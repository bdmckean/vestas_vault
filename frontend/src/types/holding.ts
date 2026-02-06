export type AssetClass =
  | 'total_us_stock'
  | 'total_foreign_stock'
  | 'us_small_cap_value'
  | 'international_small_cap_value'
  | 'developed_markets'
  | 'emerging_markets'
  | 'bonds'
  | 'short_term_treasuries'
  | 'intermediate_term_treasuries'
  | 'municipal_bonds'
  | 'cash'
  | 'other';

export interface Holding {
  id: string;
  account_id: string;
  asset_class: AssetClass;
  ticker: string | null;
  name: string | null;
  amount: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface HoldingCreate {
  account_id: string;
  asset_class: AssetClass;
  ticker?: string | null;
  name?: string | null;
  amount: string;
  notes?: string | null;
}

export interface HoldingUpdate {
  asset_class?: AssetClass;
  ticker?: string | null;
  name?: string | null;
  amount?: string;
  notes?: string | null;
}

export interface HoldingWithAllocation extends Holding {
  allocation_percent: string;
}

export interface AccountHoldingsSummary {
  account_id: string;
  account_name: string;
  account_balance: string;
  holdings_total: string;
  difference: string;
  holdings: HoldingWithAllocation[];
}

export interface PortfolioAllocation {
  total_portfolio_value: string;
  by_asset_class: Record<string, string>;
  by_asset_class_percent: Record<string, string>;
  by_account: AccountHoldingsSummary[];
}

export const ASSET_CLASS_LABELS: Record<AssetClass, string> = {
  total_us_stock: 'Total US Stock',
  total_foreign_stock: 'Total Foreign Stock',
  us_small_cap_value: 'US Small Cap Value',
  international_small_cap_value: 'Intl Small Cap Value',
  developed_markets: 'Developed Markets',
  emerging_markets: 'Emerging Markets',
  bonds: 'Bonds',
  short_term_treasuries: 'Short-Term Treasuries',
  intermediate_term_treasuries: 'Intermediate Treasuries',
  municipal_bonds: 'Municipal Bonds',
  cash: 'Cash',
  other: 'Other',
};

export const ASSET_CLASS_COLORS: Record<AssetClass, string> = {
  total_us_stock: 'bg-blue-100 text-blue-800',
  total_foreign_stock: 'bg-green-100 text-green-800',
  us_small_cap_value: 'bg-indigo-100 text-indigo-800',
  international_small_cap_value: 'bg-teal-100 text-teal-800',
  developed_markets: 'bg-cyan-100 text-cyan-800',
  emerging_markets: 'bg-orange-100 text-orange-800',
  bonds: 'bg-yellow-100 text-yellow-800',
  short_term_treasuries: 'bg-lime-100 text-lime-800',
  intermediate_term_treasuries: 'bg-amber-100 text-amber-800',
  municipal_bonds: 'bg-emerald-100 text-emerald-800',
  cash: 'bg-gray-100 text-gray-800',
  other: 'bg-purple-100 text-purple-800',
};
