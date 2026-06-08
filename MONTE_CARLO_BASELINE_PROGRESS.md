# Monte Carlo Baseline Overlay - Implementation Progress

**Date Started:** 2026-05-27
**Status:** In Progress - Backend Complete, Frontend Pending

---

## Goal

Add baseline (deterministic) projection overlay to Monte Carlo fan chart so users can:
- See where their baseline scenario falls within the range of Monte Carlo outcomes
- Understand if baseline is optimistic/pessimistic/median (via percentile label)
- Make better-informed retirement planning decisions

---

## Completed ✅

### Backend Changes

1. **Schema Updates** (`backend/app/schemas/monte_carlo.py`)
   - ✅ Added `MonteCarloBaselineYear` model (year, balance)
   - ✅ Updated `MonteCarloRunResponse` to include:
     - `baseline_projection: list[MonteCarloBaselineYear]` - year-by-year baseline balances
     - `baseline_percentile: float` - where baseline terminal value ranks (0-100)

2. **Service Logic** (`backend/app/services/monte_carlo_data_prep_service.py`)
   - ✅ Import `MonteCarloBaselineYear` schema
   - ✅ Extract baseline ending balances from `RetirementScenarioService` projection
   - ✅ Build `baseline_years` list for all projection years
   - ✅ Calculate baseline percentile rank by comparing baseline terminal value against all MC simulation terminal values
   - ✅ Return baseline data in `MonteCarloRunResponse`

**Key Implementation Details:**
- Baseline uses existing `RetirementScenarioService.generate_projection()` - no new projection logic needed
- Percentile calculation: `baseline_rank / total_simulations * 100`
- Baseline terminal value is compared against sorted Monte Carlo terminal values

---

## Remaining Work 🚧

### Frontend Changes (Not Started)

1. **Types Update** (`frontend/src/types/monte_carlo.ts`)
   - ❌ Add `MonteCarloBaselineYear` interface
   - ❌ Update `MonteCarloRunResponse` interface to include:
     - `baseline_projection: MonteCarloBaselineYear[]`
     - `baseline_percentile: number`

2. **UI - Fan Chart Overlay** (`frontend/src/pages/MonteCarloPage.tsx`)
   - ❌ Add baseline line to SVG chart (dashed black line)
   - ❌ Map baseline data to chart coordinates (same logic as P10/P50/P90 lines)
   - ❌ Ensure baseline overlays on top of fan (render after polygons)

3. **UI - Percentile Label** (`frontend/src/pages/MonteCarloPage.tsx`)
   - ❌ Add info card showing baseline percentile
   - ❌ Example: "Baseline ≈ 55th percentile" or "Your baseline is at the 55th percentile"
   - ❌ Consider color coding:
     - Green: 40-60th percentile (reasonable/median)
     - Yellow: 20-40th or 60-80th (somewhat optimistic/pessimistic)
     - Red: <20th or >80th (very optimistic/very pessimistic)

---

## Code Locations

**Backend:**
- Schema: `/Users/brianmckean/work/repo/vestas_vault/backend/app/schemas/monte_carlo.py`
- Service: `/Users/brianmckean/work/repo/vestas_vault/backend/app/services/monte_carlo_data_prep_service.py`
- API: `/Users/brianmckean/work/repo/vestas_vault/backend/app/api/v1/monte_carlo.py` (no changes needed)

**Frontend:**
- Types: `/Users/brianmckean/work/repo/vestas_vault/frontend/src/types/monte_carlo.ts`
- Page: `/Users/brianmckean/work/repo/vestas_vault/frontend/src/pages/MonteCarloPage.tsx`
- Hook: `/Users/brianmckean/work/repo/vestas_vault/frontend/src/hooks/useMonteCarlo.ts` (no changes needed - types will update automatically)

---

## Implementation Notes

### Fan Chart SVG Structure (Current)

```tsx
<svg viewBox="0 0 ${width} 100" preserveAspectRatio="none">
  {/* Zero line */}
  <line x1="0" y1="100" x2={width} y2="100" stroke="#9ca3af" strokeWidth="0.6" />

  {/* P10-P90 range (light blue) */}
  <polygon points={`${line('p10')} ${line('p90').reverse()}`} fill="#bfdbfe" opacity="0.5" />

  {/* P25-P75 range (darker blue) */}
  <polygon points={`${line('p25')} ${line('p75').reverse()}`} fill="#60a5fa" opacity="0.4" />

  {/* P50 median line (solid blue) */}
  <polyline points={line('p50')} fill="none" stroke="#1d4ed8" strokeWidth="1.8" />
</svg>
```

### Baseline Overlay Logic (To Implement)

```tsx
// 1. Map baseline data to SVG points (same coordinate system as percentiles)
const baselineLine = mc.baseline_projection
  .map((b, i) => `${i * step + 10},${100 - (b.balance / maxY) * 100}`)
  .join(' ');

// 2. Add baseline polyline AFTER percentile polygons (so it overlays)
<polyline
  points={baselineLine}
  fill="none"
  stroke="#0f172a"  // Dark gray/black
  strokeWidth="1.5"
  strokeDasharray="4,3"  // Dashed line
  strokeLinecap="round"
/>

// 3. Add legend/label for baseline
<div className="text-xs text-gray-600 mt-2">
  <span className="inline-block w-8 border-t-2 border-dashed border-gray-900 mr-2"></span>
  Baseline (≈ {mc.baseline_percentile}th percentile)
</div>
```

---

## Testing Checklist (After Implementation)

- [ ] Backend: API returns `baseline_projection` and `baseline_percentile` fields
- [ ] Frontend: Types compile without errors
- [ ] UI: Baseline line renders on fan chart
- [ ] UI: Baseline line is dashed and visible against fan
- [ ] UI: Baseline percentile label displays correctly
- [ ] Test with various scenarios:
  - [ ] Conservative scenario (baseline high percentile)
  - [ ] Aggressive scenario (baseline low percentile)
  - [ ] Median scenario (baseline ~50th percentile)
- [ ] Test edge cases:
  - [ ] Baseline above P90 (optimistic)
  - [ ] Baseline below P10 (pessimistic)
  - [ ] Very short horizon (3-5 years)
  - [ ] Very long horizon (40+ years)

---

## Next Session Tasks

1. Update frontend types (`monte_carlo.ts`)
2. Add baseline line to SVG chart (`MonteCarloPage.tsx`)
3. Add baseline percentile display card
4. Test with real scenarios
5. Consider adding tooltip/legend explaining baseline vs percentiles
6. Update PRD status from "❌ Not Implemented" to "⚠️ Partial" or "✅ Implemented"

---

## Related PRD Requirements

From `PRD.md` lines 1510-1553:

**Monte Carlo Simulations - Priority: 🟡 High**

Acceptance Criteria:
- ✅ User can run N Monte Carlo simulations for the current scenario
- ✅ Success rate and percentile outcomes (e.g., 10th/50th/90th final balance) are displayed
- ⚠️ **Baseline projection is comparable to the Monte Carlo distribution** ← This feature
- ✅ Return assumptions are documented and driven by scenario
- ✅ Performance is acceptable for default simulation count
- ❌ Appropriate disclaimers are shown (future work)

**What we're completing:** The baseline comparison requirement so users can see where their deterministic projection falls within the probabilistic distribution.

---

## Future Enhancements (After Baseline Overlay)

1. **User controls** - Simulation count selector (500/1000/2000/5000)
2. **Disclaimers** - "Probabilistic results" and "Past performance" warnings
3. **Terminal distribution histogram** - Visual of final balance distribution
4. **Sample paths** - Show 5-10 individual simulation paths
5. **Enhanced success metrics** - User-defined floor (not just $0)
6. **Asset class correlation** - More realistic multi-asset simulations

---

**End of Progress Note**
