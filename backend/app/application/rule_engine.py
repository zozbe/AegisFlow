from typing import List
from app.domain.entities import Event, Alert
from app.domain.rules import BaseRule

class RuleEngine:
    def __init__(self, rules: List[BaseRule]):
        self.rules = rules

    def process_event(self, event: Event) -> List[Alert]:
        """
        Gelen saf Event objesini kayıtlı tüm kurallardan geçirir.
        Kural ihlali varsa Alert objesi oluşturup listeye ekler.
        """
        alerts = []
        for rule in self.rules:
            result = rule.evaluate(event)
            
            if result.is_triggered:
                alert = Alert(
                    event_id=event.id,
                    user_id=event.user_id,
                    rule_name=rule.name,
                    severity=rule.severity,
                    description=result.reason
                )
                alerts.append(alert)
                
        return alerts