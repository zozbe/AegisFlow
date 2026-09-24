from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional, Dict

# Saf Python objesi. SQLAlchemy'den veya veritabanından tamamen bağımsız.
@dataclass
class Event:
    id: str
    user_id: str
    event_type: str
    timestamp: datetime
    ip_address: Optional[str] = None
    device_id: Optional[str] = None
    metadata: Dict = field(default_factory=dict)

@dataclass
class RuleResult:
    is_triggered: bool
    score: int = 0
    reason: str = ""

@dataclass
class Alert:
    event_id: str
    user_id: str
    rule_name: str
    severity: str
    description: str
    timestamp: datetime = field(default_factory=datetime.now)