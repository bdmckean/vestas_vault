import { useState, useEffect } from 'react';
import { usePlannedSpending, useCreatePlannedSpending, useUpdatePlannedSpending, useDeletePlannedSpending } from '../hooks/usePlannedSpending';
import {
  usePlannedFixedExpenses,
  useCreatePlannedFixedExpense,
  useUpdatePlannedFixedExpense,
  useDeletePlannedFixedExpense,
} from '../hooks/usePlannedFixedExpenses';
import type { PlannedFixedExpense, PlannedFixedExpenseCreate } from '../types/planned_fixed_expense';

export function PlannedSpendingPage() {
  const { data: plannedSpending, isLoading, error: plannedSpendingError } = usePlannedSpending();
  const createMutation = useCreatePlannedSpending();
  const updateMutation = useUpdatePlannedSpending();
  const deleteMutation = useDeletePlannedSpending();

  // Fixed expenses
  const { data: fixedExpenses, isLoading: fixedExpensesLoading, error: fixedExpensesError } = usePlannedFixedExpenses();
  const createFixedExpenseMutation = useCreatePlannedFixedExpense();
  const updateFixedExpenseMutation = useUpdatePlannedFixedExpense();
  const deleteFixedExpenseMutation = useDeletePlannedFixedExpense();

  const [monthlySpending, setMonthlySpending] = useState('');
  const [annualLumpSum, setAnnualLumpSum] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fixed expense form state
  const [showFixedExpenseForm, setShowFixedExpenseForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<PlannedFixedExpense | null>(null);
  const [expenseForm, setExpenseForm] = useState<PlannedFixedExpenseCreate>({
    name: '',
    monthly_amount: '',
    start_year: new Date().getFullYear(),
    end_year: new Date().getFullYear() + 5,
    notes: '',
  });

  // Load existing data when it's available
  useEffect(() => {
    if (plannedSpending) {
      setMonthlySpending(plannedSpending.monthly_spending);
      setAnnualLumpSum(plannedSpending.annual_lump_sum);
    }
  }, [plannedSpending]);

  const formatCurrency = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value || '0') : value;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const calculateTotalFixedMonthly = () => {
    if (!fixedExpenses) return 0;
    return fixedExpenses.reduce((sum, exp) => sum + parseFloat(exp.monthly_amount || '0'), 0);
  };

  const calculateTotalAnnual = () => {
    const monthly = parseFloat(monthlySpending || '0');
    const lumpSum = parseFloat(annualLumpSum || '0');
    const fixedMonthly = calculateTotalFixedMonthly();
    return (monthly + fixedMonthly) * 12 + lumpSum;
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
        await updateMutation.mutateAsync({
          monthly_spending: monthlySpending,
          annual_lump_sum: annualLumpSum,
        });
        setSuccess('Planned spending updated successfully');
      } else {
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

  // Fixed expense handlers
  const resetExpenseForm = () => {
    setExpenseForm({
      name: '',
      monthly_amount: '',
      start_year: new Date().getFullYear(),
      end_year: new Date().getFullYear() + 5,
      notes: '',
    });
    setEditingExpense(null);
    setShowFixedExpenseForm(false);
  };

  const handleEditExpense = (expense: PlannedFixedExpense) => {
    setEditingExpense(expense);
    setExpenseForm({
      name: expense.name,
      monthly_amount: expense.monthly_amount,
      start_year: expense.start_year,
      end_year: expense.end_year,
      notes: expense.notes || '',
    });
    setShowFixedExpenseForm(true);
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (parseFloat(expenseForm.monthly_amount || '0') <= 0) {
      setError('Monthly amount must be greater than 0');
      return;
    }

    if (expenseForm.end_year <= expenseForm.start_year) {
      setError('End year must be greater than start year');
      return;
    }

    try {
      if (editingExpense) {
        await updateFixedExpenseMutation.mutateAsync({
          id: editingExpense.id,
          data: expenseForm,
        });
        setSuccess('Fixed expense updated successfully');
      } else {
        await createFixedExpenseMutation.mutateAsync(expenseForm);
        setSuccess('Fixed expense added successfully');
      }
      resetExpenseForm();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error saving fixed expense');
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this fixed expense?')) {
      return;
    }

    try {
      await deleteFixedExpenseMutation.mutateAsync(id);
      setSuccess('Fixed expense deleted successfully');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error deleting fixed expense');
    }
  };

  // Show errors if any
  if (plannedSpendingError) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Planned Spending</h1>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Error loading planned spending: {(plannedSpendingError as Error).message}
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">Loading spending data...</div>
      </div>
    );
  }

  const totalAnnual = calculateTotalAnnual();
  const totalFixedMonthly = calculateTotalFixedMonthly();

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

      {fixedExpensesError && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
          Note: Could not load fixed expenses: {(fixedExpensesError as Error).message}
        </div>
      )}

      {/* Variable Spending Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Variable Spending (Subject to Inflation)</h2>
        <p className="text-gray-600 text-sm mb-4">
          These amounts will increase with inflation over time in projections.
        </p>
        <form onSubmit={handleSubmit} className="space-y-6">
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
              Your desired monthly spending amount (will increase with inflation)
            </p>
          </div>

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

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={createMutation.isLoading || updateMutation.isLoading}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
            >
              {createMutation.isLoading || updateMutation.isLoading
                ? 'Saving...'
                : plannedSpending
                ? 'Update Variable Spending'
                : 'Save Variable Spending'}
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

      {/* Fixed Expenses Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Fixed Expenses (Not Subject to Inflation)</h2>
            <p className="text-gray-600 text-sm mt-1">
              Fixed-rate expenses like loans that don&#39;t increase with inflation and have an end date.
            </p>
          </div>
          <button
            onClick={() => setShowFixedExpenseForm(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 font-medium text-sm"
          >
            + Add Fixed Expense
          </button>
        </div>

        {showFixedExpenseForm && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">
              {editingExpense ? 'Edit Fixed Expense' : 'Add Fixed Expense'}
            </h3>
            <form onSubmit={handleSaveExpense} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={expenseForm.name}
                    onChange={(e) => setExpenseForm({ ...expenseForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Mortgage, Car Loan"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Amount</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      value={expenseForm.monthly_amount}
                      onChange={(e) => setExpenseForm({ ...expenseForm, monthly_amount: e.target.value })}
                      className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                      min="0"
                      step="1"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Year</label>
                  <input
                    type="number"
                    value={expenseForm.start_year}
                    onChange={(e) => setExpenseForm({ ...expenseForm, start_year: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="2000"
                    max="2100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Year</label>
                  <input
                    type="number"
                    value={expenseForm.end_year}
                    onChange={(e) => setExpenseForm({ ...expenseForm, end_year: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="2000"
                    max="2100"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">Spending ends at the start of this year</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                <input
                  type="text"
                  value={expenseForm.notes || ''}
                  onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Additional notes..."
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={createFixedExpenseMutation.isLoading || updateFixedExpenseMutation.isLoading}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 font-medium"
                >
                  {createFixedExpenseMutation.isLoading || updateFixedExpenseMutation.isLoading
                    ? 'Saving...'
                    : editingExpense
                    ? 'Update'
                    : 'Add'}
                </button>
                <button
                  type="button"
                  onClick={resetExpenseForm}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {fixedExpensesLoading ? (
          <div className="text-center py-4 text-gray-500">Loading fixed expenses...</div>
        ) : fixedExpenses && fixedExpenses.length > 0 ? (
          <div className="space-y-3">
            {fixedExpenses.map((expense) => (
              <div
                key={expense.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-gray-900">{expense.name}</span>
                    <span className="text-lg font-semibold text-blue-600">
                      {formatCurrency(expense.monthly_amount)}/mo
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {expense.start_year} - {expense.end_year}
                    {expense.notes && <span className="ml-2 italic">({expense.notes})</span>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditExpense(expense)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteExpense(expense.id)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
            <div className="pt-3 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-700">Total Fixed Monthly:</span>
                <span className="text-lg font-bold text-green-600">{formatCurrency(totalFixedMonthly)}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No fixed expenses added yet.</p>
            <p className="text-sm mt-1">Add fixed-rate expenses like loans or mortgages that don&#39;t increase with inflation.</p>
          </div>
        )}
      </div>

      {/* Summary Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Annual Spending Summary</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Variable monthly spending x 12:</span>
            <span className="font-medium">{formatCurrency((parseFloat(monthlySpending || '0') * 12).toString())}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Fixed monthly expenses x 12:</span>
            <span className="font-medium">{formatCurrency((totalFixedMonthly * 12).toString())}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Annual lump sum:</span>
            <span className="font-medium">{formatCurrency(annualLumpSum)}</span>
          </div>
          <div className="flex justify-between pt-3 border-t border-blue-200">
            <span className="text-xl font-semibold text-gray-900">Total Annual Spending:</span>
            <span className="text-xl font-bold text-blue-600">{formatCurrency(totalAnnual.toString())}</span>
          </div>
        </div>
      </div>

      {/* Information Box */}
      <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-2">About Spending Types</h3>
        <ul className="text-sm text-gray-600 space-y-2 list-disc list-inside">
          <li>
            <strong>Variable spending</strong> increases with inflation over time in projections
          </li>
          <li>
            <strong>Fixed expenses</strong> (like loans) stay constant and end at a specific year
          </li>
          <li>
            When a fixed expense ends, your total spending will decrease by that amount
          </li>
          <li>
            Fixed expenses are useful for modeling mortgages, car loans, or other fixed-rate payments
          </li>
        </ul>
      </div>
    </div>
  );
}
