from sqlalchemy.orm import Session
from datetime import timedelta
from typing import Optional
from app.infrastructure.models import RiskAssessment, SecurityIncident, SecurityAlert

def generate_incident_title(db: Session, assessment: RiskAssessment) -> str:
    """
    Vaka için bağlam (context) bazlı akıllı bir başlık üretir.
    O penceredeki alarmları inceleyerek SOC analistine ipucu veren bir isim seçer.
    """
    window_end = assessment.window_start + timedelta(hours=1)
    
    # O penceredeki kuralları bul
    alerts = db.query(SecurityAlert).filter(
        SecurityAlert.user_id == assessment.user_id,
        SecurityAlert.timestamp >= assessment.window_start,
        SecurityAlert.timestamp < window_end
    ).all()
    
    if alerts:
        rule_names = set(a.rule_name for a in alerts)
        
        if "OffHoursCriticalActionRule" in rule_names:
            return "Possible Off-Hours Data Exfiltration"
        elif "BruteForceRule" in rule_names: # Gelecekte ekleyeceğimiz kurallar için örnek
            return "Possible Account Compromise (Brute Force)"
        elif "MassDownloadRule" in rule_names:
            return "Suspicious Mass Data Access"
        else:
            return "Multiple Security Policy Violations"
            
    # Eğer hiç kural yok ama Risk CRITICAL/HIGH çıkmışsa (Demek ki ML Anomaly skoru uçurmuş)
    if assessment.ml_norm_score >= 80:
        return "Critical Behavioral Anomaly Detected"
        
    return "Suspicious Activity Detected"

# DÜZELTME: Dönüş tipi Optional[SecurityIncident] (veya SecurityIncident | None) olarak güncellendi.
def evaluate_and_create_incident(db: Session, assessment: RiskAssessment) -> Optional[SecurityIncident]:
    """
    Risk değerlendirmesini alır, eşik değerlerini kontrol eder ve gerekirse 
    tekrarlanmayacak şekilde (idempotent) yeni bir Incident oluşturur.
    """
    # 1. Eşik (Threshold) Kontrolü
    if assessment.priority not in ["HIGH", "CRITICAL"]:
        return None

    # 2. Idempotency Kontrolü (Aynı vakanın tekrar açılmasını engelle)
    existing_incident = db.query(SecurityIncident).filter(
        SecurityIncident.assessment_id == assessment.id
    ).first()
    
    if existing_incident:
        return existing_incident

    # 3. Akıllı Başlık Üretimi
    incident_title = generate_incident_title(db, assessment)

    # 4. Yeni Incident Kaydı
    new_incident = SecurityIncident(
        title=incident_title,
        user_id=assessment.user_id,
        status="OPEN",
        severity=assessment.priority,
        risk_score=assessment.final_risk,
        assessment_id=assessment.id
    )
    
    db.add(new_incident)
    db.commit()
    db.refresh(new_incident)
    
    return new_incident