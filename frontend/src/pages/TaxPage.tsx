import { useState, useEffect } from 'react';
import { useTaxConfig, useCreateTaxConfig, useUpdateTaxConfig, useDeleteTaxConfig } from '../hooks/useTaxConfig';
import { useStandardDeductions } from '../hooks/useTaxTables';
import { taxConfigApi, EstimatedAnnualIncome } from '../services/tax_config_api';
import type { FilingStatus, SeniorDeductionBreakdown } from '../types/tax_config';

const FILING_STATUS_OPTIONS: { value: FilingStatus; label: string }[] = [
  { value: 'single', label: 'Single' },
  { value: 'married_filing_jointly', label: 'Married Filing Jointly' },
  { value: 'married_filing_separately', label: 'Married Filing Separately' },
  { value: 'head_of_household', label: 'Head of Household' },
  { value: 'qualifying_widow', label: 'Qualifying Widow(er)' },
];

export function TaxPage() {
  const { data: taxConfig, isLoading } = useTaxConfig();
  const createMutation = useCreateTaxConfig();
  const updateMutation = useUpdateTaxConfig();
  const deleteMutation = useDeleteTaxConfig();

  const [filingStatus, setFilingStatus] = useState<FilingStatus>('single');
  const [totalDeductions, setTotalDeductions] = useState('');
  const [primaryAge, setPrimaryAge] = useState<number | null>(null);
  const [spouseAge, setSpouseAge] = useState<number | null>(null);
  const [annualIncome, setAnnualIncome] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [taxYear, setTaxYear] = useState(2026);
  const [seniorDeductions, setSeniorDeductions] = useState<SeniorDeductionBreakdown | null>(null);
  const [calculatingSenior, setCalculatingSenior] = useState(false);
  const [estimatedIncome, setEstimatedIncome] = useState<EstimatedAnnualIncome | null>(null);
  const [loadingEstimatedIncome, setLoadingEstimatedIncome] = useState(false);

  // Load standard deductions for selected year
  const { data: standardDeductionsData } = useStandardDeductions(taxYear);

  // Fetch estimated annual income from SS and Other Income
  useEffect(() => {
    const fetchEstimatedIncome = async () => {
      setLoadingEstimatedIncome(true);
      try {
        const data = await taxConfigApi.getEstimatedAnnualIncome();
        setEstimatedIncome(data);
        // Auto-populate annual income if not already set
        if (!annualIncome && data.total.annual_amount && parseFloat(data.total.annual_amount) > 0) {
          setAnnualIncome(data.total.annual_amount);
        }
      } catch (err) {
        console.error('Error fetching estimated income:', err);
      } finally {
        setLoadingEstimatedIncome(false);
      }
    };
    fetchEstimatedIncome();
  }, []);

  // Load existing data when it's available
  useEffect(() => {
    if (taxConfig) {
      setFilingStatus(taxConfig.filing_status);
      setTotalDeductions(taxConfig.total_deductions);
      setPrimaryAge(taxConfig.primary_age);
      setSpouseAge(taxConfig.spouse_age);
      setAnnualIncome(taxConfig.annual_income || '');
    }
  }, [taxConfig]);

  // Calculate senior deductions when relevant fields change
  useEffect(() => {
    const calculateSenior = async () => {
      if (
        (primaryAge !== null && primaryAge >= 65) ||
        (spouseAge !== null && spouseAge >= 65) ||
        (filingStatus === 'married_filing_jointly' && (primaryAge !== null || spouseAge !== null))
      ) {
        setCalculatingSenior(true);
        try {
          const breakdown = await taxConfigApi.calculateSeniorDeductions(
            filingStatus,
            primaryAge,
            spouseAge,
            annualIncome ? parseFloat(annualIncome) : null,
            taxYear
          );
          setSeniorDeductions(breakdown);
          // Auto-update total deductions to include senior deductions if not manually set
          if (!taxConfig && breakdown.total_automatic_deduction) {
            setTotalDeductions(breakdown.total_automatic_deduction);
          }
        } catch (err) {
          console.error('Error calculating senior deductions:', err);
        } finally {
          setCalculatingSenior(false);
        }
      } else {
        setSeniorDeductions(null);
      }
    };

    calculateSenior();
  }, [filingStatus, primaryAge, spouseAge, annualIncome, taxYear, taxConfig]);

  const formatCurrency = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value || '0') : value;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const getStandardDeduction = () => {
    if (!standardDeductionsData) return null;
    return standardDeductionsData.standard_deductions[filingStatus];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const deductions = parseFloat(totalDeductions || '0');

    if (deductions < 0) {
      setError('Deductions cannot be negative');
      return;
    }

    try {
      if (taxConfig) {
        // Update existing
        await updateMutation.mutateAsync({
          filing_status: filingStatus,
          total_deductions: totalDeductions,
          primary_age: primaryAge,
          spouse_age: spouseAge,
          annual_income: annualIncome || null,
        });
        setSuccess('Tax configuration updated successfully');
      } else {
        // Create new
        await createMutation.mutateAsync({
          filing_status: filingStatus,
          total_deductions: totalDeductions,
          primary_age: primaryAge,
          spouse_age: spouseAge,
          annual_income: annualIncome || null,
        });
        setSuccess('Tax configuration created successfully');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error saving tax configuration');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete the tax configuration?')) {
      return;
    }

    setError(null);
    try {
      await deleteMutation.mutateAsync();
      setFilingStatus('single');
      setTotalDeductions('');
      setPrimaryAge(null);
      setSpouseAge(null);
      setAnnualIncome('');
      setSeniorDeductions(null);
      setSuccess('Tax configuration deleted successfully');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error deleting tax configuration');
    }
  };

  const handleUseStandardDeduction = () => {
    const standard = getStandardDeduction();
    if (standard) {
      setTotalDeductions(standard.toString());
    }
  };

  const handleUseSeniorDeduction = () => {
    if (seniorDeductions) {
      setTotalDeductions(seniorDeductions.total_automatic_deduction);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  const standardDeduction = getStandardDeduction();
  const deductionsValue = parseFloat(totalDeductions || '0');
  const showSpouseAge = filingStatus === 'married_filing_jointly' || filingStatus === 'qualifying_widow';

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">Tax Configuration</h1>
      <p className="text-gray-600 mb-6">
        Configure your tax filing status and deductions. This will be used for retirement planning tax calculations.
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
          {/* Tax Year Selection */}
          <div>
            <label htmlFor="tax_year" className="block text-sm font-medium text-gray-700 mb-2">
              Tax Year (for reference)
            </label>
            <select
              id="tax_year"
              value={taxYear}
              onChange={(e) => setTaxYear(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={2026}>2026</option>
              <option value={2025}>2025</option>
              <option value={2024}>2024</option>
            </select>
            <p className="mt-1 text-sm text-gray-500">
              Select tax year to view standard deductions (for reference only)
            </p>
          </div>

          {/* Filing Status */}
          <div>
            <label htmlFor="filing_status" className="block text-sm font-medium text-gray-700 mb-2">
              Filing Status
            </label>
            <select
              id="filing_status"
              value={filingStatus}
              onChange={(e) => setFilingStatus(e.target.value as FilingStatus)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              {FILING_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-sm text-gray-500">
              Your federal tax filing status
            </p>
          </div>

          {/* Age Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="primary_age" className="block text-sm font-medium text-gray-700 mb-2">
                Primary Filer Age
              </label>
              <input
                type="number"
                id="primary_age"
                value={primaryAge || ''}
                onChange={(e) => setPrimaryAge(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter age"
                min="0"
                max="120"
              />
              <p className="mt-1 text-sm text-gray-500">
                Age of primary filer (for senior deductions)
              </p>
            </div>
            {showSpouseAge && (
              <div>
                <label htmlFor="spouse_age" className="block text-sm font-medium text-gray-700 mb-2">
                  Spouse Age
                </label>
                <input
                  type="number"
                  id="spouse_age"
                  value={spouseAge || ''}
                  onChange={(e) => setSpouseAge(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter age"
                  min="0"
                  max="120"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Age of spouse (for senior deductions)
                </p>
              </div>
            )}
          </div>

          {/* Estimated Annual Income */}
          {estimatedIncome && parseFloat(estimatedIncome.total.annual_amount) > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">
                Estimated Annual Income (from configured sources)
              </h3>
              <div className="space-y-2">
                {parseFloat(estimatedIncome.social_security.annual_amount) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Social Security (at FRA):</span>
                    <span className="font-medium">{formatCurrency(estimatedIncome.social_security.annual_amount)}</span>
                  </div>
                )}
                {estimatedIncome.other_income.sources.map((source, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span className="text-gray-600">
                      {source.name} ({source.income_type})
                      {!source.is_taxable && <span className="text-green-600 ml-1">(tax-free)</span>}:
                    </span>
                    <span className="font-medium">{formatCurrency(source.annual_amount)}</span>
                  </div>
                ))}
                <div className="flex justify-between pt-2 border-t border-green-200">
                  <span className="text-lg font-semibold text-gray-900">Total Estimated Income:</span>
                  <span className="text-lg font-bold text-green-600">
                    {formatCurrency(estimatedIncome.total.annual_amount)}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-2">{estimatedIncome.note}</p>
                <button
                  type="button"
                  onClick={() => setAnnualIncome(estimatedIncome.total.annual_amount)}
                  className="mt-2 w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium"
                >
                  Use Calculated Income ({formatCurrency(estimatedIncome.total.annual_amount)})
                </button>
              </div>
            </div>
          )}

          {/* Annual Income Override */}
          <div>
            <label htmlFor="annual_income" className="block text-sm font-medium text-gray-700 mb-2">
              Annual Income for Senior Deduction Eligibility
              {estimatedIncome && parseFloat(estimatedIncome.total.annual_amount) > 0 && (
                <span className="text-green-600 ml-2">(auto-calculated above)</span>
              )}
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  id="annual_income"
                  value={annualIncome}
                  onChange={(e) => setAnnualIncome(e.target.value)}
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                  min="0"
                  step="1000"
                />
              </div>
              {estimatedIncome && parseFloat(estimatedIncome.total.annual_amount) > 0 && (
                <button
                  type="button"
                  onClick={() => setAnnualIncome(estimatedIncome.total.annual_amount)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm font-medium whitespace-nowrap"
                >
                  Reset to Calculated
                </button>
              )}
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Used to determine eligibility for $6,000 bonus senior deduction (if under $150k). 
              {!estimatedIncome || parseFloat(estimatedIncome.total.annual_amount) === 0 
                ? ' Configure Social Security and Other Income to auto-calculate.'
                : ' You can override the calculated value if needed.'}
            </p>
          </div>

          {/* Senior Deductions Breakdown */}
          {seniorDeductions && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Senior Deductions Breakdown ({taxYear})</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Base Standard Deduction:</span>
                  <span className="font-medium">{formatCurrency(seniorDeductions.base_standard_deduction)}</span>
                </div>
                {parseFloat(seniorDeductions.additional_senior_deduction) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Additional Senior Deduction:</span>
                    <span className="font-medium text-purple-600">
                      {formatCurrency(seniorDeductions.additional_senior_deduction)}
                    </span>
                  </div>
                )}
                {parseFloat(seniorDeductions.bonus_senior_deduction) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Bonus Senior Deduction:</span>
                    <span className="font-medium text-purple-600">
                      {formatCurrency(seniorDeductions.bonus_senior_deduction)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-purple-200">
                  <span className="text-lg font-semibold text-gray-900">Total Automatic Deduction:</span>
                  <span className="text-lg font-bold text-purple-600">
                    {formatCurrency(seniorDeductions.total_automatic_deduction)}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-2">{seniorDeductions.explanation}</p>
                <button
                  type="button"
                  onClick={handleUseSeniorDeduction}
                  className="mt-2 w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm font-medium"
                >
                  Use Total Automatic Deduction ({formatCurrency(seniorDeductions.total_automatic_deduction)})
                </button>
              </div>
            </div>
          )}

          {/* Total Deductions */}
          <div>
            <label htmlFor="total_deductions" className="block text-sm font-medium text-gray-700 mb-2">
              Total Deductions
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  id="total_deductions"
                  value={totalDeductions}
                  onChange={(e) => setTotalDeductions(e.target.value)}
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                  min="0"
                  step="100"
                  required
                />
              </div>
              {standardDeduction && (
                <button
                  type="button"
                  onClick={handleUseStandardDeduction}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm font-medium whitespace-nowrap"
                >
                  Use Standard ({formatCurrency(standardDeduction)})
                </button>
              )}
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Total deductions (standard deduction + itemized deductions + senior deductions). Use buttons to set to standard or automatic senior deduction.
            </p>
            {standardDeduction && (
              <p className="mt-1 text-xs text-blue-600">
                Standard deduction for {FILING_STATUS_OPTIONS.find((o) => o.value === filingStatus)?.label} ({taxYear}): {formatCurrency(standardDeduction)}
              </p>
            )}
          </div>

          {/* Summary Card */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Tax Configuration Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Filing Status:</span>
                <span className="font-medium">{FILING_STATUS_OPTIONS.find((o) => o.value === filingStatus)?.label}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Deductions:</span>
                <span className="font-medium">{formatCurrency(deductionsValue)}</span>
              </div>
              {seniorDeductions && (
                <div className="flex justify-between pt-2 border-t border-blue-200">
                  <span className="text-sm text-gray-600">Automatic Senior Deduction:</span>
                  <span className="text-sm font-medium text-purple-600">
                    {formatCurrency(seniorDeductions.total_automatic_deduction)}
                  </span>
                </div>
              )}
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
                : taxConfig
                ? 'Update Tax Configuration'
                : 'Save Tax Configuration'}
            </button>
            {taxConfig && (
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
        <h3 className="text-sm font-medium text-gray-900 mb-2">About Tax Configuration</h3>
        <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
          <li>Filing status determines which tax brackets apply to your income</li>
          <li>Total deductions include standard deduction, itemized deductions, and senior deductions</li>
          <li>For 2026: Additional $1,650 per person 65+ and bonus $6,000 per person 65+ if income under $150k</li>
          <li>Enter ages to automatically calculate senior deductions</li>
          <li>You can use the buttons to quickly set deductions to standard or automatic senior amounts</li>
          <li>This configuration will be used in retirement planning tax calculations</li>
        </ul>
      </div>
    </div>
  );
}
