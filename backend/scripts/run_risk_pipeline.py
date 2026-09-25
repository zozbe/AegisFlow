import sys
import os
import pandas as pd

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.infrastructure.database import SessionLocal
from app.application.risk_assessment_service import RiskAssessmentService
from app.infrastructure.repository import RiskAssessmentRepository

def run_pipeline():
    db = SessionLocal()
    try:
        service = RiskAssessmentService(db)
        print("🚀 AegisFlow Risk Pipeline başlatılıyor...")
        
        # Servis bizim için tüm işi yapıyor (ama henüz DB'ye yazmıyor)
        assessments = service.evaluate_all_events()
        
        if not assessments:
            print("❌ Değerlendirilecek veri bulunamadı.")
            return

        # 1. Pipeline'ın ürettiği sonuçları veritabanına kalıcı olarak kaydet (Upsert)
        repository = RiskAssessmentRepository(db)
        repository.upsert_assessments(assessments)
        
        print(f"✅ {len(assessments)} adet risk değerlendirmesi veritabanına kaydedildi.\n")

        # 2. Terminalde güzel görünmesi için Pandas ile yazdır
        data = []
        for a in assessments:
            data.append({
                "User": a.user_id,
                "Window": a.window_start.strftime("%H:%M"),
                "Rule_Agg": round(a.rule_score, 1),
                "ML_Raw": round(a.ml_raw_score, 4),
                "ML_Norm": round(a.ml_norm_score, 2),
                "Final_Risk": round(a.final_risk, 2),
                "Priority": a.priority
            })
        
        df = pd.DataFrame(data).sort_values(by="Final_Risk", ascending=False)
        print("--- 🛡️ AEGISFLOW RISK PIPELINE SONUÇLARI ---")
        print(df.to_string(index=False))

    except Exception as e:
        db.rollback()
        print(f"❌ Pipeline hatası: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    run_pipeline()