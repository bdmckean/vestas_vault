export interface AssetClassProjection {
  key: string;
  name: string;
  expected_return: number | null;
  range: {
    low: number;
    high: number;
    median?: number;
  } | null;
  notes: string | null;
}

export interface ConsolidatedProjections {
  description: string;
  as_of_date: string;
  asset_classes: {
    [key: string]: {
      expected_return: number;
      range: {
        low: number;
        high: number;
        median?: number;
      };
      notes: string;
    };
  };
}

export interface InstitutionProjection {
  institution: string;
  as_of_date: string;
  source: string;
  forecast_horizon: string;
  asset_classes: {
    [key: string]: any;
  };
  key_themes?: string[];
  source_url?: string;
}

export interface HistoricalReturns {
  metadata: {
    last_updated: string;
    description: string;
    data_sources: string[];
    note: string;
  };
  us_equities: {
    [key: string]: {
      description: string;
      periods: {
        [key: string]: {
          nominal: number | string;
          real: number | string;
          years: number;
          notes?: string;
        };
      };
      volatility?: {
        standard_deviation: string;
        notes?: string;
      };
      source?: string;
    };
  };
  [key: string]: any;
}
