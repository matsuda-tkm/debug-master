// API設定
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const API_ENDPOINTS = {
  HEALTH: `${API_BASE_URL}/api/health`,
  CHALLENGES: `${API_BASE_URL}/api/challenges`,
  CHALLENGE_BY_ID: (id: string) => `${API_BASE_URL}/api/challenges/${id}`,
  GENERATE_CODE: `${API_BASE_URL}/api/generate-code`,
  GENERATE_HINT: `${API_BASE_URL}/api/generate-hint`,
  GENERATE_EXPLANATION: `${API_BASE_URL}/api/generate-explanation`,
  GENERATE_RETIRE_EXPLANATION: `${API_BASE_URL}/api/generate-retire-explanation`,
  RUN_PYTHON: `${API_BASE_URL}/api/run-python`,
} as const;

export default API_ENDPOINTS;
