export interface RiskAssessment {
  id: number;
  user_id: string;
  window_start: string;
  rule_score: number;
  ml_raw_score: number;
  ml_norm_score: number;
  final_risk: number;
  priority: string;
}