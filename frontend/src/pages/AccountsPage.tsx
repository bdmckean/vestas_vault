import { useState } from 'react';
import { AccountCard } from '../components/AccountCard';
import { AccountForm } from '../components/AccountForm';
import {
  useAccounts,
  useCreateAccount,
  useDeleteAccount,
  useUpdateAccount,
} from '../hooks/useAccounts';
import type { Account, AccountCreate } from '../types/account';

export function AccountsPage() {
  const { data: accounts, isLoading, error } = useAccounts();
  const createAccount = useCreateAccount();
  const updateAccount = useUpdateAccount();
  const deleteAccount = useDeleteAccount();

  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [showForm, setShowForm] = useState(false);

  const handleCreate = (data: AccountCreate) => {
    createAccount.mutate(data, {
      onSuccess: () => {
        setShowForm(false);
      },
    });
  };

  const handleUpdate = (data: AccountCreate) => {
    if (editingAccount) {
      updateAccount.mutate(
        { id: editingAccount.id, data },
        {
          onSuccess: () => {
            setEditingAccount(null);
            setShowForm(false);
          },
        }
      );
    }
  };

  const handleEdit = (account: Account) => {
    setEditingAccount(account);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this account?')) {
      deleteAccount.mutate(id);
    }
  };

  const handleCancel = () => {
    setEditingAccount(null);
    setShowForm(false);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">Loading accounts...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-red-600">Error loading accounts: {error.message}</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Retirement Accounts</h1>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 font-medium"
          >
            Add Account
          </button>
        )}
      </div>

      {showForm && (
        <div className="mb-8">
          <AccountForm
            account={editingAccount}
            onSubmit={editingAccount ? handleUpdate : handleCreate}
            onCancel={handleCancel}
          />
        </div>
      )}

      {accounts && accounts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600 text-lg">No accounts yet. Add your first account to get started.</p>
        </div>
      )}

      {accounts && accounts.length > 0 && (
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <p className="text-lg font-semibold text-gray-900">
            Total Balance:{' '}
            <span className="text-blue-600">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
              }).format(
                accounts.reduce((sum, acc) => sum + parseFloat(acc.balance), 0)
              )}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
