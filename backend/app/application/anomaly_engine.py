import pandas as pd
from sklearn.ensemble import IsolationForest

class AnomalyEngine:
    def __init__(self, contamination=0.1, random_state=42):
        # contamination: -1 / 1 etiketlemesi için kesme noktası (threshold) belirler
        self.model = IsolationForest(
            contamination=contamination, 
            random_state=random_state,
            n_estimators=100
        )
        
        self.feature_columns = [
            'event_count', 
            'critical_action_count', 
            'distinct_ips', 
            'distinct_devices', 
            'critical_action_ratio', 
            'off_hours_ratio'
        ]

    def fit(self, features_df: pd.DataFrame):
        """Modeli, verilen davranış matrisi üzerinde eğitir."""
        if features_df.empty:
            raise ValueError("Eğitim için veri bulunamadı.")
            
        X = features_df[self.feature_columns]
        self.model.fit(X)

    def score(self, features_df: pd.DataFrame) -> pd.DataFrame:
        """Eğitilmiş model üzerinden anomali skorlarını hesaplar ve DataFrame'e ekler."""
        if features_df.empty:
            return features_df
            
        X = features_df[self.feature_columns]
        
        # decision_function: Ne kadar negatifse uzayda o kadar kolay izole ediliyor demektir
        scores = self.model.decision_function(X)
        
        # predict: Sadece contamination oranına göre verilmiş kaba bir -1 (izole) veya 1 (normal) kararı
        predictions = self.model.predict(X)
        
        result_df = features_df.copy()
        result_df['iforest_score'] = scores.round(4)
        result_df['iforest_prediction'] = predictions
        
        # Matematiksel olarak en kolay izole edilenden (en negatif) en zora (en pozitif) doğru sıralıyoruz
        result_df = result_df.sort_values(by='iforest_score', ascending=True)
        
        return result_df