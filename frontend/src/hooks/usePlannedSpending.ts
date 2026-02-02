import { useMutation, useQuery, useQueryClient } from 'react-query';
import { plannedSpendingApi } from '../services/planned_spending_api';
import type { PlannedSpendingCreate, PlannedSpendingUpdate } from '../types/planned_spending';

export function usePlannedSpending() {
  return useQuery('planned-spending', plannedSpendingApi.getPlannedSpending, {
    retry: false,
  });
}

export function useCreatePlannedSpending() {
  const queryClient = useQueryClient();
  return useMutation(plannedSpendingApi.createPlannedSpending, {
    onSuccess: () => {
      queryClient.invalidateQueries('planned-spending');
    },
  });
}

export function useUpdatePlannedSpending() {
  const queryClient = useQueryClient();
  return useMutation(plannedSpendingApi.updatePlannedSpending, {
    onSuccess: () => {
      queryClient.invalidateQueries('planned-spending');
    },
  });
}

export function useDeletePlannedSpending() {
  const queryClient = useQueryClient();
  return useMutation(plannedSpendingApi.deletePlannedSpending, {
    onSuccess: () => {
      queryClient.invalidateQueries('planned-spending');
    },
  });
}

export function useTotalAnnualSpending() {
  return useQuery('total-annual-spending', plannedSpendingApi.getTotalAnnualSpending, {
    enabled: false, // Only fetch when explicitly called
  });
}
