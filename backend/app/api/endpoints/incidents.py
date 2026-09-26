from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.infrastructure.database import SessionLocal
from app.infrastructure.models import SecurityIncident
from app.api.schemas import SecurityIncidentResponse

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

router = APIRouter()

@router.get("/incidents", response_model=List[SecurityIncidentResponse])
def get_incidents(db: Session = Depends(get_db)):
    """
    Tüm güvenlik vakalarını en yeniden en eskiye doğru listeler.
    Dashboard'daki 'Live Alerts' veya Incident tabloları için kullanılır.
    """
    incidents = db.query(SecurityIncident).order_by(SecurityIncident.created_at.desc()).all()
    return incidents

@router.get("/incidents/{incident_id}", response_model=SecurityIncidentResponse)
def get_incident(incident_id: int, db: Session = Depends(get_db)):
    """
    Spesifik bir vakanın detaylarını ID'sine göre getirir.
    Investigation (İnceleme) ekranında kullanılır.
    """
    incident = db.query(SecurityIncident).filter(SecurityIncident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident bulunamadı")
    return incident