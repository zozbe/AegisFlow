import random
import os
import sys
from faker import Faker
from datetime import datetime
import json

# 1. Proje ana dizinini yola ekliyoruz ki 'app' modülünü bulabilelim
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.infrastructure.database import SessionLocal
from app.infrastructure.models import SecurityEvent

fake = Faker()

NORMAL_EVENTS = ["LOGIN_SUCCESS", "FILE_READ", "LOGOUT"]
SUSPICIOUS_EVENTS = ["LOGIN_FAILED"]
CRITICAL_EVENTS = ["FILE_DOWNLOAD", "PRIVILEGE_CHANGE", "DATA_EXPORT"]

class UebaDataGenerator:
    def __init__(self):
        self.users_baseline = {
            "user_alice": {
                "role": "HR",
                "known_ips": [fake.ipv4(), fake.ipv4()],
                "known_devices": [fake.uuid4()],
                "working_hours": (8, 17)
            },
            "user_bob": {
                "role": "Finance",
                "known_ips": [fake.ipv4()],
                "known_devices": [fake.uuid4(), fake.uuid4()],
                "working_hours": (9, 18)
            },
            "user_charlie_compromised": {
                "role": "IT",
                "known_ips": [fake.ipv4()],
                "known_devices": [fake.uuid4()],
                "working_hours": (10, 19)
            }
        }

    def generate_single_event(self, user_id: str, is_anomalous: bool = False):
        profile = self.users_baseline[user_id]
        
        if is_anomalous:
            hour = random.randint(0, 5)
        else:
            hour = random.randint(profile["working_hours"][0], profile["working_hours"][1])
            
        timestamp = datetime.now().replace(hour=hour, minute=random.randint(0, 59), second=random.randint(0, 59)).isoformat()

        if is_anomalous:
            event_type = random.choice(CRITICAL_EVENTS + NORMAL_EVENTS)
            ip_address = fake.ipv4() 
            device_id = fake.uuid4() 
        else:
            if random.random() < 0.10:
                event_type = random.choice(SUSPICIOUS_EVENTS)
            else:
                event_type = random.choice(NORMAL_EVENTS)
                
            ip_address = random.choice(profile["known_ips"])
            device_id = random.choice(profile["known_devices"])

        return {
            "user_id": user_id,
            "event_type": event_type,
            "timestamp": timestamp,
            "ip_address": ip_address,
            "device_id": device_id,
            "metadata_json": {"role": profile["role"]}
        }

# --- VERİTABANINA KAYIT (DB INSERTION) ---
if __name__ == "__main__":
    generator = UebaDataGenerator()
    
    print("Sentetik veriler üretiliyor ve veritabanına kaydediliyor...")
    events_to_insert = []
    
    # 1. Normal Davranışlar (ML modeli için baseline oluşturmak adına bolca üretiyoruz)
    for _ in range(50):
        events_to_insert.append(generator.generate_single_event("user_alice", is_anomalous=False))
        events_to_insert.append(generator.generate_single_event("user_bob", is_anomalous=False))
        # Charlie'nin hesabı çalınmadan önceki normal halleri
        events_to_insert.append(generator.generate_single_event("user_charlie_compromised", is_anomalous=False))
        
    # 2. Anormal Davranışlar (Saldırı anı - Az sayıda)
    for _ in range(5):
        events_to_insert.append(generator.generate_single_event("user_charlie_compromised", is_anomalous=True))
        
    # Veritabanı oturumu aç ve kaydet
    db = SessionLocal()
    try:
        # Sözlük (dict) formatındaki verileri SQLAlchemy ORM nesnelerine dönüştürüyoruz
        orm_events = [SecurityEvent(**event_data) for event_data in events_to_insert]
        
        db.add_all(orm_events)
        db.commit()
        
        # İşlemin başarılı olduğunu doğrulamak için DB'deki toplam kayıt sayısını çekiyoruz
        total_events = db.query(SecurityEvent).count()
        print(f"✅ Başarılı! Veritabanına {len(orm_events)} yeni olay eklendi.")
        print(f"📊 Veritabanındaki toplam SecurityEvent sayısı: {total_events}")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Veritabanına yazarken hata oluştu: {e}")
    finally:
        db.close()