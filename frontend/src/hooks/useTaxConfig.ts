import { useMutation, useQuery, useQueryClient } from 'react-query';
import { taxConfigApi } from '../services/tax_config_api';
import type { TaxConfigCreate, TaxConfigUpdate } from '../types/tax_config';

export function useTaxConfig() {
  return useQuery('tax-config', taxConfigApi.getTaxConfig, {
    retry: false,
  });
}

export function useCreateTaxConfig() {
  const queryClient = useQueryClient();
  return useMutation(taxConfigApi.createTaxConfig, {
    onSuccess: () => {
      queryClient.invalidateQueries('tax-config');
    },
  });
}

export function useUpdateTaxConfig() {
  const queryClient = useQueryClient();
  return useMutation(taxConfigApi.updateTaxConfig, {
    onSuccess: () => {
      queryClient.invalidateQueries('tax-config');
    },
  });
}

export function useDeleteTaxConfig() {
  const queryClient = useQueryClient();
  return useMutation(taxConfigApi.deleteTaxConfig, {
    onSuccess: () => {
      queryClient.invalidateQueries('tax-config');
    },
  });
}
