from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Optional

from app.infrastructure.database import SessionLocal
from app.infrastructure.models import RiskAssessment
from app.api.schemas import RiskAssessmentResponse

# Veritabanı bağlantısı için FastAPI Dependency Injection
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

router = APIRouter()

@router.get("/assessments", response_model=List[RiskAssessmentResponse])
def get_assessments(
    user_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Hesaplanmış risk skorlarını getirir.
    ?user_id= parametresi ile belirli bir kullanıcıya göre filtrelenebilir.
    En güncel zaman pencereleri en üstte (DESC) gelecek şekilde sıralanır.
    """
    query = db.query(RiskAssessment)
    
    if user_id:
        query = query.filter(RiskAssessment.user_id == user_id)
        
    assessments = query.order_by(RiskAssessment.window_start.desc()).all()
    return assessments