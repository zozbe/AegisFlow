import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.infrastructure.database import SessionLocal
# Yeni SecurityAlert modelimizi import ediyoruz
from app.infrastructure.models import SecurityEvent, SecurityAlert
from app.domain.entities import Event
from app.domain.rules import OffHoursCriticalActionRule
from app.application.rule_engine import RuleEngine

def map_orm_to_domain(orm_event: SecurityEvent) -> Event:
    return Event(
        id=orm_event.id,
        user_id=orm_event.user_id,
        event_type=orm_event.event_type,
        timestamp=orm_event.timestamp,
        ip_address=orm_event.ip_address,
        device_id=orm_event.device_id,
        metadata=orm_event.metadata_json or {}
    )

def run_analysis():
    engine = RuleEngine(rules=[OffHoursCriticalActionRule()])
    db = SessionLocal()
    
    try:
        print("Veritabanından olaylar okunuyor...")
        db_events = db.query(SecurityEvent).all()
        
        total_alerts = 0
        alerts_to_save = [] # Veritabanına yazılacak alarmları burada biriktireceğiz
        
        for db_event in db_events:
            domain_event = map_orm_to_domain(db_event)
            alerts = engine.process_event(domain_event)
            
            for alert in alerts:
                total_alerts += 1
                print(f"🚨 ALARM DETECTED: {alert.user_id} - {alert.rule_name} ({alert.severity})")
                
                # Saf Domain Alert nesnesini, SQLAlchemy ORM nesnesine (SecurityAlert) çeviriyoruz
                orm_alert = SecurityAlert(
                    event_id=alert.event_id,
                    user_id=alert.user_id,
                    rule_name=alert.rule_name,
                    severity=alert.severity,
                    description=alert.description
                )
                alerts_to_save.append(orm_alert)
        
        # Döngü bittiğinde, biriken alarmları veritabanına topluca kaydet (Bulk Insert)
        if alerts_to_save:
            db.add_all(alerts_to_save)
            db.commit()
            print(f"\n✅ {len(alerts_to_save)} adet alarm 'security_alerts' tablosuna başarıyla kaydedildi!")
            
        print(f"--- ANALİZ TAMAMLANDI ---")
        print(f"İncelenen Olay Sayısı: {len(db_events)}")
        print(f"Üretilen Alarm Sayısı: {total_alerts}")

    except Exception as e:
        db.rollback()
        print(f"❌ Veritabanı hatası: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    run_analysis()