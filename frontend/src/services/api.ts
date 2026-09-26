import { RiskAssessment, EvidenceResponse, SecurityIncident } from '../types';

const BASE_URL = 'http://127.0.0.1:8000/api/v1';

export const getAssessments = async (userId?: string): Promise<RiskAssessment[]> => {
  const url = userId
    ? `${BASE_URL}/assessments?user_id=${encodeURIComponent(userId)}`
    : `${BASE_URL}/assessments`;

  const response = await fetch(url);
  if (!response.ok) throw new Error(`API Hatası: ${response.status}`);
  return response.json();
};

export const getAssessmentEvidence = async (id: number): Promise<EvidenceResponse> => {
  const response = await fetch(`${BASE_URL}/assessments/${id}/evidence`);
  if (!response.ok) throw new Error(`API Hatası: ${response.status}`);
  return response.json();
};

export const getIncidents = async (): Promise<SecurityIncident[]> => {
  const response = await fetch(`${BASE_URL}/incidents`);
  if (!response.ok) {
    throw new Error('Vakalar (Incidents) getirilemedi');
  }
  return response.json();
};

export const getIncidentById = async (id: number): Promise<SecurityIncident> => {
  const response = await fetch(`${BASE_URL}/incidents/${id}`);
  if (!response.ok) {
    throw new Error('Vaka detayı getirilemedi');
  }
  return response.json();
};