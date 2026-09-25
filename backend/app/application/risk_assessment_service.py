import pandas as pd
from sqlalchemy.orm import Session

from app.infrastructure.models import SecurityEvent, RiskAssessment
from app.domain.entities import Event
from app.domain.rules import OffHoursCriticalActionRule
from app.application.rule_engine import RuleEngine
from app.application.anomaly_engine import AnomalyEngine
from app.application.risk_engine import RiskEngine

class RiskAssessmentService:
    """
    Application-level orchestration service.
    Sorumlulukları: DB'den event okuma, Feature Engineering, Rule ve ML motorlarını 
    koşturma ve nihai Risk Fusion işlemlerini koordine etme.
    Not: İleride Feature Engineering ve Persistence katmanları ayrıştırılabilir.
    """
    CRITICAL_EVENTS = {"FILE_DOWNLOAD", "PRIVILEGE_CHANGE", "DATA_EXPORT"}
    
    SEVERITY_SCORES = {
        "LOW": 20.0,
        "MEDIUM": 50.0,
        "HIGH": 80.0,
        "CRITICAL": 100.0
    }

    def __init__(self, db_session: Session):
        self.db = db_session
        self.rule_engine = RuleEngine(rules=[OffHoursCriticalActionRule()])
        self.risk_engine = RiskEngine()
        self.anomaly_engine = AnomalyEngine(contamination=0.1)

    def _determine_priority(self, final_risk: float) -> str:
        """Risk skoruna göre merkezi öncelik atama sözleşmesi (Boundaries)"""
        if final_risk >= 80:
            return "CRITICAL"
        elif final_risk >= 50:
            return "HIGH"
        elif final_risk >= 20:
            return "MEDIUM"
        return "LOW"

    def evaluate_all_events(self) -> list[RiskAssessment]:
        db_events = self.db.query(SecurityEvent).all()
        if not db_events:
            return []

        # 1. Aşama: RULE ENGINE (Event-Level)
        alerts_data = []
        for orm_event in db_events:
            domain_event = Event(
                id=orm_event.id, user_id=orm_event.user_id, event_type=orm_event.event_type,
                timestamp=orm_event.timestamp, ip_address=orm_event.ip_address,
                device_id=orm_event.device_id, metadata=orm_event.metadata_json or {}
            )
            alerts = self.rule_engine.process_event(domain_event)
            for alert in alerts:
                alerts_data.append({
                    "user_id": alert.user_id,
                    "timestamp": domain_event.timestamp,
                    "rule_score": self.SEVERITY_SCORES.get(alert.severity, 0.0)
                })
        
        alerts_df = pd.DataFrame(alerts_data)
        if not alerts_df.empty:
            alerts_df['timestamp'] = pd.to_datetime(alerts_df['timestamp'])

        # 2. Aşama: ML ENGINE (Window-Level)
        df = pd.read_sql(self.db.query(SecurityEvent).statement, self.db.bind)
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        df['is_critical'] = df['event_type'].apply(lambda x: 1 if x in self.CRITICAL_EVENTS else 0)
        df['is_off_hours'] = df['timestamp'].apply(lambda x: 1 if (x.hour < 7 or x.hour >= 19) else 0)

        grouped = df.groupby(['user_id', pd.Grouper(key='timestamp', freq='1h')])
        features_df = grouped.agg(
            event_count=('id', 'count'),
            critical_action_count=('is_critical', 'sum'),
            distinct_ips=('ip_address', 'nunique'),
            distinct_devices=('device_id', 'nunique'),
            off_hours_count=('is_off_hours', 'sum')
        ).reset_index()

        features_df['critical_action_ratio'] = features_df['critical_action_count'] / features_df['event_count']
        features_df['off_hours_ratio'] = features_df['off_hours_count'] / features_df['event_count']

        self.anomaly_engine.fit(features_df)
        scored_df = self.anomaly_engine.score(features_df)

        # 3. Aşama: RISK FUSION
        assessments = []
        for _, row in scored_df.iterrows():
            user = row['user_id']
            window_start = row['timestamp']
            window_end = window_start + pd.Timedelta(hours=1)

            window_rule_scores = []
            if not alerts_df.empty:
                mask = (alerts_df['user_id'] == user) & (alerts_df['timestamp'] >= window_start) & (alerts_df['timestamp'] < window_end)
                window_rule_scores = alerts_df[mask]['rule_score'].tolist()

            agg_rule_score = self.risk_engine.aggregate_rule_scores(window_rule_scores)
            ml_raw = row['iforest_score']
            ml_norm = self.risk_engine.normalize_ml_score(ml_raw)
            final_risk = self.risk_engine.calculate_risk(agg_rule_score, ml_norm)
            priority = self._determine_priority(final_risk)

            assessment = RiskAssessment(
                user_id=user,
                window_start=window_start.to_pydatetime(),
                rule_score=agg_rule_score,
                ml_raw_score=ml_raw,
                ml_norm_score=ml_norm,
                final_risk=final_risk,
                priority=priority
            )
            assessments.append(assessment)

        return assessments