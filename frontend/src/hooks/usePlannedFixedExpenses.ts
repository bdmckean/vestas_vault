/**
 * React Query hooks for planned fixed expenses.
 */

import { useMutation, useQuery, useQueryClient } from 'react-query';
import { plannedFixedExpensesApi } from '../services/planned_fixed_expenses_api';
import type {
  PlannedFixedExpense,
  PlannedFixedExpenseCreate,
  PlannedFixedExpenseSummary,
  PlannedFixedExpenseUpdate,
} from '../types/planned_fixed_expense';

export function usePlannedFixedExpenses() {
  return useQuery<PlannedFixedExpense[], Error>(
    'planned-fixed-expenses',
    plannedFixedExpensesApi.getAll,
    { retry: false }
  );
}

export function usePlannedFixedExpensesSummary() {
  return useQuery<PlannedFixedExpenseSummary, Error>(
    'planned-fixed-expenses-summary',
    plannedFixedExpensesApi.getSummary,
    { retry: false }
  );
}

export function usePlannedFixedExpense(id: string) {
  return useQuery<PlannedFixedExpense, Error>(
    ['planned-fixed-expense', id],
    () => plannedFixedExpensesApi.getById(id),
    { enabled: !!id, retry: false }
  );
}

export function useCreatePlannedFixedExpense() {
  const queryClient = useQueryClient();
  return useMutation<PlannedFixedExpense, Error, PlannedFixedExpenseCreate>(
    (data) => plannedFixedExpensesApi.create(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('planned-fixed-expenses');
        queryClient.invalidateQueries('planned-fixed-expenses-summary');
      },
    }
  );
}

export function useUpdatePlannedFixedExpense() {
  const queryClient = useQueryClient();
  return useMutation<PlannedFixedExpense, Error, { id: string; data: PlannedFixedExpenseUpdate }>(
    ({ id, data }) => plannedFixedExpensesApi.update(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('planned-fixed-expenses');
        queryClient.invalidateQueries('planned-fixed-expenses-summary');
      },
    }
  );
}

export function useDeletePlannedFixedExpense() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>(
    (id) => plannedFixedExpensesApi.delete(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('planned-fixed-expenses');
        queryClient.invalidateQueries('planned-fixed-expenses-summary');
      },
    }
  );
}
