import { useQuery } from 'react-query';
import { assetProjectionsApi } from '../services/asset_projections_api';
import type { AssetClassProjection } from '../types/asset_projections';

export function use10YearProjections() {
  return useQuery('asset-projections-10-year', assetProjectionsApi.get10YearProjections);
}

export function useConsolidated10Year() {
  return useQuery('asset-projections-consolidated', assetProjectionsApi.getConsolidated10Year);
}

export function useHistoricalReturns() {
  return useQuery('asset-projections-historical', assetProjectionsApi.getHistoricalReturns);
}

export function useAssetClasses() {
  return useQuery<{ asset_classes: AssetClassProjection[] }, Error>(
    'asset-classes',
    assetProjectionsApi.getAssetClasses
  );
}
