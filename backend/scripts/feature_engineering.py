import sys
import os
import pandas as pd

# app modülünü bulabilmesi için
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.infrastructure.database import SessionLocal
from app.infrastructure.models import SecurityEvent
from app.application.anomaly_engine import AnomalyEngine

CRITICAL_EVENTS = {"FILE_DOWNLOAD", "PRIVILEGE_CHANGE", "DATA_EXPORT"}

def extract_features():
    db = SessionLocal()
    try:
        query = db.query(SecurityEvent)
        df = pd.read_sql(query.statement, db.bind)
    finally:
        db.close()

    if df.empty:
        print("Veritabanında olay bulunamadı.")
        return

    df['timestamp'] = pd.to_datetime(df['timestamp'])
    df['is_critical'] = df['event_type'].apply(lambda x: 1 if x in CRITICAL_EVENTS else 0)
    df['is_off_hours'] = df['timestamp'].apply(lambda x: 1 if (x.hour < 7 or x.hour >= 19) else 0)

    grouped = df.groupby(['user_id', pd.Grouper(key='timestamp', freq='1h')])
    
    features_df = grouped.agg(
        event_count=('id', 'count'),
        critical_action_count=('is_critical', 'sum'),
        distinct_ips=('ip_address', 'nunique'),
        distinct_devices=('device_id', 'nunique'),
        off_hours_count=('is_off_hours', 'sum')
    ).reset_index()

    features_df['critical_action_ratio'] = (features_df['critical_action_count'] / features_df['event_count']).round(2)
    features_df['off_hours_ratio'] = (features_df['off_hours_count'] / features_df['event_count']).round(2)
    features_df = features_df.drop(columns=['off_hours_count'])

    # --- ML MOTORU ENTEGRASYONU ---
    print("--- 🤖 ML MODELİ EĞİTİLİYOR ---")
    ml_engine = AnomalyEngine(contamination=0.1) # %10 anomali beklentisi
    
    # 1. Eğit
    ml_engine.fit(features_df)
    
    # 2. Skorla
    scored_df = ml_engine.score(features_df)
    
    # Analiz için sadece önemli kolonları gösterelim (Konsola sığsın diye)
    pd.set_option('display.max_columns', None)
    pd.set_option('display.width', 1000)
    
    cols_to_show = [
        'user_id', 
        'timestamp', 
        'event_count', 
        'critical_action_ratio', 
        'off_hours_ratio', 
        'iforest_score', 
        'iforest_prediction'
    ]
    
    print("\n--- 🧠 ANOMALİ SKORLARI (En Kolay İzole Edilenden, En Zora) ---")
    print(scored_df[cols_to_show].head(10).to_string(index=False))

if __name__ == "__main__":
    extract_features()