import axios from 'axios';
import type {
  Holding,
  HoldingCreate,
  HoldingUpdate,
  AccountHoldingsSummary,
  PortfolioAllocation,
} from '../types/holding';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8005';

const apiClient = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const holdingsApi = {
  getAllHoldings: async (): Promise<Holding[]> => {
    const response = await apiClient.get<Holding[]>('/holdings');
    return response.data;
  },

  getHoldingById: async (id: string): Promise<Holding> => {
    const response = await apiClient.get<Holding>(`/holdings/${id}`);
    return response.data;
  },

  getAccountHoldings: async (accountId: string): Promise<Holding[]> => {
    const response = await apiClient.get<Holding[]>(`/holdings/account/${accountId}`);
    return response.data;
  },

  getAccountHoldingsSummary: async (accountId: string): Promise<AccountHoldingsSummary> => {
    const response = await apiClient.get<AccountHoldingsSummary>(
      `/holdings/account/${accountId}/summary`
    );
    return response.data;
  },

  getPortfolioAllocation: async (): Promise<PortfolioAllocation> => {
    const response = await apiClient.get<PortfolioAllocation>('/holdings/portfolio-allocation');
    return response.data;
  },

  createHolding: async (data: HoldingCreate): Promise<Holding> => {
    const response = await apiClient.post<Holding>('/holdings', data);
    return response.data;
  },

  updateHolding: async (id: string, data: HoldingUpdate): Promise<Holding> => {
    const response = await apiClient.put<Holding>(`/holdings/${id}`, data);
    return response.data;
  },

  deleteHolding: async (id: string): Promise<void> => {
    await apiClient.delete(`/holdings/${id}`);
  },
};
