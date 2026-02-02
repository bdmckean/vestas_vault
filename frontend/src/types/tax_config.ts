export type FilingStatus =
  | 'single'
  | 'married_filing_jointly'
  | 'married_filing_separately'
  | 'head_of_household'
  | 'qualifying_widow';

export interface TaxConfig {
  id: number;
  filing_status: FilingStatus;
  total_deductions: string;
  primary_age: number | null;
  spouse_age: number | null;
  annual_income: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaxConfigCreate {
  filing_status: FilingStatus;
  total_deductions: string;
  primary_age?: number | null;
  spouse_age?: number | null;
  annual_income?: string | null;
}

export interface TaxConfigUpdate {
  filing_status: FilingStatus;
  total_deductions: string;
  primary_age?: number | null;
  spouse_age?: number | null;
  annual_income?: string | null;
}

export interface SeniorDeductionBreakdown {
  base_standard_deduction: string;
  additional_senior_deduction: string;
  bonus_senior_deduction: string;
  total_automatic_deduction: string;
  explanation: string;
}

export interface TaxBracket {
  rate: number;
  min: number;
  max: number | null;
}

export interface StandardDeductions {
  single: number;
  married_filing_jointly: number;
  married_filing_separately: number;
  head_of_household: number;
  qualifying_widow: number;
}

export interface USFederalTaxTables {
  metadata: {
    last_updated: string;
    description: string;
    tax_year: number;
    data_source: string;
    note: string;
  };
  standard_deductions: {
    [year: string]: StandardDeductions;
  };
  tax_brackets: {
    [year: string]: {
      [status: string]: TaxBracket[];
    };
  };
}

export interface ColoradoTaxTables {
  metadata: {
    last_updated: string;
    description: string;
    tax_year: number;
    data_source: string;
    note: string;
  };
  tax_rate: {
    [year: string]: {
      rate: number;
      rate_low: number;
      note: string;
    };
  };
  standard_deductions: {
    [year: string]: StandardDeductions;
  };
  filing_statuses: FilingStatus[];
  notes: string[];
}
