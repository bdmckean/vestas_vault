import { useMutation, useQuery, useQueryClient } from 'react-query';
import { otherIncomeApi } from '../services/other_income_api';
import type { OtherIncomeCreate, OtherIncomeUpdate } from '../types/other_income';

export function useOtherIncome() {
  return useQuery('other-income', otherIncomeApi.getAllIncome);
}

export function useOtherIncomeById(id: string) {
  return useQuery(['other-income', id], () => otherIncomeApi.getIncomeById(id), {
    enabled: !!id,
  });
}

export function useCreateOtherIncome() {
  const queryClient = useQueryClient();
  return useMutation(otherIncomeApi.createIncome, {
    onSuccess: () => {
      queryClient.invalidateQueries('other-income');
    },
  });
}

export function useUpdateOtherIncome() {
  const queryClient = useQueryClient();
  return useMutation(
    ({ id, data }: { id: string; data: OtherIncomeUpdate }) =>
      otherIncomeApi.updateIncome(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('other-income');
      },
    }
  );
}

export function useDeleteOtherIncome() {
  const queryClient = useQueryClient();
  return useMutation(otherIncomeApi.deleteIncome, {
    onSuccess: () => {
      queryClient.invalidateQueries('other-income');
    },
  });
}

export function useOtherIncomeProjections(
  startYear: number,
  startMonth: number,
  endYear: number,
  endMonth: number,
  enabled = true
) {
  return useQuery(
    ['other-income-projections', startYear, startMonth, endYear, endMonth],
    () => otherIncomeApi.getProjections(startYear, startMonth, endYear, endMonth),
    { enabled }
  );
}

export function useOtherIncomeSummary(
  startYear: number,
  startMonth: number,
  endYear: number,
  endMonth: number,
  enabled = true
) {
  return useQuery(
    ['other-income-summary', startYear, startMonth, endYear, endMonth],
    () => otherIncomeApi.getMonthlySummary(startYear, startMonth, endYear, endMonth),
    { enabled }
  );
}

export function useOtherIncomeTotalMonthly(year: number, month: number, enabled = true) {
  return useQuery(
    ['other-income-total', year, month],
    () => otherIncomeApi.getTotalMonthly(year, month),
    { enabled }
  );
}
