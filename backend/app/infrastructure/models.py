from sqlalchemy import Column, String, DateTime, JSON
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