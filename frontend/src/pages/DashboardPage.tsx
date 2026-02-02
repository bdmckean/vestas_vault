import { Link } from 'react-router-dom';
import { useAccounts } from '../hooks/useAccounts';
import { useOtherIncome } from '../hooks/useOtherIncome';
import { usePlannedSpending } from '../hooks/usePlannedSpending';
import { useSocialSecurity } from '../hooks/useSocialSecurity';

export function DashboardPage() {
  const { data: accounts, isLoading: accountsLoading } = useAccounts();
  const { data: socialSecurity, isLoading: ssLoading } = useSocialSecurity();
  const { data: otherIncome, isLoading: otherIncomeLoading } = useOtherIncome();
  const { data: plannedSpending, isLoading: spendingLoading } = usePlannedSpending();

  const totalBalance = accounts
    ? accounts.reduce((sum, acc) => sum + parseFloat(acc.balance), 0)
    : 0;

  const totalOtherIncomeMonthly = otherIncome
    ? otherIncome.reduce((sum, inc) => sum + parseFloat(inc.monthly_amount), 0)
    : 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  if (accountsLoading || ssLoading || spendingLoading || otherIncomeLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  const totalAnnualSpending = plannedSpending
    ? parseFloat(plannedSpending.monthly_spending) * 12 + parseFloat(plannedSpending.annual_lump_sum)
    : 0;

  const ssMonthly = socialSecurity ? parseFloat(socialSecurity.fra_monthly_amount) : 0;
  const totalMonthlyIncome = ssMonthly + totalOtherIncomeMonthly;
  const totalAnnualIncome = totalMonthlyIncome * 12;
  const annualGap = totalAnnualIncome - totalAnnualSpending;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">Retirement Planner Dashboard</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Accounts Summary */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Total Portfolio</h2>
          <p className="text-3xl font-bold text-blue-600">{formatCurrency(totalBalance)}</p>
          <p className="text-sm text-gray-500 mt-2">
            {accounts?.length || 0} account{accounts?.length !== 1 ? 's' : ''}
          </p>
          <Link
            to="/accounts"
            className="mt-4 inline-block text-blue-600 hover:text-blue-800 font-medium text-sm"
          >
            Manage Accounts →
          </Link>
        </div>

        {/* Income Summary */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Total Income</h2>
          <p className="text-3xl font-bold text-green-600">
            {formatCurrency(totalMonthlyIncome)}
            <span className="text-lg text-gray-500">/mo</span>
          </p>
          <p className="text-sm text-gray-500 mt-2">
            SS: {formatCurrency(ssMonthly)} + Other: {formatCurrency(totalOtherIncomeMonthly)}
          </p>
          <div className="mt-4 flex gap-2">
            <Link
              to="/social-security"
              className="text-blue-600 hover:text-blue-800 font-medium text-sm"
            >
              SS →
            </Link>
            <Link
              to="/other-income"
              className="text-blue-600 hover:text-blue-800 font-medium text-sm"
            >
              Other →
            </Link>
          </div>
        </div>

        {/* Planned Spending Summary */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Planned Spending</h2>
          {plannedSpending ? (
            <>
              <p className="text-3xl font-bold text-purple-600">
                {formatCurrency(totalAnnualSpending)}
                <span className="text-lg text-gray-500">/yr</span>
              </p>
              <p className="text-sm text-gray-500 mt-2">
                {formatCurrency(parseFloat(plannedSpending.monthly_spending))}/mo +{' '}
                {formatCurrency(parseFloat(plannedSpending.annual_lump_sum))} lump sum
              </p>
            </>
          ) : (
            <p className="text-gray-500">Not configured</p>
          )}
          <Link
            to="/planned-spending"
            className="mt-4 inline-block text-blue-600 hover:text-blue-800 font-medium text-sm"
          >
            {plannedSpending ? 'Update Spending →' : 'Setup Spending →'}
          </Link>
        </div>

        {/* Income vs Spending Gap */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Annual Gap</h2>
          <p className={`text-3xl font-bold ${annualGap >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {annualGap >= 0 ? '+' : ''}{formatCurrency(annualGap)}
            <span className="text-lg text-gray-500">/yr</span>
          </p>
          <p className="text-sm text-gray-500 mt-2">
            {annualGap >= 0 
              ? 'Surplus - income exceeds spending' 
              : 'Shortfall - must withdraw from portfolio'}
          </p>
          <Link
            to="/scenario-modeling"
            className="mt-4 inline-block text-blue-600 hover:text-blue-800 font-medium text-sm"
          >
            Model Scenarios →
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-2">
            <Link
              to="/accounts"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-center font-medium text-sm"
            >
              Accounts
            </Link>
            <Link
              to="/social-security"
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-center font-medium text-sm"
            >
              Social Security
            </Link>
            <Link
              to="/other-income"
              className="bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 text-center font-medium text-sm"
            >
              Other Income
            </Link>
            <Link
              to="/planned-spending"
              className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 text-center font-medium text-sm"
            >
              Spending
            </Link>
            <Link
              to="/tax"
              className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 text-center font-medium text-sm"
            >
              Tax Setup
            </Link>
            <Link
              to="/asset-projections"
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 text-center font-medium text-sm"
            >
              Projections
            </Link>
            <Link
              to="/scenario-modeling"
              className="col-span-2 bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 text-center font-medium text-sm"
            >
              Model Scenarios
            </Link>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Next Steps</h2>
          <ul className="space-y-2">
            {!accounts || accounts.length === 0 ? (
              <li className="text-gray-600">
                • <Link to="/accounts" className="text-blue-600 hover:underline">Add your retirement accounts</Link>
              </li>
            ) : null}
            {!socialSecurity ? (
              <li className="text-gray-600">
                • <Link to="/social-security" className="text-blue-600 hover:underline">Configure Social Security benefits</Link>
              </li>
            ) : null}
            {!otherIncome || otherIncome.length === 0 ? (
              <li className="text-gray-600">
                • <Link to="/other-income" className="text-blue-600 hover:underline">Add other income sources (pensions, etc.)</Link>
              </li>
            ) : null}
            {!plannedSpending ? (
              <li className="text-gray-600">
                • <Link to="/planned-spending" className="text-blue-600 hover:underline">Set up planned spending</Link>
              </li>
            ) : null}
            {accounts && accounts.length > 0 && socialSecurity && plannedSpending ? (
              <li className="text-gray-600">
                • <Link to="/scenario-modeling" className="text-blue-600 hover:underline">Model different investment scenarios</Link>
              </li>
            ) : null}
            {accounts && accounts.length > 0 && socialSecurity && plannedSpending && otherIncome && otherIncome.length > 0 ? (
              <li className="text-green-600 font-medium">
                ✓ All basic setup complete! Ready for projections.
              </li>
            ) : null}
          </ul>
        </div>
      </div>

      {/* Income Breakdown */}
      {(socialSecurity || (otherIncome && otherIncome.length > 0)) && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Income Breakdown (at FRA)</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Monthly</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Annual</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {socialSecurity && (
                  <tr>
                    <td className="px-4 py-3 text-sm text-gray-900">Social Security</td>
                    <td className="px-4 py-3 text-sm text-gray-600">Government Benefit</td>
                    <td className="px-4 py-3 text-sm text-right font-medium">{formatCurrency(ssMonthly)}</td>
                    <td className="px-4 py-3 text-sm text-right font-medium">{formatCurrency(ssMonthly * 12)}</td>
                  </tr>
                )}
                {otherIncome?.map((income) => (
                  <tr key={income.id}>
                    <td className="px-4 py-3 text-sm text-gray-900">{income.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 capitalize">{income.income_type}</td>
                    <td className="px-4 py-3 text-sm text-right font-medium">{formatCurrency(parseFloat(income.monthly_amount))}</td>
                    <td className="px-4 py-3 text-sm text-right font-medium">{formatCurrency(parseFloat(income.monthly_amount) * 12)}</td>
                  </tr>
                ))}
                <tr className="bg-gray-50 font-semibold">
                  <td className="px-4 py-3 text-sm text-gray-900">Total</td>
                  <td className="px-4 py-3 text-sm text-gray-600"></td>
                  <td className="px-4 py-3 text-sm text-right text-green-600">{formatCurrency(totalMonthlyIncome)}</td>
                  <td className="px-4 py-3 text-sm text-right text-green-600">{formatCurrency(totalAnnualIncome)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
