import sys
import os
import random
from datetime import datetime, timedelta

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.infrastructure.database import SessionLocal
from app.infrastructure.models import SecurityEvent

# Deterministik yapı için seed sabitliyoruz
random.seed(42)

def clear_database(db):
    """Her çalıştırmada temiz bir test ortamı için tabloyu sıfırlar."""
    db.query(SecurityEvent).delete()
    db.commit()

def generate_scenarios():
    db = SessionLocal()
    clear_database(db)
    
    events = []
    base_date = datetime(2026, 9, 24)

    def create_event(user, event_type, ip, device, hour, minute):
        """Olay oluşturmayı kolaylaştıran yardımcı fonksiyon"""
        ts = base_date.replace(hour=hour, minute=minute)
        ts += timedelta(seconds=random.randint(0, 59))
        
        events.append(SecurityEvent(
            user_id=user, 
            event_type=event_type, 
            timestamp=ts,
            ip_address=ip, 
            device_id=device, 
            metadata_json={}
        ))

    # =========================================================================
    # 👤 PROFİL 1: ALICE (Baseline & High Volume Tester)
    # =========================================================================
    
    # Senaryo 1: Baseline (Standart Mesai İçi Davranış)
    create_event("user_alice", "LOGIN_SUCCESS", "192.168.1.50", "DEV-ALICE", 8, 0)
    create_event("user_alice", "FILE_READ", "192.168.1.50", "DEV-ALICE", 8, 15)
    create_event("user_alice", "FILE_READ", "192.168.1.50", "DEV-ALICE", 9, 30)
    create_event("user_alice", "LOGOUT", "192.168.1.50", "DEV-ALICE", 10, 0)

    # Senaryo 2: High-Volume Normal (Çok Sayıda Zararsız İşlem)
    create_event("user_alice", "LOGIN_SUCCESS", "192.168.1.50", "DEV-ALICE", 13, 0)
    for i in range(30):
        create_event("user_alice", "FILE_READ", "192.168.1.50", "DEV-ALICE", 13, 5 + (i % 50))
    create_event("user_alice", "LOGOUT", "192.168.1.50", "DEV-ALICE", 14, 0)


    # =========================================================================
    # 👤 PROFİL 2: BOB (The Ambiguous / False-Positive Tester)
    # =========================================================================
    
    # Senaryo 1: Mobilite - Yeni Cihaz
    create_event("user_bob", "LOGIN_SUCCESS", "192.168.1.60", "DEV-BOB-MOBILE", 9, 0)
    for i in range(5):
        create_event("user_bob", "FILE_READ", "192.168.1.60", "DEV-BOB-MOBILE", 9, 10 + (i*5))
        
    # Senaryo 2: Mobilite - Yeni IP
    create_event("user_bob", "LOGIN_SUCCESS", "203.0.113.42", "DEV-BOB", 14, 0)
    create_event("user_bob", "FILE_READ", "203.0.113.42", "DEV-BOB", 14, 15)
    create_event("user_bob", "FILE_DOWNLOAD", "203.0.113.42", "DEV-BOB", 14, 30)

    # Senaryo 3: Login Retry (Şifre Unutma)
    create_event("user_bob", "LOGIN_FAILED", "192.168.1.60", "DEV-BOB", 16, 5)
    create_event("user_bob", "LOGIN_FAILED", "192.168.1.60", "DEV-BOB", 16, 6)
    create_event("user_bob", "LOGIN_FAILED", "192.168.1.60", "DEV-BOB", 16, 7)
    create_event("user_bob", "LOGIN_SUCCESS", "192.168.1.60", "DEV-BOB", 16, 15)
    create_event("user_bob", "FILE_READ", "192.168.1.60", "DEV-BOB", 16, 20)


    # =========================================================================
    # 👤 PROFİL 3: CHARLIE (The Compromised Account)
    # =========================================================================
    
    # Senaryo 1: Off-Hours Critical
    create_event("user_charlie", "LOGIN_SUCCESS", "198.51.100.99", "DEV-CHARLIE", 3, 0)
    create_event("user_charlie", "DATA_EXPORT", "198.51.100.99", "DEV-CHARLIE", 3, 30)

    # Senaryo 2: Privilege Escalation & Exfil (Gündüz)
    create_event("user_charlie", "LOGIN_SUCCESS", "198.51.100.99", "DEV-CHARLIE-HACKER", 10, 0)
    create_event("user_charlie", "PRIVILEGE_CHANGE", "198.51.100.99", "DEV-CHARLIE-HACKER", 10, 15)
    create_event("user_charlie", "FILE_DOWNLOAD", "198.51.100.99", "DEV-CHARLIE-HACKER", 10, 20)
    create_event("user_charlie", "FILE_DOWNLOAD", "198.51.100.99", "DEV-CHARLIE-HACKER", 10, 22)
    create_event("user_charlie", "FILE_DOWNLOAD", "198.51.100.99", "DEV-CHARLIE-HACKER", 10, 25)
    create_event("user_charlie", "DATA_EXPORT", "198.51.100.99", "DEV-CHARLIE-HACKER", 10, 30)

    db.add_all(events)
    db.commit()
    db.close()
    
    print(f"✅ Deterministik Senaryolar Uygulandı! Toplam {len(events)} olay veritabanına yazıldı.")

if __name__ == "__main__":
    generate_scenarios()