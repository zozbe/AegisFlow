from typing import List
from datetime import timedelta
from app.infrastructure.models import SecurityEvent, SecurityAlert
from app.api.schemas import TimelineEvent, EventSource

def build_behavioral_timeline(
    events: List[SecurityEvent], 
    alerts: List[SecurityAlert],
    ml_norm_score: float,
    window_start
) -> List[TimelineEvent]:
    timeline = []

    # 1. Kural İhlalleri (Rule Signals)
    for alert in alerts:
        timeline.append(
            TimelineEvent(
                timestamp=alert.timestamp,
                event_type=alert.rule_name.upper(),
                description=f"Statik Kural: {alert.description}",
                source=EventSource.RULE,
                severity=alert.severity
            )
        )

    # 2. Ham Olaylar (Raw Events)
    # Sistemdeki hareketleri bağlam oluşturması için ekliyoruz
    critical_event_types = ["DATA_EXPORT", "DELETE_USER", "PRIVILEGE_ESCALATION", "MASS_DOWNLOAD"]
    
    for event in events:
        severity = "HIGH" if event.event_type in critical_event_types else "INFO"
        timeline.append(
            TimelineEvent(
                timestamp=event.timestamp,
                event_type=event.event_type,
                description=f"Sistem aktivitesi: {event.event_type}",
                source=EventSource.RAW_EVENT,
                severity=severity
            )
        )

    # 3. Davranışsal Anomali Sinyali (Window-level ML Evidence)
    # Eğer ML skoru yüksekse (örn: 60 ve üzeri), bunu tekil bir event'e değil, 
    # pencerenin geneline yayılan bir "Bağlamsal Anomali" olarak çizelgeye ekliyoruz.
    if ml_norm_score >= 60.0:
        # Anomaliyi görsel olarak pencerenin sonuna veya son olayın zamanına hizalayabiliriz
        anomaly_time = max([e.timestamp for e in events]) if events else window_start + timedelta(minutes=59)
        timeline.append(
            TimelineEvent(
                timestamp=anomaly_time,
                event_type="BEHAVIORAL_ANOMALY",
                description=f"Bağlamsal Anomali: ML Modeli bu zaman penceresindeki eylem kombinasyonunu şüpheli buldu (Skor: {ml_norm_score:.1f})",
                source=EventSource.ML_ANOMALY,
                severity="CRITICAL" if ml_norm_score >= 80 else "HIGH"
            )
        )

    # 4. Tüm olayları kronolojik olarak (eskiden yeniye) sırala
    timeline.sort(key=lambda x: x.timestamp)

    return timeline