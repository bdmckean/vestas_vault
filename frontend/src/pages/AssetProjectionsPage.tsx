import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAssetClasses, useConsolidated10Year, useHistoricalReturns } from '../hooks/useAssetProjections';

export function AssetProjectionsPage() {
  const { data: assetClasses, isLoading: classesLoading } = useAssetClasses();
  const { data: consolidated, isLoading: consolidatedLoading } = useConsolidated10Year();
  const { data: historical, isLoading: historicalLoading } = useHistoricalReturns();
  
  const [activeTab, setActiveTab] = useState<'10year' | 'historical'>('10year');

  const formatPercent = (value: number | null | undefined) => {
    if (value === null || value === undefined) return 'N/A';
    return `${value.toFixed(1)}%`;
  };

  if (classesLoading || consolidatedLoading || historicalLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">Loading projections...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900">Asset Class Return Projections</h1>
        <Link
          to="/scenario-modeling"
          className="bg-orange-600 text-white px-6 py-2 rounded-md hover:bg-orange-700 font-medium"
        >
          Model Scenarios →
        </Link>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('10year')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === '10year'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            10-Year Projections (2026-2035)
          </button>
          <button
            onClick={() => setActiveTab('historical')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'historical'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Historical Returns (Long-Term)
          </button>
        </nav>
      </div>

      {/* 10-Year Projections Tab */}
      {activeTab === '10year' && (
        <div className="space-y-6">
          {consolidated && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold mb-4 text-gray-900">
                Consolidated 10-Year Projections
              </h2>
              <p className="text-gray-600 mb-6">{consolidated.description}</p>
              <p className="text-sm text-gray-500 mb-6">As of: {consolidated.as_of_date}</p>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Asset Class
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Expected Return
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Range (Low - High)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Notes
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {assetClasses?.asset_classes.map((asset) => {
                      const details = consolidated.asset_classes[asset.key];
                      return (
                        <tr key={asset.key} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{asset.name}</div>
                            <div className="text-sm text-gray-500">{asset.key}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <span className="text-sm font-semibold text-blue-600">
                              {formatPercent(details?.expected_return)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <span className="text-sm text-gray-900">
                              {details?.range
                                ? `${formatPercent(details.range.low)} - ${formatPercent(details.range.high)}`
                                : 'N/A'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-500">{details?.notes || 'N/A'}</div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Key Asset Classes Summary Cards */}
          {consolidated && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {['total_us_stock', 'total_foreign_stock', 'us_small_cap_value', 'reits', 'bonds', 'short_term_treasuries', 'cash'].map((key) => {
                const asset = consolidated.asset_classes[key];
                if (!asset) return null;
                return (
                  <div key={key} className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </h3>
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                      {formatPercent(asset.expected_return)}
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      Range: {formatPercent(asset.range.low)} - {formatPercent(asset.range.high)}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">{asset.notes}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Historical Returns Tab */}
      {activeTab === 'historical' && historical && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Long-Term Historical Returns</h2>
            
            {/* Return Assumption Notice */}
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">Return Assumption for Years 10+</h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p className="mb-2">
                      When using <strong>"Historical Average"</strong> return source, or for projections beyond year 10, the system uses <strong>long-term historical averages</strong> based on your asset allocation:
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li><strong>Total US Stock:</strong> 10.0% (30-year historical average)</li>
                      <li><strong>Total International Stock:</strong> 8.5% (long-term average)</li>
                      <li><strong>US Small Cap Value:</strong> 13.0% (long-term average)</li>
                      <li><strong>REITs:</strong> 9.35% (30-year historical average)</li>
                      <li><strong>Bonds:</strong> 4.5% (long-term average)</li>
                      <li><strong>Short-Term Treasuries:</strong> 4.0% (long-term average)</li>
                      <li><strong>Cash:</strong> 3.31% (historical T-bill average)</li>
                    </ul>
                    <p className="mt-2">
                      Your blended return for years 10+ is calculated as a weighted average based on your asset allocation percentages. These historical averages are derived from the data shown in the tables below.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <p className="text-gray-600 mb-2">{historical.metadata.description}</p>
            <p className="text-sm text-gray-500 mb-6">Last updated: {historical.metadata.last_updated}</p>

            {/* US Equities */}
            {historical.us_equities && (
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">US Equities</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Asset Class
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Period
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nominal Return
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Real Return
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Notes
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {Object.entries(historical.us_equities).map(([key, data]: [string, any]) => {
                        const periods = data.periods || {};
                        return Object.entries(periods).map(([periodKey, period]: [string, any], idx) => (
                          <tr key={`${key}-${periodKey}`} className={idx === 0 ? 'bg-blue-50' : ''}>
                            {idx === 0 && (
                              <td
                                rowSpan={Object.keys(periods).length}
                                className="px-6 py-4 whitespace-nowrap align-top"
                              >
                                <div className="text-sm font-medium text-gray-900">
                                  {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">{data.description}</div>
                              </td>
                            )}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{periodKey.replace(/_/g, ' ')}</div>
                              <div className="text-xs text-gray-500">{period.years} years</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <span className="text-sm font-medium text-gray-900">
                                {typeof period.nominal === 'number' ? `${period.nominal.toFixed(2)}%` : period.nominal}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <span className="text-sm text-gray-600">
                                {typeof period.real === 'number' ? `${period.real.toFixed(2)}%` : period.real}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-500">{period.notes || ''}</div>
                            </td>
                          </tr>
                        ));
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
