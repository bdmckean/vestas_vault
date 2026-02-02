import axios from 'axios';
import type { PlannedSpending, PlannedSpendingCreate, PlannedSpendingUpdate } from '../types/planned_spending';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8005';

const apiClient = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const plannedSpendingApi = {
  getPlannedSpending: async (): Promise<PlannedSpending | null> => {
    const response = await apiClient.get<PlannedSpending | null>('/planned-spending');
    return response.data;
  },

  createPlannedSpending: async (data: PlannedSpendingCreate): Promise<PlannedSpending> => {
    const response = await apiClient.post<PlannedSpending>('/planned-spending', data);
    return response.data;
  },

  updatePlannedSpending: async (data: PlannedSpendingUpdate): Promise<PlannedSpending> => {
    const response = await apiClient.put<PlannedSpending>('/planned-spending', data);
    return response.data;
  },

  deletePlannedSpending: async (): Promise<void> => {
    await apiClient.delete('/planned-spending');
  },

  getTotalAnnualSpending: async (): Promise<{ total_annual_spending: string }> => {
    const response = await apiClient.get<{ total_annual_spending: string }>('/planned-spending/total-annual');
    return response.data;
  },
};
