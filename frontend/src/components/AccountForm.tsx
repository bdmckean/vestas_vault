import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import type { Account, AccountCreate, AccountType } from '../types/account';

interface AccountFormProps {
  account?: Account | null;
  onSubmit: (data: AccountCreate) => void;
  onCancel: () => void;
}

export function AccountForm({ account, onSubmit, onCancel }: AccountFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AccountCreate>({
    defaultValues: account
      ? {
          name: account.name,
          account_type: account.account_type,
          balance: account.balance,
        }
      : {
          name: '',
          account_type: 'pretax',
          balance: '0.00',
        },
  });

  useEffect(() => {
    if (account) {
      reset({
        name: account.name,
        account_type: account.account_type,
        balance: account.balance,
      });
    }
  }, [account, reset]);

  const accountTypes: AccountType[] = ['pretax', 'roth', 'taxable', 'cash'];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">
        {account ? 'Edit Account' : 'Add New Account'}
      </h2>

      <div className="mb-4">
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
          Account Name
        </label>
        <input
          {...register('name', { required: 'Account name is required' })}
          type="text"
          id="name"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      <div className="mb-4">
        <label htmlFor="account_type" className="block text-sm font-medium text-gray-700 mb-2">
          Account Type
        </label>
        <select
          {...register('account_type', { required: 'Account type is required' })}
          id="account_type"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          {accountTypes.map((type) => (
            <option key={type} value={type}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </option>
          ))}
        </select>
        {errors.account_type && (
          <p className="mt-1 text-sm text-red-600">{errors.account_type.message}</p>
        )}
      </div>

      <div className="mb-6">
        <label htmlFor="balance" className="block text-sm font-medium text-gray-700 mb-2">
          Balance
        </label>
        <input
          {...register('balance', {
            required: 'Balance is required',
            pattern: {
              value: /^\d+(\.\d{1,2})?$/,
              message: 'Invalid balance format',
            },
          })}
          type="text"
          id="balance"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="0.00"
        />
        {errors.balance && (
          <p className="mt-1 text-sm text-red-600">{errors.balance.message}</p>
        )}
      </div>

      <div className="flex gap-4">
        <button
          type="submit"
          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 font-medium"
        >
          {account ? 'Update Account' : 'Create Account'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 font-medium"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
