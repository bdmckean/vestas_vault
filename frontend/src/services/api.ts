import axios from 'axios';
import type { Account, AccountCreate, AccountUpdate } from '../types/account';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8005';

const apiClient = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const accountsApi = {
  getAll: async (): Promise<Account[]> => {
    const response = await apiClient.get<Account[]>('/accounts');
    return response.data;
  },

  getById: async (id: string): Promise<Account> => {
    const response = await apiClient.get<Account>(`/accounts/${id}`);
    return response.data;
  },

  create: async (data: AccountCreate): Promise<Account> => {
    const response = await apiClient.post<Account>('/accounts', data);
    return response.data;
  },

  update: async (id: string, data: AccountUpdate): Promise<Account> => {
    const response = await apiClient.put<Account>(`/accounts/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/accounts/${id}`);
  },
};
