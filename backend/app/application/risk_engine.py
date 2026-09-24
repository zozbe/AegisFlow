import math

class RiskEngine:
    ML_WEIGHT = 0.25

    def normalize_ml_score(self, raw_score: float, k: float = 15.0, tau: float = 0.0) -> float:
        """
        Isolation Forest ham skorunu 0-100 arasındaki
        ML anomaly score değerine dönüştürür.

        Daha negatif raw_score -> daha yüksek anomaly score.
        """
        exponent = k * (raw_score - tau)
        ml_score = 100 / (1 + math.exp(exponent))

        return round(ml_score, 2)

    def aggregate_rule_scores(self, rule_scores: list[float]) -> float:
        """
        Birden fazla rule skorunu diminishing returns
        yaklaşımıyla 0-100 aralığında birleştirir.
        """
        if not rule_scores:
            return 0.0

        total_score = 0.0

        for score in sorted(rule_scores, reverse=True):
            total_score += score * ((100 - total_score) / 100)

        return round(total_score, 2)

    def calculate_risk(self, rule_score: float, ml_score: float) -> float:
        """
        Rule ve ML sinyallerini birleştirerek nihai
        0-100 investigation priority skorunu hesaplar.

        ML maksimum %25 oranında katkı sağlayabilir.
        """
        ml_contribution = ml_score * self.ML_WEIGHT
        remaining_space = (100 - rule_score) / 100

        risk = rule_score + (ml_contribution * remaining_space)

        return round(min(risk, 100), 2)