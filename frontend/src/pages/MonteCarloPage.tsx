import { useEffect, useState } from 'react';
import { useSavedScenarios } from '../hooks/useSavedScenarios';
import { useMonteCarloRun } from '../hooks/useMonteCarlo';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function MonteCarloPage() {
  const currentYear = new Date().getFullYear();
  const { data: scenarios, isLoading: scenariosLoading } = useSavedScenarios();
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('');
  const { data: mc, isLoading: mcLoading } = useMonteCarloRun(selectedScenarioId, 1000, '30_year');
  const startAge = typeof mc?.assumptions?.start_age === 'number' ? mc.assumptions.start_age : null;

  const zeroInfoFor = (key: 'p10' | 'p50' | 'p90') => {
    if (!mc) return null;
    const terminal = Number(mc.terminal_percentiles?.[key] ?? NaN);
    if (terminal !== 0) return null;
    const hit = mc.yearly_percentiles.find(row => row[key] <= 0);
    if (!hit) return null;
    if (startAge == null) return `Hits $0 in year ${hit.year}`;
    return `Hits $0 at age ${Math.round(startAge + hit.year - 1)}`;
  };

  useEffect(() => {
    if (!selectedScenarioId && scenarios && scenarios.length > 0) {
      setSelectedScenarioId(scenarios[0].id);
    }
  }, [selectedScenarioId, scenarios]);

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-4xl font-bold text-gray-900">Monte Carlo</h1>
        <p className="text-gray-600 mt-2">Fan chart and success rate from simulated paths.</p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Scenario</label>
        <select
          value={selectedScenarioId}
          onChange={e => setSelectedScenarioId(e.target.value)}
          className="w-full md:w-96 px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="">Select a scenario...</option>
          {(scenarios ?? []).map(s => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {scenariosLoading ? (
        <div className="bg-white rounded-lg shadow-md p-6 text-gray-600">Loading scenarios...</div>
      ) : !selectedScenarioId ? (
        <div className="bg-gray-50 rounded-lg p-10 text-center text-gray-500">
          No saved scenarios found yet.
        </div>
      ) : mcLoading || !mc ? (
        <div className="bg-white rounded-lg shadow-md p-6 text-gray-600">
          Running Monte Carlo...
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4 text-sm">
            <div className="bg-green-50 rounded p-3">
              <div className="text-gray-600">Success Rate</div>
              <div className="font-semibold text-green-700">{mc.success_rate_pct}%</div>
            </div>
            <div className="bg-blue-50 rounded p-3 border-2 border-blue-300">
              <div className="text-gray-600">Baseline</div>
              <div className="font-semibold text-blue-800">≈ {mc.baseline_percentile}th %ile</div>
              <div className="text-xs text-gray-500 mt-1">
                {mc.baseline_percentile >= 40 && mc.baseline_percentile <= 60
                  ? 'Reasonable'
                  : mc.baseline_percentile < 30 || mc.baseline_percentile > 70
                    ? 'Check assumptions'
                    : 'Review plan'}
              </div>
            </div>
            <div className="bg-gray-50 rounded p-3">
              <div className="text-gray-600">P50 Terminal</div>
              <div className="font-semibold">
                {formatCurrency(mc.terminal_percentiles.p50 ?? 0)}
              </div>
              {zeroInfoFor('p50') && (
                <div className="text-xs text-gray-500 mt-1">{zeroInfoFor('p50')}</div>
              )}
            </div>
            <div className="bg-gray-50 rounded p-3">
              <div className="text-gray-600">P10 Terminal</div>
              <div className="font-semibold">
                {formatCurrency(mc.terminal_percentiles.p10 ?? 0)}
              </div>
              {zeroInfoFor('p10') && (
                <div className="text-xs text-gray-500 mt-1">{zeroInfoFor('p10')}</div>
              )}
            </div>
            <div className="bg-gray-50 rounded p-3">
              <div className="text-gray-600">P90 Terminal</div>
              <div className="font-semibold">
                {formatCurrency(mc.terminal_percentiles.p90 ?? 0)}
              </div>
              {zeroInfoFor('p90') && (
                <div className="text-xs text-gray-500 mt-1">{zeroInfoFor('p90')}</div>
              )}
            </div>
          </div>
          {(() => {
            const rows = mc.yearly_percentiles ?? [];
            const baseline = mc.baseline_projection ?? [];
            const step = 22;
            const width = Math.max(1, rows.length * step);
            const allVals = rows.flatMap(r => [r.p10, r.p25, r.p50, r.p75, r.p90]);
            // Include baseline values in maxY calculation for proper scaling
            const baselineVals = baseline.map(b => b.balance);
            const maxY = Math.max(1, ...allVals, ...baselineVals);
            const chartHeight = 232;
            // viewBox y: 0 = top (maxY), 100 = bottom ($0)
            const line = (key: 'p10' | 'p25' | 'p50' | 'p75' | 'p90') =>
              rows.map((r, i) => `${i * step + 10},${100 - (r[key] / maxY) * 100}`).join(' ');
            // Baseline line: map baseline balances to SVG coordinates
            const baselineLine = baseline
              .map((b, i) => `${i * step + 10},${100 - (b.balance / maxY) * 100}`)
              .join(' ');
            return (
              <div>
                <div className="h-72 overflow-x-auto border rounded p-2 bg-white">
                  <div className="h-full" style={{ width: `${width}px` }}>
                    <div className="relative" style={{ height: `${chartHeight}px` }}>
                      <svg
                        className="w-full h-full block"
                        viewBox={`0 0 ${width} 100`}
                        preserveAspectRatio="none"
                      >
                        <line
                          x1="0"
                          y1="100"
                          x2={width}
                          y2="100"
                          stroke="#9ca3af"
                          strokeWidth="0.6"
                        />
                        <polygon
                          points={`${line('p10')} ${line('p90').split(' ').reverse().join(' ')}`}
                          fill="#bfdbfe"
                          opacity="0.5"
                        />
                        <polygon
                          points={`${line('p25')} ${line('p75').split(' ').reverse().join(' ')}`}
                          fill="#60a5fa"
                          opacity="0.4"
                        />
                        <polyline
                          points={line('p50')}
                          fill="none"
                          stroke="#1d4ed8"
                          strokeWidth="1.8"
                        />
                        {/* Baseline overlay - dashed line */}
                        {baselineLine && (
                          <polyline
                            points={baselineLine}
                            fill="none"
                            stroke="#0f172a"
                            strokeWidth="1.5"
                            strokeDasharray="4,3"
                            strokeLinecap="round"
                          />
                        )}
                      </svg>
                    </div>
                    <div className="relative h-8 pointer-events-none">
                      {rows.map((r, i) => (
                        <span
                          key={`mcy-${r.year}`}
                          className="absolute text-[10px] text-gray-500 whitespace-nowrap"
                          style={{
                            left: `${i * step + 10}px`,
                            bottom: '2px',
                            transform: 'translateX(-50%) rotate(-45deg)',
                            transformOrigin: 'top left',
                          }}
                        >
                          {currentYear + r.year - 1}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                {/* Legend */}
                <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-gray-600">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-0.5 bg-blue-300"></div>
                    <span>P10-P90 range</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-0.5 bg-blue-500"></div>
                    <span>P25-P75 range</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-0.5 bg-blue-700"></div>
                    <span>P50 median</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 border-t-2 border-dashed border-gray-900"></div>
                    <span>Baseline projection</span>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
