import axios from 'axios';
import type {
  OtherIncome,
  OtherIncomeCreate,
  OtherIncomeUpdate,
  OtherIncomeProjection,
  OtherIncomeSummary,
} from '../types/other_income';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8005';

const apiClient = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const otherIncomeApi = {
  getAllIncome: async (): Promise<OtherIncome[]> => {
    const response = await apiClient.get<OtherIncome[]>('/other-income');
    return response.data;
  },

  getIncomeById: async (id: string): Promise<OtherIncome> => {
    const response = await apiClient.get<OtherIncome>(`/other-income/${id}`);
    return response.data;
  },

  createIncome: async (data: OtherIncomeCreate): Promise<OtherIncome> => {
    const response = await apiClient.post<OtherIncome>('/other-income', data);
    return response.data;
  },

  updateIncome: async (id: string, data: OtherIncomeUpdate): Promise<OtherIncome> => {
    const response = await apiClient.put<OtherIncome>(`/other-income/${id}`, data);
    return response.data;
  },

  deleteIncome: async (id: string): Promise<void> => {
    await apiClient.delete(`/other-income/${id}`);
  },

  getProjections: async (
    startYear: number,
    startMonth: number,
    endYear: number,
    endMonth: number
  ): Promise<OtherIncomeProjection[]> => {
    const response = await apiClient.get<OtherIncomeProjection[]>('/other-income/projections', {
      params: {
        start_year: startYear,
        start_month: startMonth,
        end_year: endYear,
        end_month: endMonth,
      },
    });
    return response.data;
  },

  getMonthlySummary: async (
    startYear: number,
    startMonth: number,
    endYear: number,
    endMonth: number
  ): Promise<OtherIncomeSummary[]> => {
    const response = await apiClient.get<OtherIncomeSummary[]>('/other-income/summary', {
      params: {
        start_year: startYear,
        start_month: startMonth,
        end_year: endYear,
        end_month: endMonth,
      },
    });
    return response.data;
  },

  getTotalMonthly: async (
    year: number,
    month: number
  ): Promise<{ year: number; month: number; total_amount: string }> => {
    const response = await apiClient.get<{ year: number; month: number; total_amount: string }>(
      `/other-income/total/${year}/${month}`
    );
    return response.data;
  },
};
