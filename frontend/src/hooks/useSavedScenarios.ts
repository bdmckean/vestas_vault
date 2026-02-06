import { useMutation, useQuery, useQueryClient } from 'react-query';
import { savedScenariosApi } from '../services/saved_scenarios_api';
import type { SavedScenarioCreate, SavedScenarioUpdate } from '../types/saved_scenario';

export function useSavedScenarios() {
  return useQuery('saved-scenarios', savedScenariosApi.getAll);
}

export function useSavedScenarioById(id: string) {
  return useQuery(['saved-scenarios', id], () => savedScenariosApi.getById(id), {
    enabled: !!id,
  });
}

export function useCreateSavedScenario() {
  const queryClient = useQueryClient();
  return useMutation(savedScenariosApi.create, {
    onSuccess: () => {
      queryClient.invalidateQueries('saved-scenarios');
    },
  });
}

export function useUpdateSavedScenario() {
  const queryClient = useQueryClient();
  return useMutation(
    ({ id, data }: { id: string; data: SavedScenarioUpdate }) =>
      savedScenariosApi.update(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('saved-scenarios');
      },
    }
  );
}

export function useDeleteSavedScenario() {
  const queryClient = useQueryClient();
  return useMutation(savedScenariosApi.delete, {
    onSuccess: () => {
      queryClient.invalidateQueries('saved-scenarios');
    },
  });
}

export function useDuplicateSavedScenario() {
  const queryClient = useQueryClient();
  return useMutation(
    ({ id, newName }: { id: string; newName: string }) =>
      savedScenariosApi.duplicate(id, newName),
    {
      onSuccess: (newScenario) => {
        queryClient.invalidateQueries('saved-scenarios');
        // Invalidate fixed expenses queries since the new scenario will have copied fixed expenses
        queryClient.invalidateQueries('fixed-expenses');
        queryClient.invalidateQueries(['fixed-expenses', newScenario.id]);
      },
    }
  );
}

export function useScenarioProjection(id: string) {
  return useQuery(
    ['scenario-projection', id],
    () => savedScenariosApi.getProjection(id),
    { enabled: !!id }
  );
}

export function useGenerateAdhocProjection() {
  return useMutation(savedScenariosApi.generateAdhocProjection);
}

export function useCompareScenarios() {
  return useMutation(savedScenariosApi.compare);
}

export function useCreateOrUpdateDefaultScenario() {
  const queryClient = useQueryClient();
  return useMutation(savedScenariosApi.createOrUpdateDefault, {
    onSuccess: (scenario) => {
      queryClient.invalidateQueries('saved-scenarios');
      // Also invalidate fixed expenses for this scenario since they're auto-created
      // Use a pattern match to invalidate all fixed-expenses queries for this scenario
      queryClient.invalidateQueries(['fixed-expenses', scenario.id]);
      // Also invalidate all fixed-expenses queries in case the scenario ID changed
      queryClient.invalidateQueries('fixed-expenses');
    },
  });
}
