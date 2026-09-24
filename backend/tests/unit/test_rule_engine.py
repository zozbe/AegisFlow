from datetime import datetime
from app.domain.entities import Event
from app.domain.rules import OffHoursCriticalActionRule
from app.application.rule_engine import RuleEngine

def test_off_hours_critical_action_rule_triggers_alert():
    # 1. Kural Motorunu ve kuralı hazırla
    rule = OffHoursCriticalActionRule()
    engine = RuleEngine(rules=[rule])
    
    # 2. Veritabanına İHTİYAÇ DUYMADAN sahte (mock) bir Event objesi yarat
    # Senaryo: Gece 03:00'te DATA_EXPORT yapılmış
    anomalous_event = Event(
        id="test-event-1",
        user_id="user_charlie_compromised",
        event_type="DATA_EXPORT",
        timestamp=datetime(2026, 9, 25, 3, 0, 0), # Gece 03:00
        ip_address="192.168.1.1",
        device_id="device-1"
    )
    
    # 3. Motoru çalıştır
    alerts = engine.process_event(anomalous_event)
    
    # 4. Doğrula: 1 adet Alert dönmeli ve detayları kuralın severity/name değerleriyle eşleşmeli
    assert len(alerts) == 1
    assert alerts[0].rule_name == "OffHoursCriticalActionRule"
    assert alerts[0].severity == "HIGH"
    assert "mesai saatleri dışında (03:00)" in alerts[0].description

def test_normal_hours_critical_action_rule_ignores():
    rule = OffHoursCriticalActionRule()
    engine = RuleEngine(rules=[rule])
    
    # Senaryo: Gündüz 14:00'te yapılan aynı kritik işlem
    normal_event = Event(
        id="test-event-2",
        user_id="user_alice",
        event_type="DATA_EXPORT",
        timestamp=datetime(2026, 9, 25, 14, 0, 0), # Gündüz 14:00
        ip_address="192.168.1.1",
        device_id="device-2"
    )
    
    alerts = engine.process_event(normal_event)
    
    # Doğrula: Mesai içi olduğu için kural tetiklenmemeli (0 Alert)
    assert len(alerts) == 0