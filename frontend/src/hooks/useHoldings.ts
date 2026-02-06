import { useMutation, useQuery, useQueryClient } from 'react-query';
import { holdingsApi } from '../services/holdings_api';
import type { HoldingCreate, HoldingUpdate } from '../types/holding';

export function useHoldings() {
  return useQuery('holdings', holdingsApi.getAllHoldings);
}

export function useHoldingById(id: string) {
  return useQuery(['holdings', id], () => holdingsApi.getHoldingById(id), {
    enabled: !!id,
  });
}

export function useAccountHoldings(accountId: string) {
  return useQuery(
    ['holdings', 'account', accountId],
    () => holdingsApi.getAccountHoldings(accountId),
    { enabled: !!accountId }
  );
}

export function useAccountHoldingsSummary(accountId: string) {
  return useQuery(
    ['holdings', 'account', accountId, 'summary'],
    () => holdingsApi.getAccountHoldingsSummary(accountId),
    { enabled: !!accountId }
  );
}

export function usePortfolioAllocation() {
  return useQuery('portfolio-allocation', holdingsApi.getPortfolioAllocation);
}

export function useCreateHolding() {
  const queryClient = useQueryClient();
  return useMutation(holdingsApi.createHolding, {
    onSuccess: (data) => {
      queryClient.invalidateQueries('holdings');
      queryClient.invalidateQueries(['holdings', 'account', data.account_id]);
      queryClient.invalidateQueries('portfolio-allocation');
    },
  });
}

export function useUpdateHolding() {
  const queryClient = useQueryClient();
  return useMutation(
    ({ id, data }: { id: string; data: HoldingUpdate }) => holdingsApi.updateHolding(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('holdings');
        queryClient.invalidateQueries('portfolio-allocation');
      },
    }
  );
}

export function useDeleteHolding() {
  const queryClient = useQueryClient();
  return useMutation(holdingsApi.deleteHolding, {
    onSuccess: () => {
      queryClient.invalidateQueries('holdings');
      queryClient.invalidateQueries('portfolio-allocation');
    },
  });
}
