import { useState } from 'react';
import { useCreateScenario, useExportScenarioCSV, useExportScenarioJSON } from '../hooks/useScenarios';
import type { AssetAllocation, ScenarioCreate, ScenarioResult } from '../types/scenario';

export function ScenarioModelingPage() {
  const [scenarioName, setScenarioName] = useState('');
  const [initialAmount, setInitialAmount] = useState('100000');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [allocation, setAllocation] = useState<AssetAllocation>({
    total_us_stock: '60',
    total_foreign_stock: '20',
    us_small_cap_value: '10',
    bonds: '5',
    short_term_treasuries: '3',
    cash: '2',
  });
  const [returnSource, setReturnSource] = useState<'10_year_projections' | 'historical_average' | 'historical_period'>('10_year_projections');
  const [historicalPeriodStart, setHistoricalPeriodStart] = useState('');
  const [historicalPeriodEnd, setHistoricalPeriodEnd] = useState('');
  const [rebalanceFrequency, setRebalanceFrequency] = useState<'monthly' | 'quarterly' | 'annually' | 'never'>('annually');
  const [contributionAmount, setContributionAmount] = useState('0');
  const [contributionFrequency, setContributionFrequency] = useState<'monthly' | 'quarterly' | 'annually'>('monthly');
  
  const [result, setResult] = useState<ScenarioResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const createScenarioMutation = useCreateScenario();
  const exportCSVMutation = useExportScenarioCSV();
  const exportJSONMutation = useExportScenarioJSON();

  const calculateAllocationTotal = () => {
    const total = Object.values(allocation).reduce((sum, val) => sum + parseFloat(val || '0'), 0);
    return total;
  };

  const handleAllocationChange = (key: keyof AssetAllocation, value: string) => {
    setAllocation({ ...allocation, [key]: value });
  };

  const handleGenerate = async () => {
    setError(null);
    
    if (!scenarioName.trim()) {
      setError('Please enter a scenario name');
      return;
    }
    
    if (!startDate || !endDate) {
      setError('Please select start and end dates');
      return;
    }
    
    if (new Date(startDate) >= new Date(endDate)) {
      setError('End date must be after start date');
      return;
    }
    
    const total = calculateAllocationTotal();
    if (Math.abs(total - 100) > 0.01) {
      setError(`Asset allocation must sum to 100% (currently ${total.toFixed(2)}%)`);
      return;
    }

    if (returnSource === 'historical_period' && (!historicalPeriodStart || !historicalPeriodEnd)) {
      setError('Please select historical period dates when using historical period return source');
      return;
    }

    const scenarioData: ScenarioCreate = {
      name: scenarioName,
      initial_amount: initialAmount,
      start_date: startDate,
      end_date: endDate,
      asset_allocation: allocation,
      return_source: returnSource,
      historical_period_start: returnSource === 'historical_period' ? historicalPeriodStart : undefined,
      historical_period_end: returnSource === 'historical_period' ? historicalPeriodEnd : undefined,
      rebalance_frequency: rebalanceFrequency,
      contribution_amount: contributionAmount,
      contribution_frequency: contributionFrequency,
    };

    try {
      const scenarioResult = await createScenarioMutation.mutateAsync(scenarioData);
      setResult(scenarioResult);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error generating scenario');
    }
  };

  const handleExportCSV = async () => {
    if (!result) return;
    
    const scenarioData: ScenarioCreate = {
      name: scenarioName,
      initial_amount: initialAmount,
      start_date: startDate,
      end_date: endDate,
      asset_allocation: allocation,
      return_source: returnSource,
      historical_period_start: returnSource === 'historical_period' ? historicalPeriodStart : undefined,
      historical_period_end: returnSource === 'historical_period' ? historicalPeriodEnd : undefined,
      rebalance_frequency: rebalanceFrequency,
      contribution_amount: contributionAmount,
      contribution_frequency: contributionFrequency,
    };

    try {
      const blob = await exportCSVMutation.mutateAsync(scenarioData);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${scenarioName}_projection.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error exporting CSV');
    }
  };

  const handleExportJSON = async () => {
    if (!result) return;
    
    const scenarioData: ScenarioCreate = {
      name: scenarioName,
      initial_amount: initialAmount,
      start_date: startDate,
      end_date: endDate,
      asset_allocation: allocation,
      return_source: returnSource,
      historical_period_start: returnSource === 'historical_period' ? historicalPeriodStart : undefined,
      historical_period_end: returnSource === 'historical_period' ? historicalPeriodEnd : undefined,
      rebalance_frequency: rebalanceFrequency,
      contribution_amount: contributionAmount,
      contribution_frequency: contributionFrequency,
    };

    try {
      const jsonResult = await exportJSONMutation.mutateAsync(scenarioData);
      const jsonStr = JSON.stringify(jsonResult, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${scenarioName}_projection.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error exporting JSON');
    }
  };

  const formatCurrency = (value: string) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(parseFloat(value));
  };

  const formatPercent = (value: string) => {
    return `${parseFloat(value).toFixed(2)}%`;
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">Scenario Modeling</h1>
      <p className="text-gray-600 mb-6">
        Model different investment scenarios to see how various asset allocations and time periods might affect your portfolio.
      </p>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Input Form */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-6 text-gray-900">Scenario Parameters</h2>

          {/* Scenario Name */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Scenario Name</label>
            <input
              type="text"
              value={scenarioName}
              onChange={(e) => setScenarioName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Conservative 2025-2035"
            />
          </div>

          {/* Initial Amount */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Initial Investment Amount</label>
            <input
              type="number"
              value={initialAmount}
              onChange={(e) => setInitialAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0"
              step="1000"
            />
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Asset Allocation */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Asset Allocation (Total: {calculateAllocationTotal().toFixed(2)}%)
            </label>
            <div className="space-y-2">
              {[
                { key: 'total_us_stock', label: 'Total US Stock' },
                { key: 'total_foreign_stock', label: 'Total Foreign Stock' },
                { key: 'us_small_cap_value', label: 'US Small Cap Value' },
                { key: 'bonds', label: 'Bonds' },
                { key: 'short_term_treasuries', label: 'Short Term Treasuries' },
                { key: 'cash', label: 'Cash' },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center">
                  <label className="w-48 text-sm text-gray-700">{label}</label>
                  <input
                    type="number"
                    value={allocation[key as keyof AssetAllocation]}
                    onChange={(e) => handleAllocationChange(key as keyof AssetAllocation, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                    max="100"
                    step="0.1"
                  />
                  <span className="ml-2 text-sm text-gray-500">%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Return Source */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Return Source</label>
            <select
              value={returnSource}
              onChange={(e) => setReturnSource(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="10_year_projections">10-Year Projections</option>
              <option value="historical_average">Historical Average</option>
              <option value="historical_period">Historical Period</option>
            </select>
          </div>

          {/* Historical Period Dates (if applicable) */}
          {returnSource === 'historical_period' && (
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Historical Period Start</label>
                <input
                  type="date"
                  value={historicalPeriodStart}
                  onChange={(e) => setHistoricalPeriodStart(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Historical Period End</label>
                <input
                  type="date"
                  value={historicalPeriodEnd}
                  onChange={(e) => setHistoricalPeriodEnd(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* Rebalance Frequency */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Rebalance Frequency</label>
            <select
              value={rebalanceFrequency}
              onChange={(e) => setRebalanceFrequency(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="annually">Annually</option>
              <option value="never">Never</option>
            </select>
          </div>

          {/* Contributions */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Contribution Amount (per period)</label>
              <input
                type="number"
                value={contributionAmount}
                onChange={(e) => setContributionAmount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
                step="100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Contribution Frequency</label>
              <select
                value={contributionFrequency}
                onChange={(e) => setContributionFrequency(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="annually">Annually</option>
              </select>
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={createScenarioMutation.isLoading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {createScenarioMutation.isLoading ? 'Generating...' : 'Generate Scenario'}
          </button>
        </div>

        {/* Right Column: Results */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-6 text-gray-900">Results</h2>

          {result ? (
            <div className="space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Initial Amount</div>
                  <div className="text-2xl font-bold text-blue-600">{formatCurrency(result.initial_amount)}</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Final Amount</div>
                  <div className="text-2xl font-bold text-green-600">{formatCurrency(result.final_amount)}</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Total Return</div>
                  <div className="text-2xl font-bold text-purple-600">{formatCurrency(result.total_return)}</div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Total Return %</div>
                  <div className="text-2xl font-bold text-orange-600">{formatPercent(result.total_return_percent)}</div>
                </div>
              </div>

              {/* Export Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={handleExportCSV}
                  disabled={exportCSVMutation.isLoading}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400"
                >
                  {exportCSVMutation.isLoading ? 'Exporting...' : 'Export CSV'}
                </button>
                <button
                  onClick={handleExportJSON}
                  disabled={exportJSONMutation.isLoading}
                  className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:bg-gray-400"
                >
                  {exportJSONMutation.isLoading ? 'Exporting...' : 'Export JSON'}
                </button>
              </div>

              {/* Periods Table */}
              <div className="max-h-96 overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Start Balance</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Contribution</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Return %</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">End Balance</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {result.periods.map((period) => (
                      <tr key={period.period_number} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm">
                          {period.period_type === 'month' ? 'M' : 'Y'}{period.period_number}
                        </td>
                        <td className="px-4 py-2 text-sm text-right">{formatCurrency(period.starting_balance)}</td>
                        <td className="px-4 py-2 text-sm text-right">{formatCurrency(period.contribution)}</td>
                        <td className="px-4 py-2 text-sm text-right">{formatPercent(period.return_percent)}</td>
                        <td className="px-4 py-2 text-sm text-right font-medium">{formatCurrency(period.ending_balance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-12">
              Generate a scenario to see results here
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
