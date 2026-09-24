from app.application.risk_engine import RiskEngine

def test_calculate_risk_with_rule_and_ml_score():
    engine = RiskEngine()
    risk = engine.calculate_risk(rule_score=80, ml_score=70)
    assert risk == 83.5

def test_calculate_risk_with_zero_rule_score():
    engine = RiskEngine()
    risk = engine.calculate_risk(rule_score=0, ml_score=100)
    assert risk == 25.0

def test_calculate_risk_with_high_rule_score():
    engine = RiskEngine()
    risk = engine.calculate_risk(rule_score=80, ml_score=100)
    assert risk == 85.0

def test_more_negative_raw_score_produces_higher_ml_anomaly_score():
    engine = RiskEngine()
    more_anomalous = engine.normalize_ml_score(-0.2)
    less_anomalous = engine.normalize_ml_score(0.2)
    assert more_anomalous > less_anomalous