import { useState, useEffect } from 'react';
import type { Account, AccountCreate, AccountType } from '../types/account';

interface AccountFormProps {
  account?: Account | null;
  onSubmit: (data: AccountCreate) => void;
  onCancel: () => void;
}

const ACCOUNT_TYPES: { value: AccountType; label: string }[] = [
  { value: 'pretax', label: 'Pre-tax (401k, Traditional IRA)' },
  { value: 'roth', label: 'Roth (Roth IRA, Roth 401k)' },
  { value: 'taxable', label: 'Taxable (Brokerage)' },
  { value: 'cash', label: 'Cash (Savings, Money Market)' },
];

export function AccountForm({ account, onSubmit, onCancel }: AccountFormProps) {
  const [name, setName] = useState('');
  const [accountType, setAccountType] = useState<AccountType>('pretax');
  const [balance, setBalance] = useState('');
  const [costBasis, setCostBasis] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (account) {
      setName(account.name);
      setAccountType(account.account_type);
      setBalance(account.balance);
      setCostBasis(account.cost_basis || '');
    } else {
      setName('');
      setAccountType('pretax');
      setBalance('');
      setCostBasis('');
    }
  }, [account]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Account name is required');
      return;
    }

    const balanceNum = parseFloat(balance);
    if (isNaN(balanceNum) || balanceNum < 0) {
      setError('Please enter a valid balance');
      return;
    }

    // Validate cost basis if provided
    let costBasisValue: string | null = null;
    if (costBasis.trim()) {
      const costBasisNum = parseFloat(costBasis);
      if (isNaN(costBasisNum) || costBasisNum < 0) {
        setError('Please enter a valid cost basis');
        return;
      }
      if (costBasisNum > balanceNum) {
        setError('Cost basis cannot exceed account balance');
        return;
      }
      costBasisValue = costBasis;
    }

    onSubmit({
      name: name.trim(),
      account_type: accountType,
      balance: balance,
      cost_basis: costBasisValue,
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        {account ? 'Edit Account' : 'Add New Account'}
      </h2>
      
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Account Name
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Fidelity 401k"
          />
        </div>

        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
            Account Type
          </label>
          <select
            id="type"
            value={accountType}
            onChange={(e) => setAccountType(e.target.value as AccountType)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {ACCOUNT_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="balance" className="block text-sm font-medium text-gray-700 mb-1">
            Balance
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
              $
            </span>
            <input
              type="number"
              id="balance"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              placeholder="0.00"
            />
          </div>
        </div>

        {(accountType === 'taxable' || account?.account_type === 'taxable') && (
          <div>
            <label htmlFor="cost_basis" className="block text-sm font-medium text-gray-700 mb-1">
              Cost Basis <span className="text-gray-500 text-xs">(for taxable accounts only)</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                $
              </span>
              <input
                type="number"
                id="cost_basis"
                value={costBasis}
                onChange={(e) => setCostBasis(e.target.value)}
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                placeholder="Original purchase price (optional)"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Only gains (balance - cost basis) are taxable on withdrawals. Leave blank if unknown.
            </p>
          </div>
        )}

        <div className="flex gap-4 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 font-medium"
          >
            {account ? 'Update Account' : 'Add Account'}
          </button>
        </div>
      </form>
    </div>
  );
}
