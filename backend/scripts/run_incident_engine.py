import sys
import os

# Proje kök dizinini Python yoluna ekle (app modüllerini bulabilmesi için)
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.infrastructure.database import SessionLocal
from app.infrastructure.models import RiskAssessment, SecurityIncident
from app.services.incident import evaluate_and_create_incident

def main():
    db = SessionLocal()
    try:
        print("--- INCIDENT CREATION ENGINE TEST ---")
        
        # Tüm değerlendirmeleri al
        assessments = db.query(RiskAssessment).order_by(RiskAssessment.id.asc()).all()
        
        if not assessments:
            print("Hiç RiskAssessment bulunamadı. Lütfen önce risk motorunu çalıştırın.")
            return

        for assessment in assessments:
            print(f"\nİnceleniyor: Assessment #{assessment.id} | User: {assessment.user_id} | Risk: {assessment.final_risk:.1f} ({assessment.priority})")
            
            # Veritabanında önceden var mı diye biz script seviyesinde de bakalım ki çıktımız net olsun
            already_exists = db.query(SecurityIncident).filter(SecurityIncident.assessment_id == assessment.id).first() is not None

            # Servisi Çağır
            incident = evaluate_and_create_incident(db, assessment)

            # Sonuçları Analiz Et
            if incident is None:
                print("  -> [SKIPPED] LOW/MEDIUM seviye olduğu için vaka oluşturulmadı.")
            else:
                if already_exists:
                    print(f"  -> [IDEMPOTENCY OK] Vaka zaten mevcuttu. Yeni kayıt açılmadı (Incident #{incident.id})")
                else:
                    print(f"  -> [CREATED] Yeni Vaka Oluşturuldu! ID: {incident.id}")
                
                print(f"     Title: {incident.title}")
                print(f"     Severity: {incident.severity}")
                print(f"     Status: {incident.status}")

        print("\n--- TEST TAMAMLANDI ---")
        total_incidents = db.query(SecurityIncident).count()
        print(f"Veritabanındaki Toplam Incident Sayısı: {total_incidents}")

    finally:
        db.close()

if __name__ == "__main__":
    main()