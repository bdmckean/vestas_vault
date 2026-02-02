import { useQuery } from 'react-query';
import { taxConfigApi } from '../services/tax_config_api';

export function useUSFederalTaxTables() {
  return useQuery('us-federal-tax-tables', taxConfigApi.getUSFederalTaxTables);
}

export function useColoradoTaxTables() {
  return useQuery('colorado-tax-tables', taxConfigApi.getColoradoTaxTables);
}

export function useStandardDeductions(taxYear: number) {
  return useQuery(
    ['standard-deductions', taxYear],
    () => taxConfigApi.getStandardDeductions(taxYear),
    {
      enabled: !!taxYear,
    }
  );
}
