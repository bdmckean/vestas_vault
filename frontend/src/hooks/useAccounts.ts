import { useMutation, useQuery, useQueryClient } from 'react-query';
import { accountsApi } from '../services/api';
import type { Account, AccountCreate, AccountUpdate } from '../types/account';

export function useAccounts() {
  return useQuery<Account[], Error>('accounts', accountsApi.getAll);
}

export function useAccount(id: string) {
  return useQuery<Account, Error>(['account', id], () => accountsApi.getById(id), {
    enabled: !!id,
  });
}

export function useCreateAccount() {
  const queryClient = useQueryClient();
  return useMutation<Account, Error, AccountCreate>(
    (data) => accountsApi.create(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('accounts');
      },
    }
  );
}

export function useUpdateAccount() {
  const queryClient = useQueryClient();
  return useMutation<Account, Error, { id: string; data: AccountUpdate }>(
    ({ id, data }) => accountsApi.update(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('accounts');
      },
    }
  );
}

export function useDeleteAccount() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>(
    (id) => accountsApi.delete(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('accounts');
      },
    }
  );
}
