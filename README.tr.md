# 🛡️ AegisFlow

**Yapay Zekâ Destekli UEBA Odaklı Güvenlik Analitiği Platformu**

AegisFlow, **Kullanıcı ve Varlık Davranış Analitiği (UEBA — User and Entity Behavior Analytics)** yaklaşımına odaklanan bir güvenlik analitiği prototipidir.

Proje, kullanıcı ve sistem davranışlarını analiz ederek olağandışı aktiviteleri tespit etmek için birden fazla yaklaşımı bir araya getirir:

* Kural tabanlı güvenlik tespiti
* İstatistiksel / makine öğrenmesi tabanlı anomali tespiti
* Risk skorlama
* Olay korelasyonu
* Yapay zekâ destekli güvenlik analizi

Temel amaç; **iç tehdit, ele geçirilmiş hesap veya olağandışı kullanıcı davranışlarına** işaret edebilecek davranışsal anomalileri tespit edebilen bir güvenlik analitiği altyapısı geliştirmektir.

> **Not:** AegisFlow eğitim, deneysel geliştirme ve portföy amacıyla oluşturulan bir güvenlik analitiği prototipidir. Bir anomalinin tespit edilmesi, tek başına bir saldırının gerçekleştiği anlamına gelmez.

---

## 🎯 Projenin Amacı

Geleneksel güvenlik izleme sistemleri çoğunlukla önceden tanımlanmış kurallara ve bilinen saldırı kalıplarına dayanır.

AegisFlow ise davranışın **bağlamını ve zaman içerisindeki örüntülerini** analiz etmeyi amaçlar.

Örneğin:

```text
Normal davranış:

LOGIN_SUCCESS
      ↓
FILE_READ
      ↓
LOGOUT
```

Potansiyel olarak olağandışı davranış:

```text
LOGIN_SUCCESS
      ↓
Yeni IP adresi
      ↓
Yeni cihaz
      ↓
Birden fazla kritik işlem
      ↓
Mesai dışı aktivite
```

Bu nedenle sistem tek bir olayı doğrudan kötü amaçlı olarak değerlendirmek yerine, birden fazla davranışsal sinyali birlikte analiz etmeyi hedefler.

---

## 🧠 Tespit Yaklaşımı

AegisFlow iki bağımsız tespit mekanizmasını paralel olarak kullanır:

```text
                    Security Events
                          │
                          ▼
                  ┌───────────────┐
                  │  Normalization │
                  └───────┬───────┘
                          │
              ┌───────────┴───────────┐
              ▼                       ▼
       ┌──────────────┐       ┌────────────────┐
       │ Rule Engine  │       │ ML Anomaly     │
       │              │       │ Detection      │
       └──────┬───────┘       └───────┬────────┘
              │                       │
              └───────────┬───────────┘
                          ▼
                    Risk Assessment
                          │
                          ▼
                    Event Correlation
                          │
                          ▼
                       Incidents
                          │
                          ▼
                AI Security Assistant
                          │
                          ▼
                    React Dashboard
```

### Kural Tabanlı Tespit

Rule Engine, önceden tanımlanmış güvenlik kurallarını değerlendirir.

Şu anda uygulanan örnek kural:

**OffHoursCriticalActionRule**

Bu kural, kritik işlemlerin tanımlanan çalışma saatleri dışında gerçekleştirilmesini tespit eder.

Mevcut kritik işlem türleri:

* `FILE_DOWNLOAD`
* `PRIVILEGE_CHANGE`
* `DATA_EXPORT`

Kural tetiklendiğinde aşağıdaki bilgileri içeren bir alarm oluşturulur:

* Kullanıcı
* Kural adı
* Önem seviyesi
* Açıklama
* İlgili olay

### Makine Öğrenmesi ile Anomali Tespiti

ML katmanında davranışsal örüntüleri analiz etmek için **Isolation Forest** kullanılmaktadır.

Davranışlar kullanıcı bazında zaman pencerelerinde gruplanır.

Kullanılması planlanan temel özellikler:

* `event_count`
* `critical_action_count`
* `critical_action_ratio`
* `distinct_ips`
* `distinct_devices`
* `off_hours_ratio`

Model tarafından üretilen anomali sinyali daha sonra uygulama seviyesinde bir anomali skoruna dönüştürülecektir.

> ML tarafından tespit edilen bir anomali, doğrudan kötü amaçlı aktivite olarak değerlendirilmez. Anomali, daha ileri analiz için davranışsal bir sinyal olarak ele alınır.

---

## 🏗️ Mimari

AegisFlow, **Clean Architecture yaklaşımından yararlanan modüler monolith** mimarisi ile geliştirilmektedir.

```text
AegisFlow/
│
├── backend/
│   ├── app/
│   │   ├── core/
│   │   ├── domain/
│   │   ├── application/
│   │   └── infrastructure/
│   │
│   ├── scripts/
│   ├── tests/
│   ├── alembic/
│   └── main.py
│
├── docker-compose.yml
├── .env
└── README.md
```

### Mimari Katmanlar

#### Domain

Uygulamanın temel güvenlik kavramlarını ve iş kurallarını içerir.

Örnekler:

* `Event`
* `Alert`
* `RuleResult`
* `BaseRule`
* `OffHoursCriticalActionRule`

Domain katmanı FastAPI veya SQLAlchemy gibi framework'lerden bağımsız tutulmaktadır.

#### Application

Uygulama seviyesindeki işlemleri ve orkestrasyonu içerir.

Örneğin:

* `RuleEngine`

#### Infrastructure

Harici teknik bağımlılıkları içerir.

Örnekler:

* PostgreSQL
* SQLAlchemy
* Veritabanı bağlantısı
* ORM modelleri

#### API

FastAPI tabanlı API katmanı, AegisFlow fonksiyonlarının dış dünyaya açılmasını sağlayacaktır.

Planlanan endpoint'ler:

```text
GET /api/v1/health
GET /api/v1/events
GET /api/v1/alerts
GET /api/v1/incidents
GET /api/v1/users/{user_id}/behavior
GET /api/v1/analytics
```

---

## 🛠️ Teknoloji Stack'i

### Backend

* Python 3.13
* FastAPI
* Uvicorn
* SQLAlchemy 2
* Alembic
* Pydantic
* Pydantic Settings

### Veritabanı

* PostgreSQL 15
* psycopg

### Makine Öğrenmesi

* Pandas
* NumPy
* Scikit-learn
* Isolation Forest

### Test

* Pytest
* HTTPX

### Altyapı

* Docker
* Docker Compose
* Git
* GitHub

### Frontend

Planlanan teknolojiler:

* React
* TypeScript
* Vite

### Yapay Zekâ

Planlanan AI Security Assistant özellikleri:

* Yapılandırılmış güvenlik bağlamı
* Olay açıklaması
* İnceleme / araştırma önerileri
* Yapılandırılmış JSON çıktısı
* Çıktı şeması doğrulaması

---

## 📊 Veri Modeli

AegisFlow şu anda iki temel veritabanı varlığı üzerinden çalışmaktadır.

### SecurityEvent

Bir kullanıcı veya sistem tarafından gerçekleştirilen güvenlik olayını temsil eder.

Örnek:

```json
{
  "user_id": "user_charlie_compromised",
  "event_type": "DATA_EXPORT",
  "timestamp": "2026-09-25T03:11:00",
  "ip_address": "192.168.1.10",
  "device_id": "device-123",
  "metadata_json": {
    "role": "IT"
  }
}
```

Desteklenen olay türlerinden bazıları:

```text
LOGIN_SUCCESS
LOGIN_FAILED
FILE_READ
FILE_DOWNLOAD
PRIVILEGE_CHANGE
DATA_EXPORT
LOGOUT
```

Olayın kendisi doğrudan kötü amaçlı olarak etiketlenmez.

Sistem olayın **bağlamını ve davranışsal örüntüsünü** analiz eder.

### SecurityAlert

Rule Engine tarafından oluşturulan güvenlik alarmını temsil eder.

Bir alarm aşağıdaki bilgileri içerir:

```text
event_id
user_id
rule_name
severity
description
timestamp
```

---

## 🧪 Sentetik Güvenlik Verisi

AegisFlow geliştirme ve test aşamasında sentetik güvenlik olayları üreten bir veri oluşturucu kullanmaktadır.

Veri oluşturucu farklı kullanıcı davranış profilleri oluşturur.

Örneğin:

* HR kullanıcısı
* Finance kullanıcısı
* IT kullanıcısı

Sentetik veri içerisinde hem normal hem de olağandışı davranış senaryoları bulunmaktadır.

Örnek:

```text
Normal aktivite
    ↓
Bilinen IP
Bilinen cihaz
Çalışma saatleri
Normal olaylar

Potansiyel olarak olağandışı aktivite
    ↓
Farklı IP
Farklı cihaz
Mesai dışı aktivite
Kritik işlemler
```

Bu yaklaşım, gerçek kullanıcı verileri kullanılmadan kontrollü bir test ortamı oluşturmayı sağlar.

---

## 🚨 Mevcut Rule Engine

Şu anda uygulanan temel güvenlik kuralı:

### OffHoursCriticalActionRule

MVP için çalışma saatleri:

```text
07:00 - 19:00
```

Kritik bir işlem bu saatlerin dışında gerçekleştirildiğinde `HIGH` seviyesinde alarm oluşturulur.

Örnek:

```text
Kullanıcı:    user_charlie_compromised
Olay:         DATA_EXPORT
Saat:         03:11
Kural:        OffHoursCriticalActionRule
Önem:         HIGH
```

---

## 🧪 Testler

Projede unit testler ve entegrasyon odaklı testler bulunmaktadır.

Unit testleri çalıştırmak için:

```bash
cd backend

python -m pytest tests/unit/
```

Mevcut Rule Engine testleri şunları kontrol eder:

* Kritik bir işlemin mesai dışında alarm oluşturması
* Kritik bir işlemin normal çalışma saatlerinde bu kural tarafından alarm oluşturmaması

Health endpoint'i için de veritabanı bağlantısının başarılı ve başarısız olduğu senaryolar test edilmiştir.

---

## 🐳 Projeyi Çalıştırma

### 1. Repository'yi klonla

```bash
git clone <repository-url>
cd AegisFlow
```

### 2. Ortam değişkenlerini oluştur

Proje kök dizininde `.env` dosyası oluştur:

```env
POSTGRES_USER=your_user
POSTGRES_PASSWORD=your_password
POSTGRES_DB=aegisflow
DATABASE_URL=postgresql+psycopg://your_user:your_password@localhost:5432/aegisflow
```

> `.env` dosyasını GitHub'a yüklemeyin.

### 3. PostgreSQL'i başlat

```bash
docker compose up -d
```

### 4. Backend bağımlılıklarını yükle

```bash
cd backend

pip install -r requirements.txt
```

### 5. Veritabanı migration'larını çalıştır

```bash
alembic upgrade head
```

### 6. Sentetik veri oluştur

```bash
python scripts/data_generator.py
```

### 7. Rule Engine'i çalıştır

```bash
python scripts/run_rule_engine.py
```

### 8. Testleri çalıştır

```bash
python -m pytest
```

---

## 📖 API Dokümantasyonu

AegisFlow, FastAPI kullanmaktadır.

API sunucusu çalıştırıldığında FastAPI'nin interaktif Swagger dokümantasyonu kullanılabilecektir.

```text
/api/docs
```

OpenAPI şeması:

```text
/api/openapi.json
```

API katmanı ilerleyen aşamalarda güvenlik analitiği backend'i ile React dashboard arasında bağlantı görevi görecektir.

---

## 🗺️ Geliştirme Yol Haritası

### ✅ Faz 0 — Mimari

* [x] Proje konsepti
* [x] UEBA odaklı mimari
* [x] Clean Architecture yapısı
* [x] Rule + ML paralel tespit tasarımı
* [x] Event ve Alert modelinin tasarlanması
* [x] MVP ve gelecek fazların belirlenmesi

### ✅ Faz 1 — Backend & Veritabanı

* [x] FastAPI temeli
* [x] PostgreSQL
* [x] SQLAlchemy
* [x] Alembic migration'ları
* [x] Health endpoint
* [x] Veritabanı bağlantı testleri

### ✅ Faz 2 — Sentetik Güvenlik Verisi

* [x] Kullanıcı davranış profilleri
* [x] Sentetik güvenlik olayları
* [x] IP ve cihaz bağlamı
* [x] Normal ve olağandışı davranış senaryoları
* [x] Veri doğrulama script'i

### ✅ Faz 3 — Rule Engine

* [x] Domain entity'leri
* [x] Rule abstraction
* [x] Strategy tabanlı Rule Engine
* [x] Mesai dışı kritik işlem tespiti
* [x] Unit testler
* [x] SecurityAlert kayıtlarının oluşturulması
* [x] Database migration

### 🚧 Faz 4 — ML Anomali Tespiti

* [ ] Davranışsal feature engineering
* [ ] Zaman penceresi bazlı veri gruplama
* [ ] Isolation Forest
* [ ] Anomali skoru
* [ ] Model değerlendirmesi
* [ ] Rule + ML sinyallerinin birleştirilmesi

### 🔜 Faz 5 — Incident Correlation

* [ ] Event correlation
* [ ] Birden fazla sinyalden incident oluşturma
* [ ] Risk skorlama
* [ ] Incident yaşam döngüsü
* [ ] Investigation timeline

### 🔜 Faz 6 — FastAPI Application Layer

* [ ] Events API
* [ ] Alerts API
* [ ] Incidents API
* [ ] Analytics API
* [ ] Swagger dokümantasyonu
* [ ] API integration testleri

### 🔜 Faz 7 — React Dashboard

* [ ] Authentication
* [ ] Security dashboard
* [ ] Alert listesi
* [ ] Incident görünümü
* [ ] Kullanıcı davranış timeline'ı
* [ ] Risk görselleştirmeleri
* [ ] Analytics

### 🔜 Faz 8 — AI Security Assistant

* [ ] Yapılandırılmış incident context
* [ ] AI destekli incident açıklaması
* [ ] Investigation önerileri
* [ ] Yapılandırılmış JSON çıktısı
* [ ] Output schema validation
* [ ] Prompt injection güvenlik yaklaşımı

---

## 🔐 Güvenlik Prensipleri

### AI karar verici değildir

AI katmanı bir olayın doğrudan kötü amaçlı olup olmadığına karar vermez.

Sistem yaklaşımı:

```text
Events
  ↓
Rules + ML
  ↓
Evidence
  ↓
Risk / Correlation
  ↓
AI Explanation
```

AI Security Assistant, yapılandırılmış güvenlik kanıtlarını açıklamaya ve analistin inceleme sürecini desteklemeye yardımcı olur.

### Anomali ≠ Saldırı

Olağandışı bir IP adresi, cihaz veya aktivite saati tek başına hesabın ele geçirildiğini göstermez.

AegisFlow bu özellikleri, birlikte değerlendirilmesi gereken **davranışsal sinyaller** olarak ele alır.

### Yapılandırılmış AI Context

Güvenlik olayları AI katmanına yapılandırılmış veri olarak aktarılacaktır.

AI tarafından oluşturulan çıktılar da uygulama içerisinde kullanılmadan önce önceden tanımlanmış bir şema üzerinden doğrulanacaktır.

---

## 📌 Güncel Proje Durumu

AegisFlow şu anda çalışan bir backend temel altyapısına sahiptir:

* PostgreSQL
* SQLAlchemy ORM
* Alembic migration'ları
* Sentetik güvenlik olayı üretimi
* Domain seviyesinde güvenlik kuralları
* Rule Engine
* Alert persistence
* Otomatik testler

Bir sonraki büyük geliştirme aşaması:

**Isolation Forest kullanarak makine öğrenmesi tabanlı davranışsal anomali tespiti.**

---

## 👩‍💻 Geliştirici

**Berfin Zozan İnanç**

Bilgisayar Mühendisliği Mezunu

* GitHub: github.com/zozbe
* LinkedIn: linkedin.com/in/berfinzozaninanc
* Medium: medium.com/@berfin.zozan

---

## 📄 Lisans

Bu proje eğitim, deneysel geliştirme ve portföy amacıyla geliştirilmiştir.
