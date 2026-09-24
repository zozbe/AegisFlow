from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

# Veritabanı ile konuşacak ana motoru oluşturuyoruz
engine = create_engine(settings.DATABASE_URL)

# Her bir istek geldiğinde veritabanında açılacak oturumların fabrikası
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# İleride tablolarımızı (SecurityEvent vb.) bu Base sınıfından türeteceğiz
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()