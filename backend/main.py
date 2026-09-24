from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.infrastructure.database import get_db

app = FastAPI(title="AegisFlow API")

@app.get("/api/v1/health")
def health_check(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        # Gerçek hatayı (e) ileride burada backend loglarına yazdıracağız (saldırgan görmeyecek)
        # print(f"Database connection error: {e}") 
        
        # Kullanıcıya ise sadece genel bir 503 hatası dönüyoruz
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection failed"
        )