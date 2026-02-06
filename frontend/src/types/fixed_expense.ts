export interface FixedExpense {
  id: string;
  scenario_id: string;
  name: string;
  monthly_amount: string;
  start_year: number;
  end_year: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface FixedExpenseCreate {
  scenario_id: string;
  name: string;
  monthly_amount: string;
  start_year: number;
  end_year?: number | null;
  notes?: string | null;
}

export interface FixedExpenseUpdate {
  name?: string;
  monthly_amount?: string;
  start_year?: number;
  end_year?: number | null;
  notes?: string | null;
}
