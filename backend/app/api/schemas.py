from pydantic import BaseModel, ConfigDict
from datetime import datetime

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