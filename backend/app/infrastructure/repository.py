from sqlalchemy.orm import Session
from sqlalchemy.dialects.postgresql import insert
from app.infrastructure.models import RiskAssessment

class RiskAssessmentRepository:
    def __init__(self, db_session: Session):
        self.db = db_session

    def upsert_assessments(self, assessments: list[RiskAssessment]):
        if not assessments:
            return

        values = []

        for a in assessments:
            values.append({
                "user_id": a.user_id,
                "window_start": a.window_start,
                "rule_score": a.rule_score,
                "ml_raw_score": a.ml_raw_score,
                "ml_norm_score": a.ml_norm_score,
                "final_risk": a.final_risk,
                "priority": a.priority
            })

        stmt = insert(RiskAssessment).values(values)

        stmt = stmt.on_conflict_do_update(
            index_elements=["user_id", "window_start"],
            set_={
                "rule_score": stmt.excluded.rule_score,
                "ml_raw_score": stmt.excluded.ml_raw_score,
                "ml_norm_score": stmt.excluded.ml_norm_score,
                "final_risk": stmt.excluded.final_risk,
                "priority": stmt.excluded.priority
            }
        )

        self.db.execute(stmt)
        self.db.commit()