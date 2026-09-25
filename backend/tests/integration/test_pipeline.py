import pytest
from app.infrastructure.database import SessionLocal
from app.application.risk_assessment_service import RiskAssessmentService
from scripts.data_generator import generate_scenarios

@pytest.fixture(scope="module")
def setup_deterministic_data():
    generate_scenarios()
    db = SessionLocal()
    yield db
    db.close()

@pytest.fixture(scope="module")
def assessments(setup_deterministic_data):
    """
    Testin içinde fusion mantığı kopyalanmaz. Doğrudan production servisi çağrılır.
    """
    db = setup_deterministic_data
    service = RiskAssessmentService(db)
    return service.evaluate_all_events()

# --- TESTLER ---

def test_priority_thresholds(setup_deterministic_data):
    """Kural 0: Priority sözleşmesi sınır değerlerini (Boundaries) test eder."""
    service = RiskAssessmentService(setup_deterministic_data)
    
    assert service._determine_priority(19.99) == "LOW"
    assert service._determine_priority(20.00) == "MEDIUM"
    assert service._determine_priority(49.99) == "MEDIUM"
    assert service._determine_priority(50.00) == "HIGH"
    assert service._determine_priority(79.99) == "HIGH"
    assert service._determine_priority(80.00) == "CRITICAL"
    assert service._determine_priority(100.00) == "CRITICAL"

def test_final_risk_is_within_bounds(assessments):
    """Kural 1: Risk skoru daima 0-100 arasında kalmalıdır."""
    assert all(0.0 <= a.final_risk <= 100.0 for a in assessments)

def test_charlie_0300_has_rule_alerts(assessments):
    """Kural 2: Charlie'nin 03:00 mesai dışı kritik penceresi kural sinyali almalıdır."""
    charlie_0300 = next(a for a in assessments if a.user_id == 'user_charlie' and a.window_start.hour == 3)
    
    assert charlie_0300.rule_score > 0.0
    assert charlie_0300.final_risk >= 80.0 # CRITICAL seviyesine ulaşmalı
    assert charlie_0300.priority == "CRITICAL"

def test_charlie_1000_ml_anomaly_but_not_critical(assessments):
    """
    Kural 3: Charlie 10:00 penceresi anomali barındırır ama deterministik kural 
    olmadığı için tek başına CRITICAL seviyeye çıkmamalıdır.
    """
    charlie_1000 = next(a for a in assessments if a.user_id == 'user_charlie' and a.window_start.hour == 10)
    
    assert charlie_1000.ml_raw_score < 0.0 # ML davranışı negatif yönde (izole edilebilir) görmeli
    assert charlie_1000.rule_score == 0.0 # Gündüz kuralımız henüz olmadığı için 0 olmalı
    assert charlie_1000.final_risk < 80.0 # Kural ihlali olmadan CRITICAL olmamalı
    assert charlie_1000.priority == "LOW" # Mevcut MVP sınırlarına göre LOW

def test_alice_high_volume_is_not_critical(assessments):
    """Kural 4: Alice'in 13:00'teki yüksek işlem hacmi tek başına risk üretmemelidir."""
    alice_1300 = next(a for a in assessments if a.user_id == 'user_alice' and a.window_start.hour == 13)
    assert alice_1300.final_risk < 50.0 
    assert alice_1300.priority in ["LOW", "MEDIUM"]

def test_bob_ambiguous_scenarios_are_not_critical(assessments):
    """Kural 5: Bob'un mobilite ve şifre hataları CRITICAL seviye üretmemelidir."""
    bob_assessments = [a for a in assessments if a.user_id == 'user_bob']
    assert all(a.final_risk < 80.0 for a in bob_assessments)
    assert all(a.priority != "CRITICAL" for a in bob_assessments)