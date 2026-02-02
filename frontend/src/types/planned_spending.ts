export interface PlannedSpending {
  id: number;
  monthly_spending: string;
  annual_lump_sum: string;
  created_at: string;
  updated_at: string;
}

export interface PlannedSpendingCreate {
  monthly_spending: string;
  annual_lump_sum: string;
}

export interface PlannedSpendingUpdate {
  monthly_spending: string;
  annual_lump_sum: string;
}
