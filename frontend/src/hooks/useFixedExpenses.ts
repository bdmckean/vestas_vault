import { useMutation, useQuery, useQueryClient } from 'react-query';
import {
  createFixedExpense,
  deleteFixedExpense,
  getFixedExpenses,
  updateFixedExpense,
} from '../services/fixed_expenses_api';
import type { FixedExpense, FixedExpenseCreate, FixedExpenseUpdate } from '../types/fixed_expense';

export function useFixedExpenses(scenarioId?: string) {
  return useQuery<FixedExpense[], Error>(
    ['fixed-expenses', scenarioId],
    () => {
      console.log('Fetching fixed expenses for scenario:', scenarioId);
      return getFixedExpenses(scenarioId);
    },
    {
      enabled: !!scenarioId,
      staleTime: 0, // Always refetch when scenario changes
      cacheTime: 0, // Don't cache empty results
      retry: false,
      onSuccess: (data) => {
        console.log('Fixed expenses fetched:', data);
      },
      onError: (error) => {
        console.error('Error fetching fixed expenses:', error);
      },
    }
  );
}

export function useCreateFixedExpense() {
  const queryClient = useQueryClient();
  return useMutation<FixedExpense, Error, FixedExpenseCreate>(
    (expense) => createFixedExpense(expense),
    {
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries(['fixed-expenses', variables.scenario_id]);
        queryClient.invalidateQueries('scenario-projection');
      },
    }
  );
}

export function useUpdateFixedExpense() {
  const queryClient = useQueryClient();
  return useMutation<FixedExpense, Error, { id: string; data: FixedExpenseUpdate }>(
    ({ id, data }) => updateFixedExpense(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('fixed-expenses');
        queryClient.invalidateQueries('scenario-projection');
      },
    }
  );
}

export function useDeleteFixedExpense() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>(
    (id) => deleteFixedExpense(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('fixed-expenses');
        queryClient.invalidateQueries('scenario-projection');
      },
    }
  );
}

export function useAllFixedExpenses() {
  return useQuery<FixedExpense[], Error>(
    ['fixed-expenses', 'all'],
    () => getFixedExpenses(), // Get all without scenario_id filter
    {
      staleTime: 0,
      cacheTime: 0,
    }
  );
}
