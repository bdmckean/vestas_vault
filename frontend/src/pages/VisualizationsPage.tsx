import { useEffect, useMemo, useState } from 'react';
import { useSavedScenarios, useScenarioProjection } from '../hooks/useSavedScenarios';
import { useTaxConfig } from '../hooks/useTaxConfig';
import { useUSFederalTaxTables } from '../hooks/useTaxTables';
import type { FilingStatus, USFederalTaxTables } from '../types/tax_config';

type ChartKey = 'income_sources' | 'tax_bracket_gap' | 'assets_by_account' | 'spending_breakdown';

/**
 * Single palette across Visualizations so account types and income sources read the same
 * in every chart. (SS = teal, Other income = amber — distinct, not two greens.)
 */
const VIZ = {
  socialSecurity: 'bg-teal-600',
  otherIncome: 'bg-amber-500',
  pretax: 'bg-blue-600',
  taxable: 'bg-violet-600',
  cash: 'bg-slate-500',
  roth: 'bg-orange-500',
  taxTaxableIncome: 'bg-sky-600',
  federalTax: 'bg-red-600',
  stateTax: 'bg-rose-500',
  bracketGap: 'bg-lime-300',
  spendingMonthly: 'bg-blue-600',
  spendingLump: 'bg-violet-500',
  spendingTaxes: 'bg-red-600',
  spendingLoans: 'bg-orange-400',
  trendLine: '#0f172a',
} as const;

function toNumber(value: string | number | null | undefined): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const n = parseFloat(String(value ?? '0'));
  return Number.isFinite(n) ? n : 0;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatCompactCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

function getLatestTaxYear(tables: USFederalTaxTables | undefined): string | null {
  if (!tables?.tax_brackets) return null;
  const years = Object.keys(tables.tax_brackets).filter(y => /^\d+$/.test(y));
  if (!years.length) return null;
  years.sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
  return years[years.length - 1];
}

export function VisualizationsPage() {
  const { data: scenarios, isLoading: scenariosLoading } = useSavedScenarios();
  const { data: taxConfig } = useTaxConfig();
  const { data: usTaxTables } = useUSFederalTaxTables();
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('');
  const [selectedChart, setSelectedChart] = useState<ChartKey>('income_sources');
  const [hoveredIncomeYear, setHoveredIncomeYear] = useState<number | null>(null);
  const [hoveredTaxYear, setHoveredTaxYear] = useState<number | null>(null);
  const [hoveredAssetYear, setHoveredAssetYear] = useState<number | null>(null);
  const [hoveredSpendingYear, setHoveredSpendingYear] = useState<number | null>(null);

  const { data: projection, isLoading: projectionLoading } =
    useScenarioProjection(selectedScenarioId);

  useEffect(() => {
    if (!selectedScenarioId && scenarios && scenarios.length > 0) {
      setSelectedScenarioId(scenarios[0].id);
    }
  }, [selectedScenarioId, scenarios]);

  const rows = projection?.projections ?? [];
  const filingStatus: FilingStatus = taxConfig?.filing_status ?? 'single';
  const latestTaxYear = getLatestTaxYear(usTaxTables);

  const taxBrackets = useMemo(() => {
    if (!latestTaxYear || !usTaxTables?.tax_brackets?.[latestTaxYear]?.[filingStatus]) return [];
    return usTaxTables.tax_brackets[latestTaxYear][filingStatus];
  }, [latestTaxYear, usTaxTables, filingStatus]);

  const incomeData = rows.map(r => {
    const socialSecurity = toNumber(r.social_security_income);
    const otherIncome = toNumber(r.other_income);
    const pretaxWithdrawal = toNumber(r.pretax_withdrawal);
    const taxableWithdrawal = toNumber(r.taxable_withdrawal);
    const cashWithdrawal = toNumber(r.cash_withdrawal);
    const rothWithdrawal = toNumber(r.roth_withdrawal);
    const total =
      socialSecurity +
      otherIncome +
      pretaxWithdrawal +
      taxableWithdrawal +
      cashWithdrawal +
      rothWithdrawal;
    return {
      year: r.calendar_year,
      socialSecurity,
      otherIncome,
      pretaxWithdrawal,
      taxableWithdrawal,
      cashWithdrawal,
      rothWithdrawal,
      total,
    };
  });
  const maxIncomeTotal = Math.max(1, ...incomeData.map(r => r.total));
  const hoveredIncome = incomeData.find(r => r.year === hoveredIncomeYear) ?? null;

  const taxData = rows.map(r => {
    const taxableIncome = toNumber(r.taxable_income);
    const federalTax = toNumber(r.federal_tax);
    const stateTax = toNumber(r.state_tax);
    const yearNum = toNumber(r.year);
    const inflationRate = toNumber(projection?.inflation_rate ?? '0');
    const bracketScale = Math.pow(1 + inflationRate / 100, Math.max(0, yearNum - 1));
    let bracketRate = 0;
    let nextBracketMin: number | null = null;
    for (let i = 0; i < taxBrackets.length; i += 1) {
      const b = taxBrackets[i];
      const scaledMin = b.min * bracketScale;
      const scaledMax = b.max == null ? null : b.max * bracketScale;
      const inBracket =
        scaledMax == null
          ? taxableIncome >= scaledMin
          : taxableIncome >= scaledMin && taxableIncome <= scaledMax;
      if (inBracket) {
        bracketRate = b.rate;
        if (i + 1 < taxBrackets.length) nextBracketMin = taxBrackets[i + 1].min * bracketScale;
        break;
      }
    }
    if (bracketRate === 0 && taxBrackets.length > 0) {
      // Fallback for edge rounding: use highest bracket if we didn't match earlier
      bracketRate = taxBrackets[taxBrackets.length - 1].rate;
      nextBracketMin = null;
    }
    const gapToNextBracket =
      nextBracketMin == null ? null : Math.max(0, nextBracketMin - taxableIncome);
    const stackTotal = taxableIncome + federalTax + stateTax + (gapToNextBracket ?? 0);
    return {
      year: r.calendar_year,
      taxableIncome,
      federalTax,
      stateTax,
      bracketRate,
      nextBracketMin,
      gapToNextBracket,
      cap: nextBracketMin ?? taxableIncome,
      stackTotal,
    };
  });
  const maxTaxCap = Math.max(
    1,
    ...taxData.map(r => r.cap + r.federalTax + r.stateTax),
    ...taxData.map(r => r.stackTotal)
  );
  const hoveredTax = taxData.find(r => r.year === hoveredTaxYear) ?? null;

  const assetData = rows.map(r => {
    const pretax = toNumber(r.pretax_ending_balance);
    const roth = toNumber(r.roth_ending_balance);
    const taxable = toNumber(r.taxable_ending_balance);
    const cash = toNumber(r.cash_ending_balance);
    const total = pretax + roth + taxable + cash;
    return { year: r.calendar_year, pretax, roth, taxable, cash, total };
  });
  const maxAssetTotal = Math.max(1, ...assetData.map(r => r.total));
  const hoveredAsset = assetData.find(r => r.year === hoveredAssetYear) ?? null;

  const spendingData = rows.map(r => {
    const monthlyAmount = toNumber(r.monthly_spending);
    const monthlyAnnualized = toNumber(r.monthly_spending) * 12;
    const lumpSum = toNumber(r.annual_lump_spending);
    const taxes = toNumber(r.total_tax);
    const loans = toNumber(r.fixed_spending);
    const annualExTaxes = Math.max(0, toNumber(r.total_spending) - taxes);
    const monthlyExTaxes = annualExTaxes / 12;
    const total = monthlyAnnualized + lumpSum + taxes + loans;
    return {
      year: r.calendar_year,
      monthlyAmount,
      monthlyAnnualized,
      monthlyExTaxes,
      annualExTaxes,
      lumpSum,
      taxes,
      loans,
      total,
    };
  });
  const maxSpendingTotal = Math.max(1, ...spendingData.map(r => r.total));
  const hoveredSpending = spendingData.find(r => r.year === hoveredSpendingYear) ?? null;
  const spendingStep = 24; // 20px bar + ~4px gap
  const spendingChartWidth = Math.max(1, spendingData.length * spendingStep);
  const spendingLinePoints = spendingData
    .map((row, idx) => {
      const x = idx * spendingStep + 10;
      const y = 100 - (row.annualExTaxes / maxSpendingTotal) * 100;
      return `${x},${Math.max(0, Math.min(100, y))}`;
    })
    .join(' ');

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-4xl font-bold text-gray-900">Visualizations</h1>
        <p className="text-gray-600 mt-2">
          Select a scenario and switch between key retirement charts.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Scenario</label>
            <select
              value={selectedScenarioId}
              onChange={e => setSelectedScenarioId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Select a scenario...</option>
              {(scenarios ?? []).map(s => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Chart</label>
            <select
              value={selectedChart}
              onChange={e => setSelectedChart(e.target.value as ChartKey)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="income_sources">Income Sources by Year</option>
              <option value="tax_bracket_gap">Taxable Income vs Next Bracket Gap</option>
              <option value="assets_by_account">Assets by Account Type</option>
              <option value="spending_breakdown">Spending Breakdown</option>
            </select>
          </div>
        </div>
      </div>

      {scenariosLoading ? (
        <div className="bg-white rounded-lg shadow-md p-6 text-gray-600">Loading scenarios...</div>
      ) : !selectedScenarioId ? (
        <div className="bg-gray-50 rounded-lg p-10 text-center text-gray-500">
          No saved scenarios found yet. Create a scenario first, then return here.
        </div>
      ) : projectionLoading ? (
        <div className="bg-white rounded-lg shadow-md p-6 text-gray-600">Loading projection...</div>
      ) : !projection || rows.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-10 text-center text-gray-500">
          No projection data is available for this scenario yet. Open `Scenarios`, run/save a
          scenario projection, then come back here.
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-6">
          {selectedChart === 'income_sources' && (
            <>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Income Sources by Year</h2>
              <p className="text-sm text-gray-600 mb-4">
                Stacked yearly total from Social Security, other income, and withdrawals.
              </p>
              <div className="h-64 flex items-end gap-1 overflow-x-auto pb-12">
                {incomeData.map(row => {
                  const ssH = (row.socialSecurity / maxIncomeTotal) * 100;
                  const otherH = (row.otherIncome / maxIncomeTotal) * 100;
                  const pretaxH = (row.pretaxWithdrawal / maxIncomeTotal) * 100;
                  const taxableH = (row.taxableWithdrawal / maxIncomeTotal) * 100;
                  const cashH = (row.cashWithdrawal / maxIncomeTotal) * 100;
                  const rothH = (row.rothWithdrawal / maxIncomeTotal) * 100;
                  return (
                    <div
                      key={row.year}
                      className="min-w-[16px] h-full flex-1 flex flex-col items-center justify-end"
                      title={`${row.year} • SS ${formatCurrency(
                        row.socialSecurity
                      )} • Other ${formatCurrency(row.otherIncome)} • Pretax W ${formatCurrency(
                        row.pretaxWithdrawal
                      )} • Taxable W ${formatCurrency(
                        row.taxableWithdrawal
                      )} • Cash W ${formatCurrency(row.cashWithdrawal)} • Roth W ${formatCurrency(
                        row.rothWithdrawal
                      )} • Total ${formatCurrency(row.total)}`}
                      onMouseEnter={() => setHoveredIncomeYear(row.year)}
                      onMouseLeave={() => setHoveredIncomeYear(null)}
                    >
                      <div className="w-full h-full rounded-t-sm overflow-hidden bg-gray-100 flex flex-col-reverse">
                        <div className={VIZ.roth} style={{ height: `${rothH}%` }} />
                        <div className={VIZ.cash} style={{ height: `${cashH}%` }} />
                        <div className={VIZ.taxable} style={{ height: `${taxableH}%` }} />
                        <div className={VIZ.pretax} style={{ height: `${pretaxH}%` }} />
                        <div className={VIZ.otherIncome} style={{ height: `${otherH}%` }} />
                        <div className={VIZ.socialSecurity} style={{ height: `${ssH}%` }} />
                      </div>
                      <span className="text-[10px] text-gray-500 mt-4 origin-top-left -rotate-45 whitespace-nowrap">
                        {row.year}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-gray-600">
                <span className="inline-flex items-center gap-1">
                  <span className={`inline-block h-2.5 w-2.5 rounded-sm ${VIZ.socialSecurity}`} />
                  Social Security
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className={`inline-block h-2.5 w-2.5 rounded-sm ${VIZ.otherIncome}`} />
                  Other Income
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className={`inline-block h-2.5 w-2.5 rounded-sm ${VIZ.pretax}`} />
                  Pretax Withdrawal
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className={`inline-block h-2.5 w-2.5 rounded-sm ${VIZ.taxable}`} />
                  Taxable Withdrawal
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className={`inline-block h-2.5 w-2.5 rounded-sm ${VIZ.cash}`} />
                  Cash Withdrawal
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className={`inline-block h-2.5 w-2.5 rounded-sm ${VIZ.roth}`} />
                  Roth Withdrawal
                </span>
              </div>
              <div className="mt-3 text-xs">
                {hoveredIncome ? (
                  <div className="rounded border border-gray-200 bg-gray-50 p-3 text-gray-700">
                    <div className="font-medium mb-1">Year {hoveredIncome.year} breakdown</div>
                    <div>Social Security: {formatCurrency(hoveredIncome.socialSecurity)}</div>
                    <div>Other Income: {formatCurrency(hoveredIncome.otherIncome)}</div>
                    <div>Pretax Withdrawal: {formatCurrency(hoveredIncome.pretaxWithdrawal)}</div>
                    <div>Taxable Withdrawal: {formatCurrency(hoveredIncome.taxableWithdrawal)}</div>
                    <div>Cash Withdrawal: {formatCurrency(hoveredIncome.cashWithdrawal)}</div>
                    <div>Roth Withdrawal: {formatCurrency(hoveredIncome.rothWithdrawal)}</div>
                    <div className="font-medium mt-1">
                      Total: {formatCurrency(hoveredIncome.total)}
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-500">Hover a bar to see the stack breakdown.</div>
                )}
              </div>
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-xs divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2 py-1 text-left">Year</th>
                      <th className="px-2 py-1 text-right">Social Security</th>
                      <th className="px-2 py-1 text-right">Other Income</th>
                      <th className="px-2 py-1 text-right">Pretax W</th>
                      <th className="px-2 py-1 text-right">Taxable W</th>
                      <th className="px-2 py-1 text-right">Cash W</th>
                      <th className="px-2 py-1 text-right">Roth W</th>
                      <th className="px-2 py-1 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {incomeData.map(row => (
                      <tr key={`income-${row.year}`}>
                        <td className="px-2 py-1">{row.year}</td>
                        <td className="px-2 py-1 text-right">
                          {formatCurrency(row.socialSecurity)}
                        </td>
                        <td className="px-2 py-1 text-right">{formatCurrency(row.otherIncome)}</td>
                        <td className="px-2 py-1 text-right">
                          {formatCurrency(row.pretaxWithdrawal)}
                        </td>
                        <td className="px-2 py-1 text-right">
                          {formatCurrency(row.taxableWithdrawal)}
                        </td>
                        <td className="px-2 py-1 text-right">
                          {formatCurrency(row.cashWithdrawal)}
                        </td>
                        <td className="px-2 py-1 text-right">
                          {formatCurrency(row.rothWithdrawal)}
                        </td>
                        <td className="px-2 py-1 text-right font-medium">
                          {formatCurrency(row.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {selectedChart === 'tax_bracket_gap' && (
            <>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                Taxable Income vs Next Bracket Gap
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Sky = taxable income, red = federal tax, rose = state tax, lime = room to next
                bracket, using {latestTaxYear ?? 'latest'} federal brackets for{' '}
                {filingStatus.replaceAll('_', ' ')}.
              </p>
              <div className="h-64 flex items-end gap-1 overflow-x-auto pb-12">
                {taxData.map(row => {
                  const taxableH = (row.taxableIncome / maxTaxCap) * 100;
                  const fedTaxH = (row.federalTax / maxTaxCap) * 100;
                  const stateTaxH = (row.stateTax / maxTaxCap) * 100;
                  const gapValue = row.gapToNextBracket ?? 0;
                  const gapH = (gapValue / maxTaxCap) * 100;
                  return (
                    <div
                      key={row.year}
                      className="min-w-[16px] h-full flex-1 flex flex-col items-center justify-end"
                      title={`${row.year} • Taxable ${formatCurrency(
                        row.taxableIncome
                      )} • Fed Tax ${formatCurrency(row.federalTax)} • Rate ${
                        row.bracketRate
                      }% • Gap ${
                        row.gapToNextBracket == null
                          ? 'Top bracket'
                          : formatCurrency(row.gapToNextBracket)
                      }`}
                      onMouseEnter={() => setHoveredTaxYear(row.year)}
                      onMouseLeave={() => setHoveredTaxYear(null)}
                    >
                      <div className="w-full h-full rounded-t-sm overflow-hidden bg-gray-100 flex flex-col-reverse">
                        <div className={VIZ.taxTaxableIncome} style={{ height: `${taxableH}%` }} />
                        <div className={VIZ.federalTax} style={{ height: `${fedTaxH}%` }} />
                        <div className={VIZ.stateTax} style={{ height: `${stateTaxH}%` }} />
                        <div className={VIZ.bracketGap} style={{ height: `${gapH}%` }} />
                      </div>
                      <span className="text-[10px] text-gray-500 mt-4 origin-top-left -rotate-45 whitespace-nowrap">
                        {row.year}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-gray-600">
                <span className="inline-flex items-center gap-1">
                  <span className={`inline-block h-2.5 w-2.5 rounded-sm ${VIZ.taxTaxableIncome}`} />
                  Taxable Income
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className={`inline-block h-2.5 w-2.5 rounded-sm ${VIZ.federalTax}`} />
                  Federal Tax
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className={`inline-block h-2.5 w-2.5 rounded-sm ${VIZ.stateTax}`} />
                  State Tax
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className={`inline-block h-2.5 w-2.5 rounded-sm ${VIZ.bracketGap}`} />
                  Gap to Next Bracket
                </span>
              </div>
              <div className="mt-3 text-xs">
                {hoveredTax ? (
                  <div className="rounded border border-gray-200 bg-gray-50 p-3 text-gray-700">
                    <div className="font-medium mb-1">Year {hoveredTax.year} breakdown</div>
                    <div>Taxable Income: {formatCurrency(hoveredTax.taxableIncome)}</div>
                    <div>Federal Tax: {formatCurrency(hoveredTax.federalTax)}</div>
                    <div>State Tax: {formatCurrency(hoveredTax.stateTax)}</div>
                    <div>Current Bracket: {hoveredTax.bracketRate}%</div>
                    <div>
                      Gap to Next Bracket:{' '}
                      {hoveredTax.gapToNextBracket == null
                        ? 'Top bracket'
                        : formatCurrency(hoveredTax.gapToNextBracket)}
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-500">Hover a bar to see the stack breakdown.</div>
                )}
              </div>
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-xs divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2 py-1 text-left">Year</th>
                      <th className="px-2 py-1 text-right">Taxable Income</th>
                      <th className="px-2 py-1 text-right">Federal Tax</th>
                      <th className="px-2 py-1 text-right">State Tax</th>
                      <th className="px-2 py-1 text-right">Bracket Rate</th>
                      <th className="px-2 py-1 text-right">Gap To Next Bracket</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {taxData.map(row => (
                      <tr key={`tax-${row.year}`}>
                        <td className="px-2 py-1">{row.year}</td>
                        <td className="px-2 py-1 text-right">
                          {formatCurrency(row.taxableIncome)}
                        </td>
                        <td className="px-2 py-1 text-right">{formatCurrency(row.federalTax)}</td>
                        <td className="px-2 py-1 text-right">{formatCurrency(row.stateTax)}</td>
                        <td className="px-2 py-1 text-right">{row.bracketRate}%</td>
                        <td className="px-2 py-1 text-right">
                          {row.gapToNextBracket == null
                            ? 'Top bracket'
                            : formatCurrency(row.gapToNextBracket)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {selectedChart === 'assets_by_account' && (
            <>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Assets by Account Type</h2>
              <p className="text-sm text-gray-600 mb-4">
                Year-end balances stacked by account type.
              </p>
              <div className="h-64 flex items-end gap-1 overflow-x-auto pb-12">
                {assetData.map(row => {
                  const pretaxH = (row.pretax / maxAssetTotal) * 100;
                  const rothH = (row.roth / maxAssetTotal) * 100;
                  const taxableH = (row.taxable / maxAssetTotal) * 100;
                  const cashH = (row.cash / maxAssetTotal) * 100;
                  return (
                    <div
                      key={row.year}
                      className="min-w-[16px] h-full flex-1 flex flex-col items-center justify-end"
                      title={`${row.year} • Pretax ${formatCurrency(
                        row.pretax
                      )} • Roth ${formatCurrency(row.roth)} • Taxable ${formatCurrency(
                        row.taxable
                      )} • Cash ${formatCurrency(row.cash)} • Total ${formatCurrency(row.total)}`}
                      onMouseEnter={() => setHoveredAssetYear(row.year)}
                      onMouseLeave={() => setHoveredAssetYear(null)}
                    >
                      <div className="w-full h-full rounded-t-sm overflow-hidden bg-gray-100 flex flex-col-reverse">
                        <div className={VIZ.cash} style={{ height: `${cashH}%` }} />
                        <div className={VIZ.taxable} style={{ height: `${taxableH}%` }} />
                        <div className={VIZ.roth} style={{ height: `${rothH}%` }} />
                        <div className={VIZ.pretax} style={{ height: `${pretaxH}%` }} />
                      </div>
                      <span className="text-[10px] text-gray-500 mt-4 origin-top-left -rotate-45 whitespace-nowrap">
                        {row.year}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-gray-600">
                <span className="inline-flex items-center gap-1">
                  <span className={`inline-block h-2.5 w-2.5 rounded-sm ${VIZ.pretax}`} />
                  Pretax
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className={`inline-block h-2.5 w-2.5 rounded-sm ${VIZ.roth}`} />
                  Roth
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className={`inline-block h-2.5 w-2.5 rounded-sm ${VIZ.taxable}`} />
                  Taxable
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className={`inline-block h-2.5 w-2.5 rounded-sm ${VIZ.cash}`} />
                  Cash
                </span>
                <span className="text-xs text-gray-600">
                  Max total: {formatCompactCurrency(maxAssetTotal)}
                </span>
              </div>
              <div className="mt-3 text-xs">
                {hoveredAsset ? (
                  <div className="rounded border border-gray-200 bg-gray-50 p-3 text-gray-700">
                    <div className="font-medium mb-1">Year {hoveredAsset.year} breakdown</div>
                    <div>Pretax: {formatCurrency(hoveredAsset.pretax)}</div>
                    <div>Roth: {formatCurrency(hoveredAsset.roth)}</div>
                    <div>Taxable: {formatCurrency(hoveredAsset.taxable)}</div>
                    <div>Cash: {formatCurrency(hoveredAsset.cash)}</div>
                    <div className="font-medium mt-1">
                      Total: {formatCurrency(hoveredAsset.total)}
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-500">Hover a bar to see the stack breakdown.</div>
                )}
              </div>
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-xs divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2 py-1 text-left">Year</th>
                      <th className="px-2 py-1 text-right">Pretax</th>
                      <th className="px-2 py-1 text-right">Roth</th>
                      <th className="px-2 py-1 text-right">Taxable</th>
                      <th className="px-2 py-1 text-right">Cash</th>
                      <th className="px-2 py-1 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {assetData.map(row => (
                      <tr key={`asset-${row.year}`}>
                        <td className="px-2 py-1">{row.year}</td>
                        <td className="px-2 py-1 text-right">{formatCurrency(row.pretax)}</td>
                        <td className="px-2 py-1 text-right">{formatCurrency(row.roth)}</td>
                        <td className="px-2 py-1 text-right">{formatCurrency(row.taxable)}</td>
                        <td className="px-2 py-1 text-right">{formatCurrency(row.cash)}</td>
                        <td className="px-2 py-1 text-right font-medium">
                          {formatCurrency(row.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {selectedChart === 'spending_breakdown' && (
            <>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Spending Breakdown</h2>
              <p className="text-sm text-gray-600 mb-4">
                Annualized spending components by year: monthly spending, lump sum, taxes, and
                loan/fixed expenses.
              </p>
              <div className="h-64 overflow-x-auto pb-12">
                <div className="relative h-full" style={{ width: `${spendingChartWidth}px` }}>
                  {spendingData.length > 1 && (
                    <svg
                      className="absolute inset-0 z-10 pointer-events-none"
                      viewBox={`0 0 ${spendingChartWidth} 100`}
                      preserveAspectRatio="none"
                    >
                      <polyline
                        points={spendingLinePoints}
                        fill="none"
                        stroke={VIZ.trendLine}
                        strokeWidth="1.5"
                      />
                    </svg>
                  )}
                  <div className="h-full flex items-end gap-1">
                    {spendingData.map(row => {
                      const monthlyH = (row.monthlyAnnualized / maxSpendingTotal) * 100;
                      const lumpH = (row.lumpSum / maxSpendingTotal) * 100;
                      const taxesH = (row.taxes / maxSpendingTotal) * 100;
                      const loansH = (row.loans / maxSpendingTotal) * 100;
                      return (
                        <div
                          key={row.year}
                          className="w-5 h-full flex flex-col items-center justify-end"
                          title={`${row.year} • Monthly ${formatCurrency(
                            row.monthlyAmount
                          )} • Monthly ex taxes ${formatCurrency(
                            row.monthlyExTaxes
                          )} • Annual ex taxes ${formatCurrency(
                            row.annualExTaxes
                          )} • Monthly x12 ${formatCurrency(
                            row.monthlyAnnualized
                          )} • Lump ${formatCurrency(row.lumpSum)} • Taxes ${formatCurrency(
                            row.taxes
                          )} • Loans/Fixed ${formatCurrency(row.loans)} • Total ${formatCurrency(
                            row.total
                          )}`}
                          onMouseEnter={() => setHoveredSpendingYear(row.year)}
                          onMouseLeave={() => setHoveredSpendingYear(null)}
                        >
                          <div className="w-full h-full rounded-t-sm overflow-hidden bg-gray-100 flex flex-col-reverse">
                            <div
                              className={VIZ.spendingMonthly}
                              style={{ height: `${monthlyH}%` }}
                            />
                            <div className={VIZ.spendingLump} style={{ height: `${lumpH}%` }} />
                            <div className={VIZ.spendingTaxes} style={{ height: `${taxesH}%` }} />
                            <div className={VIZ.spendingLoans} style={{ height: `${loansH}%` }} />
                          </div>
                          <span className="text-[10px] text-gray-500 mt-4 origin-top-left -rotate-45 whitespace-nowrap">
                            {row.year}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-gray-600">
                <span className="inline-flex items-center gap-1">
                  <span className={`inline-block h-2.5 w-2.5 rounded-sm ${VIZ.spendingMonthly}`} />
                  Monthly Spending (x12)
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className={`inline-block h-2.5 w-2.5 rounded-sm ${VIZ.spendingLump}`} />
                  Lump Sum
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className={`inline-block h-2.5 w-2.5 rounded-sm ${VIZ.spendingTaxes}`} />
                  Taxes
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className={`inline-block h-2.5 w-2.5 rounded-sm ${VIZ.spendingLoans}`} />
                  Loans / Fixed
                </span>
                <span className="inline-flex items-center gap-1">
                  <span
                    className="inline-block h-2.5 w-6 rounded-sm border border-gray-300"
                    style={{ backgroundColor: VIZ.trendLine }}
                  />
                  Yearly Spending Ex Taxes (line)
                </span>
              </div>
              <div className="mt-3 text-xs">
                {hoveredSpending ? (
                  <div className="rounded border border-gray-200 bg-gray-50 p-3 text-gray-700">
                    <div className="font-medium mb-1">Year {hoveredSpending.year} breakdown</div>
                    <div>Monthly Spending: {formatCurrency(hoveredSpending.monthlyAmount)}</div>
                    <div>Monthly Ex Taxes: {formatCurrency(hoveredSpending.monthlyExTaxes)}</div>
                    <div>
                      Annual Ex Taxes (line): {formatCurrency(hoveredSpending.annualExTaxes)}
                    </div>
                    <div>
                      Monthly Spending (x12): {formatCurrency(hoveredSpending.monthlyAnnualized)}
                    </div>
                    <div>Lump Sum: {formatCurrency(hoveredSpending.lumpSum)}</div>
                    <div>Taxes: {formatCurrency(hoveredSpending.taxes)}</div>
                    <div>Loans / Fixed: {formatCurrency(hoveredSpending.loans)}</div>
                    <div className="font-medium mt-1">
                      Total: {formatCurrency(hoveredSpending.total)}
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-500">Hover a bar to see the stack breakdown.</div>
                )}
              </div>
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-xs divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2 py-1 text-left">Year</th>
                      <th className="px-2 py-1 text-right">Monthly</th>
                      <th className="px-2 py-1 text-right">Monthly Ex Taxes</th>
                      <th className="px-2 py-1 text-right">Annual Ex Taxes (line)</th>
                      <th className="px-2 py-1 text-right">Monthly x12</th>
                      <th className="px-2 py-1 text-right">Lump Sum</th>
                      <th className="px-2 py-1 text-right">Taxes</th>
                      <th className="px-2 py-1 text-right">Loans / Fixed</th>
                      <th className="px-2 py-1 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {spendingData.map(row => (
                      <tr key={`spending-${row.year}`}>
                        <td className="px-2 py-1">{row.year}</td>
                        <td className="px-2 py-1 text-right">
                          {formatCurrency(row.monthlyAmount)}
                        </td>
                        <td className="px-2 py-1 text-right">
                          {formatCurrency(row.monthlyExTaxes)}
                        </td>
                        <td className="px-2 py-1 text-right">
                          {formatCurrency(row.annualExTaxes)}
                        </td>
                        <td className="px-2 py-1 text-right">
                          {formatCurrency(row.monthlyAnnualized)}
                        </td>
                        <td className="px-2 py-1 text-right">{formatCurrency(row.lumpSum)}</td>
                        <td className="px-2 py-1 text-right">{formatCurrency(row.taxes)}</td>
                        <td className="px-2 py-1 text-right">{formatCurrency(row.loans)}</td>
                        <td className="px-2 py-1 text-right font-medium">
                          {formatCurrency(row.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
