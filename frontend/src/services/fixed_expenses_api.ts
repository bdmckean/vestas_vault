import axios from 'axios';
import type { FixedExpense, FixedExpenseCreate, FixedExpenseUpdate } from '../types/fixed_expense';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8005';

const apiClient = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

export async function getFixedExpenses(scenarioId?: string): Promise<FixedExpense[]> {
  const params = scenarioId ? { scenario_id: scenarioId } : {};
  const response = await apiClient.get<FixedExpense[]>('/fixed-expenses', { params });
  return response.data;
}

export async function getFixedExpense(id: string): Promise<FixedExpense> {
  const response = await apiClient.get<FixedExpense>(`/fixed-expenses/${id}`);
  return response.data;
}

export async function createFixedExpense(expense: FixedExpenseCreate): Promise<FixedExpense> {
  const response = await apiClient.post<FixedExpense>('/fixed-expenses', expense);
  return response.data;
}

export async function updateFixedExpense(
  id: string,
  expense: FixedExpenseUpdate
): Promise<FixedExpense> {
  const response = await apiClient.patch<FixedExpense>(`/fixed-expenses/${id}`, expense);
  return response.data;
}

export async function deleteFixedExpense(id: string): Promise<void> {
  await apiClient.delete(`/fixed-expenses/${id}`);
}
