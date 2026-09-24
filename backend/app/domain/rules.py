from abc import ABC, abstractmethod
from app.domain.entities import Event, RuleResult

# Yeni yazılacak her kuralın uyması gereken zorunlu şablon
class BaseRule(ABC):
    @property
    @abstractmethod
    def name(self) -> str:
        pass

    @property
    @abstractmethod
    def severity(self) -> str:
        # Örn: "LOW", "MEDIUM", "HIGH", "CRITICAL"
        pass

    @abstractmethod
    def evaluate(self, event: Event) -> RuleResult:
        pass

# İlk Kuralımız: Mesai Dışı Kritik İşlem Kuralı
class OffHoursCriticalActionRule(BaseRule):
    name = "OffHoursCriticalActionRule"
    severity = "HIGH"
    
    # Kuralın ilgilendiği spesifik olaylar
    CRITICAL_EVENTS = {"FILE_DOWNLOAD", "PRIVILEGE_CHANGE", "DATA_EXPORT"}

    def evaluate(self, event: Event) -> RuleResult:
        # 1. Kriter: Olay kritik bir tür mü? Değilse doğrudan pas geç (örneğin FILE_READ ise ilgilenme)
        if event.event_type not in self.CRITICAL_EVENTS:
            return RuleResult(is_triggered=False)

        # 2. Kriter: Mesai dışı mı? 
        # (MVP için genel mesai saatini 07:00 - 19:00 kabul ediyoruz. İleride bu bilgiyi UserProfile'dan dinamik alacağız)
        hour = event.timestamp.hour
        is_off_hours = hour < 7 or hour >= 19

        if is_off_hours:
            return RuleResult(
                is_triggered=True,
                score=80,
                reason=f"Kritik işlem ({event.event_type}) mesai saatleri dışında ({hour:02d}:00) gerçekleştirildi."
            )

        # Gündüz vakti yapılan kritik işlemler (Örn: Gündüz saat 14:00'te DATA_EXPORT) bu kurala takılmaz.
        return RuleResult(is_triggered=False)