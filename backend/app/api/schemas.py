from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import List
from enum import Enum

class RiskAssessmentResponse(BaseModel):
    id: int
    user_id: str
    window_start: datetime
    rule_score: float
    ml_raw_score: float
    ml_norm_score: float
    final_risk: float
    priority: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# --- KANIT (EVIDENCE) ŞEMALARI ---

class RuleEvidence(BaseModel):
    rule_name: str
    severity: str
    count: int

class MLEvidence(BaseModel):
    total_events: int
    distinct_ips: int
    critical_actions: int

# --- YENİ: KORELASYON VE TIMELINE ŞEMALARI ---

class EventSource(str, Enum):
    RULE = "RULE"
    ML_ANOMALY = "ML_ANOMALY"
    RAW_EVENT = "RAW_EVENT"

class TimelineEvent(BaseModel):
    timestamp: datetime
    event_type: str
    description: str
    source: EventSource
    severity: str

class EvidenceResponse(BaseModel):
    assessment_id: int
    user_id: str
    window_start: datetime
    rule_evidence: List[RuleEvidence]
    ml_evidence: MLEvidence
    timeline: List[TimelineEvent]