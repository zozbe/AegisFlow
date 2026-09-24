from fastapi.testclient import TestClient
from main import app

# API'mizi tarayıcı olmadan test edebilmek için sanal bir istemci oluşturuyoruz
client = TestClient(app)

def test_health_check():
    # 1. API'ye tıpkı bir kullanıcının tarayıcıdan girmesi gibi GET isteği at
    response = client.get("/api/v1/health")
    
    # 2. HTTP 200 OK (Başarılı) kodu döndüğünden emin ol
    assert response.status_code == 200
    
    # 3. Gelen JSON verisinin tam beklediğimiz gibi olduğundan emin ol
    data = response.json()
    assert data["status"] == "healthy"
    assert data["database"] == "connected"