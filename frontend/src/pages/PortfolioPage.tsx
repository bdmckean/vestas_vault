import { useState } from 'react';
import { useAccounts } from '../hooks/useAccounts';
import {
  usePortfolioAllocation,
  useCreateHolding,
  useUpdateHolding,
  useDeleteHolding,
} from '../hooks/useHoldings';
import type { Holding, HoldingCreate, AssetClass } from '../types/holding';
import { ASSET_CLASS_LABELS, ASSET_CLASS_COLORS } from '../types/holding';

const ASSET_CLASS_OPTIONS: AssetClass[] = [
  'total_us_stock',
  'total_foreign_stock',
  'us_small_cap_value',
  'international_small_cap_value',
  'developed_markets',
  'emerging_markets',
  'bonds',
  'short_term_treasuries',
  'intermediate_term_treasuries',
  'municipal_bonds',
  'cash',
  'other',
];

export function PortfolioPage() {
  const { data: accounts, isLoading: accountsLoading } = useAccounts();
  const { data: allocation, isLoading: allocationLoading, refetch } = usePortfolioAllocation();
  const createMutation = useCreateHolding();
  const updateMutation = useUpdateHolding();
  const deleteMutation = useDeleteHolding();

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingHolding, setEditingHolding] = useState<Holding | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [formData, setFormData] = useState<{
    asset_class: AssetClass;
    ticker: string;
    name: string;
    amount: string;
    notes: string;
  }>({
    asset_class: 'total_us_stock',
    ticker: '',
    name: '',
    amount: '',
    notes: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const formatCurrency = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value || '0') : value;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const formatPercent = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value || '0') : value;
    return `${num.toFixed(1)}%`;
  };

  const resetForm = () => {
    setFormData({
      asset_class: 'total_us_stock',
      ticker: '',
      name: '',
      amount: '',
      notes: '',
    });
    setSelectedAccountId('');
    setEditingHolding(null);
    setShowAddForm(false);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!selectedAccountId && !editingHolding) {
      setError('Please select an account');
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    try {
      if (editingHolding) {
        await updateMutation.mutateAsync({
          id: editingHolding.id,
          data: {
            asset_class: formData.asset_class,
            ticker: formData.ticker || null,
            name: formData.name || null,
            amount: formData.amount,
            notes: formData.notes || null,
          },
        });
        setSuccess('Holding updated successfully');
      } else {
        await createMutation.mutateAsync({
          account_id: selectedAccountId,
          asset_class: formData.asset_class,
          ticker: formData.ticker || null,
          name: formData.name || null,
          amount: formData.amount,
          notes: formData.notes || null,
        });
        setSuccess('Holding added successfully');
      }
      resetForm();
      refetch();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error saving holding');
    }
  };

  const handleEdit = (holding: Holding) => {
    setEditingHolding(holding);
    setSelectedAccountId(holding.account_id);
    setFormData({
      asset_class: holding.asset_class,
      ticker: holding.ticker || '',
      name: holding.name || '',
      amount: holding.amount,
      notes: holding.notes || '',
    });
    setShowAddForm(true);
  };

  const handleDelete = async (holding: Holding) => {
    if (!window.confirm(`Delete ${ASSET_CLASS_LABELS[holding.asset_class]} holding of ${formatCurrency(holding.amount)}?`)) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(holding.id);
      setSuccess('Holding deleted successfully');
      refetch();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error deleting holding');
    }
  };

  if (accountsLoading || allocationLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">Loading portfolio...</div>
      </div>
    );
  }

  const totalPortfolioValue = allocation ? parseFloat(allocation.total_portfolio_value) : 0;
  const holdingsTotal = allocation?.by_account.reduce(
    (sum, acc) => sum + parseFloat(acc.holdings_total),
    0
  ) || 0;
  const unallocated = totalPortfolioValue - holdingsTotal;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Portfolio Holdings</h1>
          <p className="text-gray-600 mt-2">
            Manage your investment holdings across all accounts.
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium"
        >
          + Add Holding
        </button>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}

      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Total Portfolio</h2>
          <p className="text-3xl font-bold text-blue-600">{formatCurrency(totalPortfolioValue)}</p>
          <p className="text-sm text-gray-500 mt-1">{accounts?.length || 0} accounts</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Allocated</h2>
          <p className="text-3xl font-bold text-green-600">{formatCurrency(holdingsTotal)}</p>
          <p className="text-sm text-gray-500 mt-1">
            {totalPortfolioValue > 0 ? formatPercent((holdingsTotal / totalPortfolioValue) * 100) : '0%'} of portfolio
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Unallocated</h2>
          <p className={`text-3xl font-bold ${unallocated > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
            {formatCurrency(unallocated)}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {unallocated > 0 ? 'Add holdings to allocate' : 'Fully allocated'}
          </p>
        </div>
      </div>

      {/* Asset Allocation Chart */}
      {allocation && Object.keys(allocation.by_asset_class).length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Asset Allocation</h2>
          <div className="space-y-3">
            {Object.entries(allocation.by_asset_class)
              .sort((a, b) => parseFloat(b[1]) - parseFloat(a[1]))
              .map(([assetClass, amount]) => {
                const percent = allocation.by_asset_class_percent[assetClass] || '0';
                return (
                  <div key={assetClass} className="flex items-center">
                    <div className="w-40 text-sm font-medium text-gray-700">
                      {ASSET_CLASS_LABELS[assetClass as AssetClass] || assetClass}
                    </div>
                    <div className="flex-1 mx-4">
                      <div className="h-6 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${Math.min(parseFloat(percent), 100)}%` }}
                        />
                      </div>
                    </div>
                    <div className="w-24 text-right text-sm font-medium text-gray-900">
                      {formatCurrency(amount)}
                    </div>
                    <div className="w-16 text-right text-sm text-gray-600">
                      {formatPercent(percent)}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Holdings by Account */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Holdings by Account</h2>
        {allocation?.by_account && allocation.by_account.length > 0 ? (
          <div className="space-y-6">
            {allocation.by_account.map((accountSummary) => (
              <div key={accountSummary.account_id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{accountSummary.account_name}</h3>
                    <p className="text-sm text-gray-500">
                      Balance: {formatCurrency(accountSummary.account_balance)} |
                      Allocated: {formatCurrency(accountSummary.holdings_total)}
                      {parseFloat(accountSummary.difference) !== 0 && (
                        <span className="text-orange-600 ml-2">
                          ({formatCurrency(accountSummary.difference)} unallocated)
                        </span>
                      )}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedAccountId(accountSummary.account_id);
                      setShowAddForm(true);
                    }}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    + Add Holding
                  </button>
                </div>
                {accountSummary.holdings.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Asset Class</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Ticker</th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">%</th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {accountSummary.holdings.map((holding) => (
                          <tr key={holding.id} className="hover:bg-gray-50">
                            <td className="px-3 py-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${ASSET_CLASS_COLORS[holding.asset_class]}`}>
                                {ASSET_CLASS_LABELS[holding.asset_class]}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-sm text-gray-600">
                              {holding.ticker || '-'}
                            </td>
                            <td className="px-3 py-2 text-sm text-right font-medium">
                              {formatCurrency(holding.amount)}
                            </td>
                            <td className="px-3 py-2 text-sm text-right text-gray-600">
                              {formatPercent(holding.allocation_percent)}
                            </td>
                            <td className="px-3 py-2 text-right">
                              <button
                                onClick={() => handleEdit(holding)}
                                className="text-blue-600 hover:text-blue-800 text-sm mr-2"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(holding)}
                                className="text-red-600 hover:text-red-800 text-sm"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm italic">No holdings configured for this account</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">
            No accounts found. Add accounts first, then configure their holdings.
          </p>
        )}
      </div>

      {/* Add/Edit Holding Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {editingHolding ? 'Edit Holding' : 'Add Holding'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Account Selection */}
              {!editingHolding && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Account *
                  </label>
                  <select
                    value={selectedAccountId}
                    onChange={(e) => setSelectedAccountId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select account...</option>
                    {accounts?.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name} ({formatCurrency(account.balance)})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Asset Class */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Asset Class *
                </label>
                <select
                  value={formData.asset_class}
                  onChange={(e) => setFormData({ ...formData, asset_class: e.target.value as AssetClass })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {ASSET_CLASS_OPTIONS.map((ac) => (
                    <option key={ac} value={ac}>
                      {ASSET_CLASS_LABELS[ac]}
                    </option>
                  ))}
                </select>
              </div>

              {/* Ticker */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ticker (optional)
                </label>
                <input
                  type="text"
                  value={formData.ticker}
                  onChange={(e) => setFormData({ ...formData, ticker: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., VTSAX, VTI"
                  maxLength={20}
                />
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (optional)
                </label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Additional notes"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isLoading || updateMutation.isLoading}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 font-medium"
                >
                  {createMutation.isLoading || updateMutation.isLoading
                    ? 'Saving...'
                    : editingHolding
                    ? 'Update'
                    : 'Add Holding'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Information Box */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-2">About Portfolio Holdings</h3>
        <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
          <li>Add holdings to track your specific investments within each account</li>
          <li>The sum of holdings should match the account balance</li>
          <li>Asset allocation is used for scenario modeling and projections</li>
          <li>You can add multiple holdings of the same asset class (e.g., multiple US stock funds)</li>
        </ul>
      </div>
    </div>
  );
}
