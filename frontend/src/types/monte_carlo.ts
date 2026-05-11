export interface MonteCarloYearPercentile {
  year: number;
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
}

export interface MonteCarloRunResponse {
  scenario_id: string;
  scenario_name: string;
  simulations: number;
  horizon_years: number;
  success_rate_pct: number;
  terminal_percentiles: Record<string, number>;
  yearly_percentiles: MonteCarloYearPercentile[];
  assumptions: Record<string, string | number>;
}
