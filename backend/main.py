from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints import assessments

app = FastAPI(
    title="AegisFlow API", 
    description="User and Entity Behavior Analytics (UEBA) System",
    version="1.0.0"
)

# İleride React (Frontend) Dashboard'umuzun API'ye erişebilmesi için CORS izinleri
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Geliştirme aşamasında her şeye izin veriyoruz
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Yazdığımız router'ı /api/v1 prefix'i ile uygulamaya bağlıyoruz
app.include_router(assessments.router, prefix="/api/v1", tags=["Risk Assessments"])

@app.get("/")
def root():
    return {"message": "AegisFlow API is running. Go to /docs for Swagger UI."}