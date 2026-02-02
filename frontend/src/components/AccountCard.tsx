import type { Account } from '../types/account';

interface AccountCardProps {
  account: Account;
  onEdit: (account: Account) => void;
  onDelete: (id: string) => void;
}

export function AccountCard({ account, onEdit, onDelete }: AccountCardProps) {
  const formatCurrency = (value: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(parseFloat(value));
  };

  const getAccountTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      pretax: 'bg-blue-100 text-blue-800',
      roth: 'bg-green-100 text-green-800',
      taxable: 'bg-purple-100 text-purple-800',
      cash: 'bg-gray-100 text-gray-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">{account.name}</h3>
          <span className={`inline-block px-2 py-1 rounded text-xs font-medium mt-2 ${getAccountTypeColor(account.account_type)}`}>
            {account.account_type.toUpperCase()}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(account)}
            className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(account.id)}
            className="px-3 py-1 text-sm text-red-600 hover:text-red-800 font-medium"
          >
            Delete
          </button>
        </div>
      </div>
      <div className="border-t pt-4">
        <p className="text-2xl font-bold text-gray-900">{formatCurrency(account.balance)}</p>
      </div>
    </div>
  );
}
