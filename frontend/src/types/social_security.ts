export interface SocialSecurity {
  id: string;
  birth_date: string; // ISO date string
  fra_monthly_amount: string;
  fra_age: string;
  created_at: string;
  updated_at: string;
}

export interface SocialSecurityCreate {
  birth_date: string; // ISO date string (YYYY-MM-DD)
  fra_monthly_amount: string;
  // fra_age is calculated automatically from birth_date
}

export interface SocialSecurityUpdate {
  birth_date?: string;
  fra_monthly_amount?: string;
  // fra_age is calculated automatically from birth_date
}

export interface SocialSecurityPaymentProjection {
  age_years: number;
  age_months: number;
  start_date: string; // ISO date string
  monthly_amount: string;
  annual_amount: string;
  reduction_percent: string | null;
  increase_percent: string | null;
}
