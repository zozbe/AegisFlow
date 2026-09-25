import { RiskAssessment } from '../types';

const BASE_URL = 'http://127.0.0.1:8000/api/v1';

export const getAssessments = async (
  userId?: string
): Promise<RiskAssessment[]> => {
  const url = userId
    ? `${BASE_URL}/assessments?user_id=${encodeURIComponent(userId)}`
    : `${BASE_URL}/assessments`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`API Hatası: ${response.status}`);
  }

  return response.json();
};