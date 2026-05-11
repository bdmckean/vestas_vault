import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from 'react-query';
import {
  useSavedScenarios,
  useCreateSavedScenario,
  useUpdateSavedScenario,
  useDeleteSavedScenario,
  useDuplicateSavedScenario,
  useScenarioProjection,
  useCompareScenarios,
  useCreateOrUpdateDefaultScenario,
} from '../hooks/useSavedScenarios';
import {
  useFixedExpenses,
  useAllFixedExpenses,
  useCreateFixedExpense,
  useUpdateFixedExpense,
  useDeleteFixedExpense,
} from '../hooks/useFixedExpenses';
import { useSocialSecurity } from '../hooks/useSocialSecurity';
import { useAccounts } from '../hooks/useAccounts';
import type {
  SavedScenario,
  SavedScenarioCreate,
  AssetAllocation,
  ScenarioProjectionResult,
  ScenarioComparisonResult,
} from '../types/saved_scenario';
import type { FixedExpense, FixedExpenseCreate } from '../types/fixed_expense';
import { DEFAULT_ASSET_ALLOCATION } from '../types/saved_scenario';

/** FastAPI may return `detail` as a string, object, or list of validation errors */
function formatApiError(err: unknown, fallback: string): string {
  const ax = err as { response?: { data?: { detail?: unknown } }; message?: string };
  const d = ax.response?.data?.detail;
  if (typeof d === 'string') return d;
  if (Array.isArray(d)) {
    return d
      .map((item: unknown) => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object' && 'msg' in item) {
          return String((item as { msg: string }).msg);
        }
        return JSON.stringify(item);
      })
      .join(' ');
  }
  if (d && typeof d === 'object') return JSON.stringify(d);
  if (ax.message) return ax.message;
  return fallback;
}

export function ScenarioModelingPage() {
  const queryClient = useQueryClient();
  const { data: scenarios, isLoading } = useSavedScenarios();
  const { data: ssConfig, isLoading: ssLoading } = useSocialSecurity();
  const { data: accounts, isLoading: accountsLoading } = useAccounts();
  const { data: allFixedExpenses } = useAllFixedExpenses(); // Get all fixed expenses for calculating totals
  const createMutation = useCreateSavedScenario();
  const updateMutation = useUpdateSavedScenario();
  const deleteMutation = useDeleteSavedScenario();
  const duplicateMutation = useDuplicateSavedScenario();
  const compareMutation = useCompareScenarios();
  const createDefaultMutation = useCreateOrUpdateDefaultScenario();

  // Helper to calculate total monthly spending (base + fixed expenses) for a scenario
  const calculateTotalMonthlySpending = (scenario: SavedScenario): number => {
    const baseMonthly = parseFloat(scenario.monthly_spending || '0');
    const scenarioFixedExpenses =
      allFixedExpenses?.filter(fe => fe.scenario_id === scenario.id) || [];
    const fixedMonthly = scenarioFixedExpenses.reduce((sum, fe) => {
      // Only count expenses that are active in year 1 (current year) of the projection
      if (fe.start_year <= 1 && (!fe.end_year || fe.end_year >= 1)) {
        return sum + parseFloat(fe.monthly_amount || '0');
      }
      return sum;
    }, 0);
    return baseMonthly + fixedMonthly;
  };

  // Helper to get fixed expenses count for a scenario
  const getFixedExpensesCount = (scenarioId: string): number => {
    return allFixedExpenses?.filter(fe => fe.scenario_id === scenarioId).length || 0;
  };

  const [showForm, setShowForm] = useState(false);
  const [editingScenario, setEditingScenario] = useState<SavedScenario | null>(null);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [comparisonResult, setComparisonResult] = useState<ScenarioComparisonResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [remainingStockTargetKey, setRemainingStockTargetKey] =
    useState<keyof AssetAllocation>('total_us_stock');
  /** While editing "% within stocks bucket", keep raw string so typing isn't overwritten by float math */
  const [stockWithinPctDrafts, setStockWithinPctDrafts] = useState<Record<string, string>>({});

  // Fixed expenses
  const {
    data: fixedExpenses,
    isLoading: fixedExpensesLoading,
    refetch: refetchFixedExpenses,
    error: fixedExpensesError,
  } = useFixedExpenses(editingScenario?.id);
  const createFixedExpenseMutation = useCreateFixedExpense();
  const updateFixedExpenseMutation = useUpdateFixedExpense();
  const deleteFixedExpenseMutation = useDeleteFixedExpense();

  // Debug logging
  useEffect(() => {
    console.log('editingScenario changed:', editingScenario?.id, editingScenario?.name);
    console.log('fixedExpenses:', fixedExpenses);
    console.log('fixedExpensesLoading:', fixedExpensesLoading);
    console.log('fixedExpensesError:', fixedExpensesError);
  }, [editingScenario?.id, fixedExpenses, fixedExpensesLoading, fixedExpensesError]);

  // Refetch fixed expenses when editingScenario changes
  useEffect(() => {
    if (editingScenario?.id) {
      console.log('Refetching fixed expenses for scenario:', editingScenario.id);
      refetchFixedExpenses();
    }
  }, [editingScenario?.id, refetchFixedExpenses]);
  const [newExpense, setNewExpense] = useState({ name: '', monthly_amount: '', end_year: '' });
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<SavedScenarioCreate>({
    name: '',
    description: '',
    ss_start_age_years: 67,
    ss_start_age_months: 0,
    spouse_ss_start_age_years: null,
    spouse_ss_start_age_months: null,
    monthly_spending: '10000',
    annual_lump_spending: '0',
    additional_other_income_annual: '0',
    inflation_adjusted_percent: '50',
    spending_reduction_percent: '0',
    spending_reduction_start_year: null,
    projection_years: 35,
    asset_allocation: DEFAULT_ASSET_ALLOCATION,
    return_source: '10_year_projections',
    custom_return_percent: null,
    inflation_rate: '2.5',
    use_bucket_strategy: false,
    bucket_strategy_type: 'A',
    bucket_1_years: 3,
    bucket_2_years: 4,
    rebalancing_threshold: '5.0',
    recovery_threshold_pct: '100',
  });

  // Selected scenario projection
  const {
    data: projection,
    isLoading: projectionLoading,
    error: projectionError,
  } = useScenarioProjection(selectedScenarioId || '');

  // Auto-create/update default scenario when prerequisites are met
  useEffect(() => {
    const hasSSConfig = ssConfig && ssConfig.birth_date && ssConfig.fra_monthly_amount;
    const hasAccounts = accounts && accounts.length > 0;

    if (!isLoading && !ssLoading && !accountsLoading && hasSSConfig && hasAccounts) {
      // Check if default scenario exists
      const hasDefaultScenario = scenarios?.some(s => s.name === 'Default Scenario');

      // Create or update default scenario if it doesn't exist or if data has changed
      if (!hasDefaultScenario && !createDefaultMutation.isLoading) {
        createDefaultMutation.mutate(undefined, {
          onError: (err: any) => {
            // Silently fail - user can manually create scenarios
            console.warn('Could not create default scenario:', err);
          },
        });
      }
    }
  }, [isLoading, ssLoading, accountsLoading, ssConfig, accounts, scenarios, createDefaultMutation]);

  const formatCurrency = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value || '0') : value;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const formatCompactCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  };

  const accountBalanceChartData = (projection?.projections ?? []).map(p => {
    const pretax = parseFloat(String(p.pretax_ending_balance || '0'));
    const roth = parseFloat(String(p.roth_ending_balance || '0'));
    const taxable = parseFloat(String(p.taxable_ending_balance || '0'));
    const cash = parseFloat(String(p.cash_ending_balance || '0'));
    const total = pretax + roth + taxable + cash;
    return { year: p.calendar_year, pretax, roth, taxable, cash, total };
  });
  const maxAccountTotal = Math.max(
    1,
    ...accountBalanceChartData.map(row => (Number.isFinite(row.total) ? row.total : 0))
  );

  // Convert projection year to calendar year (projection year 1 = current year)
  const projectionYearToCalendarYear = (projectionYear: number): number => {
    const currentYear = new Date().getFullYear();
    return currentYear + projectionYear - 1;
  };

  const resetForm = () => {
    setStockWithinPctDrafts({});
    setFormData({
      name: '',
      description: '',
      ss_start_age_years: 67,
      ss_start_age_months: 0,
      monthly_spending: '10000',
      annual_lump_spending: '0',
      additional_other_income_annual: '0',
      inflation_adjusted_percent: '50',
      spending_reduction_percent: '0',
      spending_reduction_start_year: null,
      projection_years: 35,
      asset_allocation: DEFAULT_ASSET_ALLOCATION,
      return_source: '10_year_projections',
      custom_return_percent: null,
      inflation_rate: '2.5',
      use_bucket_strategy: false,
      bucket_strategy_type: 'A',
      bucket_1_years: 3,
      bucket_2_years: 4,
      rebalancing_threshold: '5.0',
      recovery_threshold_pct: '100',
    });
    setEditingScenario(null);
    setShowForm(false);
    setError(null);
  };

  // Allow keyboard dismissal for the scenario modal.
  useEffect(() => {
    if (!showForm) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        resetForm();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showForm]);

  const handleEdit = (scenario: SavedScenario) => {
    setStockWithinPctDrafts({});
    setEditingScenario(scenario);
    setFormData({
      name: scenario.name,
      description: scenario.description || '',
      ss_start_age_years: scenario.ss_start_age_years,
      ss_start_age_months: scenario.ss_start_age_months,
      spouse_ss_start_age_years: scenario.spouse_ss_start_age_years ?? null,
      spouse_ss_start_age_months: scenario.spouse_ss_start_age_months ?? null,
      monthly_spending: scenario.monthly_spending,
      annual_lump_spending: scenario.annual_lump_spending,
      additional_other_income_annual: scenario.additional_other_income_annual ?? '0',
      inflation_adjusted_percent: scenario.inflation_adjusted_percent,
      spending_reduction_percent: scenario.spending_reduction_percent,
      spending_reduction_start_year: scenario.spending_reduction_start_year,
      projection_years: scenario.projection_years,
      asset_allocation: scenario.asset_allocation,
      return_source:
        scenario.return_source === 'ten_year_projections'
          ? '10_year_projections'
          : scenario.return_source,
      custom_return_percent: scenario.custom_return_percent,
      inflation_rate: scenario.inflation_rate,
      use_bucket_strategy: scenario.use_bucket_strategy || false,
      bucket_strategy_type: scenario.bucket_strategy_type || 'A',
      bucket_1_years: scenario.bucket_1_years ?? (scenario.bucket_strategy_type === 'B' ? 1 : 3),
      bucket_2_years: scenario.bucket_2_years ?? (scenario.bucket_strategy_type === 'B' ? 5 : 4),
      rebalancing_threshold: scenario.rebalancing_threshold || '5.0',
      recovery_threshold_pct: scenario.recovery_threshold_pct ?? '100',
    });
    setShowForm(true);
    setError(null);
    setSuccess(null);
    // Refetch fixed expenses when editing a scenario
    queryClient.invalidateQueries(['fixed-expenses', scenario.id]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!formData.name.trim()) {
      setError('Please enter a scenario name');
      return;
    }

    // When bucket strategy is on, use normalized allocation so stock allocations sum to available %
    let dataToSubmit = formData;
    if (formData.use_bucket_strategy && accounts?.length) {
      const normalized = computeBucketAllocation(accounts, formData);
      if (normalized) {
        dataToSubmit = {
          ...formData,
          asset_allocation: { ...formData.asset_allocation, ...normalized },
        };
      }
    }

    // Validate allocation sums to 100
    const allocTotal = Object.values(dataToSubmit.asset_allocation).reduce(
      (sum, val) => sum + parseFloat(val || '0'),
      0
    );
    // Bucket strategy recomputes many lines with .toFixed(2); sum can be 99.9–100.1
    const allocTolerance = dataToSubmit.use_bucket_strategy ? 0.55 : 0.01;
    if (Math.abs(allocTotal - 100) > allocTolerance) {
      setError(`Asset allocation must sum to 100% (currently ${allocTotal.toFixed(2)}%)`);
      return;
    }

    try {
      if (editingScenario) {
        await updateMutation.mutateAsync({ id: editingScenario.id, data: dataToSubmit });
        setSuccess('Scenario updated successfully');
      } else {
        await createMutation.mutateAsync(dataToSubmit);
        setSuccess('Scenario created successfully');
      }
      resetForm();
    } catch (err: unknown) {
      setError(formatApiError(err, 'Error saving scenario'));
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this scenario?')) return;
    try {
      await deleteMutation.mutateAsync(id);
      if (selectedScenarioId === id) {
        setSelectedScenarioId(null);
      }
      setSuccess('Scenario deleted');
    } catch (err: unknown) {
      setError(formatApiError(err, 'Error deleting scenario'));
    }
  };

  const handleDuplicate = async (id: string, name: string) => {
    const newName = prompt('Name for the duplicated scenario:', `${name} (copy)`);
    if (!newName) return;
    try {
      const newScenario = await duplicateMutation.mutateAsync({ id, newName });
      setSuccess('Scenario duplicated with all loans and settings');
      // Refresh fixed expenses to show the copied ones
      queryClient.invalidateQueries('fixed-expenses');
    } catch (err: unknown) {
      setError(formatApiError(err, 'Error duplicating scenario'));
    }
  };

  const handleCompare = async () => {
    if (compareIds.length < 2) {
      setError('Select at least 2 scenarios to compare');
      return;
    }
    try {
      const result = await compareMutation.mutateAsync(compareIds);
      setComparisonResult(result);
    } catch (err: unknown) {
      setError(formatApiError(err, 'Error comparing scenarios'));
    }
  };

  const toggleCompare = (id: string) => {
    setCompareIds(prev => (prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]));
  };

  const STOCK_ALLOCATION_KEYS: (keyof AssetAllocation)[] = [
    'total_us_stock',
    'total_foreign_stock',
    'us_small_cap_value',
    'international_small_cap_value',
    'developed_markets',
    'emerging_markets',
    'reits',
    'other',
  ];
  const STOCK_ALLOCATION_OPTIONS: { key: keyof AssetAllocation; label: string }[] = [
    { key: 'total_us_stock', label: 'Total US (VTI)' },
    { key: 'us_small_cap_value', label: 'Small Cap Value (VBR)' },
    { key: 'total_foreign_stock', label: 'Total Intl (VXUS)' },
    { key: 'international_small_cap_value', label: 'Intl Small Cap (VSS)' },
    { key: 'developed_markets', label: 'Developed (VEA)' },
    { key: 'emerging_markets', label: 'Emerging (VWO)' },
    { key: 'reits', label: 'REITs (VNQ)' },
    { key: 'other', label: 'Other' },
  ];

  // Bucket-derived percentages for display when bucket strategy is on (same formula as computeBucketAllocation).
  const bucketBreakdown = ((): {
    cashPct: number;
    bondPct: number;
    stockAvailablePct: number;
  } | null => {
    if (!formData.use_bucket_strategy || !accounts?.length) return null;
    const totalPortfolio = accounts.reduce((s, a) => s + parseFloat(String(a.balance || '0')), 0);
    if (totalPortfolio <= 0) return null;
    const annualSpending =
      parseFloat(String(formData.monthly_spending || '0')) * 12 +
      parseFloat(String(formData.annual_lump_spending || '0'));
    const b1 = formData.bucket_1_years ?? ((formData.bucket_strategy_type || 'A') === 'B' ? 1 : 3);
    const b2 = formData.bucket_2_years ?? ((formData.bucket_strategy_type || 'A') === 'B' ? 5 : 4);
    const isB = (formData.bucket_strategy_type || 'A') === 'B';
    let cashPct = ((b1 * annualSpending) / totalPortfolio) * 100;
    let bondPct = ((isB ? b2 * annualSpending : 0.5 * b2 * annualSpending) / totalPortfolio) * 100;
    if (cashPct + bondPct > 100) {
      const scale = 100 / (cashPct + bondPct);
      cashPct *= scale;
      bondPct *= scale;
    }
    const stockAvailablePct = Math.max(0, 100 - cashPct - bondPct);
    return { cashPct, bondPct, stockAvailablePct };
  })();

  const stockAllocationSum = STOCK_ALLOCATION_KEYS.reduce(
    (s, k) => s + parseFloat(String(formData.asset_allocation[k] || '0')),
    0
  );
  const stockRemainingPct = bucketBreakdown
    ? Math.max(0, bucketBreakdown.stockAvailablePct - stockAllocationSum)
    : 0;

  // Compute cash/bond % from bucket years and spending when bucket strategy is on. Returns null if not applicable.
  const computeBucketAllocation = (
    accts: { balance: string }[] | undefined,
    data: SavedScenarioCreate
  ): Partial<AssetAllocation> | null => {
    if (!data.use_bucket_strategy || !accts?.length) return null;
    const totalPortfolio = accts.reduce((s, a) => s + parseFloat(String(a.balance || '0')), 0);
    if (totalPortfolio <= 0) return null;
    const annualSpending =
      parseFloat(String(data.monthly_spending || '0')) * 12 +
      parseFloat(String(data.annual_lump_spending || '0'));
    const b1 = data.bucket_1_years ?? ((data.bucket_strategy_type || 'A') === 'B' ? 1 : 3);
    const b2 = data.bucket_2_years ?? ((data.bucket_strategy_type || 'A') === 'B' ? 5 : 4);
    const isB = (data.bucket_strategy_type || 'A') === 'B';
    const cashDollars = b1 * annualSpending;
    const bondDollars = isB ? b2 * annualSpending : 0.5 * b2 * annualSpending;
    let cashPct = (cashDollars / totalPortfolio) * 100;
    let bondPct = (bondDollars / totalPortfolio) * 100;
    if (cashPct + bondPct > 100) {
      const scale = 100 / (cashPct + bondPct);
      cashPct *= scale;
      bondPct *= scale;
    }
    const stockRemainderPct = Math.max(0, 100 - cashPct - bondPct);
    const currentStockTotal = STOCK_ALLOCATION_KEYS.reduce(
      (s, k) => s + parseFloat(String(data.asset_allocation[k] || '0')),
      0
    );
    const factor = currentStockTotal > 0 ? stockRemainderPct / currentStockTotal : 1;
    const newAlloc: Partial<AssetAllocation> = {
      cash: String(cashPct.toFixed(2)),
      bonds: String(bondPct.toFixed(2)),
      short_term_treasuries: '0',
      intermediate_term_treasuries: '0',
      municipal_bonds: '0',
    };
    STOCK_ALLOCATION_KEYS.forEach(k => {
      const v = parseFloat(String(data.asset_allocation[k] || '0'));
      (newAlloc as AssetAllocation)[k] = String((v * factor).toFixed(2));
    });
    return newAlloc;
  };

  // When bucket strategy is on, set cash and bond % from (bucket years × annual spending) / total portfolio
  useEffect(() => {
    const newAlloc = computeBucketAllocation(accounts ?? undefined, formData);
    if (!newAlloc) return;
    setFormData(prev => ({
      ...prev,
      asset_allocation: { ...prev.asset_allocation, ...newAlloc },
    }));
  }, [
    formData.use_bucket_strategy,
    formData.bucket_1_years,
    formData.bucket_2_years,
    formData.bucket_strategy_type,
    formData.monthly_spending,
    formData.annual_lump_spending,
    accounts,
  ]);

  const handleAllocationChange = (key: keyof AssetAllocation, value: string) => {
    // Only update the field being edited. Do not rescale other stock lines on every change —
    // that caused confusing jumps while typing. When bucket strategy is on, save still
    // normalizes stock totals via computeBucketAllocation (preserves your mix vs. target %).
    const next = { ...formData.asset_allocation, [key]: value };
    setFormData({ ...formData, asset_allocation: next });
  };

  const formatWithinStockPctDisplay = (fieldKey: keyof AssetAllocation): string => {
    if (!bucketBreakdown || bucketBreakdown.stockAvailablePct <= 0) return '0';
    const abs = parseFloat(String(formData.asset_allocation[fieldKey] || '0'));
    const w = (abs / bucketBreakdown.stockAvailablePct) * 100;
    if (!Number.isFinite(w)) return '0';
    return (Math.round(w * 100) / 100).toString();
  };

  const commitWithinStockPctDraft = (fieldKey: keyof AssetAllocation) => {
    if (!bucketBreakdown || bucketBreakdown.stockAvailablePct <= 0) return;
    const id = fieldKey as string;
    const raw = (stockWithinPctDrafts[id] ?? formatWithinStockPctDisplay(fieldKey)).trim();
    setStockWithinPctDrafts(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    if (raw === '' || raw === '-' || raw === '.' || raw === '-.') {
      handleAllocationChange(fieldKey, '0');
      return;
    }
    const within = parseFloat(raw);
    if (Number.isNaN(within)) return;
    const abs = (within / 100) * bucketBreakdown.stockAvailablePct;
    handleAllocationChange(fieldKey, abs.toFixed(2));
  };

  useEffect(() => {
    if (!formData.use_bucket_strategy) setStockWithinPctDrafts({});
  }, [formData.use_bucket_strategy]);

  useEffect(() => {
    setStockWithinPctDrafts({});
  }, [
    formData.monthly_spending,
    formData.annual_lump_spending,
    formData.bucket_1_years,
    formData.bucket_2_years,
    formData.bucket_strategy_type,
    accounts,
  ]);

  const handleAddRemainingStockAllocation = () => {
    if (!bucketBreakdown) return;
    const remaining = Math.max(0, bucketBreakdown.stockAvailablePct - stockAllocationSum);
    if (remaining <= 0) return;
    const current = parseFloat(String(formData.asset_allocation[remainingStockTargetKey] || '0'));
    const updated = current + remaining;
    setFormData({
      ...formData,
      asset_allocation: {
        ...formData.asset_allocation,
        [remainingStockTargetKey]: updated.toFixed(2),
      },
    });
  };

  if (isLoading || ssLoading || accountsLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">Loading scenarios...</div>
      </div>
    );
  }

  // Check prerequisites
  const hasSSConfig = ssConfig && ssConfig.birth_date && ssConfig.fra_monthly_amount;
  const hasAccounts = accounts && accounts.length > 0;
  const missingPrereqs = !hasSSConfig || !hasAccounts;

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Scenario Modeling</h1>
          <p className="text-gray-600 mt-2">
            Create and compare retirement scenarios with different SS timing and spending levels.
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Other Income is global. Edit it on the{' '}
            <Link to="/other-income" className="underline">
              Other Income
            </Link>{' '}
            page and scenario projections will update automatically.
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          disabled={missingPrereqs}
          className={`px-4 py-2 rounded-md font-medium ${
            missingPrereqs
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          + New Scenario
        </button>
      </div>

      {/* Prerequisites Warning */}
      {missingPrereqs && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-amber-800 mb-3">
            Setup Required Before Creating Scenarios
          </h2>
          <p className="text-amber-700 mb-4">
            To model retirement scenarios, the following data must be configured first:
          </p>
          <ul className="space-y-3">
            <li className="flex items-center">
              {hasSSConfig ? (
                <span className="text-green-600 mr-2">✓</span>
              ) : (
                <span className="text-red-500 mr-2">✗</span>
              )}
              <span className={hasSSConfig ? 'text-green-700' : 'text-amber-800'}>
                <strong>Social Security Configuration</strong> - Birth date and FRA benefit amount
              </span>
              {!hasSSConfig && (
                <Link
                  to="/social-security"
                  className="ml-3 text-blue-600 hover:text-blue-800 underline text-sm"
                >
                  Configure →
                </Link>
              )}
            </li>
            <li className="flex items-center">
              {hasAccounts ? (
                <span className="text-green-600 mr-2">✓</span>
              ) : (
                <span className="text-red-500 mr-2">✗</span>
              )}
              <span className={hasAccounts ? 'text-green-700' : 'text-amber-800'}>
                <strong>Investment Accounts</strong> - At least one account with holdings
              </span>
              {!hasAccounts && (
                <Link
                  to="/accounts"
                  className="ml-3 text-blue-600 hover:text-blue-800 underline text-sm"
                >
                  Add Accounts →
                </Link>
              )}
            </li>
          </ul>
          <p className="text-amber-600 text-sm mt-4">
            Optional: Configure{' '}
            <Link to="/other-income" className="underline">
              Other Income
            </Link>
            ,{' '}
            <Link to="/spending" className="underline">
              Planned Spending
            </Link>
            , and{' '}
            <Link to="/taxes" className="underline">
              Tax Settings
            </Link>{' '}
            for more accurate projections.
          </p>
        </div>
      )}

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scenarios List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Saved Scenarios</h2>
            {compareIds.length >= 2 && (
              <button
                onClick={handleCompare}
                className="text-sm bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700"
              >
                Compare ({compareIds.length})
              </button>
            )}
          </div>

          {scenarios && scenarios.length > 0 ? (
            <div className="space-y-3">
              {/* Sort scenarios: Default Scenario first, then others */}
              {[...scenarios]
                .sort((a, b) => {
                  if (a.name === 'Default Scenario') return -1;
                  if (b.name === 'Default Scenario') return 1;
                  return 0;
                })
                .map(scenario => {
                  const isDefault = scenario.name === 'Default Scenario';
                  return (
                    <div
                      key={scenario.id}
                      className={`bg-white rounded-lg shadow p-4 cursor-pointer transition ${
                        selectedScenarioId === scenario.id ? 'ring-2 ring-blue-500' : ''
                      } ${isDefault ? 'border-l-4 border-blue-500' : ''}`}
                      onClick={() => setSelectedScenarioId(scenario.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={compareIds.includes(scenario.id)}
                            onChange={e => {
                              e.stopPropagation();
                              toggleCompare(scenario.id);
                            }}
                            className="h-4 w-4 text-purple-600 rounded"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-gray-900">{scenario.name}</h3>
                              {isDefault && (
                                <span className="text-xs font-normal text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                                  Auto-generated
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500">
                              SS @ {scenario.ss_start_age_years}y {scenario.ss_start_age_months}m |{' '}
                              {formatCurrency(calculateTotalMonthlySpending(scenario))}/mo
                              {getFixedExpensesCount(scenario.id) > 0 && (
                                <span className="text-xs text-gray-400 ml-1">
                                  (incl. {getFixedExpensesCount(scenario.id)} loan
                                  {getFixedExpensesCount(scenario.id) !== 1 ? 's' : ''})
                                </span>
                              )}
                            </p>
                            {isDefault && (
                              <p className="text-xs text-gray-400 mt-1">
                                Based on your current Accounts, SS, Spending, and Portfolio. Click
                                "Refresh" to update with latest loans from Spending page.
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {isDefault && (
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                createDefaultMutation.mutate(undefined, {
                                  onSuccess: updatedScenario => {
                                    setSuccess(
                                      'Default scenario updated from current configuration'
                                    );
                                    // Always invalidate fixed expenses for the default scenario
                                    queryClient.invalidateQueries([
                                      'fixed-expenses',
                                      updatedScenario.id,
                                    ]);
                                    // If we're currently editing this scenario, refetch immediately
                                    if (editingScenario?.id === updatedScenario.id) {
                                      refetchFixedExpenses();
                                    }
                                    // Update editingScenario if it's the default scenario
                                    if (editingScenario?.id === updatedScenario.id) {
                                      setEditingScenario(updatedScenario);
                                    }
                                  },
                                  onError: (err: unknown) => {
                                    setError(
                                      formatApiError(err, 'Error updating default scenario')
                                    );
                                  },
                                });
                              }}
                              className="text-purple-600 hover:text-purple-800 text-xs font-medium"
                              title="Regenerate from current configuration (includes loans from Spending page)"
                            >
                              Refresh
                            </button>
                          )}
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              handleEdit(scenario);
                            }}
                            className="text-blue-600 hover:text-blue-800 text-xs"
                          >
                            Edit
                          </button>
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              handleDuplicate(scenario.id, scenario.name);
                            }}
                            className="text-green-600 hover:text-green-800 text-xs"
                          >
                            Copy
                          </button>
                          {!isDefault && (
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                handleDelete(scenario.id);
                              }}
                              className="text-red-600 hover:text-red-800 text-xs"
                            >
                              Del
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <div className="text-gray-400 text-5xl mb-4">📊</div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">No Scenarios Yet</h3>
              {missingPrereqs ? (
                <p className="text-gray-500">
                  Complete the setup requirements above, then create your first scenario.
                </p>
              ) : (
                <p className="text-gray-500">
                  Click "+ New Scenario" to create your first retirement projection.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Projection Results */}
        <div className="lg:col-span-2">
          {comparisonResult ? (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Scenario Comparison</h2>
                <button
                  onClick={() => setComparisonResult(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕ Close
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Scenario
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                        SS Start
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                        Final Portfolio
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                        Years to Depletion
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                        Total SS
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {comparisonResult.scenarios.map(s => (
                      <tr key={s.scenario_name} className="hover:bg-gray-50">
                        <td className="px-4 py-2 font-medium">{s.scenario_name}</td>
                        <td className="px-4 py-2 text-right">{s.ss_start_age}</td>
                        <td className="px-4 py-2 text-right font-medium">
                          {formatCurrency(s.final_portfolio)}
                        </td>
                        <td className="px-4 py-2 text-right">
                          {s.years_until_depletion || 'Never'}
                        </td>
                        <td className="px-4 py-2 text-right">
                          {formatCurrency(s.total_ss_received)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : selectedScenarioId && projectionError ? (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Configuration Required</h2>
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded">
                <p className="font-medium">Unable to generate projection</p>
                <p className="mt-1 text-sm">
                  {(projectionError as any)?.response?.data?.detail ||
                    'Please configure Social Security settings (birth date and FRA amount) before generating projections.'}
                </p>
                <Link
                  to="/social-security"
                  className="inline-block mt-3 text-blue-600 hover:text-blue-800 font-medium text-sm"
                >
                  Go to Social Security Settings →
                </Link>
              </div>
            </div>
          ) : selectedScenarioId && projection ? (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {projection.scenario_name} Projection
              </h2>

              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Initial Portfolio</div>
                  <div className="text-xl font-bold text-blue-600">
                    {formatCurrency(projection.initial_portfolio)}
                  </div>
                </div>
                <div
                  className={`p-4 rounded-lg ${
                    parseFloat(projection.final_portfolio) > 0 ? 'bg-green-50' : 'bg-red-50'
                  }`}
                >
                  <div className="text-sm text-gray-600">Final Portfolio</div>
                  <div
                    className={`text-xl font-bold ${
                      parseFloat(projection.final_portfolio) > 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {formatCurrency(projection.final_portfolio)}
                  </div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">SS Start Age</div>
                  <div className="text-xl font-bold text-purple-600">{projection.ss_start_age}</div>
                </div>
                <div
                  className={`p-4 rounded-lg ${
                    projection.years_until_depletion ? 'bg-orange-50' : 'bg-gray-50'
                  }`}
                >
                  <div className="text-sm text-gray-600">Depletion</div>
                  <div
                    className={`text-xl font-bold ${
                      projection.years_until_depletion ? 'text-orange-600' : 'text-gray-600'
                    }`}
                  >
                    {projection.years_until_depletion
                      ? `Year ${projection.years_until_depletion}`
                      : 'Never'}
                  </div>
                </div>
              </div>

              {/* Account type segregation: initial vs final */}
              {(projection.initial_pretax != null || projection.final_pretax != null) && (
                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-xs font-medium text-gray-500 mb-1">
                      Initial by account type
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                      <span className="text-blue-600">
                        P: {formatCurrency(projection.initial_pretax ?? '0')}
                      </span>
                      <span className="text-green-600">
                        R: {formatCurrency(projection.initial_roth ?? '0')}
                      </span>
                      <span className="text-purple-600">
                        T: {formatCurrency(projection.initial_taxable ?? '0')}
                      </span>
                      <span className="text-gray-600">
                        C: {formatCurrency(projection.initial_cash ?? '0')}
                      </span>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-xs font-medium text-gray-500 mb-1">
                      Final by account type
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                      <span className="text-blue-600">
                        P: {formatCurrency(projection.final_pretax ?? '0')}
                      </span>
                      <span className="text-green-600">
                        R: {formatCurrency(projection.final_roth ?? '0')}
                      </span>
                      <span className="text-purple-600">
                        T: {formatCurrency(projection.final_taxable ?? '0')}
                      </span>
                      <span className="text-gray-600">
                        C: {formatCurrency(projection.final_cash ?? '0')}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Totals */}
              <div className="grid grid-cols-3 gap-4 mb-6 text-sm">
                <div>
                  <span className="text-gray-600">Total SS Received:</span>{' '}
                  <span className="font-medium">
                    {formatCurrency(projection.total_ss_received)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Total Spending:</span>{' '}
                  <span className="font-medium">{formatCurrency(projection.total_spending)}</span>
                </div>
                <div>
                  <span className="text-gray-600">Total Withdrawals:</span>{' '}
                  <span className="font-medium">
                    {formatCurrency(projection.total_withdrawals)}
                  </span>
                </div>
              </div>

              {accountBalanceChartData.length > 0 && (
                <div className="mb-6 rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-900">
                      Assets by Account Type (Year End)
                    </h3>
                    <span className="text-xs text-gray-500">
                      Max total: {formatCompactCurrency(maxAccountTotal)}
                    </span>
                  </div>
                  <div className="h-56 flex items-end gap-1 overflow-x-auto pb-12">
                    {accountBalanceChartData.map(row => {
                      const pretaxH = (row.pretax / maxAccountTotal) * 100;
                      const rothH = (row.roth / maxAccountTotal) * 100;
                      const taxableH = (row.taxable / maxAccountTotal) * 100;
                      const cashH = (row.cash / maxAccountTotal) * 100;
                      return (
                        <div
                          key={row.year}
                          className="min-w-[20px] h-full flex-1 flex flex-col items-center justify-end"
                          title={`${row.year} • Pretax ${formatCurrency(
                            row.pretax
                          )} • Roth ${formatCurrency(row.roth)} • Taxable ${formatCurrency(
                            row.taxable
                          )} • Cash ${formatCurrency(row.cash)} • Total ${formatCurrency(
                            row.total
                          )}`}
                        >
                          <div className="w-full h-full rounded-t-sm overflow-hidden bg-gray-100 flex flex-col-reverse">
                            <div className="bg-gray-500" style={{ height: `${cashH}%` }} />
                            <div className="bg-purple-500" style={{ height: `${taxableH}%` }} />
                            <div className="bg-green-500" style={{ height: `${rothH}%` }} />
                            <div className="bg-blue-500" style={{ height: `${pretaxH}%` }} />
                          </div>
                          <span className="text-[10px] text-gray-500 mt-4 origin-top-left -rotate-45 whitespace-nowrap">
                            {row.year}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-xs text-gray-600">
                    <span className="inline-flex items-center gap-1">
                      <span className="inline-block h-2.5 w-2.5 rounded-sm bg-blue-500" />
                      Pretax
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="inline-block h-2.5 w-2.5 rounded-sm bg-green-500" />
                      Roth
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="inline-block h-2.5 w-2.5 rounded-sm bg-purple-500" />
                      Taxable
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="inline-block h-2.5 w-2.5 rounded-sm bg-gray-500" />
                      Cash
                    </span>
                  </div>
                </div>
              )}

              {/* Year-by-Year Table */}
              <div className="max-h-96 overflow-x-auto overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">
                        Year
                      </th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">Age</th>
                      <th className="px-2 py-2 text-right text-xs font-medium text-gray-500">
                        Start Bal
                      </th>
                      <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 bg-blue-50">
                        Pretax
                      </th>
                      <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 bg-green-50">
                        Roth
                      </th>
                      <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 bg-purple-50">
                        Taxable
                      </th>
                      <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 bg-gray-50">
                        Cash
                      </th>
                      <th className="px-2 py-2 text-right text-xs font-medium text-gray-500">
                        SS Income
                      </th>
                      <th
                        className="px-2 py-2 text-right text-xs font-medium text-gray-500"
                        title="Primary earner SS"
                      >
                        Primary SS
                      </th>
                      <th
                        className="px-2 py-2 text-right text-xs font-medium text-gray-500"
                        title="Spouse SS (with spousal benefit)"
                      >
                        Spouse SS
                      </th>
                      <th className="px-2 py-2 text-right text-xs font-medium text-gray-500">
                        Other Inc
                      </th>
                      <th className="px-2 py-2 text-right text-xs font-medium text-gray-500">
                        Fixed (Loans)
                      </th>
                      <th className="px-2 py-2 text-right text-xs font-medium text-gray-500">
                        Variable
                      </th>
                      <th className="px-2 py-2 text-right text-xs font-medium text-gray-500">
                        Mo. Spend
                      </th>
                      <th className="px-2 py-2 text-right text-xs font-medium text-gray-500">
                        Total Spend
                      </th>
                      <th className="px-2 py-2 text-right text-xs font-medium text-gray-500">
                        Taxable Inc
                      </th>
                      <th className="px-2 py-2 text-right text-xs font-medium text-gray-500">
                        Fed Tax
                      </th>
                      <th className="px-2 py-2 text-right text-xs font-medium text-gray-500">
                        State Tax
                      </th>
                      <th className="px-2 py-2 text-right text-xs font-medium text-gray-500">
                        Withdrawal
                      </th>
                      <th
                        className="px-2 py-2 text-right text-xs font-medium text-gray-500"
                        title="Withdrawal as % of starting portfolio"
                      >
                        Withdrawal %
                      </th>
                      <th
                        className="px-2 py-2 text-right text-xs font-medium text-gray-500"
                        title="Blended portfolio return rate applied this year (from scenario return model)"
                      >
                        Return %
                      </th>
                      <th
                        className="px-2 py-2 text-right text-xs font-medium text-gray-500 bg-blue-50"
                        title="Withdrawal from pretax"
                      >
                        P W
                      </th>
                      <th
                        className="px-2 py-2 text-right text-xs font-medium text-gray-500 bg-purple-50"
                        title="Withdrawal from taxable"
                      >
                        T W
                      </th>
                      <th
                        className="px-2 py-2 text-right text-xs font-medium text-gray-500 bg-gray-50"
                        title="Withdrawal from cash"
                      >
                        C W
                      </th>
                      <th
                        className="px-2 py-2 text-right text-xs font-medium text-gray-500 bg-green-50"
                        title="Withdrawal from Roth"
                      >
                        R W
                      </th>
                      <th
                        className="px-2 py-2 text-right text-xs font-medium text-gray-500"
                        title="Dollar investment gain/loss (before tax) on average balances"
                      >
                        Return $
                      </th>
                      <th className="px-2 py-2 text-right text-xs font-medium text-gray-500">
                        End Bal
                      </th>
                      <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 bg-blue-50">
                        Pretax
                      </th>
                      <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 bg-green-50">
                        Roth
                      </th>
                      <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 bg-purple-50">
                        Taxable
                      </th>
                      <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 bg-gray-50">
                        Cash
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {projection.projections.map(p => (
                      <tr key={p.year} className={p.is_depleted ? 'bg-red-50' : 'hover:bg-gray-50'}>
                        <td className="px-2 py-2">{p.calendar_year}</td>
                        <td className="px-2 py-2">{p.age}</td>
                        <td className="px-2 py-2 text-right font-medium">
                          {formatCurrency(p.starting_balance)}
                        </td>
                        <td className="px-2 py-2 text-right text-blue-600 text-xs">
                          {formatCurrency(p.pretax_starting_balance)}
                        </td>
                        <td className="px-2 py-2 text-right text-green-600 text-xs">
                          {formatCurrency(p.roth_starting_balance)}
                        </td>
                        <td className="px-2 py-2 text-right text-purple-600 text-xs">
                          {formatCurrency(p.taxable_starting_balance)}
                        </td>
                        <td className="px-2 py-2 text-right text-gray-600 text-xs">
                          {formatCurrency(p.cash_starting_balance)}
                        </td>
                        <td className="px-2 py-2 text-right text-green-600">
                          {formatCurrency(p.social_security_income)}
                        </td>
                        <td className="px-2 py-2 text-right text-green-600 text-xs">
                          {formatCurrency(p.primary_ss_income ?? '0')}
                        </td>
                        <td className="px-2 py-2 text-right text-green-500 text-xs">
                          {formatCurrency(p.spouse_ss_income ?? '0')}
                        </td>
                        <td className="px-2 py-2 text-right text-green-500">
                          {formatCurrency(p.other_income)}
                        </td>
                        <td className="px-2 py-2 text-right text-orange-600 text-xs">
                          {formatCurrency(p.fixed_spending)}
                        </td>
                        <td className="px-2 py-2 text-right text-blue-600 text-xs">
                          {formatCurrency(p.variable_spending)}
                        </td>
                        <td className="px-2 py-2 text-right">
                          {formatCurrency(p.monthly_spending)}
                        </td>
                        <td className="px-2 py-2 text-right text-red-600">
                          {formatCurrency(p.total_spending)}
                        </td>
                        <td className="px-2 py-2 text-right">{formatCurrency(p.taxable_income)}</td>
                        <td className="px-2 py-2 text-right text-orange-600">
                          {formatCurrency(p.federal_tax)}
                        </td>
                        <td className="px-2 py-2 text-right text-orange-500">
                          {formatCurrency(p.state_tax)}
                        </td>
                        <td className="px-2 py-2 text-right">
                          {formatCurrency(p.portfolio_withdrawal)}
                        </td>
                        <td className="px-2 py-2 text-right text-gray-600">
                          {p.withdrawal_rate_percent != null
                            ? `${parseFloat(p.withdrawal_rate_percent).toFixed(2)}%`
                            : '—'}
                        </td>
                        <td className="px-2 py-2 text-right text-indigo-600">
                          {p.return_percent != null && p.return_percent !== ''
                            ? `${parseFloat(String(p.return_percent)).toFixed(2)}%`
                            : '—'}
                        </td>
                        <td className="px-2 py-2 text-right text-blue-600 text-xs">
                          {formatCurrency(p.pretax_withdrawal ?? '0')}
                        </td>
                        <td className="px-2 py-2 text-right text-purple-600 text-xs">
                          {formatCurrency(p.taxable_withdrawal ?? '0')}
                        </td>
                        <td className="px-2 py-2 text-right text-gray-600 text-xs">
                          {formatCurrency(p.cash_withdrawal ?? '0')}
                        </td>
                        <td className="px-2 py-2 text-right text-green-600 text-xs">
                          {formatCurrency(p.roth_withdrawal ?? '0')}
                        </td>
                        <td className="px-2 py-2 text-right text-blue-600">
                          {formatCurrency(p.investment_return)}
                        </td>
                        <td className="px-2 py-2 text-right font-medium">
                          {formatCurrency(p.ending_balance)}
                        </td>
                        <td className="px-2 py-2 text-right text-blue-600 text-xs">
                          {formatCurrency(p.pretax_ending_balance)}
                        </td>
                        <td className="px-2 py-2 text-right text-green-600 text-xs">
                          {formatCurrency(p.roth_ending_balance)}
                        </td>
                        <td className="px-2 py-2 text-right text-purple-600 text-xs">
                          {formatCurrency(p.taxable_ending_balance)}
                        </td>
                        <td className="px-2 py-2 text-right text-gray-600 text-xs">
                          {formatCurrency(p.cash_ending_balance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : projectionLoading ? (
            <div className="bg-white rounded-lg shadow-md p-6 text-center text-gray-500">
              Loading projection...
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-12 text-center text-gray-500">
              Select a scenario to view its projection, or create a new one.
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl my-8 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {editingScenario ? 'Edit Scenario' : 'New Scenario'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}
              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                  {success}
                </div>
              )}
              {/* Name & Description */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Scenario Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="e.g., SS at 67, $10k/mo"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Projection Years
                  </label>
                  <input
                    type="number"
                    value={formData.projection_years}
                    onChange={e =>
                      setFormData({ ...formData, projection_years: parseInt(e.target.value) || 35 })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    min="1"
                    max="50"
                  />
                </div>
              </div>

              {/* Social Security */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Social Security</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      SS Start Age (Years)
                    </label>
                    <select
                      value={formData.ss_start_age_years}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          ss_start_age_years: parseInt(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      {[62, 63, 64, 65, 66, 67, 68, 69, 70].map(age => (
                        <option key={age} value={age}>
                          {age}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Additional Months
                    </label>
                    <select
                      value={formData.ss_start_age_months}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          ss_start_age_months: parseInt(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(m => (
                        <option key={m} value={m}>
                          {m} months
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                {ssConfig?.spouse_birth_date && (
                  <div className="grid grid-cols-2 gap-4 mt-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Spouse SS Start Age (Years)
                      </label>
                      <select
                        value={formData.spouse_ss_start_age_years ?? ''}
                        onChange={e =>
                          setFormData({
                            ...formData,
                            spouse_ss_start_age_years: e.target.value
                              ? parseInt(e.target.value)
                              : null,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="">Not claiming</option>
                        {[62, 63, 64, 65, 66, 67, 68, 69, 70].map(age => (
                          <option key={age} value={age}>
                            {age}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Spouse Additional Months
                      </label>
                      <select
                        value={formData.spouse_ss_start_age_months ?? ''}
                        onChange={e =>
                          setFormData({
                            ...formData,
                            spouse_ss_start_age_months: e.target.value
                              ? parseInt(e.target.value)
                              : null,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="">—</option>
                        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(m => (
                          <option key={m} value={m}>
                            {m} months
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Spending */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Spending</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Monthly Spending
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                        $
                      </span>
                      <input
                        type="number"
                        value={formData.monthly_spending}
                        onChange={e =>
                          setFormData({ ...formData, monthly_spending: e.target.value })
                        }
                        className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-md [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Annual Lump Spending
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                        $
                      </span>
                      <input
                        type="number"
                        value={formData.annual_lump_spending}
                        onChange={e =>
                          setFormData({ ...formData, annual_lump_spending: e.target.value })
                        }
                        className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-md [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Additional Income (Annual)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                        $
                      </span>
                      <input
                        type="number"
                        value={formData.additional_other_income_annual ?? '0'}
                        onChange={e =>
                          setFormData({
                            ...formData,
                            additional_other_income_annual: e.target.value,
                          })
                        }
                        className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-md [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Added on top of global Other Income for this scenario.
                    </p>
                  </div>
                </div>
                {/* Fixed Expenses Section */}
                {editingScenario ? (
                  <div className="mt-3 border rounded-md p-3 bg-gray-50">
                    <h4 className="text-sm font-semibold text-gray-800 mb-2">
                      Fixed Expenses (not subject to inflation)
                    </h4>
                    <p className="text-xs text-gray-500 mb-3">
                      Add fixed-rate loans or expenses that end after a specific year. Variable
                      spending = Monthly Spending - Fixed Expenses.
                      {editingScenario?.name === 'Default Scenario' && (
                        <span className="block mt-1 text-blue-600">
                          💡 Tip: Loans from the Spending page are automatically included. Click
                          "Refresh" on the Default Scenario to update them.
                        </span>
                      )}
                    </p>

                    {/* Existing fixed expenses */}
                    {fixedExpensesError && (
                      <div className="text-xs text-red-500 mb-3">
                        Error loading fixed expenses: {(fixedExpensesError as Error).message}
                      </div>
                    )}
                    {fixedExpensesLoading ? (
                      <div className="text-xs text-gray-500 mb-3">Loading fixed expenses...</div>
                    ) : fixedExpenses && fixedExpenses.length > 0 ? (
                      <div className="space-y-2 mb-3">
                        {fixedExpenses.map(fe => {
                          // Try to extract original calendar years from notes, otherwise convert projection years
                          let displayYears = '';
                          if (fe.notes && fe.notes.includes('Original:')) {
                            // Extract original years from notes: "Original: 2021-2031"
                            const match = fe.notes.match(/Original:\s*(\d{4})-(\d{4})/);
                            if (match) {
                              displayYears = `${match[1]}-${match[2]}`;
                            } else {
                              // Fallback to converted projection years
                              const startCalendarYear = projectionYearToCalendarYear(fe.start_year);
                              const endCalendarYear = fe.end_year
                                ? projectionYearToCalendarYear(fe.end_year)
                                : null;
                              displayYears = endCalendarYear
                                ? `${startCalendarYear}-${endCalendarYear}`
                                : `${startCalendarYear}+`;
                            }
                          } else {
                            // Convert projection years to calendar years
                            const startCalendarYear = projectionYearToCalendarYear(fe.start_year);
                            const endCalendarYear = fe.end_year
                              ? projectionYearToCalendarYear(fe.end_year)
                              : null;
                            displayYears = endCalendarYear
                              ? `${startCalendarYear}-${endCalendarYear}`
                              : `${startCalendarYear}+`;
                          }

                          return (
                            <div
                              key={fe.id}
                              className="flex items-center gap-2 text-sm bg-white p-2 rounded border"
                            >
                              <span className="flex-1 font-medium">{fe.name}</span>
                              <span className="text-gray-600">
                                ${parseFloat(fe.monthly_amount).toLocaleString()}/mo
                              </span>
                              <span className="text-gray-500">{displayYears}</span>
                              <button
                                type="button"
                                onClick={() => deleteFixedExpenseMutation.mutate(fe.id)}
                                className="text-red-600 hover:text-red-800 text-xs"
                              >
                                Remove
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-500 mb-3">
                        No fixed expenses added yet.
                        {editingScenario?.name === 'Default Scenario' && (
                          <span className="block mt-1 text-blue-600">
                            Click "Refresh" on the Default Scenario to copy loans from Spending
                            page.
                          </span>
                        )}
                      </div>
                    )}

                    {/* Add new fixed expense */}
                    <div className="flex gap-2 items-end">
                      <div className="flex-1">
                        <label className="block text-xs text-gray-600">Name</label>
                        <input
                          type="text"
                          value={newExpense.name}
                          onChange={e => setNewExpense({ ...newExpense, name: e.target.value })}
                          placeholder="e.g., Mortgage"
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                        />
                      </div>
                      <div className="w-24">
                        <label className="block text-xs text-gray-600">$/month</label>
                        <input
                          type="number"
                          value={newExpense.monthly_amount}
                          onChange={e =>
                            setNewExpense({ ...newExpense, monthly_amount: e.target.value })
                          }
                          placeholder="2000"
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          min="0"
                        />
                      </div>
                      <div className="w-20">
                        <label className="block text-xs text-gray-600">End Yr</label>
                        <input
                          type="number"
                          value={newExpense.end_year}
                          onChange={e => setNewExpense({ ...newExpense, end_year: e.target.value })}
                          placeholder="10"
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          min="1"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (newExpense.name && newExpense.monthly_amount && editingScenario) {
                            createFixedExpenseMutation.mutate({
                              scenario_id: editingScenario.id,
                              name: newExpense.name,
                              monthly_amount: newExpense.monthly_amount,
                              start_year: 1,
                              end_year: newExpense.end_year ? parseInt(newExpense.end_year) : null,
                            });
                            setNewExpense({ name: '', monthly_amount: '', end_year: '' });
                          }
                        }}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      % of Spending Subject to Inflation
                    </label>
                    <input
                      type="number"
                      value={formData.inflation_adjusted_percent}
                      onChange={e =>
                        setFormData({ ...formData, inflation_adjusted_percent: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Save scenario first to add specific fixed expenses (loans, etc.)
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Spending Reduction %
                    </label>
                    <input
                      type="number"
                      value={formData.spending_reduction_percent}
                      onChange={e =>
                        setFormData({ ...formData, spending_reduction_percent: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Reduction at Year
                    </label>
                    <input
                      type="number"
                      value={formData.spending_reduction_start_year || ''}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          spending_reduction_start_year: e.target.value
                            ? parseInt(e.target.value)
                            : null,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      min="1"
                      placeholder="Leave blank for no reduction"
                    />
                  </div>
                </div>
              </div>

              {/* Returns & Inflation */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Returns & Inflation</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Return Source
                    </label>
                    <select
                      value={formData.return_source}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          return_source: e.target.value as any,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="10_year_projections">Hybrid (10-Year then Historical)</option>
                      <option value="historical_average">Historical Average (All Years)</option>
                      <option value="custom">Custom (All Years)</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.return_source === '10_year_projections' &&
                        'Years 1-10: 10-year institutional projections. Years 11+: Long-term historical averages.'}
                      {formData.return_source === 'historical_average' &&
                        'Uses long-term historical averages for all projection years.'}
                      {formData.return_source === 'custom' &&
                        'Uses your custom return percentage for all projection years.'}
                    </p>
                  </div>
                  {formData.return_source === 'custom' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Custom Return %
                      </label>
                      <input
                        type="number"
                        value={formData.custom_return_percent || ''}
                        onChange={e =>
                          setFormData({ ...formData, custom_return_percent: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Inflation Rate %
                    </label>
                    <input
                      type="number"
                      value={formData.inflation_rate}
                      onChange={e => setFormData({ ...formData, inflation_rate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                </div>
              </div>

              {/* Bucket Strategy */}
              <div className="border-t pt-4">
                <div className="mb-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.use_bucket_strategy || false}
                      onChange={e =>
                        setFormData({ ...formData, use_bucket_strategy: e.target.checked })
                      }
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Enable Bucket Strategy
                    </span>
                  </label>
                  <p className="text-xs text-gray-500 ml-6 mt-1">
                    Dynamic rebalancing strategy that protects near-term spending needs while
                    allowing long-term growth assets to recover from market downturns.
                  </p>
                </div>

                {formData.use_bucket_strategy && (
                  <div className="ml-6 space-y-3 bg-blue-50 p-4 rounded-md">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Strategy
                      </label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="bucket_strategy_type"
                            checked={(formData.bucket_strategy_type || 'A') === 'A'}
                            onChange={() => {
                              setFormData(prev => {
                                const next = {
                                  ...prev,
                                  bucket_strategy_type: 'A' as const,
                                  bucket_1_years: 3,
                                  bucket_2_years: 4,
                                };
                                const alloc = computeBucketAllocation(accounts ?? undefined, next);
                                if (alloc)
                                  next.asset_allocation = { ...prev.asset_allocation, ...alloc };
                                return next;
                              });
                            }}
                            className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                          />
                          <span className="text-sm">
                            Strategy A: 3yr cash, 4yr balanced (50/50)
                          </span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="bucket_strategy_type"
                            checked={(formData.bucket_strategy_type || 'A') === 'B'}
                            onChange={() => {
                              setFormData(prev => {
                                const next = {
                                  ...prev,
                                  bucket_strategy_type: 'B' as const,
                                  bucket_1_years: 1,
                                  bucket_2_years: 5,
                                };
                                const alloc = computeBucketAllocation(accounts ?? undefined, next);
                                if (alloc)
                                  next.asset_allocation = { ...prev.asset_allocation, ...alloc };
                                return next;
                              });
                            }}
                            className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                          />
                          <span className="text-sm">Strategy B: 1yr cash, 5yr bonds</span>
                        </label>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Bucket 1 Years (Cash)
                        </label>
                        <input
                          type="number"
                          value={
                            formData.bucket_1_years !== undefined &&
                            formData.bucket_1_years !== null
                              ? formData.bucket_1_years
                              : ''
                          }
                          onChange={e => {
                            const raw = e.target.value;
                            if (raw === '') {
                              setFormData({
                                ...formData,
                                bucket_1_years: undefined as unknown as number,
                              });
                              return;
                            }
                            const n = parseInt(raw, 10);
                            if (Number.isNaN(n)) return;
                            const years = Math.max(1, Math.min(10, n));
                            setFormData(prev => {
                              const next = { ...prev, bucket_1_years: years };
                              const alloc = computeBucketAllocation(accounts ?? undefined, next);
                              if (alloc)
                                next.asset_allocation = { ...prev.asset_allocation, ...alloc };
                              return next;
                            });
                          }}
                          onBlur={e => {
                            if (e.target.value === '' || formData.bucket_1_years === undefined) {
                              const defaultVal =
                                (formData.bucket_strategy_type || 'A') === 'B' ? 1 : 3;
                              setFormData(prev => {
                                const next = { ...prev, bucket_1_years: defaultVal };
                                const alloc = computeBucketAllocation(accounts ?? undefined, next);
                                if (alloc)
                                  next.asset_allocation = { ...prev.asset_allocation, ...alloc };
                                return next;
                              });
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          min="1"
                          max="10"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Years of spending in cash bucket
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {(formData.bucket_strategy_type || 'A') === 'B'
                            ? 'Bucket 2 Years (Bonds)'
                            : 'Bucket 2 Years (Balanced)'}
                        </label>
                        <input
                          type="number"
                          value={
                            formData.bucket_2_years !== undefined &&
                            formData.bucket_2_years !== null
                              ? formData.bucket_2_years
                              : ''
                          }
                          onChange={e => {
                            const raw = e.target.value;
                            if (raw === '') {
                              setFormData({
                                ...formData,
                                bucket_2_years: undefined as unknown as number,
                              });
                              return;
                            }
                            const n = parseInt(raw, 10);
                            if (Number.isNaN(n)) return;
                            const years = Math.max(1, Math.min(10, n));
                            setFormData(prev => {
                              const next = { ...prev, bucket_2_years: years };
                              const alloc = computeBucketAllocation(accounts ?? undefined, next);
                              if (alloc)
                                next.asset_allocation = { ...prev.asset_allocation, ...alloc };
                              return next;
                            });
                          }}
                          onBlur={e => {
                            if (e.target.value === '' || formData.bucket_2_years === undefined) {
                              const defaultVal =
                                (formData.bucket_strategy_type || 'A') === 'B' ? 5 : 4;
                              setFormData(prev => {
                                const next = { ...prev, bucket_2_years: defaultVal };
                                const alloc = computeBucketAllocation(accounts ?? undefined, next);
                                if (alloc)
                                  next.asset_allocation = { ...prev.asset_allocation, ...alloc };
                                return next;
                              });
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          min="1"
                          max="10"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          {(formData.bucket_strategy_type || 'A') === 'B'
                            ? 'Years of spending in bond bucket'
                            : 'Years of spending in balanced bucket'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Rebalancing Threshold %
                        </label>
                        <input
                          type="number"
                          value={formData.rebalancing_threshold || '5.0'}
                          onChange={e =>
                            setFormData({ ...formData, rebalancing_threshold: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          min="0"
                          max="20"
                          step="0.1"
                        />
                        <p className="text-xs text-gray-500 mt-1">Drift % before rebalancing</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Recovery Threshold %
                        </label>
                        <input
                          type="number"
                          value={formData.recovery_threshold_pct ?? '100'}
                          onChange={e =>
                            setFormData({ ...formData, recovery_threshold_pct: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          min="50"
                          max="100"
                          step="1"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Refill cash when Bucket 3 reaches this % of previous high (100 = full
                          recovery)
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 text-xs text-gray-600 bg-white p-3 rounded border border-blue-200">
                      <p className="font-semibold mb-1">How it works:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>
                          <strong>Bucket 1 (Cash):</strong>{' '}
                          {formData.bucket_1_years ??
                            ((formData.bucket_strategy_type || 'A') === 'B' ? 1 : 3)}{' '}
                          years of spending, 100% cash, 3.5% return
                        </li>
                        {(formData.bucket_strategy_type || 'A') === 'B' ? (
                          <>
                            <li>
                              <strong>Bucket 2 (Bonds):</strong> {formData.bucket_2_years ?? 5}{' '}
                              years of spending, 100% bonds, ~4.5% return
                            </li>
                            <li>
                              <strong>Bucket 3 (Stocks):</strong> Remaining balance, 100% stocks,
                              6–10% return
                            </li>
                          </>
                        ) : (
                          <>
                            <li>
                              <strong>Bucket 2 (Balanced):</strong> {formData.bucket_2_years ?? 4}{' '}
                              years of spending, 50% stocks / 50% bonds, 5.25% return
                            </li>
                            <li>
                              <strong>Bucket 3 (Growth):</strong> Remaining balance, 100% stocks,
                              6–10% return
                            </li>
                          </>
                        )}
                        <li>
                          Withdrawals always come from Bucket 1 first, then Bucket 2, then Bucket 3.
                          When stocks increase, Bucket 1 is refilled from Bucket 3. When stocks
                          decrease, we wait for recovery before refilling.
                        </li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              {/* Asset Allocation */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Asset Allocation (Total:{' '}
                  {Object.values(formData.asset_allocation)
                    .reduce((s, v) => s + parseFloat(v || '0'), 0)
                    .toFixed(1)}
                  %)
                </h3>
                {formData.use_bucket_strategy && (
                  <div className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded px-3 py-2 mb-3 space-y-1">
                    <p>
                      Cash and bond allocation are set by the strategy (years of spending). Edit
                      only the <strong>stock and REIT</strong> allocations below for the growth
                      bucket. Changing one line does not change the others; save to align the stock
                      total with “Stocks available” if needed.
                    </p>
                    {bucketBreakdown != null ? (
                      <>
                        <p className="font-medium">
                          Cash: {bucketBreakdown.cashPct.toFixed(1)}% · Bonds:{' '}
                          {bucketBreakdown.bondPct.toFixed(1)}% ·{' '}
                          <strong>
                            Stocks available: {bucketBreakdown.stockAvailablePct.toFixed(1)}%
                          </strong>
                        </p>
                        <p
                          className={
                            Math.abs(stockAllocationSum - bucketBreakdown.stockAvailablePct) > 0.5
                              ? 'text-amber-700 font-medium'
                              : 'text-gray-600'
                          }
                        >
                          Stock allocation total: {stockAllocationSum.toFixed(1)}%{' '}
                          {Math.abs(stockAllocationSum - bucketBreakdown.stockAvailablePct) > 0.5
                            ? `(should equal ${bucketBreakdown.stockAvailablePct.toFixed(1)}%)`
                            : ''}
                        </p>
                        <div className="flex items-center gap-2 pt-1">
                          <select
                            value={remainingStockTargetKey}
                            onChange={e =>
                              setRemainingStockTargetKey(e.target.value as keyof AssetAllocation)
                            }
                            className="px-2 py-1 border border-amber-300 rounded text-xs bg-white"
                          >
                            {STOCK_ALLOCATION_OPTIONS.map(opt => (
                              <option key={opt.key} value={opt.key}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={handleAddRemainingStockAllocation}
                            disabled={stockRemainingPct <= 0.0001}
                            className="px-2 py-1 rounded text-xs font-medium bg-amber-600 text-white hover:bg-amber-700 disabled:bg-amber-300"
                          >
                            Add Remaining ({stockRemainingPct.toFixed(2)}%)
                          </button>
                        </div>
                      </>
                    ) : (
                      <p className="text-gray-600">
                        Add accounts with balances to see cash/bond/stock breakdown from bucket
                        years.
                      </p>
                    )}
                  </div>
                )}

                {/* US Equities */}
                <div className="mb-3">
                  <h4 className="text-sm font-medium text-gray-600 mb-2">US Equities</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { key: 'total_us_stock', label: 'Total US (VTI)', return: '7.5%' },
                      { key: 'us_small_cap_value', label: 'Small Cap Value (VBR)', return: '8.5%' },
                    ].map(({ key, label, return: ret }) => (
                      <div key={key} className="flex items-center gap-2">
                        <label className="w-40 text-xs text-gray-700" title={`Expected: ${ret}`}>
                          {label}
                        </label>
                        {formData.use_bucket_strategy && bucketBreakdown ? (
                          <input
                            type="text"
                            inputMode="decimal"
                            autoComplete="off"
                            value={
                              stockWithinPctDrafts[key] ??
                              formatWithinStockPctDisplay(key as keyof AssetAllocation)
                            }
                            onFocus={() => {
                              const k = key as keyof AssetAllocation;
                              setStockWithinPctDrafts(d => ({
                                ...d,
                                [k]: d[k as string] ?? formatWithinStockPctDisplay(k),
                              }));
                            }}
                            onChange={e =>
                              setStockWithinPctDrafts(d => ({
                                ...d,
                                [key]: e.target.value,
                              }))
                            }
                            onBlur={() => commitWithinStockPctDraft(key as keyof AssetAllocation)}
                            className="w-16 px-2 py-1 border border-gray-300 rounded-md text-sm"
                          />
                        ) : (
                          <input
                            type="number"
                            value={formData.asset_allocation[key as keyof AssetAllocation]}
                            onChange={e =>
                              handleAllocationChange(key as keyof AssetAllocation, e.target.value)
                            }
                            className="w-16 px-2 py-1 border border-gray-300 rounded-md text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            min={0}
                            max={100}
                            step={0.01}
                          />
                        )}
                        <span className="text-xs text-gray-400">%</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* International Equities */}
                <div className="mb-3">
                  <h4 className="text-sm font-medium text-gray-600 mb-2">International Equities</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { key: 'total_foreign_stock', label: 'Total Intl (VXUS)', return: '7.0%' },
                      {
                        key: 'international_small_cap_value',
                        label: 'Intl Small Cap (VSS)',
                        return: '8.0%',
                      },
                      { key: 'developed_markets', label: 'Developed (VEA)', return: '6.5%' },
                      { key: 'emerging_markets', label: 'Emerging (VWO)', return: '8.0%' },
                    ].map(({ key, label, return: ret }) => (
                      <div key={key} className="flex items-center gap-2">
                        <label className="w-40 text-xs text-gray-700" title={`Expected: ${ret}`}>
                          {label}
                        </label>
                        {formData.use_bucket_strategy && bucketBreakdown ? (
                          <input
                            type="text"
                            inputMode="decimal"
                            autoComplete="off"
                            value={
                              stockWithinPctDrafts[key] ??
                              formatWithinStockPctDisplay(key as keyof AssetAllocation)
                            }
                            onFocus={() => {
                              const k = key as keyof AssetAllocation;
                              setStockWithinPctDrafts(d => ({
                                ...d,
                                [k]: d[k as string] ?? formatWithinStockPctDisplay(k),
                              }));
                            }}
                            onChange={e =>
                              setStockWithinPctDrafts(d => ({
                                ...d,
                                [key]: e.target.value,
                              }))
                            }
                            onBlur={() => commitWithinStockPctDraft(key as keyof AssetAllocation)}
                            className="w-16 px-2 py-1 border border-gray-300 rounded-md text-sm"
                          />
                        ) : (
                          <input
                            type="number"
                            value={formData.asset_allocation[key as keyof AssetAllocation]}
                            onChange={e =>
                              handleAllocationChange(key as keyof AssetAllocation, e.target.value)
                            }
                            className="w-16 px-2 py-1 border border-gray-300 rounded-md text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            min={0}
                            max={100}
                            step={0.01}
                          />
                        )}
                        <span className="text-xs text-gray-400">%</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Real Estate */}
                <div className="mb-3">
                  <h4 className="text-sm font-medium text-gray-600 mb-2">Real Estate</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {[{ key: 'reits', label: 'REITs (VNQ)', return: '9.5%' }].map(
                      ({ key, label, return: ret }) => (
                        <div key={key} className="flex items-center gap-2">
                          <label className="w-40 text-xs text-gray-700" title={`Expected: ${ret}`}>
                            {label}
                          </label>
                          {formData.use_bucket_strategy && bucketBreakdown ? (
                            <input
                              type="text"
                              inputMode="decimal"
                              autoComplete="off"
                              value={
                                stockWithinPctDrafts[key] ??
                                formatWithinStockPctDisplay(key as keyof AssetAllocation)
                              }
                              onFocus={() => {
                                const k = key as keyof AssetAllocation;
                                setStockWithinPctDrafts(d => ({
                                  ...d,
                                  [k]: d[k as string] ?? formatWithinStockPctDisplay(k),
                                }));
                              }}
                              onChange={e =>
                                setStockWithinPctDrafts(d => ({
                                  ...d,
                                  [key]: e.target.value,
                                }))
                              }
                              onBlur={() => commitWithinStockPctDraft(key as keyof AssetAllocation)}
                              className="w-16 px-2 py-1 border border-gray-300 rounded-md text-sm"
                            />
                          ) : (
                            <input
                              type="number"
                              value={formData.asset_allocation[key as keyof AssetAllocation]}
                              onChange={e =>
                                handleAllocationChange(key as keyof AssetAllocation, e.target.value)
                              }
                              className="w-16 px-2 py-1 border border-gray-300 rounded-md text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              min={0}
                              max={100}
                              step={0.01}
                            />
                          )}
                          <span className="text-xs text-gray-400">%</span>
                        </div>
                      )
                    )}
                  </div>
                </div>

                {/* Fixed Income - read-only when bucket strategy is on */}
                <div className="mb-3">
                  <h4 className="text-sm font-medium text-gray-600 mb-2">
                    Fixed Income
                    {formData.use_bucket_strategy && (
                      <span className="ml-2 text-xs font-normal text-amber-600">
                        (set by bucket strategy)
                      </span>
                    )}
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { key: 'bonds', label: 'Total Bond (BND)', return: '4.5%' },
                      {
                        key: 'short_term_treasuries',
                        label: 'Short Treasury (VGSH)',
                        return: '4.0%',
                      },
                      {
                        key: 'intermediate_term_treasuries',
                        label: 'Interm Treasury (VGIT)',
                        return: '4.2%',
                      },
                      { key: 'municipal_bonds', label: 'Muni Bonds (VTEB)', return: '3.5%' },
                    ].map(({ key, label, return: ret }) => (
                      <div key={key} className="flex items-center gap-2">
                        <label className="w-40 text-xs text-gray-700" title={`Expected: ${ret}`}>
                          {label}
                        </label>
                        <input
                          type="number"
                          value={formData.asset_allocation[key as keyof AssetAllocation]}
                          onChange={e =>
                            handleAllocationChange(key as keyof AssetAllocation, e.target.value)
                          }
                          readOnly={!!formData.use_bucket_strategy}
                          className={`w-16 px-2 py-1 border rounded-md text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                            formData.use_bucket_strategy
                              ? 'border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed'
                              : 'border-gray-300'
                          }`}
                          min="0"
                          max="100"
                          step="0.01"
                        />
                        <span className="text-xs text-gray-400">%</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Cash & Other - cash read-only when bucket strategy is on */}
                <div>
                  <h4 className="text-sm font-medium text-gray-600 mb-2">
                    Cash & Other
                    {formData.use_bucket_strategy && (
                      <span className="ml-2 text-xs font-normal text-amber-600">
                        (cash set by bucket strategy)
                      </span>
                    )}
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { key: 'cash', label: 'Cash (VMFXX)', return: '3.5%', lockWhenBucket: true },
                      { key: 'other', label: 'Other', return: '5.0%', lockWhenBucket: false },
                    ].map(({ key, label, return: ret, lockWhenBucket }) => {
                      const readOnly = !!(formData.use_bucket_strategy && lockWhenBucket);
                      return (
                        <div key={key} className="flex items-center gap-2">
                          <label className="w-40 text-xs text-gray-700" title={`Expected: ${ret}`}>
                            {label}
                          </label>
                          <input
                            type="number"
                            value={formData.asset_allocation[key as keyof AssetAllocation]}
                            onChange={e =>
                              handleAllocationChange(key as keyof AssetAllocation, e.target.value)
                            }
                            readOnly={readOnly}
                            className={`w-16 px-2 py-1 border rounded-md text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                              readOnly
                                ? 'border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed'
                                : 'border-gray-300'
                            }`}
                            min="0"
                            max="100"
                            step="0.01"
                          />
                          <span className="text-xs text-gray-400">%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4 pt-4 border-t">
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
                    : editingScenario
                      ? 'Update Scenario'
                      : 'Create Scenario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
