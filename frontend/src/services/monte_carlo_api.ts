import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import type { MonteCarloRunResponse } from '../types/monte_carlo';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

export const monteCarloApi = {
  run: async (params: {
    scenario_id: string;
    simulations?: number;
    period_key?: string;
    seed?: number;
  }): Promise<MonteCarloRunResponse> => {
    const response = await apiClient.post<MonteCarloRunResponse>('/monte-carlo/run', {
      scenario_id: params.scenario_id,
      simulations: params.simulations ?? 1000,
      period_key: params.period_key ?? '30_year',
      seed: params.seed ?? 42,
    });
    return response.data;
  },
};
