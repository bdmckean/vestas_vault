/**
 * Types for planned fixed expenses (global fixed spending not subject to inflation).
 */

export interface PlannedFixedExpense {
  id: string;
  name: string;
  monthly_amount: string;
  start_year: number;
  end_year: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlannedFixedExpenseCreate {
  name: string;
  monthly_amount: string;
  start_year: number;
  end_year: number;
  notes?: string | null;
}

export interface PlannedFixedExpenseUpdate {
  name?: string;
  monthly_amount?: string;
  start_year?: number;
  end_year?: number;
  notes?: string | null;
}

export interface PlannedFixedExpenseSummary {
  total_monthly: string;
  expenses: PlannedFixedExpense[];
}
