import { useState, useEffect } from 'react';
import { usePlannedSpending, useCreatePlannedSpending, useUpdatePlannedSpending, useDeletePlannedSpending } from '../hooks/usePlannedSpending';

export function PlannedSpendingPage() {
  const { data: plannedSpending, isLoading } = usePlannedSpending();
  const createMutation = useCreatePlannedSpending();
  const updateMutation = useUpdatePlannedSpending();
  const deleteMutation = useDeletePlannedSpending();

  const [monthlySpending, setMonthlySpending] = useState('');
  const [annualLumpSum, setAnnualLumpSum] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load existing data when it's available
  useEffect(() => {
    if (plannedSpending) {
      setMonthlySpending(plannedSpending.monthly_spending);
      setAnnualLumpSum(plannedSpending.annual_lump_sum);
    }
  }, [plannedSpending]);

  const formatCurrency = (value: string) => {
    const num = parseFloat(value || '0');
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const calculateTotalAnnual = () => {
    const monthly = parseFloat(monthlySpending || '0');
    const lumpSum = parseFloat(annualLumpSum || '0');
    return monthly * 12 + lumpSum;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const monthly = parseFloat(monthlySpending || '0');
    const lumpSum = parseFloat(annualLumpSum || '0');

    if (monthly < 0 || lumpSum < 0) {
      setError('Spending amounts cannot be negative');
      return;
    }

    try {
      if (plannedSpending) {
        // Update existing
        await updateMutation.mutateAsync({
          monthly_spending: monthlySpending,
          annual_lump_sum: annualLumpSum,
        });
        setSuccess('Planned spending updated successfully');
      } else {
        // Create new
        await createMutation.mutateAsync({
          monthly_spending: monthlySpending,
          annual_lump_sum: annualLumpSum,
        });
        setSuccess('Planned spending created successfully');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error saving planned spending');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete the planned spending configuration?')) {
      return;
    }

    setError(null);
    try {
      await deleteMutation.mutateAsync();
      setMonthlySpending('');
      setAnnualLumpSum('');
      setSuccess('Planned spending deleted successfully');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error deleting planned spending');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  const totalAnnual = calculateTotalAnnual();

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">Planned Spending</h1>
      <p className="text-gray-600 mb-6">
        Enter your planned spending amounts. This will be used for retirement planning calculations.
      </p>

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

      <div className="bg-white rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Monthly Spending */}
          <div>
            <label htmlFor="monthly_spending" className="block text-sm font-medium text-gray-700 mb-2">
              Monthly Spending
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                id="monthly_spending"
                value={monthlySpending}
                onChange={(e) => setMonthlySpending(e.target.value)}
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
                min="0"
                step="100"
                required
              />
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Your desired monthly spending amount
            </p>
          </div>

          {/* Annual Lump Sum */}
          <div>
            <label htmlFor="annual_lump_sum" className="block text-sm font-medium text-gray-700 mb-2">
              Annual Lump Sum Spending
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                id="annual_lump_sum"
                value={annualLumpSum}
                onChange={(e) => setAnnualLumpSum(e.target.value)}
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
                min="0"
                step="100"
                required
              />
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Additional lump sum spending per year (e.g., vacations, major purchases)
            </p>
          </div>

          {/* Summary Card */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Annual Spending Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Monthly spending × 12:</span>
                <span className="font-medium">{formatCurrency((parseFloat(monthlySpending || '0') * 12).toString())}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Annual lump sum:</span>
                <span className="font-medium">{formatCurrency(annualLumpSum)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-blue-200">
                <span className="text-lg font-semibold text-gray-900">Total Annual Spending:</span>
                <span className="text-lg font-bold text-blue-600">{formatCurrency(totalAnnual.toString())}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={createMutation.isLoading || updateMutation.isLoading}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
            >
              {createMutation.isLoading || updateMutation.isLoading
                ? 'Saving...'
                : plannedSpending
                ? 'Update Planned Spending'
                : 'Save Planned Spending'}
            </button>
            {plannedSpending && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteMutation.isLoading}
                className="bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
              >
                {deleteMutation.isLoading ? 'Deleting...' : 'Delete'}
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Information Box */}
      <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-2">About Planned Spending</h3>
        <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
          <li>Monthly spending is multiplied by 12 to calculate annual spending</li>
          <li>Annual lump sum is added to the monthly total for total annual spending</li>
          <li>These amounts will be used in retirement planning scenarios and projections</li>
          <li>You can update these values at any time</li>
        </ul>
      </div>
    </div>
  );
}
