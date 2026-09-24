# 🛡️ AegisFlow

**AI-Assisted UEBA-Focused Security Analytics Platform**

AegisFlow is a security analytics prototype focused on **User and Entity Behavior Analytics (UEBA)**.

The project analyzes user and system behavior to identify unusual activity by combining:

* Rule-based security detection
* Statistical / machine learning anomaly detection
* Risk scoring
* Event correlation
* AI-assisted security analysis

The goal is to detect behavioral anomalies that may indicate **insider threats, compromised accounts, or unusual user activity**.

> **Note:** AegisFlow is a security analytics prototype developed for learning, experimentation, and portfolio purposes. An anomaly does not automatically mean that an attack has occurred.

---

## 🎯 Project Goal

Traditional security monitoring often relies heavily on predefined rules and known patterns.

AegisFlow explores a different approach by analyzing **behavioral context**.

For example:

```text
Normal:
LOGIN_SUCCESS
FILE_READ
LOGOUT

Potentially unusual:
LOGIN_SUCCESS
        ↓
New IP address
        ↓
New device
        ↓
Multiple critical actions
        ↓
Activity outside normal working hours
```

Instead of treating a single event as malicious, AegisFlow aims to combine multiple behavioral signals to generate a more meaningful security assessment.

---

## 🧠 Detection Approach

AegisFlow uses two independent detection paths:

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

### Rule-Based Detection

The Rule Engine evaluates deterministic security rules.

Current example:

**OffHoursCriticalActionRule**

Detects critical actions performed outside defined working hours.

Critical actions currently include:

* `FILE_DOWNLOAD`
* `PRIVILEGE_CHANGE`
* `DATA_EXPORT`

The rule engine generates an alert containing:

* User
* Rule name
* Severity
* Description
* Related event

### ML Anomaly Detection

The ML layer uses **Isolation Forest** to identify unusual behavioral patterns.

Behavior is analyzed in time windows grouped by user.

Current candidate features:

* `event_count`
* `critical_action_count`
* `critical_action_ratio`
* `distinct_ips`
* `distinct_devices`
* `off_hours_ratio`

The ML model produces an **anomaly signal**, which will later be transformed into an application-level anomaly score.

> ML anomalies are treated as behavioral signals, not direct proof of malicious activity.

---

## 🏗️ Architecture

AegisFlow follows a **Clean Architecture-inspired modular monolith** approach.

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

### Architecture Layers

#### Domain

Contains business concepts and detection rules.

Examples:

* `Event`
* `Alert`
* `RuleResult`
* `BaseRule`
* `OffHoursCriticalActionRule`

The domain layer is intentionally independent from FastAPI and SQLAlchemy.

#### Application

Contains application-level use cases and orchestration.

Example:

* `RuleEngine`

#### Infrastructure

Contains external technical dependencies.

Examples:

* PostgreSQL
* SQLAlchemy
* Database session management
* ORM models

#### API

The API layer will expose AegisFlow functionality through FastAPI endpoints.

Planned endpoints include:

```text
GET /api/v1/health
GET /api/v1/events
GET /api/v1/alerts
GET /api/v1/incidents
GET /api/v1/users/{user_id}/behavior
GET /api/v1/analytics
```

---

## 🛠️ Technology Stack

### Backend

* Python 3.13
* FastAPI
* Uvicorn
* SQLAlchemy 2
* Alembic
* Pydantic
* Pydantic Settings

### Database

* PostgreSQL 15
* psycopg

### Machine Learning

* Pandas
* NumPy
* Scikit-learn
* Isolation Forest

### Testing

* Pytest
* HTTPX

### Infrastructure

* Docker
* Docker Compose
* Git / GitHub

### Frontend

Planned:

* React
* TypeScript
* Vite

### AI

Planned:

* AI Security Analyst Assistant
* Structured security context
* Schema-validated AI responses

---

## 📊 Data Model

AegisFlow currently works with two main database entities.

### SecurityEvent

Represents a security-related user/system event.

Example:

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

Supported event types include:

```text
LOGIN_SUCCESS
LOGIN_FAILED
FILE_READ
FILE_DOWNLOAD
PRIVILEGE_CHANGE
DATA_EXPORT
LOGOUT
```

The event itself is not labeled as malicious.

Its **context and behavioral pattern** are analyzed by the detection system.

### SecurityAlert

Represents an alert generated by the Rule Engine.

An alert contains:

```text
event_id
user_id
rule_name
severity
description
timestamp
```

---

## 🧪 Synthetic Security Data

AegisFlow currently uses a synthetic security-event generator for development and testing.

The generator creates different behavioral profiles such as:

* HR user
* Finance user
* IT user

The synthetic dataset contains both normal and unusual behavioral patterns.

For example:

```text
Normal activity
    ↓
Known IP
Known device
Working hours
Normal events

Potentially unusual activity
    ↓
Different IP
Different device
Off-hours activity
Critical actions
```

The purpose is to create controlled data for testing the detection pipeline without using real user data.

---

## 🚨 Current Rule Engine

The first implemented detection rule is:

### OffHoursCriticalActionRule

Working-hour range for the MVP:

```text
07:00 - 19:00
```

Critical events outside this period generate a `HIGH` severity alert.

Example:

```text
User:      user_charlie_compromised
Event:     DATA_EXPORT
Time:      03:11
Rule:      OffHoursCriticalActionRule
Severity:  HIGH
```

---

## 🧪 Testing

The project includes unit and integration-oriented tests.

Example:

```bash
cd backend

python -m pytest tests/unit/
```

Current rule-engine tests verify:

* Critical actions outside working hours trigger an alert
* Critical actions during normal hours do not trigger this rule

Health endpoint testing verifies:

```text
GET /api/v1/health
```

with both healthy and database-unavailable scenarios considered.

---

## 🐳 Running the Project

### 1. Clone the repository

```bash
git clone <repository-url>
cd AegisFlow
```

### 2. Create the environment file

Create a `.env` file in the project root:

```env
POSTGRES_USER=your_user
POSTGRES_PASSWORD=your_password
POSTGRES_DB=aegisflow
DATABASE_URL=postgresql+psycopg://your_user:your_password@localhost:5432/aegisflow
```

> Do not commit `.env` to GitHub.

### 3. Start PostgreSQL

```bash
docker compose up -d
```

### 4. Install backend dependencies

```bash
cd backend

pip install -r requirements.txt
```

### 5. Run migrations

```bash
alembic upgrade head
```

### 6. Generate synthetic data

```bash
python scripts/data_generator.py
```

### 7. Run the Rule Engine

```bash
python scripts/run_rule_engine.py
```

### 8. Run tests

```bash
python -m pytest
```

---

## 📖 API Documentation

AegisFlow uses FastAPI.

Once the API server is running, interactive API documentation will be available through Swagger UI.

```text
/api/docs
```

and the OpenAPI schema through:

```text
/api/openapi.json
```

The API will eventually serve as the bridge between the security analytics backend and the React dashboard.

---

## 🗺️ Development Roadmap

### ✅ Phase 0 — Architecture

* [x] Project concept
* [x] UEBA-focused architecture
* [x] Clean Architecture structure
* [x] Rule + ML parallel detection design
* [x] Event and alert model design
* [x] MVP / future roadmap

### ✅ Phase 1 — Backend & Database

* [x] FastAPI foundation
* [x] PostgreSQL
* [x] SQLAlchemy
* [x] Alembic migrations
* [x] Health endpoint
* [x] Database connectivity tests

### ✅ Phase 2 — Synthetic Security Data

* [x] User behavior profiles
* [x] Synthetic security events
* [x] IP and device context
* [x] Normal and unusual behavior scenarios
* [x] Data verification script

### ✅ Phase 3 — Rule Engine

* [x] Domain entities
* [x] Rule abstraction
* [x] Strategy-based Rule Engine
* [x] Off-hours critical action detection
* [x] Unit tests
* [x] SecurityAlert persistence
* [x] Database migration

### 🚧 Phase 4 — ML Anomaly Detection

* [ ] Behavioral feature engineering
* [ ] Time-window aggregation
* [ ] Isolation Forest
* [ ] Anomaly score
* [ ] Model evaluation
* [ ] Rule + ML signal combination

### 🔜 Phase 5 — Incident Correlation

* [ ] Event correlation
* [ ] Multi-signal incidents
* [ ] Risk scoring
* [ ] Incident lifecycle
* [ ] Investigation timeline

### 🔜 Phase 6 — FastAPI Application Layer

* [ ] Events API
* [ ] Alerts API
* [ ] Incidents API
* [ ] Analytics API
* [ ] Swagger documentation
* [ ] API integration tests

### 🔜 Phase 7 — React Dashboard

* [ ] Authentication
* [ ] Security dashboard
* [ ] Alert list
* [ ] Incident view
* [ ] User behavior timeline
* [ ] Risk visualization
* [ ] Analytics

### 🔜 Phase 8 — AI Security Assistant

* [ ] Structured incident context
* [ ] AI-generated incident explanation
* [ ] Investigation suggestions
* [ ] Structured JSON output
* [ ] Output schema validation
* [ ] Prompt-injection-aware design

---

## 🔐 Security Principles

AegisFlow follows several security principles:

### AI is not the decision-maker

The AI layer does not directly decide whether an event is malicious.

Instead:

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

The AI assistant receives structured security evidence and helps explain it.

### Anomaly ≠ Attack

An unusual IP, device, or activity time does not automatically mean that an account has been compromised.

AegisFlow treats these characteristics as **behavioral signals** that need to be evaluated together.

### Structured AI Context

Security events will be passed to the AI layer as structured data.

AI responses will also be validated against a predefined schema before being used by the application.

---

## 📌 Current Project Status

AegisFlow currently has a working backend foundation with:

* PostgreSQL database
* SQLAlchemy ORM
* Alembic migrations
* Synthetic security-event generation
* Domain-level security rules
* Rule Engine
* Alert persistence
* Automated tests

The next major development step is **ML-based behavioral anomaly detection using Isolation Forest**.

---

## 👩‍💻 Author

**Berfin Zozan İnanç**

Computer Engineering Graduate

* GitHub: [github.com/zozbe](https://github.com/zozbe)
* LinkedIn: [linkedin.com/in/berfinzozaninanc](https://linkedin.com/in/berfinzozaninanc)
* Medium: [medium.com/@berfin.zozan](https://medium.com/@berfin.zozan)

---

## 📄 License

This project is developed for educational, experimental, and portfolio purposes.
