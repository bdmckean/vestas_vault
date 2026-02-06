/**
 * API client for planned fixed expenses.
 */

import axios from 'axios';
import type {
  PlannedFixedExpense,
  PlannedFixedExpenseCreate,
  PlannedFixedExpenseSummary,
  PlannedFixedExpenseUpdate,
} from '../types/planned_fixed_expense';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8005';

const apiClient = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const plannedFixedExpensesApi = {
  getAll: async (): Promise<PlannedFixedExpense[]> => {
    const response = await apiClient.get<PlannedFixedExpense[]>('/planned-fixed-expenses');
    return response.data;
  },

  getSummary: async (): Promise<PlannedFixedExpenseSummary> => {
    const response = await apiClient.get<PlannedFixedExpenseSummary>('/planned-fixed-expenses/summary');
    return response.data;
  },

  getById: async (id: string): Promise<PlannedFixedExpense> => {
    const response = await apiClient.get<PlannedFixedExpense>(`/planned-fixed-expenses/${id}`);
    return response.data;
  },

  create: async (data: PlannedFixedExpenseCreate): Promise<PlannedFixedExpense> => {
    const response = await apiClient.post<PlannedFixedExpense>('/planned-fixed-expenses', data);
    return response.data;
  },

  update: async (id: string, data: PlannedFixedExpenseUpdate): Promise<PlannedFixedExpense> => {
    const response = await apiClient.patch<PlannedFixedExpense>(`/planned-fixed-expenses/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/planned-fixed-expenses/${id}`);
  },
};
