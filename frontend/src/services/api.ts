import { RiskAssessment } from '../types';

const BASE_URL = 'http://127.0.0.1:8000/api/v1';

export const getAssessments = async (): Promise<RiskAssessment[]> => {
  const response = await fetch(`${BASE_URL}/assessments`);
  if (!response.ok) {
    throw new Error(`API Hatası: ${response.status}`);
  }
  return response.json();
};