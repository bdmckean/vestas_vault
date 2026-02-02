import { useState, useEffect } from 'react';
import {
  useOtherIncome,
  useCreateOtherIncome,
  useUpdateOtherIncome,
  useDeleteOtherIncome,
  useOtherIncomeSummary,
} from '../hooks/useOtherIncome';
import type { OtherIncome, OtherIncomeCreate, IncomeType } from '../types/other_income';
import { INCOME_TYPE_LABELS, INCOME_TYPE_COLORS } from '../types/other_income';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

export function OtherIncomePage() {
  const { data: incomes, isLoading } = useOtherIncome();
  const createMutation = useCreateOtherIncome();
  const updateMutation = useUpdateOtherIncome();
  const deleteMutation = useDeleteOtherIncome();

  // Projection date range - default to next 5 years
  const [projStartYear] = useState(currentYear);
  const [projStartMonth] = useState(currentMonth);
  const [projEndYear] = useState(currentYear + 5);
  const [projEndMonth] = useState(12);

  const { data: summaries } = useOtherIncomeSummary(
    projStartYear,
    projStartMonth,
    projEndYear,
    projEndMonth,
    (incomes?.length ?? 0) > 0
  );

  // Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<OtherIncome | null>(null);
  const [formData, setFormData] = useState<OtherIncomeCreate>({
    name: '',
    income_type: 'pension',
    monthly_amount: '',
    start_month: currentMonth,
    start_year: currentYear,
    end_month: null,
    end_year: null,
    cola_rate: '0',
    is_taxable: true,
    notes: '',
  });
  const [isOngoing, setIsOngoing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Reset form when opening/closing
  useEffect(() => {
    if (!isFormOpen) {
      setEditingIncome(null);
      setFormData({
        name: '',
        income_type: 'pension',
        monthly_amount: '',
        start_month: currentMonth,
        start_year: currentYear,
        end_month: null,
        end_year: null,
        cola_rate: '0',
        is_taxable: true,
        notes: '',
      });
      setIsOngoing(true);
      setError(null);
    }
  }, [isFormOpen]);

  // Load existing data when editing
  useEffect(() => {
    if (editingIncome) {
      setFormData({
        name: editingIncome.name,
        income_type: editingIncome.income_type,
        monthly_amount: editingIncome.monthly_amount,
        start_month: editingIncome.start_month,
        start_year: editingIncome.start_year,
        end_month: editingIncome.end_month,
        end_year: editingIncome.end_year,
        cola_rate: editingIncome.cola_rate,
        is_taxable: editingIncome.is_taxable,
        notes: editingIncome.notes || '',
      });
      setIsOngoing(editingIncome.end_month === null);
      setIsFormOpen(true);
    }
  }, [editingIncome]);

  const formatCurrency = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value || '0') : value;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const formatPercent = (value: string) => {
    const num = parseFloat(value || '0') * 100;
    return `${num.toFixed(1)}%`;
  };

  const formatDateRange = (income: OtherIncome) => {
    const start = `${MONTHS[income.start_month - 1]} ${income.start_year}`;
    if (income.end_month === null) {
      return `${start} - Ongoing`;
    }
    const end = `${MONTHS[income.end_month - 1]} ${income.end_year}`;
    return `${start} - ${end}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const submitData = {
      ...formData,
      end_month: isOngoing ? null : formData.end_month,
      end_year: isOngoing ? null : formData.end_year,
    };

    try {
      if (editingIncome) {
        await updateMutation.mutateAsync({
          id: editingIncome.id,
          data: submitData,
        });
        setSuccess('Income source updated successfully');
      } else {
        await createMutation.mutateAsync(submitData);
        setSuccess('Income source created successfully');
      }
      setIsFormOpen(false);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error saving income source');
    }
  };

  const handleDelete = async (income: OtherIncome) => {
    if (!window.confirm(`Are you sure you want to delete "${income.name}"?`)) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(income.id);
      setSuccess('Income source deleted successfully');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error deleting income source');
    }
  };

  const totalMonthlyIncome = incomes?.reduce(
    (sum, income) => sum + parseFloat(income.monthly_amount),
    0
  ) || 0;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Other Income Sources</h1>
          <p className="text-gray-600 mt-2">
            Manage income from pensions, employment, rental properties, and other sources.
          </p>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium"
        >
          + Add Income Source
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Total Income Sources</h2>
          <p className="text-3xl font-bold text-blue-600">{incomes?.length || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Combined Monthly Income</h2>
          <p className="text-3xl font-bold text-green-600">{formatCurrency(totalMonthlyIncome)}</p>
          <p className="text-sm text-gray-500 mt-1">(at current rates)</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Annual Income</h2>
          <p className="text-3xl font-bold text-purple-600">{formatCurrency(totalMonthlyIncome * 12)}</p>
          <p className="text-sm text-gray-500 mt-1">(at current rates)</p>
        </div>
      </div>

      {/* Income Sources List */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Income Sources</h2>
        {incomes && incomes.length > 0 ? (
          <div className="space-y-4">
            {incomes.map((income) => (
              <div
                key={income.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{income.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${INCOME_TYPE_COLORS[income.income_type]}`}>
                        {INCOME_TYPE_LABELS[income.income_type]}
                      </span>
                      {!income.is_taxable && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Tax-Free
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Monthly Amount:</span>
                        <p className="font-semibold text-gray-900">{formatCurrency(income.monthly_amount)}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Active Period:</span>
                        <p className="font-semibold text-gray-900">{formatDateRange(income)}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">COLA Rate:</span>
                        <p className="font-semibold text-gray-900">{formatPercent(income.cola_rate)}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Annual Total:</span>
                        <p className="font-semibold text-gray-900">{formatCurrency(parseFloat(income.monthly_amount) * 12)}</p>
                      </div>
                    </div>
                    {income.notes && (
                      <p className="mt-2 text-sm text-gray-600 italic">{income.notes}</p>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => setEditingIncome(income)}
                      className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(income)}
                      className="text-red-600 hover:text-red-800 font-medium text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p className="mb-4">No income sources added yet.</p>
            <button
              onClick={() => setIsFormOpen(true)}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Add your first income source
            </button>
          </div>
        )}
      </div>

      {/* Projections Table */}
      {summaries && summaries.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Income Projections ({projStartYear} - {projEndYear})
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Taxable</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Non-Taxable</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {summaries.slice(0, 24).map((summary) => (
                  <tr key={`${summary.year}-${summary.month}`} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {MONTHS[summary.month - 1]} {summary.year}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                      {formatCurrency(summary.total_amount)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-600">
                      {formatCurrency(summary.taxable_amount)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-green-600">
                      {formatCurrency(summary.non_taxable_amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {summaries.length > 24 && (
            <p className="mt-4 text-sm text-gray-500 text-center">
              Showing first 24 months of {summaries.length} total
            </p>
          )}
        </div>
      )}

      {/* Add/Edit Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {editingIncome ? 'Edit Income Source' : 'Add Income Source'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Name/Description *
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Company Pension, Rental Property"
                  required
                />
              </div>

              {/* Income Type */}
              <div>
                <label htmlFor="income_type" className="block text-sm font-medium text-gray-700 mb-1">
                  Income Type *
                </label>
                <select
                  id="income_type"
                  value={formData.income_type}
                  onChange={(e) => setFormData({ ...formData, income_type: e.target.value as IncomeType })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="pension">Pension</option>
                  <option value="employment">Employment</option>
                  <option value="rental">Rental Income</option>
                  <option value="annuity">Annuity</option>
                  <option value="dividend">Dividend</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Monthly Amount */}
              <div>
                <label htmlFor="monthly_amount" className="block text-sm font-medium text-gray-700 mb-1">
                  Monthly Amount *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    id="monthly_amount"
                    value={formData.monthly_amount}
                    onChange={(e) => setFormData({ ...formData, monthly_amount: e.target.value })}
                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
              </div>

              {/* Start Date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="start_month" className="block text-sm font-medium text-gray-700 mb-1">
                    Start Month *
                  </label>
                  <select
                    id="start_month"
                    value={formData.start_month}
                    onChange={(e) => setFormData({ ...formData, start_month: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {MONTHS.map((month, index) => (
                      <option key={month} value={index + 1}>{month}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="start_year" className="block text-sm font-medium text-gray-700 mb-1">
                    Start Year *
                  </label>
                  <input
                    type="number"
                    id="start_year"
                    value={formData.start_year}
                    onChange={(e) => setFormData({ ...formData, start_year: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1900"
                    max="2100"
                    required
                  />
                </div>
              </div>

              {/* Ongoing Checkbox */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="ongoing"
                  checked={isOngoing}
                  onChange={(e) => setIsOngoing(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="ongoing" className="ml-2 text-sm text-gray-700">
                  Ongoing (no end date)
                </label>
              </div>

              {/* End Date */}
              {!isOngoing && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="end_month" className="block text-sm font-medium text-gray-700 mb-1">
                      End Month
                    </label>
                    <select
                      id="end_month"
                      value={formData.end_month || ''}
                      onChange={(e) => setFormData({ ...formData, end_month: e.target.value ? parseInt(e.target.value) : null })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select month</option>
                      {MONTHS.map((month, index) => (
                        <option key={month} value={index + 1}>{month}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="end_year" className="block text-sm font-medium text-gray-700 mb-1">
                      End Year
                    </label>
                    <input
                      type="number"
                      id="end_year"
                      value={formData.end_year || ''}
                      onChange={(e) => setFormData({ ...formData, end_year: e.target.value ? parseInt(e.target.value) : null })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="1900"
                      max="2100"
                    />
                  </div>
                </div>
              )}

              {/* COLA Rate */}
              <div>
                <label htmlFor="cola_rate" className="block text-sm font-medium text-gray-700 mb-1">
                  Annual COLA Rate (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id="cola_rate"
                    value={parseFloat(formData.cola_rate || '0') * 100}
                    onChange={(e) => setFormData({ ...formData, cola_rate: (parseFloat(e.target.value) / 100).toString() })}
                    className="w-full pr-8 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                    min="0"
                    max="100"
                    step="0.1"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Annual cost-of-living adjustment applied to the income
                </p>
              </div>

              {/* Taxable */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_taxable"
                  checked={formData.is_taxable}
                  onChange={(e) => setFormData({ ...formData, is_taxable: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="is_taxable" className="ml-2 text-sm text-gray-700">
                  This income is taxable
                </label>
              </div>

              {/* Notes */}
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (optional)
                </label>
                <textarea
                  id="notes"
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Additional details about this income source"
                />
              </div>

              {/* Form Actions */}
              <div className="flex gap-4 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
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
                    : editingIncome
                    ? 'Update'
                    : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Information Box */}
      <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-2">About Other Income</h3>
        <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
          <li>Add income sources like pensions, part-time work, rental income, or annuities</li>
          <li>Each source can have a different start and end date</li>
          <li>COLA (Cost of Living Adjustment) is applied annually from the start year</li>
          <li>Mark income as taxable or non-taxable for accurate tax projections</li>
          <li>Projections show future income with COLA applied</li>
        </ul>
      </div>
    </div>
  );
}
