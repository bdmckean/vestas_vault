export type IncomeType = 'pension' | 'employment' | 'rental' | 'annuity' | 'dividend' | 'other';

export interface OtherIncome {
  id: string;
  name: string;
  income_type: IncomeType;
  monthly_amount: string;
  start_month: number;
  start_year: number;
  end_month: number | null;
  end_year: number | null;
  cola_rate: string;
  is_taxable: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface OtherIncomeCreate {
  name: string;
  income_type: IncomeType;
  monthly_amount: string;
  start_month: number;
  start_year: number;
  end_month?: number | null;
  end_year?: number | null;
  cola_rate?: string;
  is_taxable?: boolean;
  notes?: string | null;
}

export interface OtherIncomeUpdate {
  name?: string;
  income_type?: IncomeType;
  monthly_amount?: string;
  start_month?: number;
  start_year?: number;
  end_month?: number | null;
  end_year?: number | null;
  cola_rate?: string;
  is_taxable?: boolean;
  notes?: string | null;
}

export interface OtherIncomeProjection {
  income_id: string;
  name: string;
  income_type: IncomeType;
  year: number;
  month: number;
  amount: string;
  is_taxable: boolean;
}

export interface OtherIncomeSummary {
  year: number;
  month: number;
  total_amount: string;
  taxable_amount: string;
  non_taxable_amount: string;
  by_type: Record<string, string>;
  by_source: Record<string, string>;
}

export const INCOME_TYPE_LABELS: Record<IncomeType, string> = {
  pension: 'Pension',
  employment: 'Employment',
  rental: 'Rental Income',
  annuity: 'Annuity',
  dividend: 'Dividend',
  other: 'Other',
};

export const INCOME_TYPE_COLORS: Record<IncomeType, string> = {
  pension: 'bg-blue-100 text-blue-800',
  employment: 'bg-green-100 text-green-800',
  rental: 'bg-purple-100 text-purple-800',
  annuity: 'bg-orange-100 text-orange-800',
  dividend: 'bg-yellow-100 text-yellow-800',
  other: 'bg-gray-100 text-gray-800',
};
