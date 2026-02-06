# Implementation Roadmap: Code to Markdown Alignment

**Goal:** Align the codebase implementation with the retirement strategies described in the markdown documentation files.

**Status:** Not Started
**Estimated Effort:** 4-6 weeks
**Last Updated:** 2026-02-04

---

## Overview

This document outlines the step-by-step implementation plan to make the code produce the same scenarios and results as described in:
- `COMPLETE_RETIREMENT_ANALYSIS.md`
- `RETIREMENT_STRATEGY_SUMMARY.md`
- `APP_ARCHITECTURE_PROPOSAL.md`

The implementation is divided into **9 phases** with **54 tasks** total.

---

## Phase 1: Account Type Segregation (6 tasks)

**Goal:** Track separate balances for pretax, Roth, taxable, and cash accounts instead of aggregating everything.

**Priority:** 🔴 CRITICAL - Everything else depends on this

### Tasks

- [ ] **1.1** Add account_type tracking to projection model
  - Update `retirement_scenario_service.py` to store account balances by type
  - Create dictionary structure: `{pretax: Decimal, roth: Decimal, taxable: Decimal, cash: Decimal}`

- [ ] **1.2** Update Account model to ensure account_type field is properly used
  - Verify `account_type` enum includes: `pretax`, `roth`, `taxable`, `cash`
  - Check that all existing accounts have valid types

- [ ] **1.3** Modify retirement_scenario_service.py to track separate balances per account type
  - Replace single `portfolio_balance` with account type dictionary
  - Initialize separate balances from `account_repository.get_all()` grouped by type

- [ ] **1.4** Implement withdrawal sequencing logic
  - Withdraw 100% from pretax first
  - Then withdraw from taxable accounts if pretax depleted
  - Preserve Roth accounts (only use for emergencies or if configured)
  - Add `withdrawal_sequence` configuration to SavedScenario model

- [ ] **1.5** Add Roth balance tracking to ScenarioYearProjection schema
  - Add fields: `roth_starting_balance`, `roth_ending_balance`
  - Add fields: `pretax_starting_balance`, `pretax_ending_balance`
  - Add fields: `taxable_starting_balance`, `taxable_ending_balance`

- [ ] **1.6** Update tax calculations to differentiate account types
  - Pretax withdrawals: 100% taxable
  - Roth withdrawals: 0% taxable
  - Taxable account withdrawals: gains only (need cost basis tracking)

---

## Phase 2: Bucket Strategy - Time-Based Returns (5 tasks)

**Goal:** Implement different return rates for different time periods (conservative early, aggressive later).

**Priority:** 🟡 HIGH - Core strategy from markdown

### Tasks

- [ ] **2.1** Create BucketStrategy model
  - Table: `bucket_strategies` with columns: `id`, `scenario_id`, `start_year`, `end_year`, `return_percent`, `allocation_type`
  - Repository: `BucketStrategyRepository`

- [ ] **2.2** Add bucket_strategy_enabled flag to SavedScenario model
  - Boolean field: `use_bucket_strategy` (default: False)
  - When False, use existing return logic
  - When True, use bucket strategy returns

- [ ] **2.3** Implement get_return_for_year() method
  - Input: year_number, current_age, bucket_strategy_config
  - Output: return_percent for that specific year
  - Logic: Find which bucket the year falls into, return that bucket's rate

- [ ] **2.4** Create default bucket configuration matching markdown
  - Bucket 1: Years 1-3 = 3.5% return (100% Cash)
  - Bucket 2: Years 4-7 = 5.25% return (50/50 Balanced)
  - Bucket 3: Years 8-10 = 6.0% return (100% Stocks with international tilt)
  - Bucket 4: Years 11+ = 10.0% return (Historical average)

- [ ] **2.5** Update _get_annual_return() to check bucket strategy first
  - If `use_bucket_strategy` is True, call `get_return_for_year()`
  - Otherwise, fall back to existing logic (custom/historical/10-year projections)
  - Location: `retirement_scenario_service.py:361-405`

---

## Phase 3: Roth Conversions (6 tasks)

**Goal:** Model annual Roth conversions from pretax accounts with tax implications.

**Priority:** 🟡 HIGH - Key tax optimization strategy

### Tasks

- [ ] **3.1** Add RothConversion tracking model
  - Table: `roth_conversions` with columns: `id`, `scenario_id`, `year`, `amount`, `tax_paid`
  - Schema: `RothConversionRecord` with these fields

- [ ] **3.2** Add Roth conversion configuration to SavedScenario model
  - Field: `roth_conversion_annual_amount` (Decimal, nullable)
  - Field: `roth_conversion_enabled` (Boolean, default False)
  - Example: $40,000 per year

- [ ] **3.3** Add roth_conversion_stop_age to SavedScenario model
  - Field: `roth_conversion_stop_age` (Integer, default 75)
  - Conversions stop when age >= stop_age (RMDs begin)

- [ ] **3.4** Implement Roth conversion logic in projection loop
  - Each year: if enabled AND age < stop_age, convert configured amount
  - Move amount from pretax_balance to roth_balance
  - Calculate tax on converted amount (treated as taxable income)

- [ ] **3.5** Calculate conversion taxes and add to total tax
  - Conversion amount adds to taxable income for the year
  - Federal + state tax calculated on conversion
  - Tax must be paid from portfolio (increases withdrawal needs)

- [ ] **3.6** Track conversion amounts in ScenarioYearProjection
  - Add field: `roth_conversion_amount` (Decimal)
  - Add field: `roth_conversion_tax` (Decimal)
  - Display in year-by-year table

---

## Phase 4: RMD Calculations (6 tasks)

**Goal:** Implement Required Minimum Distributions starting at age 75.

**Priority:** 🟡 HIGH - Required for accurate age 75+ projections

### Tasks

- [ ] **4.1** Create RMD calculation utility
  - File: `backend/app/utils/rmd_calculator.py`
  - Function: `calculate_rmd_percentage(age: int) -> Decimal`

- [ ] **4.2** Add IRS Uniform Lifetime Table data
  - Age 75: 4.07%
  - Age 76: 3.97%
  - Age 77: 3.88%
  - Age 78: 3.77%
  - Age 79: 3.67%
  - Age 80: 5.35%
  - Age 85: 7.09%
  - Age 90: 10.42%
  - Age 95: 16.39%
  - Full table through age 120+

- [ ] **4.3** Add rmd_start_age to SavedScenario model
  - Field: `rmd_start_age` (Integer, default 75)
  - Field: `rmd_enabled` (Boolean, default True)

- [ ] **4.4** Implement calculate_rmd(age, pretax_balance) method
  - Get RMD percentage for age from table
  - Return: pretax_balance * rmd_percentage
  - Handle ages not in table (use nearest or interpolate)

- [ ] **4.5** Modify withdrawal logic to enforce RMDs
  - Calculate: `spending_withdrawal = total_spending - total_income`
  - Calculate: `rmd_withdrawal = calculate_rmd(age, pretax_balance)` if age >= rmd_start_age
  - Use: `required_withdrawal = max(spending_withdrawal, rmd_withdrawal)`
  - Only applies to pretax accounts

- [ ] **4.6** Add RMD tracking to ScenarioYearProjection schema
  - Add field: `rmd_required` (Boolean)
  - Add field: `rmd_amount` (Decimal)
  - Add field: `excess_rmd` (Decimal) - amount withdrawn beyond spending needs

---

## Phase 5: Spending Model Refinement (5 tasks)

**Goal:** Fix spending calculations to match markdown's model.

**Priority:** 🟢 MEDIUM - Affects accuracy of results

### Tasks

- [ ] **5.1** Fix fixed expense model to be part of total (not additive)
  - Current: `total = base_spending + fixed_expenses` ❌
  - Should be: `total = fixed_expenses + variable_expenses` ✅
  - Variable expenses are what remain after fixed are subtracted from total

- [ ] **5.2** Change spending calculation logic
  - If user sets monthly_spending = $10,000 and has $5,000 fixed expenses:
  - Fixed (not inflation-adjusted) = $5,000
  - Variable (inflation-adjusted) = $5,000
  - NOT: Variable = $10,000 + Fixed = $5,000 = $15,000 total

- [ ] **5.3** Apply inflation only to variable_expenses portion
  - Fixed expenses never inflate (they're loans that get paid off)
  - Variable expenses inflate at inflation_rate each year
  - Total spending = fixed + inflated_variable

- [ ] **5.4** Add dollar amount spending reduction option
  - Current: Only percentage-based reduction
  - Add support for: "Reduce spending by $1,000/month starting year 11"
  - Example: $10,000 → $9,000 (absolute reduction, not percentage)

- [ ] **5.5** Add spending_reduction_type field to SavedScenario
  - Enum: `percentage` or `dollar_amount`
  - If `percentage`: use existing `spending_reduction_percent`
  - If `dollar_amount`: add new field `spending_reduction_amount`

---

## Phase 6: Tax Improvements (7 tasks)

**Goal:** Add Medicare IRMAA, tax bracket indexing, and improved SS taxation.

**Priority:** 🟢 MEDIUM - Improves accuracy

### Tasks

- [ ] **6.1** Add medicare_irmaa_enabled flag to TaxConfig model
  - Field: `irmaa_enabled` (Boolean, default False)
  - Only calculate IRMAA if enabled

- [ ] **6.2** Create IRMAA threshold table for 2024
  - Married Filing Jointly thresholds:
    - Tier 1: $0-$206,000 = $0 surcharge
    - Tier 2: $206,001-$258,000 = $69.90/month ($838.80/year)
    - Tier 3: $258,001-$322,000 = $174.70/month ($2,096.40/year)
    - Tier 4: $322,001-$386,000 = $279.50/month ($3,354/year)
    - Tier 5: $386,001-$750,000 = $384.30/month ($4,611.60/year)
    - Tier 6: $750,001+ = $419.30/month ($5,031.60/year)

- [ ] **6.3** Add IRMAA surcharge amounts per filing status
  - Single thresholds are different (lower): $103k, $129k, $161k, $193k, $500k
  - Store in data file: `data/medicare_irmaa_tables.json`

- [ ] **6.4** Implement calculate_irmaa_surcharge(magi, filing_status) method
  - Input: Modified Adjusted Gross Income (MAGI), filing status
  - Output: Annual IRMAA surcharge amount
  - MAGI = AGI + tax-exempt interest + excluded foreign income

- [ ] **6.5** Add irmaa_surcharge field to ScenarioYearProjection
  - Field: `irmaa_surcharge` (Decimal) - annual IRMAA costs
  - Include in total spending/costs for the year
  - Display in projection table

- [ ] **6.6** Add tax bracket inflation indexing
  - Federal tax brackets should increase by ~2.5% annually
  - Apply indexing factor: `bracket_threshold * (1 + inflation_rate) ^ years`
  - Standard deduction also increases with inflation

- [ ] **6.7** Update SS taxation threshold to inflate annually
  - Current: Fixed $44,000 threshold for 85% taxation
  - Should be: $44,000 * (1 + inflation_rate) ^ years_since_2024
  - Apply same to $32,000 threshold for 50% taxation

---

## Phase 7: Asset Return Corrections (4 tasks)

**Goal:** Update return assumptions to match markdown's Vanguard-based values.

**Priority:** 🟢 MEDIUM - Affects projection accuracy

### Tasks

- [ ] **7.1** Update 10-year projection returns dictionary
  - Location: `retirement_scenario_service.py:382-399`
  - Review all return assumptions against markdown documentation

- [ ] **7.2** Change total_us_stock return assumption
  - Current: 7.5%
  - Should be: 5.2% (Vanguard 10-year outlook for US stocks)
  - Reason: Current high valuations, expected mean reversion

- [ ] **7.3** Change developed_markets return assumption
  - Current: 6.5%
  - Should be: 7.1% (Vanguard 10-year outlook for international developed)
  - Reason: More favorable valuations outside US

- [ ] **7.4** Change emerging_markets return assumption
  - Current: 8.0%
  - Should be: 7.5% (Vanguard 10-year outlook for emerging markets)
  - Keep other assumptions: bonds=4.5%, cash=3.5%

---

## Phase 8: Frontend Updates (7 tasks)

**Goal:** Add UI controls for all new backend features.

**Priority:** 🟢 MEDIUM - User-facing changes

### Tasks

- [ ] **8.1** Add bucket strategy toggle and configuration to scenario form
  - Checkbox: "Use Bucket Strategy"
  - When enabled, show bucket configuration table
  - Allow editing year ranges and return percentages
  - Show default configuration as starting point

- [ ] **8.2** Add Roth conversion fields to scenario form
  - Input: "Annual Roth Conversion Amount" (e.g., $40,000)
  - Input: "Stop Conversions at Age" (default: 75)
  - Checkbox: "Enable Roth Conversions"
  - Show estimated tax impact tooltip

- [ ] **8.3** Add RMD start age field to scenario form
  - Input: "RMD Start Age" (default: 75)
  - Checkbox: "Enforce RMDs" (default: checked)
  - Info tooltip: "Required Minimum Distributions from pretax accounts"

- [ ] **8.4** Add IRMAA toggle to Tax Configuration page
  - Checkbox: "Include Medicare IRMAA Surcharges"
  - Info tooltip explaining IRMAA thresholds
  - Show warning if enabled: "May increase costs at high income levels"

- [ ] **8.5** Update projection results table to show separate account balances
  - Split "Portfolio Balance" column into:
    - Pretax Balance
    - Roth Balance
    - Taxable Balance
    - Total Balance
  - Use color coding: Pretax=blue, Roth=green, Taxable=orange

- [ ] **8.6** Add Roth conversion and RMD columns to projection table
  - Column: "Roth Conv" (annual conversion amount)
  - Column: "Conv Tax" (tax paid on conversions)
  - Column: "RMD Req" (RMD amount if applicable)
  - Column: "Excess RMD" (if RMD > spending needs)

- [ ] **8.7** Add IRMAA surcharge column to projection table
  - Column: "IRMAA" (annual Medicare surcharge)
  - Highlight rows where IRMAA > $0 in yellow
  - Show tooltip with MAGI and tier information

---

## Phase 9: Validation & Testing (8 tasks)

**Goal:** Verify implementation matches markdown expectations.

**Priority:** 🔴 CRITICAL - Validates all work

### Tasks

- [ ] **9.1** Create test scenario matching markdown specifications
  - Name: "Age 66 SS Start - Markdown Baseline"
  - SS Start: Age 66 years 0 months
  - Monthly Spending: $10,000 for years 1-10, $9,000 for years 11-30
  - Projection: 30 years (to age 96)

- [ ] **9.2** Configure test accounts to match markdown
  - Pretax Account 1: $1,134,000
  - Pretax Account 2: $46,000
  - Roth Account 3: $46,000
  - Total: $1,226,000

- [ ] **9.3** Enable bucket strategy with correct return percentages
  - Years 1-3: 3.5% (Cash)
  - Years 4-7: 5.25% (Balanced)
  - Years 8-10: 6.0% (Stocks with foreign tilt)
  - Years 11-30: 10.0% (Historical average)

- [ ] **9.4** Enable Roth conversions matching markdown strategy
  - Annual conversion: $40,000
  - Stop at age: 75 (year 10 of projection)
  - Total conversions: $360,000 over 9 years

- [ ] **9.5** Enable RMDs starting at age 75
  - RMD start age: 75 (year 10)
  - Use IRS Uniform Lifetime Table
  - Verify RMDs don't cause problems (spending exceeds RMDs)

- [ ] **9.6** Run projection and compare Year 10 results (Age 76)
  - Expected with $10k/month spending: ~$780,364 portfolio
  - Expected with $9k/month spending: ~$994,758 portfolio
  - Expected Roth balance: ~$82,000 (if untouched) + conversions
  - Acceptable variance: ±5%

- [ ] **9.7** Run projection and compare Year 30 results (Age 96)
  - Expected with $10k→$9k spending: ~$551,609 portfolio
  - Expected with $9k constant spending: ~$1,733,310 portfolio
  - Expected Roth balance: ~$555,000 (if untouched + conversions)
  - Total SS received: ~$2,028,941
  - Total taxes paid: ~$313,044

- [ ] **9.8** Create and compare Age 67 and Age 70 scenarios
  - Age 67 scenario:
    - Expected final portfolio: ~$1,635,709 at age 96
    - SS start: Age 67 years 0 months ($4,000/month)
  - Age 70 scenario:
    - Expected final portfolio: ~$1,321,144 at age 96
    - SS start: Age 70 years 0 months ($4,960/month)
  - Verify Age 66 strategy wins by ~$412,000 over Age 70

---

## Implementation Notes

### Dependencies Between Phases

1. **Phase 1 must be completed first** - All other features depend on account type segregation
2. **Phases 2, 3, 4 can be done in parallel** after Phase 1
3. **Phase 5, 6, 7 are independent** and can be done anytime
4. **Phase 8 requires** completed backend features to be useful
5. **Phase 9 must be last** - validates everything

### Testing Strategy

- Create unit tests for each calculation method as you implement it
- Create integration tests after each phase
- Final validation in Phase 9 proves correctness

### Documentation Updates Needed

After implementation, update these files:
- `README.md` - Add new features to feature list
- `APP_ARCHITECTURE_PROPOSAL.md` - Update to reflect new models/schemas
- `PHASE_1_CHECKLIST.md` - Mark as complete, create Phase 2 checklist

### Known Challenges

1. **Cost basis tracking for taxable accounts** - May need to add cost_basis field to Account model
2. **Multiple account balances** - Frontend may need significant layout changes
3. **RMD calculations for multiple pretax accounts** - Need to aggregate properly
4. **Roth conversion sequencing** - Which pretax account to convert from?

---

## Progress Tracking

**Overall Progress:** 0 / 54 tasks complete (0%)

### Phase Completion Status

- [ ] Phase 1: Account Type Segregation (0/6)
- [ ] Phase 2: Bucket Strategy (0/5)
- [ ] Phase 3: Roth Conversions (0/6)
- [ ] Phase 4: RMD Calculations (0/6)
- [ ] Phase 5: Spending Model Refinement (0/5)
- [ ] Phase 6: Tax Improvements (0/7)
- [ ] Phase 7: Asset Return Corrections (0/4)
- [ ] Phase 8: Frontend Updates (0/7)
- [ ] Phase 9: Validation & Testing (0/8)

---

## Next Steps

1. Review this roadmap with team/stakeholders
2. Start with Phase 1, Task 1.1
3. Create feature branch: `feature/markdown-alignment`
4. Implement tasks in order
5. Create PR after each phase completion
6. Update this document as you progress

---

**Questions or Issues?** Document them here:

- [ ] Q: Should we support custom bucket configurations or just the default?
- [ ] Q: How to handle Roth conversions across multiple pretax accounts?
- [ ] Q: Should IRMAA calculations use current year MAGI or prior year?
- [ ] Q: Need to decide on cost basis tracking strategy for taxable accounts

