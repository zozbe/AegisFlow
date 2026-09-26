from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import timedelta

from app.infrastructure.database import SessionLocal
from app.infrastructure.models import RiskAssessment, SecurityEvent, SecurityAlert
from app.api.schemas import RiskAssessmentResponse, EvidenceResponse
from app.services.correlation import build_behavioral_timeline

# Veritabanı bağlantısı için FastAPI Dependency Injection
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

router = APIRouter()

# 1. ANA LİSTE ENDPOINT'İ (404 hatasını çözen kayıp fonksiyon)
@router.get("/assessments", response_model=List[RiskAssessmentResponse])
def get_assessments(
    user_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Hesaplanmış risk skorlarını getirir.
    """
    query = db.query(RiskAssessment)
    
    if user_id:
        query = query.filter(RiskAssessment.user_id == user_id)
        
    assessments = query.order_by(RiskAssessment.window_start.desc()).all()
    return assessments

# 2. DRILL-DOWN (KANIT VE TIMELINE) ENDPOINT'İ
@router.get("/assessments/{assessment_id}/evidence", response_model=EvidenceResponse)
def get_assessment_evidence(
    assessment_id: int, 
    db: Session = Depends(get_db)
):
    """
    Belirli bir Risk Assessment'ın neden o skoru aldığını (Evidence) 
    o zaman penceresindeki ham olaylardan ve alarmlardan çıkarır.
    """
    # 1. İlgili değerlendirmeyi bul
    assessment = db.query(RiskAssessment).filter(RiskAssessment.id == assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Risk Assessment bulunamadı")

    # Pencere bitişini hesapla (1 saatlik periyotlar)
    window_end = assessment.window_start + timedelta(hours=1)

    # 2. Rule Evidence (Kurallar)
    alerts = db.query(SecurityAlert).filter(
        SecurityAlert.user_id == assessment.user_id,
        SecurityAlert.timestamp >= assessment.window_start,
        SecurityAlert.timestamp < window_end
    ).all()

    rule_evidence_map = {}
    for a in alerts:
        key = (a.rule_name, a.severity)
        rule_evidence_map[key] = rule_evidence_map.get(key, 0) + 1
    
    rule_evidence = [
        {"rule_name": k[0], "severity": k[1], "count": v}
        for k, v in rule_evidence_map.items()
    ]

    # 3. ML Evidence (Makine Öğrenmesi)
    events = db.query(SecurityEvent).filter(
        SecurityEvent.user_id == assessment.user_id,
        SecurityEvent.timestamp >= assessment.window_start,
        SecurityEvent.timestamp < window_end
    ).all()

    total_events = len(events)
    distinct_ips = len(set(e.ip_address for e in events if e.ip_address))
    critical_actions = len([e for e in events if e.event_type in ["DATA_EXPORT", "DELETE_USER", "PRIVILEGE_ESCALATION", "MASS_DOWNLOAD"]])

    # 4. KORELASYON MOTORUNU ÇALIŞTIR
    timeline = build_behavioral_timeline(
        events=events, 
        alerts=alerts,
        ml_norm_score=assessment.ml_norm_score,
        window_start=assessment.window_start
    )

    return {
        "assessment_id": assessment.id,
        "user_id": assessment.user_id,
        "window_start": assessment.window_start,
        "rule_evidence": rule_evidence,
        "ml_evidence": {
            "total_events": total_events,
            "distinct_ips": distinct_ips,
            "critical_actions": critical_actions
        },
        "timeline": timeline
    }