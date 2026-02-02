export interface AssetAllocation {
  total_us_stock: string;
  total_foreign_stock: string;
  us_small_cap_value: string;
  bonds: string;
  short_term_treasuries: string;
  cash: string;
}

export interface ScenarioCreate {
  name: string;
  initial_amount: string;
  start_date: string; // ISO date string
  end_date: string; // ISO date string
  asset_allocation: AssetAllocation;
  return_source: '10_year_projections' | 'historical_average' | 'historical_period';
  historical_period_start?: string; // ISO date string
  historical_period_end?: string; // ISO date string
  rebalance_frequency: 'monthly' | 'quarterly' | 'annually' | 'never';
  contribution_amount: string;
  contribution_frequency: 'monthly' | 'quarterly' | 'annually';
}

export interface ScenarioPeriod {
  period_start: string; // ISO date string
  period_end: string; // ISO date string
  period_type: 'month' | 'year';
  period_number: number;
  starting_balance: string;
  contribution: string;
  return_percent: string;
  return_amount: string;
  ending_balance: string;
  asset_values: {
    [key: string]: string;
  };
}

export interface ScenarioResult {
  scenario_name: string;
  initial_amount: string;
  final_amount: string;
  total_return: string;
  total_return_percent: string;
  total_contributions: string;
  periods: ScenarioPeriod[];
  summary_stats: {
    [key: string]: string | number;
  };
}
