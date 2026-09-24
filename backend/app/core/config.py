from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

# config.py'nin bulunduğu yerden dinamik olarak 4 üst klasöre çıkıyoruz
# 1. parent: core -> 2. parent: app -> 3. parent: backend -> 4. parent: AegisFlow (kök)
ROOT_DIR = Path(__file__).resolve().parent.parent.parent.parent
ENV_FILE_PATH = ROOT_DIR / ".env"

class Settings(BaseSettings):
    PROJECT_NAME: str = "AegisFlow API"
    DATABASE_URL: str

    model_config = SettingsConfigDict(
        # Artık .env dosyasının yolunu kesin ve mutlak olarak veriyoruz
        env_file=str(ENV_FILE_PATH), 
        extra="ignore"
    )

settings = Settings()