import axios from 'axios';
import type { ScenarioCreate, ScenarioResult } from '../types/scenario';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8005';

const apiClient = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const scenarioApi = {
  createScenario: async (data: ScenarioCreate): Promise<ScenarioResult> => {
    const response = await apiClient.post<ScenarioResult>('/scenarios', data);
    return response.data;
  },

  exportScenarioCSV: async (data: ScenarioCreate): Promise<Blob> => {
    const response = await apiClient.post('/scenarios/export/csv', data, {
      responseType: 'blob',
    });
    return response.data;
  },

  exportScenarioJSON: async (data: ScenarioCreate): Promise<ScenarioResult> => {
    const response = await apiClient.post<ScenarioResult>('/scenarios/export/json', data);
    return response.data;
  },
};
