import { useQuery } from 'react-query';
import { monteCarloApi } from '../services/monte_carlo_api';

export function useMonteCarloRun(scenarioId: string, simulations = 1000, periodKey = '30_year') {
  return useQuery(
    ['monte-carlo-run', scenarioId, simulations, periodKey],
    () =>
      monteCarloApi.run({
        scenario_id: scenarioId,
        simulations,
        period_key: periodKey,
        seed: 42,
      }),
    {
      enabled: !!scenarioId,
      staleTime: 60_000,
    }
  );
}
