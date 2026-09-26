export interface RiskAssessment {
  id: number;
  user_id: string;
  window_start: string;
  rule_score: number;
  ml_raw_score: number;
  ml_norm_score: number;
  final_risk: number;
  priority: string;
  created_at: string; // <-- 1. Hatayı çözen satır
}

export interface RuleEvidence {
  rule_name: string;
  severity: string;
  count: number;
}

export interface MLEvidence {
  total_events: number;
  distinct_ips: number;
  critical_actions: number;
}

export interface EvidenceResponse {
  assessment_id: number;
  user_id: string;
  window_start: string;
  rule_evidence: RuleEvidence[];
  ml_evidence: MLEvidence;
}