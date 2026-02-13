export interface AssetAllocation {
  total_us_stock: string;        // VTI - Vanguard Total Stock Market
  total_foreign_stock: string;   // VXUS - Vanguard Total International Stock
  us_small_cap_value: string;    // VBR - Vanguard Small Cap Value
  international_small_cap_value: string; // VSS - Vanguard FTSE All-World ex-US Small Cap
  developed_markets: string;     // VEA - Vanguard FTSE Developed Markets
  emerging_markets: string;      // VWO - Vanguard FTSE Emerging Markets
  reits: string;                 // VNQ - Vanguard Real Estate ETF
  bonds: string;                 // BND - Vanguard Total Bond Market
  short_term_treasuries: string; // VGSH - Vanguard Short-Term Treasury
  intermediate_term_treasuries: string; // VGIT - Vanguard Intermediate-Term Treasury
  municipal_bonds: string;       // VTEB - Vanguard Tax-Exempt Bond
  cash: string;                  // Money Market / Savings
  other: string;                 // Other investments
}

export interface SavedScenario {
  id: string;
  name: string;
  description: string | null;
  ss_start_age_years: number;
  ss_start_age_months: number;
  monthly_spending: string;
  annual_lump_spending: string;
  inflation_adjusted_percent: string;
  spending_reduction_percent: string;
  spending_reduction_start_year: number | null;
  projection_years: number;
  asset_allocation: AssetAllocation;
  return_source: 'ten_year_projections' | 'historical_average' | 'custom';
  custom_return_percent: string | null;
  inflation_rate: string;
  created_at: string;
  updated_at: string;
}

export interface SavedScenarioCreate {
  name: string;
  description?: string | null;
  ss_start_age_years: number;
  ss_start_age_months: number;
  monthly_spending: string;
  annual_lump_spending: string;
  inflation_adjusted_percent: string;
  spending_reduction_percent: string;
  spending_reduction_start_year?: number | null;
  projection_years: number;
  asset_allocation: AssetAllocation;
  return_source: '10_year_projections' | 'historical_average' | 'custom';
  custom_return_percent?: string | null;
  inflation_rate: string;
}

export interface SavedScenarioUpdate {
  name?: string;
  description?: string | null;
  ss_start_age_years?: number;
  ss_start_age_months?: number;
  monthly_spending?: string;
  annual_lump_spending?: string;
  inflation_adjusted_percent?: string;
  spending_reduction_percent?: string;
  spending_reduction_start_year?: number | null;
  projection_years?: number;
  asset_allocation?: AssetAllocation;
  return_source?: '10_year_projections' | 'historical_average' | 'custom';
  custom_return_percent?: string | null;
  inflation_rate?: string;
}

export interface ScenarioYearProjection {
  year: number;
  calendar_year: number;
  age: number;
  starting_balance: string;
  ending_balance: string;
  // Account type balances (starting)
  pretax_starting_balance: string;
  roth_starting_balance: string;
  taxable_starting_balance: string;
  cash_starting_balance: string;
  // Account type balances (ending)
  pretax_ending_balance: string;
  roth_ending_balance: string;
  taxable_ending_balance: string;
  cash_ending_balance: string;
  social_security_income: string;
  other_income: string;
  total_income: string;
  fixed_spending: string;
  variable_spending: string;
  monthly_spending: string;
  annual_spending: string;
  annual_lump_spending: string;
  total_spending: string;
  portfolio_withdrawal: string;
  investment_return: string;
  return_percent: string;
  taxable_income: string;
  federal_tax: string;
  state_tax: string;
  total_tax: string;
  after_tax_income: string;
  is_depleted: boolean;
}

export interface ScenarioProjectionResult {
  scenario_id: string | null;
  scenario_name: string;
  initial_portfolio: string;
  final_portfolio: string;
  years_until_depletion: number | null;
  total_ss_received: string;
  total_other_income: string;
  total_spending: string;
  total_withdrawals: string;
  ss_start_age: string;
  average_return_percent: string;
  inflation_rate: string;
  projections: ScenarioYearProjection[];
}

export interface ScenarioComparisonResult {
  scenarios: ScenarioProjectionResult[];
  comparison_summary: Record<string, Record<string, string | number | null>>;
}

export const DEFAULT_ASSET_ALLOCATION: AssetAllocation = {
  total_us_stock: '40',
  total_foreign_stock: '15',
  us_small_cap_value: '5',
  international_small_cap_value: '5',
  developed_markets: '10',
  emerging_markets: '5',
  reits: '0',
  bonds: '10',
  short_term_treasuries: '5',
  intermediate_term_treasuries: '3',
  municipal_bonds: '0',
  cash: '2',
  other: '0',
};

// Asset class labels with typical Vanguard ETF tickers
export const SCENARIO_ASSET_CLASS_INFO: Record<keyof AssetAllocation, { label: string; ticker: string; expectedReturn: number }> = {
  total_us_stock: { label: 'Total US Stock', ticker: 'VTI', expectedReturn: 7.5 },
  total_foreign_stock: { label: 'Total International', ticker: 'VXUS', expectedReturn: 7.0 },
  us_small_cap_value: { label: 'US Small Cap Value', ticker: 'VBR', expectedReturn: 8.5 },
  international_small_cap_value: { label: 'Intl Small Cap Value', ticker: 'VSS', expectedReturn: 8.0 },
  developed_markets: { label: 'Developed Markets', ticker: 'VEA', expectedReturn: 6.5 },
  emerging_markets: { label: 'Emerging Markets', ticker: 'VWO', expectedReturn: 8.0 },
  reits: { label: 'REITs', ticker: 'VNQ', expectedReturn: 9.5 },
  bonds: { label: 'Total Bond Market', ticker: 'BND', expectedReturn: 4.5 },
  short_term_treasuries: { label: 'Short-Term Treasury', ticker: 'VGSH', expectedReturn: 4.0 },
  intermediate_term_treasuries: { label: 'Intermediate Treasury', ticker: 'VGIT', expectedReturn: 4.2 },
  municipal_bonds: { label: 'Municipal Bonds', ticker: 'VTEB', expectedReturn: 3.5 },
  cash: { label: 'Cash / Money Market', ticker: 'VMFXX', expectedReturn: 3.5 },
  other: { label: 'Other', ticker: '-', expectedReturn: 5.0 },
};
