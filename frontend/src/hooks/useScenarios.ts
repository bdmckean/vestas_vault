import { useMutation } from 'react-query';
import { scenarioApi } from '../services/scenario_api';
import type { ScenarioCreate, ScenarioResult } from '../types/scenario';

export function useCreateScenario() {
  return useMutation<ScenarioResult, Error, ScenarioCreate>(
    (data) => scenarioApi.createScenario(data)
  );
}

export function useExportScenarioCSV() {
  return useMutation<Blob, Error, ScenarioCreate>(
    (data) => scenarioApi.exportScenarioCSV(data)
  );
}

export function useExportScenarioJSON() {
  return useMutation<ScenarioResult, Error, ScenarioCreate>(
    (data) => scenarioApi.exportScenarioJSON(data)
  );
}
