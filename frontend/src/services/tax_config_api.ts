import axios from 'axios';
import type {
  SeniorDeductionBreakdown,
  TaxConfig,
  TaxConfigCreate,
  TaxConfigUpdate,
  USFederalTaxTables,
  ColoradoTaxTables,
  StandardDeductions,
} from '../types/tax_config';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8005';

const apiClient = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const taxConfigApi = {
  getTaxConfig: async (): Promise<TaxConfig | null> => {
    const response = await apiClient.get<TaxConfig | null>('/tax-config');
    return response.data;
  },

  createTaxConfig: async (data: TaxConfigCreate): Promise<TaxConfig> => {
    const response = await apiClient.post<TaxConfig>('/tax-config', data);
    return response.data;
  },

  updateTaxConfig: async (data: TaxConfigUpdate): Promise<TaxConfig> => {
    const response = await apiClient.put<TaxConfig>('/tax-config', data);
    return response.data;
  },

  deleteTaxConfig: async (): Promise<void> => {
    await apiClient.delete('/tax-config');
  },

  getUSFederalTaxTables: async (): Promise<USFederalTaxTables> => {
    const response = await apiClient.get<USFederalTaxTables>('/tax-tables/us-federal');
    return response.data;
  },

  getColoradoTaxTables: async (): Promise<ColoradoTaxTables> => {
    const response = await apiClient.get<ColoradoTaxTables>('/tax-tables/colorado');
    return response.data;
  },

  getStandardDeductions: async (taxYear: number): Promise<{
    tax_year: number;
    standard_deductions: StandardDeductions;
  }> => {
    const response = await apiClient.get<{
      tax_year: number;
      standard_deductions: StandardDeductions;
    }>(`/tax-tables/standard-deductions/${taxYear}`);
    return response.data;
  },

  calculateSeniorDeductions: async (
    filingStatus: string,
    primaryAge: number | null,
    spouseAge: number | null,
    annualIncome: number | null,
    taxYear: number = 2026
  ): Promise<SeniorDeductionBreakdown> => {
    const params = new URLSearchParams({
      filing_status: filingStatus,
      tax_year: taxYear.toString(),
    });
    if (primaryAge !== null) params.append('primary_age', primaryAge.toString());
    if (spouseAge !== null) params.append('spouse_age', spouseAge.toString());
    if (annualIncome !== null) params.append('annual_income', annualIncome.toString());

    const response = await apiClient.get<SeniorDeductionBreakdown>(
      `/tax-config/senior-deductions?${params.toString()}`
    );
    return response.data;
  },

  getEstimatedAnnualIncome: async (): Promise<EstimatedAnnualIncome> => {
    const response = await apiClient.get<EstimatedAnnualIncome>('/tax-config/estimated-annual-income');
    return response.data;
  },
};

export interface EstimatedAnnualIncome {
  social_security: {
    monthly_amount: string;
    annual_amount: string;
    note: string;
  };
  other_income: {
    monthly_amount: string;
    annual_amount: string;
    taxable_annual_amount: string;
    sources: {
      name: string;
      income_type: string;
      monthly_amount: string;
      annual_amount: string;
      is_taxable: boolean;
    }[];
  };
  total: {
    monthly_amount: string;
    annual_amount: string;
  };
  note: string;
}
