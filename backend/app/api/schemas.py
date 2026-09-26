from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import List

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

    # SQLAlchemy ORM objelerini otomatik olarak Pydantic modeline çevirmek için gerekli yapılandırma (Pydantic v2)
    model_config = ConfigDict(from_attributes=True)

# --- YENİ EKLENEN KANIT (EVIDENCE) ŞEMALARI ---

class RuleEvidence(BaseModel):
    rule_name: str
    severity: str
    count: int

class MLEvidence(BaseModel):
    total_events: int
    distinct_ips: int
    critical_actions: int

class EvidenceResponse(BaseModel):
    assessment_id: int
    user_id: str
    window_start: datetime
    rule_evidence: List[RuleEvidence]
    ml_evidence: MLEvidence