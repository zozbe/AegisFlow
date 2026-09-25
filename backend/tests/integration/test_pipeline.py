import pytest
import pandas as pd
from datetime import datetime
from app.infrastructure.database import SessionLocal
from app.infrastructure.models import SecurityEvent
from app.domain.entities import Event
from app.domain.rules import OffHoursCriticalActionRule
from app.application.rule_engine import RuleEngine
from app.application.anomaly_engine import AnomalyEngine
from app.application.risk_engine import RiskEngine
from scripts.data_generator import generate_scenarios

CRITICAL_EVENTS = {"FILE_DOWNLOAD", "PRIVILEGE_CHANGE", "DATA_EXPORT"}
SEVERITY_SCORES = {"LOW": 20.0, "MEDIUM": 50.0, "HIGH": 80.0, "CRITICAL": 100.0}

@pytest.fixture(scope="module")
def setup_deterministic_data():
    """Tüm testlerden önce deterministik veriyi oluşturur."""
    generate_scenarios()
    db = SessionLocal()
    yield db
    db.close()

@pytest.fixture(scope="module")
def pipeline_results(setup_deterministic_data):
    """
    Pipeline fusion mantığını çalıştırıp DataFrame döner.
    İleride bu mantık Service Layer'a taşındığında test burayı çağıracak.
    """
    db = setup_deterministic_data
    db_events = db.query(SecurityEvent).all()
    
    # 1. Rule Engine
    rule_engine = RuleEngine(rules=[OffHoursCriticalActionRule()])
    alerts_data = []
    
    for orm_event in db_events:
        event = Event(
            id=orm_event.id, user_id=orm_event.user_id, event_type=orm_event.event_type,
            timestamp=orm_event.timestamp, ip_address=orm_event.ip_address,
            device_id=orm_event.device_id, metadata=orm_event.metadata_json or {}
        )
        alerts = rule_engine.process_event(event)
        for alert in alerts:
            alerts_data.append({
                "user_id": alert.user_id,
                "timestamp": event.timestamp,
                "rule_score": SEVERITY_SCORES.get(alert.severity, 0.0)
            })
    
    alerts_df = pd.DataFrame(alerts_data)
    
    # 2. ML Engine (Feature Engineering)
    df = pd.read_sql(db.query(SecurityEvent).statement, db.bind)
    df['timestamp'] = pd.to_datetime(df['timestamp'])
    df['is_critical'] = df['event_type'].apply(lambda x: 1 if x in CRITICAL_EVENTS else 0)
    df['is_off_hours'] = df['timestamp'].apply(lambda x: 1 if (x.hour < 7 or x.hour >= 19) else 0)

    grouped = df.groupby(['user_id', pd.Grouper(key='timestamp', freq='1h')])
    features_df = grouped.agg(
        event_count=('id', 'count'),
        critical_action_count=('is_critical', 'sum'),
        distinct_ips=('ip_address', 'nunique'),
        distinct_devices=('device_id', 'nunique'),
        off_hours_count=('is_off_hours', 'sum')
    ).reset_index()

    features_df['critical_action_ratio'] = (features_df['critical_action_count'] / features_df['event_count'])
    features_df['off_hours_ratio'] = (features_df['off_hours_count'] / features_df['event_count'])
    
    ml_engine = AnomalyEngine(contamination=0.1)
    ml_engine.fit(features_df)
    scored_df = ml_engine.score(features_df)

    # 3. Risk Fusion
    risk_engine = RiskEngine()
    results = []

    for _, row in scored_df.iterrows():
        user = row['user_id']
        window_start = row['timestamp']
        window_end = window_start + pd.Timedelta(hours=1)
        
        window_rule_scores = []
        if not alerts_df.empty:
            mask = (alerts_df['user_id'] == user) & (alerts_df['timestamp'] >= window_start) & (alerts_df['timestamp'] < window_end)
            window_rule_scores = alerts_df[mask]['rule_score'].tolist()

        agg_rule_score = risk_engine.aggregate_rule_scores(window_rule_scores)
        ml_raw = row['iforest_score']
        ml_norm = risk_engine.normalize_ml_score(ml_raw)
        final_risk = risk_engine.calculate_risk(agg_rule_score, ml_norm)
        
        results.append({
            "user_id": user,
            "hour": window_start.hour,
            "rule_agg": agg_rule_score,
            "ml_raw": ml_raw,
            "final_risk": final_risk
        })
        
    return pd.DataFrame(results)

# --- TESTLER ---

def test_final_risk_is_within_bounds(pipeline_results):
    """Kural 1: Risk skoru daima 0-100 arasında kalmalıdır."""
    assert pipeline_results['final_risk'].min() >= 0.0
    assert pipeline_results['final_risk'].max() <= 100.0

def test_charlie_0300_has_rule_alerts(pipeline_results):
    """Kural 2: Charlie'nin 03:00 mesai dışı kritik penceresi kural sinyali almalıdır."""
    charlie_0300 = pipeline_results[(pipeline_results['user_id'] == 'user_charlie') & (pipeline_results['hour'] == 3)].iloc[0]
    assert charlie_0300['rule_agg'] > 0.0
    assert charlie_0300['final_risk'] >= 80.0 # CRITICAL seviyesine ulaşmalı

def test_charlie_1000_ml_anomaly_but_not_critical(pipeline_results):
    """
    Kural 3: Charlie 10:00 penceresi anomali barındırır ama deterministik kural 
    olmadığı için tek başına CRITICAL seviyeye çıkmamalıdır.
    """
    charlie_1000 = pipeline_results[(pipeline_results['user_id'] == 'user_charlie') & (pipeline_results['hour'] == 10)].iloc[0]
    
    assert charlie_1000['ml_raw'] < 0.0 # ML davranışı negatif yönde (izole edilebilir) görmeli
    assert charlie_1000['rule_agg'] == 0.0 # Gündüz kuralımız henüz olmadığı için 0 olmalı
    assert charlie_1000['final_risk'] < 80.0 # Kural ihlali olmadan CRITICAL olmamalı

def test_alice_high_volume_is_not_critical(pipeline_results):
    """Kural 4: Alice'in 13:00'teki yüksek işlem hacmi tek başına risk üretmemelidir."""
    alice_1300 = pipeline_results[(pipeline_results['user_id'] == 'user_alice') & (pipeline_results['hour'] == 13)].iloc[0]
    assert alice_1300['final_risk'] < 50.0 # LOW veya MEDIUM seviyede kalmalı

def test_bob_ambiguous_scenarios_are_not_critical(pipeline_results):
    """Kural 5: Bob'un mobilite ve şifre hataları CRITICAL seviye üretmemelidir."""
    bob_results = pipeline_results[pipeline_results['user_id'] == 'user_bob']
    assert (bob_results['final_risk'] < 80.0).all() # Hiçbiri CRITICAL olmamalı