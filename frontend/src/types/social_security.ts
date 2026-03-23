export type SpouseBenefitSource = 'own' | 'half_of_partner';

export interface SocialSecurity {
  id: string;
  birth_date: string; // ISO date string
  fra_monthly_amount: string;
  fra_age: string;
  spouse_birth_date: string | null;
  spouse_fra_monthly_amount: string | null;
  spouse_fra_age: string | null;
  spouse_benefit_source: SpouseBenefitSource | null;
  default_ss_start_age_years?: number | null;
  default_ss_start_age_months?: number | null;
  default_spouse_ss_start_age_years?: number | null;
  default_spouse_ss_start_age_months?: number | null;
  created_at: string;
  updated_at: string;
}

export interface SocialSecurityCreate {
  birth_date: string; // ISO date string (YYYY-MM-DD)
  fra_monthly_amount: string;
  spouse_birth_date?: string | null;
  spouse_fra_monthly_amount?: string | null;
  spouse_benefit_source?: SpouseBenefitSource | null;
  default_ss_start_age_years?: number | null;
  default_ss_start_age_months?: number | null;
  default_spouse_ss_start_age_years?: number | null;
  default_spouse_ss_start_age_months?: number | null;
}

export interface SocialSecurityUpdate {
  birth_date?: string;
  fra_monthly_amount?: string;
  spouse_birth_date?: string | null;
  spouse_fra_monthly_amount?: string | null;
  spouse_benefit_source?: SpouseBenefitSource | null;
  default_ss_start_age_years?: number | null;
  default_ss_start_age_months?: number | null;
  default_spouse_ss_start_age_years?: number | null;
  default_spouse_ss_start_age_months?: number | null;
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

export interface SocialSecurityProjectionsResponse {
  primary_projections: SocialSecurityPaymentProjection[];
  spouse_projections: SocialSecurityPaymentProjection[] | null;
}
