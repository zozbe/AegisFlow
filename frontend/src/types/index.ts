export interface RiskAssessment {
  id: number;
  user_id: string;
  window_start: string;
  rule_score: number;
  ml_raw_score: number;
  ml_norm_score: number;
  final_risk: number;
  priority: string;
  created_at: string;
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

// Backend'deki Enum ile eşleşen Source tipleri
export type EventSource = 'RULE' | 'ML_ANOMALY' | 'RAW_EVENT';

export interface TimelineEvent {
  timestamp: string;
  event_type: string;
  description: string;
  source: EventSource;
  severity: string; // 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'
}

export interface EvidenceResponse {
  assessment_id: number;
  user_id: string;
  window_start: string;
  rule_evidence: RuleEvidence[];
  ml_evidence: MLEvidence;
  timeline: TimelineEvent[]; // YENİ: Korelasyon çizelgemiz
}