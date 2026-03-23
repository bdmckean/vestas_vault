import axios from 'axios';
import type {
  AssetClassProjection,
  ConsolidatedProjections,
  HistoricalReturns,
  InstitutionProjection,
} from '../types/asset_projections';

import { API_BASE_URL } from '../config/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const assetProjectionsApi = {
  get10YearProjections: async (): Promise<{
    metadata: any;
    projections: InstitutionProjection[];
    consolidated_10_year_projections?: ConsolidatedProjections;
  }> => {
    const response = await apiClient.get('/asset-projections/10-year');
    return response.data;
  },

  getConsolidated10Year: async (): Promise<ConsolidatedProjections> => {
    const response = await apiClient.get('/asset-projections/10-year/consolidated');
    return response.data;
  },

  getHistoricalReturns: async (): Promise<HistoricalReturns> => {
    const response = await apiClient.get('/asset-projections/historical');
    return response.data;
  },

  getAssetClasses: async (): Promise<{ asset_classes: AssetClassProjection[] }> => {
    const response = await apiClient.get('/asset-projections/asset-classes');
    return response.data;
  },
};
