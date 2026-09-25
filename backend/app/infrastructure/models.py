from sqlalchemy import Column, String, DateTime, JSON, Integer, Float, UniqueConstraint, Index
from sqlalchemy.sql import func
from datetime import datetime
import uuid
from app.infrastructure.database import Base

class SecurityEvent(Base):
    __tablename__ = "security_events"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    
    user_id = Column(String, index=True, nullable=False)
    event_type = Column(String, index=True, nullable=False)
    
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    
    ip_address = Column(String, nullable=True)
    device_id = Column(String, nullable=True)
    hostname = Column(String, nullable=True)
    
    metadata_json = Column(JSON, nullable=True)

class SecurityAlert(Base):
    __tablename__ = "security_alerts"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    event_id = Column(String, index=True, nullable=False) 
    user_id = Column(String, index=True, nullable=False)
    rule_name = Column(String, nullable=False)
    severity = Column(String, index=True, nullable=False) 
    description = Column(String, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)

class RiskAssessment(Base):
    __tablename__ = "risk_assessments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(255), nullable=False)
    window_start = Column(DateTime, nullable=False)
    
    rule_score = Column(Float, nullable=False, default=0.0)
    ml_raw_score = Column(Float, nullable=False, default=0.0)
    ml_norm_score = Column(Float, nullable=False, default=0.0)
    final_risk = Column(Float, nullable=False, default=0.0)
    
    priority = Column(String(50), nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    __table_args__ = (
        UniqueConstraint("user_id", "window_start", name="uq_risk_assessment_user_window"),
        Index("ix_risk_assessment_user_window", "user_id", "window_start"),
    )