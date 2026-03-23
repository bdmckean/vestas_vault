# PRD vs Code Gap Analysis

**Generated:** 2026-02-18
**Purpose:** Compare PRD requirements to current codebase and recommend next steps.

---

## 1. Implemented (PRD may still say Partial/Not Implemented)

| PRD Area | Code Status | Notes |
|----------|-------------|--------|
| **Epic 1: Account Management** | ✅ Done | Accounts by type (pretax/roth/taxable/cash), CRUD, portfolio totals |
| **Epic 2: Social Security (incl. partner/spouse)** | ✅ Done | FRA, ages 62–70, partner/spouse, spousal benefit, default scenario ages. PRD says "Partial" – should be updated to Implemented. |
| **Epic 3: Other Income** | ✅ Done | CRUD, COLA, projections |
| **Epic 4: Spending Planning** | ✅ Done | Monthly/annual, inflation %, fixed expenses, spending reduction |
| **Epic 5: Tax Planning** | ⚠️ Partial | Filing status, deductions, brackets, distance to next bracket. Missing: IRMAA, tax bracket indexing. |
| **Epic 6: Scenario Modeling** | ✅ Done | Multiple scenarios, duplicate, compare, export CSV/JSON |
| **Epic 7: Retirement Projections** | ⚠️ Partial | Year-by-year, withdrawals by account type, taxes. **Account type segregation is implemented** (pretax/roth/taxable/cash start/end, withdrawal by source). Missing: RMDs. PRD Epic 7 status should reflect account-type work as done. |
| **Withdrawal sequencing** | ✅ Done | Pretax → taxable → cash → roth in `retirement_scenario_service` |
| **Bucket strategy (Strategy A only)** | ✅ Done | `use_bucket_strategy`, `bucket_1_years`, `bucket_2_years`, rebalancing (3yr cash, 4yr balanced 50/50, rest stocks). User can set # years. Strategy B (1yr cash, 5yr bonds) not in code. |

---

## 2. Not Implemented or Only Partially

| PRD / Roadmap Item | Gap | Priority |
|--------------------|-----|----------|
| **Bucket Strategy B** | PRD describes 1yr cash / 5yr bonds / stocks. Code and UI only support Strategy A (3yr cash, 4yr balanced). No strategy type selector, no bond-only bucket. | 🟡 High |
| **Scenario builder when bucket enabled** | PRD: "Fix cash and bond allocation; only allow stock % for remaining assets." Code/UI: User still edits full asset allocation; no locking of cash/bond when bucket is on. | 🟡 High |
| **RMDs** | No RMD calculation or fields. PRD/Epic 7 and roadmap Phase 4. | 🟡 High |
| **Roth conversions** | No model, schema, or projection logic. Roadmap Phase 3. | 🟡 High |
| **Epic 8: Visualizations** | No projection time-series charts (SS over time, withdrawals by type, taxes, portfolio balance, distance to bracket). | 🟡 High |
| **Epic 11: Stress testing** | Schema has `return_source: historical_period` and date range; backend does not run scenario with actual year-by-year historical returns. No "run with 2008–2009 returns" style stress test. | 🟡 High |
| **IRMAA** | Not in tax logic or projection. Epic 5 / roadmap Phase 6. | 🟢 Medium |
| **Tax bracket indexing** | Brackets not inflated by year. Roadmap Phase 6. | 🟢 Medium |
| **Epic 10: Guardrails** | No threshold-based spending adjustment or alerts. | 🟢 Lower (secondary) |
| **Epic 9: Accumulation phase** | No accumulation-phase modeling. | 🟢 Lower (secondary) |

---

## 3. Recommended Next Steps (in order)

1. **Update PRD status**
   - Epic 2: set to **Implemented** (partner/spouse done).
   - Epic 7: set to **Partial** with note "Account type segregation and withdrawals by type done; RMDs not yet implemented."

2. **Bucket Strategy B**
   - Add strategy type (A vs B) to scenario model/schema and UI.
   - For B: 1yr cash, 5yr bonds (user-editable years), rest stocks.
   - Reuse existing bucket/return/rebalancing patterns where possible.

3. **Scenario builder when bucket enabled**
   - When bucket strategy is on: in Scenario builder, fix (read-only) cash and bond allocation from bucket years; only allow allocation of the **remaining** (stock) portion (and stock sub-asset classes).

4. **RMDs**
   - Add RMD start age and RMD calculation (e.g. IRS Uniform Lifetime Table), enforce in withdrawal logic, add RMD (and excess RMD) to projection schema and UI.

5. **Roth conversions**
   - Add scenario fields (e.g. annual amount, stop age), projection logic (move pretax → roth, tax on conversion), and projection/UI columns.

6. **Stress testing**
   - Implement running a scenario with a chosen historical period’s actual returns (year-by-year) and show baseline vs stress result (e.g. ending balance, success/fail).

7. **Visualizations (Epic 8)**
   - Add time-series charts for key projection outputs (portfolio balance, SS, withdrawals by type, taxes, optional distance to next bracket).

8. **Tax improvements**
   - IRMAA and tax bracket indexing when capacity allows.

---

## 4. Quick Reference: Where in Code

- **Account types / withdrawal order:** `retirement_scenario_service.py` (account_balances, withdrawal from pretax → taxable → cash → roth).
- **Bucket strategy:** `retirement_scenario_service.py` (bucket_balances, bucket_1_years, bucket_2_years, rebalancing); `scenario.py` (model/schema); `ScenarioModelingPage.tsx` (form).
- **Spouse SS:** `retirement_scenario_service.py` (`_calculate_ss_income`, spouse_ss_income); `social_security_service.py`, `social_security` schema/model.
- **Return source / historical:** `retirement_scenario_service._get_annual_return`, `scenario_service` (historical_period stub); `asset_projection_service.get_historical_returns`.
