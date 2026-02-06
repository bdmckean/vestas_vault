import axios from 'axios';
import type {
  SavedScenario,
  SavedScenarioCreate,
  SavedScenarioUpdate,
  ScenarioProjectionResult,
  ScenarioComparisonResult,
} from '../types/saved_scenario';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8005';

const apiClient = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const savedScenariosApi = {
  getAll: async (): Promise<SavedScenario[]> => {
    const response = await apiClient.get<SavedScenario[]>('/saved-scenarios');
    return response.data;
  },

  getById: async (id: string): Promise<SavedScenario> => {
    const response = await apiClient.get<SavedScenario>(`/saved-scenarios/${id}`);
    return response.data;
  },

  create: async (data: SavedScenarioCreate): Promise<SavedScenario> => {
    const response = await apiClient.post<SavedScenario>('/saved-scenarios', data);
    return response.data;
  },

  update: async (id: string, data: SavedScenarioUpdate): Promise<SavedScenario> => {
    const response = await apiClient.put<SavedScenario>(`/saved-scenarios/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/saved-scenarios/${id}`);
  },

  duplicate: async (id: string, newName: string): Promise<SavedScenario> => {
    const response = await apiClient.post<SavedScenario>(
      `/saved-scenarios/${id}/duplicate?new_name=${encodeURIComponent(newName)}`
    );
    return response.data;
  },

  getProjection: async (id: string): Promise<ScenarioProjectionResult> => {
    const response = await apiClient.get<ScenarioProjectionResult>(
      `/saved-scenarios/${id}/projection`
    );
    return response.data;
  },

  generateAdhocProjection: async (data: SavedScenarioCreate): Promise<ScenarioProjectionResult> => {
    const response = await apiClient.post<ScenarioProjectionResult>(
      '/saved-scenarios/projection',
      data
    );
    return response.data;
  },

  compare: async (scenarioIds: string[]): Promise<ScenarioComparisonResult> => {
    const response = await apiClient.post<ScenarioComparisonResult>(
      '/saved-scenarios/compare',
      scenarioIds
    );
    return response.data;
  },

  createOrUpdateDefault: async (): Promise<SavedScenario> => {
    const response = await apiClient.post<SavedScenario>('/saved-scenarios/default');
    return response.data;
  },
};
