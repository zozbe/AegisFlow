import sys
import os
import pandas as pd

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.infrastructure.database import SessionLocal
from app.infrastructure.models import SecurityEvent
from app.domain.entities import Event
from app.domain.rules import OffHoursCriticalActionRule
from app.application.rule_engine import RuleEngine
from app.application.anomaly_engine import AnomalyEngine
from app.application.risk_engine import RiskEngine

CRITICAL_EVENTS = {"FILE_DOWNLOAD", "PRIVILEGE_CHANGE", "DATA_EXPORT"}

# Severity - Puan eşleştirmesi
SEVERITY_SCORES = {
    "LOW": 20.0,
    "MEDIUM": 50.0,
    "HIGH": 80.0,
    "CRITICAL": 100.0
}

def map_orm_to_domain(orm_event: SecurityEvent) -> Event:
    return Event(
        id=orm_event.id,
        user_id=orm_event.user_id,
        event_type=orm_event.event_type,
        timestamp=orm_event.timestamp,
        ip_address=orm_event.ip_address,
        device_id=orm_event.device_id,
        metadata=orm_event.metadata_json or {}
    )

def run_pipeline():
    db = SessionLocal()
    try:
        db_events = db.query(SecurityEvent).all()
        if not db_events:
            print("Veri bulunamadı.")
            return
            
        # 1. Aşama: RULE ENGINE (Event-Level)
        rule_engine = RuleEngine(rules=[OffHoursCriticalActionRule()])
        alerts_data = [] # Hangi event hangi skoru üretti tutacağız
        
        domain_events = [map_orm_to_domain(e) for e in db_events]
        for event in domain_events:
            alerts = rule_engine.process_event(event)
            for alert in alerts:
                alerts_data.append({
                    "event_id": alert.event_id,
                    "user_id": alert.user_id,
                    "timestamp": event.timestamp,
                    "rule_score": SEVERITY_SCORES.get(alert.severity, 0.0)
                })
        
        alerts_df = pd.DataFrame(alerts_data)
        if not alerts_df.empty:
            alerts_df['timestamp'] = pd.to_datetime(alerts_df['timestamp'])

        # 2. Aşama: ML ENGINE (Window-Level Feature Engineering)
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

        # 3. Aşama: RISK ENGINE (Sinyal Birleştirme)
        risk_engine = RiskEngine()
        results = []

        for _, row in scored_df.iterrows():
            user = row['user_id']
            window_start = row['timestamp']
            window_end = window_start + pd.Timedelta(hours=1)
            
            # Bu 1 saatlik penceredeki rule skorlarını bul
            window_rule_scores = []
            if not alerts_df.empty:
                mask = (alerts_df['user_id'] == user) & (alerts_df['timestamp'] >= window_start) & (alerts_df['timestamp'] < window_end)
                window_rule_scores = alerts_df[mask]['rule_score'].tolist()

            # Skor hesaplamaları
            agg_rule_score = risk_engine.aggregate_rule_scores(window_rule_scores)
            ml_raw_score = row['iforest_score']
            ml_norm_score = risk_engine.normalize_ml_score(ml_raw_score)
            
            final_risk = risk_engine.calculate_risk(agg_rule_score, ml_norm_score)
            
            # Priority belirleme
            priority = "LOW"
            if final_risk > 80: priority = "CRITICAL"
            elif final_risk > 50: priority = "HIGH"
            elif final_risk > 20: priority = "MEDIUM"

            results.append({
                "User": user,
                "Window": window_start.strftime("%H:%M"),
                "Rule_Agg": agg_rule_score,
                "ML_Raw": ml_raw_score,
                "ML_Norm": ml_norm_score,
                "Final_Risk": final_risk,
                "Priority": priority
            })

        # 4. Aşama: ÇIKTIYI GÖSTER
        final_df = pd.DataFrame(results)
        final_df = final_df.sort_values(by="Final_Risk", ascending=False)
        
        print("\n--- 🛡️ AEGISFLOW RISK PIPELINE SONUÇLARI ---")
        print(final_df.to_string(index=False))

    finally:
        db.close()

if __name__ == "__main__":
    run_pipeline()