import sys
import os

# app modülünü bulabilmesi için yolu ekliyoruz
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy import extract
from app.infrastructure.database import SessionLocal
from app.infrastructure.models import SecurityEvent

def verify():
    db = SessionLocal()
    try:
        print("--- 1. KULLANICI BAZLI OLAY DAĞILIMI ---")
        users = ["user_alice", "user_bob", "user_charlie_compromised"]
        for user in users:
            count = db.query(SecurityEvent).filter(SecurityEvent.user_id == user).count()
            print(f"{user}: {count} events")

        print("\n--- 2. CHARLIE'NİN ANOMALİ (MESAİ DIŞI) KAYITLARI ---")
        # Charlie'nin mesaisi 10:00 - 19:00 arasıydı. Gece 00:00 - 05:59 arasındaki loglarını çekiyoruz.
        charlie_anomalies = db.query(SecurityEvent).filter(
            SecurityEvent.user_id == "user_charlie_compromised",
            extract('hour', SecurityEvent.timestamp) < 6
        ).all()

        for event in charlie_anomalies:
            print(f"Zaman: {event.timestamp.strftime('%Y-%m-%d %H:%M:%S')} | Olay: {event.event_type:<16} | IP: {event.ip_address:<15} | Cihaz: {event.device_id}")

    finally:
        db.close()

if __name__ == "__main__":
    verify()