# Product Requirements Document (PRD)
## Retirement Planning Application - Vestas Vault

**Version:** 1.0  
**Last Updated:** February 5, 2026  
**Status:** Draft

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Problem Statement](#problem-statement)
3. [User Personas](#user-personas)
4. [Goals & Success Metrics](#goals--success-metrics)
5. [User Stories & Requirements](#user-stories--requirements)
6. [Feature Specifications](#feature-specifications)
7. [Non-Functional Requirements](#non-functional-requirements)
8. [Out of Scope](#out-of-scope)
9. [Future Considerations](#future-considerations)

---

## Executive Summary

### Product Vision
A comprehensive retirement planning application that helps users optimize their retirement strategy by modeling different scenarios, analyzing Social Security timing, managing account types, and projecting long-term financial outcomes.

### Product Mission
Enable users to make informed retirement decisions by providing accurate, personalized projections that account for Social Security timing, tax implications, account types, spending patterns, and investment strategies.

### Key Value Propositions
- **Accurate Projections**: Model retirement scenarios 30+ years into the future
- **Tax Optimization**: Understand tax implications of different withdrawal strategies
- **Social Security Optimization**: Compare claiming strategies (age 62-70)
- **Account Type Management**: Track and optimize pretax, Roth, taxable, and cash accounts
- **Scenario Comparison**: Compare multiple retirement strategies side-by-side
- **Visual Insights**: See trends over time through graphs and charts

---

## Problem Statement

### The Problem
Retirees and pre-retirees struggle to:
- Determine optimal Social Security claiming age
- Understand tax implications of withdrawal strategies
- Balance spending needs with portfolio longevity
- Optimize account type usage (pretax vs Roth vs taxable)
- Plan for Required Minimum Distributions (RMDs)
- Model different retirement scenarios accurately

### Current Solutions & Gaps
- **Financial Advisors**: Expensive, not always accessible, may not model all scenarios
- **Online Calculators**: Too simplistic, don't account for account types, taxes, or complex strategies
- **Spreadsheets**: Time-consuming, error-prone, difficult to maintain
- **Retirement Software**: Often expensive, complex, or don't support advanced strategies

### Our Solution
A web-based application that:
- Models retirement scenarios with high accuracy
- Accounts for account types, taxes, Social Security, and other income
- Provides visual insights through graphs and charts
- Allows comparison of multiple strategies
- Is accessible, affordable, and easy to use

---

## User Personas

### Primary Persona: Pre-Retiree (Age 60-66)
**Name:** Robert  
**Age:** 66  
**Situation:** Approaching retirement, has accumulated savings in multiple account types

**Goals:**
- Determine optimal Social Security claiming age
- Understand how much they can safely spend
- Optimize tax strategy through account type management
- Plan for 30+ years of retirement

**Pain Points:**
- Uncertainty about Social Security timing
- Confusion about tax implications
- Worry about running out of money
- Need to balance current spending with future security

**Tech Comfort:** Moderate - comfortable with web applications

### Secondary Persona: Retiree (Age 67-75)
**Name:** Susan  
**Age:** 70  
**Situation:** Recently retired, receiving Social Security, managing withdrawals

**Goals:**
- Optimize withdrawal strategy
- Minimize taxes
- Plan for RMDs
- Adjust spending based on portfolio performance

**Pain Points:**
- RMD planning complexity
- Tax bracket management
- Spending adjustments
- Healthcare cost planning

**Tech Comfort:** Moderate - prefers simple, clear interfaces

### Tertiary Persona: Financial Planner
**Name:** Michael  
**Age:** 45  
**Situation:** Financial advisor helping clients plan retirement

**Goals:**
- Model multiple scenarios quickly
- Present clear comparisons to clients
- Export data for client reports
- Demonstrate different strategies

**Pain Points:**
- Time-consuming scenario modeling
- Need for accurate projections
- Client presentation materials
- Keeping up with tax law changes

**Tech Comfort:** High - comfortable with complex tools

---

### Secondary Persona: Pre-Retiree Accumulator (Age 30-50)
**Name:** Jessica  
**Age:** 35  
**Situation:** Early in career, actively saving for retirement, 30+ years until retirement

**Goals:**
- Project retirement savings growth over 30+ years
- Model different contribution strategies
- See impact of different asset allocations during accumulation
- Plan for transition from accumulation to withdrawal phase
- Understand how much to save to reach retirement goals

**Pain Points:**
- Uncertainty about how much to save
- Don't know if current savings rate is sufficient
- Want to see impact of increasing contributions
- Need to plan for different life stages (kids, house, etc.)
- Want to model portfolio changes over time (aggressive early, conservative later)

**Tech Comfort:** Moderate - comfortable with web applications, prefers clear visualizations

**Key Differences from Retirees:**
- Focus on **accumulation** (contributions) vs **withdrawal** (spending)
- Longer time horizon (30+ years vs 30 years)
- Need to model **portfolio evolution** over time (different allocations at different ages)
- Contributions may vary by life stage
- May have multiple goals (retirement, house, kids' education)

---

## Goals & Success Metrics

### Business Goals
1. **Accuracy**: Projections within 5% of actual outcomes (validated against historical data)
2. **Usability**: Users can create their first scenario in under 10 minutes
3. **Adoption**: Users create and compare at least 3 scenarios per session
4. **Retention**: Users return monthly to update scenarios

### User Goals
1. **Confidence**: Users feel confident in their retirement decisions
2. **Understanding**: Users understand the impact of different strategies
3. **Optimization**: Users identify tax optimization opportunities
4. **Planning**: Users create actionable retirement plans

### Success Metrics
- **Time to First Scenario**: < 10 minutes
- **Scenario Creation Rate**: > 3 scenarios per user per month
- **Feature Usage**: > 80% of users use scenario comparison
- **Accuracy**: Projections validated against known scenarios
- **User Satisfaction**: > 4.5/5 rating

---

## User Stories & Requirements

### Epic 1: Account Management
**As a** user  
**I want to** track my retirement accounts  
**So that** I can see my total portfolio and plan withdrawals

#### User Stories
- **US-1.1**: As a user, I want to add accounts with type (pretax, Roth, taxable, cash) so I can track different account types separately
- **US-1.2**: As a user, I want to update account balances so I can keep my portfolio current
- **US-1.3**: As a user, I want to see my total portfolio value by account type so I can understand my asset allocation
- **US-1.4**: As a user, I want to delete accounts so I can remove closed accounts

**Acceptance Criteria:**
- User can create accounts with name, type, and balance
- Account types are validated (pretax, roth, taxable, cash)
- Portfolio totals are calculated correctly
- Account balances can be updated
- Accounts can be deleted

**Status:** ✅ Implemented

---

### Epic 2: Social Security Planning
**As a** user  
**I want to** model different Social Security claiming strategies  
**So that** I can determine the optimal claiming age

#### User Stories
- **US-2.1**: As a user, I want to enter my birth date so the system can calculate my Full Retirement Age (FRA)
- **US-2.2**: As a user, I want to enter my FRA benefit amount so I can see projections
- **US-2.3**: As a user, I want to see benefit amounts for ages 62-70 so I can compare claiming strategies
- **US-2.4**: As a user, I want to see month-by-month projections so I can understand exact benefit amounts
- **US-2.5**: As a user, I want to model partner/spouse Social Security so I can optimize dual benefits

**Acceptance Criteria:**
- FRA is calculated automatically from birth date
- Early/late retirement reductions are calculated correctly
- Projections show monthly amounts for ages 62-70
- COLA adjustments are applied to projections
- Partner/spouse benefits can be modeled (future)

**Status:** ⚠️ Partial (missing partner/spouse support)

---

### Epic 3: Other Income Sources
**As a** user  
**I want to** track income beyond Social Security  
**So that** I can model total retirement income accurately

#### User Stories
- **US-3.1**: As a user, I want to add pension income so I can include it in projections
- **US-3.2**: As a user, I want to add rental income with start/end dates so I can model temporary income
- **US-3.3**: As a user, I want to apply COLA adjustments to income so I can model inflation
- **US-3.4**: As a user, I want to mark income as taxable or non-taxable so taxes are calculated correctly
- **US-3.5**: As a user, I want to see month-by-month income projections so I can plan cash flow

**Acceptance Criteria:**
- User can add income sources with type, amount, dates
- COLA adjustments are applied correctly
- Taxable vs non-taxable income is tracked separately
- Projections show monthly income breakdowns
- Income sources can be updated or deleted

**Status:** ✅ Implemented

---

### Epic 4: Spending Planning
**As a** user  
**I want to** model my retirement spending  
**So that** I can ensure my portfolio lasts

#### User Stories
- **US-4.1**: As a user, I want to set monthly spending so I can model regular expenses
- **US-4.2**: As a user, I want to set annual lump sum spending so I can model large purchases
- **US-4.3**: As a user, I want to specify what monthly dollar amount is subject to inflation so I can model fixed vs variable expenses
- **US-4.4**: As a user, I want to specify loan expenses that are a fixed amount and have a fixed duration
- **US-4.5**: As a user, I want to reduce spending after a certain year so I can model "go-go, slow-go, no-go" phases
- **US-4.6**: As a user, I want to see my total loan and other spending counted as total mothly spending


**Acceptance Criteria:**
- Monthly and annual spending can be set
- Inflation is applied only to variable portion
- Fixed expenses are tracked separately
- Spending reductions can be scheduled
- Total spending is calculated correctly

**Status:** ✅ Implemented

---

### Epic 5: Tax Planning
**As a** user  
**I want to** understand tax implications  
**So that** I can optimize my withdrawal strategy

#### User Stories
- **US-5.1**: As a user, I want to set my filing status so taxes are calculated correctly
- **US-5.2**: As a user, I want to enter deductions so I can see taxable income
- **US-5.3**: As a user, I want to see how much room I have to the next tax bracket so I can optimize Roth conversions
- **US-5.4**: As a user, I want to see total taxes paid over time so I can compare strategies
- **US-5.5**: As a user, I want Medicare IRMAA surcharges calculated so I can plan for healthcare costs

**Acceptance Criteria:**
- Filing status affects tax calculations
- Deductions reduce taxable income
- Tax brackets are calculated correctly
- Distance to next bracket is shown
- IRMAA surcharges are calculated (future)

**Status:** ⚠️ Partial (missing IRMAA, tax bracket indexing)

---

### Epic 6: Scenario Modeling
**As a** user  
**I want to** create and compare retirement scenarios  
**So that** I can choose the best strategy

#### User Stories
- **US-6.1**: As a user, I want to create multiple scenarios so I can compare strategies
- **US-6.2**: As a user, I want to set different Social Security claiming ages so I can compare timing
- **US-6.3**: As a user, I want to set different spending amounts so I can see impact
- **US-6.4**: As a user, I want to set different asset allocations so I can model returns
- **US-6.5**: As a user, I want to compare scenarios side-by-side so I can see differences
- **US-6.6**: As a user, I want to export scenario data so I can share with advisors

**Acceptance Criteria:**
- Multiple scenarios can be created and saved
- Scenarios can be duplicated and modified
- Comparison shows key differences
- Data can be exported (CSV/JSON)
- Scenarios persist across sessions

**Status:** ✅ Implemented

---

### Epic 7: Retirement Projections
**As a** user  
**I want to** see year-by-year projections  
**So that** I can understand long-term outcomes

#### User Stories
- **US-7.1**: As a user, I want to see portfolio balance over time so I can assess viability
- **US-7.2**: As a user, I want to see withdrawals by account type so I can understand strategy
- **US-7.3**: As a user, I want to see taxes paid each year so I can optimize
- **US-7.4**: As a user, I want to see income vs spending so I can identify gaps
- **US-7.5**: As a user, I want to see RMDs when applicable so I can plan

**Acceptance Criteria:**
- Projections show 30+ years
- Account types are tracked separately
- Withdrawals show source account
- Taxes are calculated accurately
- RMDs are calculated at age 75+ (future)

**Status:** ⚠️ Partial (missing account type segregation, RMDs)

---

### Epic 8: Visualizations
**As a** user  
**I want to** see graphs of my projections  
**So that** I can quickly understand trends

#### User Stories
- **US-8.1**: As a user, I want to see Social Security income over time so I can see COLA impact
- **US-8.2**: As a user, I want to see withdrawals by account type over time so I can see strategy
- **US-8.3**: As a user, I want to see taxes paid over time so I can identify high-tax years
- **US-8.4**: As a user, I want to see available spending over time so I can plan
- **US-8.5**: As a user, I want to see distance to next tax bracket so I can optimize conversions
- **US-8.6**: As a user, I want to see portfolio balance over time so I can assess viability

**Acceptance Criteria:**
- Graphs are interactive (zoom, filter)
- Multiple graphs available
- Data is accurate
- Graphs can be exported
- Graphs update when scenarios change

**Status:** ❌ Not Implemented

---

### Epic 9: Accumulation Phase Planning (Secondary)
**As a** pre-retiree accumulator  
**I want to** model my retirement savings growth over time  
**So that** I can plan how much to save and when to retire

#### User Stories
- **US-9.1**: As a user in my 30s, I want to set different portfolio allocations at different ages so I can model aggressive early, conservative later
- **US-9.2**: As a user, I want to set monthly/annual contributions so I can see how savings grow
- **US-9.3**: As a user, I want to change contribution amounts at different life stages so I can model kids, house, etc.
- **US-9.4**: As a user, I want to see when I'll reach my retirement goal so I can plan retirement age
- **US-9.5**: As a user, I want to model portfolio transitions (e.g., aggressive to conservative) so I can plan asset allocation changes
- **US-9.6**: As a user, I want to see accumulation phase projections (30+ years) so I can plan long-term

**Acceptance Criteria:**
- User can set portfolio allocation for different age ranges
- Contributions can be set monthly or annually
- Contribution amounts can change at specified ages/years
- Projections show accumulation phase (contributions, growth)
- Can transition to withdrawal phase at retirement age
- Portfolio allocations can change over time

**Status:** ❌ Not Implemented (Secondary Requirement)

---

### Epic 10: Guardrails & Monitoring
**As a** user  
**I want to** set guardrails and monitor my portfolio  
**So that** I can adjust spending when needed to maintain viability

#### User Stories
- **US-10.1**: As a user, I want to set portfolio balance thresholds so I can trigger spending adjustments
- **US-10.2**: As a user, I want automatic spending reduction when portfolio drops below threshold so I can maintain viability
- **US-10.3**: As a user, I want to see portfolio health metrics so I can monitor progress
- **US-10.4**: As a user, I want alerts when portfolio balance drops below thresholds so I can take action
- **US-10.5**: As a user, I want to track success metrics (portfolio balance targets by age) so I can monitor plan health

**Acceptance Criteria:**
- User can set portfolio balance thresholds
- Spending automatically reduces when threshold breached
- Portfolio health metrics are displayed
- Alerts/warnings shown when thresholds breached
- Success metrics tracked and displayed

**Status:** ❌ Not Implemented (Secondary Requirement)

---

### Epic 11: Stress Testing
**As a** user  
**I want to** test my portfolio against historical market downturns  
**So that** I can understand sequence of returns risk

#### User Stories
- **US-11.1**: As a user, I want to run my scenario using actual historical returns so I can see real-world outcomes
- **US-11.2**: As a user, I want to select specific historical periods (e.g., 2000-2002, 2008-2009) so I can test against known crashes
- **US-11.3**: As a user, I want to use worst-case historical periods so I can see my portfolio's resilience
- **US-11.4**: As a user, I want to compare baseline vs stress test side-by-side so I can see the impact
- **US-11.5**: As a user, I want to see which historical periods would cause portfolio depletion so I can adjust my strategy
- **US-11.6**: As a user, I want to test multiple historical periods at once so I can see a range of outcomes

**Acceptance Criteria:**
- Historical returns are applied year-by-year (not averaged)
- User can select start year for historical period
- System identifies worst-case periods automatically
- Comparison shows baseline vs stress test
- Multiple stress tests can be run simultaneously
- Clear warnings about past performance not predicting future

**Status:** ❌ Not Implemented

---

### Epic 12: Portfolio Management & Rebalancing
**As a** user  
**I want to** manage my portfolio allocation and rebalancing  
**So that** I can maintain my target asset allocation over time

#### User Stories
- **US-12.1**: As a user, I want to set rebalancing frequency (monthly, quarterly, annually) so I can maintain allocation
- **US-12.2**: As a user, I want to see when rebalancing is needed so I can take action
- **US-12.3**: As a user, I want to model rebalancing impact on returns so I can optimize strategy
- **US-12.4**: As a user, I want to see portfolio drift over time so I can plan rebalancing

**Acceptance Criteria:**
- Rebalancing frequency can be set
- System tracks portfolio drift
- Rebalancing impact is modeled in projections
- Rebalancing recommendations are shown

**Status:** ⚠️ Partial (rebalance_frequency field exists, but rebalancing logic not implemented)

---

### Epic 13: Qualified Charitable Distributions (QCDs)
**As a** user  
**I want to** model Qualified Charitable Distributions  
**So that** I can optimize RMDs and reduce taxes

#### User Stories
- **US-13.1**: As a user, I want to set annual QCD amounts so I can reduce taxable RMDs
- **US-13.2**: As a user, I want QCDs to count toward RMDs but not be taxable so I can see tax savings
- **US-13.3**: As a user, I want to see impact of QCDs on taxes so I can optimize giving strategy

**Acceptance Criteria:**
- QCD amounts can be set annually
- QCDs reduce taxable income from RMDs
- QCDs count toward RMD requirement
- Tax savings are calculated and shown

**Status:** ❌ Not Implemented (Secondary Requirement)

---

### Epic 14: Annual Review & Monitoring
**As a** user  
**I want to** perform annual reviews of my retirement plan  
**So that** I can adjust strategy as needed

#### User Stories
- **US-14.1**: As a user, I want an annual review checklist so I can track what to review
- **US-14.2**: As a user, I want to compare actual vs projected returns so I can see if plan is on track
- **US-14.3**: As a user, I want to track portfolio health metrics so I can monitor progress
- **US-14.4**: As a user, I want to see if spending adjustments are needed so I can maintain viability
- **US-14.5**: As a user, I want to review tax planning annually so I can optimize Roth conversions

**Acceptance Criteria:**
- Annual review checklist is provided
- Actual vs projected comparisons are available
- Portfolio health metrics are tracked
- Recommendations for adjustments are provided
- Review items can be checked off

**Status:** ❌ Not Implemented (Secondary Requirement)

---

### Epic 15: Contingency Planning
**As a** user  
**I want to** model contingency scenarios  
**So that** I can plan for unexpected events

#### User Stories
- **US-15.1**: As a user, I want to model market underperformance scenarios so I can plan spending adjustments
- **US-15.2**: As a user, I want to model unexpected major expenses so I can see impact on portfolio
- **US-15.3**: As a user, I want to model health deterioration scenarios so I can plan for accelerated spending
- **US-15.4**: As a user, I want to model market outperformance so I can see opportunities for increased spending/conversions
- **US-15.5**: As a user, I want to see recommended actions for each contingency so I can prepare

**Acceptance Criteria:**
- Multiple contingency scenarios can be modeled
- Recommended actions provided for each scenario
- Impact on portfolio is shown
- Adjustments are suggested

**Status:** ❌ Not Implemented (Secondary Requirement)

---

### Epic 16: Emergency Fund Management
**As a** user  
**I want to** track and manage my emergency fund (Roth account)  
**So that** I can plan for unexpected expenses

#### User Stories
- **US-16.1**: As a user, I want to track Roth account as emergency fund so I can see growth over time
- **US-16.2**: As a user, I want to see when to use Roth vs pretax for emergencies so I can optimize taxes
- **US-16.3**: As a user, I want to model emergency withdrawals from Roth so I can see impact
- **US-16.4**: As a user, I want to see Roth growth targets so I can plan emergency fund size
- **US-16.5**: As a user, I want guidelines for when to use emergency fund so I can make decisions

**Acceptance Criteria:**
- Roth account tracked as emergency fund
- Growth projections shown
- Emergency withdrawal impact modeled
- Usage guidelines provided
- Targets displayed

**Status:** ⚠️ Partial (Roth tracking exists, but emergency fund management features not implemented)

---

## Feature Specifications

### Feature: Accumulation Phase Planning (Secondary)
**Priority:** 🟢 Medium (Secondary Requirement)  
**Status:** ❌ Not Implemented

**Description:**
Support retirement planning for users in accumulation phase (30s-50s) who are saving for retirement, with ability to model different portfolios and contributions over time.

**Requirements:**

#### Portfolio Evolution Over Time
- **Age-Based Allocation Changes:**
  - Set different asset allocations for different age ranges
  - Example: 100% stocks age 30-40, 80/20 stocks/bonds age 40-50, 60/40 age 50-60
  - Smooth transitions or abrupt changes at specified ages
  - Visual timeline showing allocation changes

- **Life Stage Portfolio Changes:**
  - Model portfolio changes based on life events
  - Examples: More conservative after kids, more aggressive after house paid off
  - Link portfolio changes to contribution changes

#### Contributions During Accumulation
- **Monthly/Annual Contributions:**
  - Set contribution amounts (monthly or annual)
  - Specify which account types receive contributions (pretax 401k, Roth IRA, taxable)
  - Model employer matches (e.g., 50% match up to 6% of salary)

- **Contribution Changes Over Time:**
  - Set different contribution amounts at different ages/years
  - Model life stage changes:
    - Reduce contributions during kids' college years
    - Increase contributions after house paid off
    - Catch-up contributions at age 50+
  - Visual timeline showing contribution changes

#### Accumulation Projections
- **Long-Term Growth:**
  - Project portfolio growth over 30+ years
  - Show year-by-year accumulation (contributions + growth)
  - Account for different return assumptions (aggressive early, conservative later)
  - Model tax-advantaged vs taxable account growth separately

- **Retirement Goal Tracking:**
  - Set retirement goal (e.g., $2M by age 65)
  - Show progress toward goal
  - Calculate required contribution to reach goal
  - Show impact of increasing/decreasing contributions

#### Transition to Withdrawal Phase
- **Retirement Age Planning:**
  - Set target retirement age
  - Model transition from accumulation to withdrawal
  - Show portfolio at retirement age
  - Seamlessly transition to withdrawal phase projections

- **Portfolio at Retirement:**
  - Show final accumulation portfolio balance
  - Show breakdown by account type (pretax, Roth, taxable)
  - Use as starting point for withdrawal phase scenarios

**User Value:**
- Plan how much to save
- See impact of different contribution strategies
- Model portfolio evolution over time
- Plan for life stage changes
- Determine if current savings rate is sufficient
- Plan retirement age based on savings progress

**Acceptance Criteria:**
- User can set different asset allocations for different age ranges
- Contributions can be set monthly or annually
- Contribution amounts can change at specified ages
- Projections show 30+ year accumulation phase
- Can set retirement goal and track progress
- Seamlessly transitions to withdrawal phase at retirement age
- Portfolio allocations can change over time

**Example Scenarios:**

1. **Aggressive Early, Conservative Later:**
   - Age 30-40: 100% stocks, $1,000/month contributions
   - Age 40-50: 80/20 stocks/bonds, $1,500/month contributions
   - Age 50-60: 60/40 stocks/bonds, $2,000/month (catch-up)
   - Age 60-65: 50/50 stocks/bonds, $2,000/month
   - Retirement at 65: Transition to withdrawal phase

2. **Life Stage Changes:**
   - Age 30-35: Aggressive, high contributions (no kids)
   - Age 35-45: Reduce contributions (kids, house)
   - Age 45-55: Increase contributions (kids older, house paid)
   - Age 55-65: Maximum contributions (catch-up, empty nest)

3. **Goal-Based Planning:**
   - Current age: 35
   - Current savings: $200,000
   - Goal: $2,000,000 by age 65
   - System calculates: Need $1,500/month contributions
   - User adjusts: Can increase to $2,000/month to retire earlier

**Technical Considerations:**
- Extend projection engine to support accumulation phase
- Add contribution tracking to projection model
- Support multiple portfolio allocations over time
- Link accumulation phase to withdrawal phase scenarios
- Calculate required contributions to reach goals

**Priority Note:** This is a secondary requirement. Core application focuses on withdrawal phase (retirement). Accumulation phase features can be added after core features are complete.

---

### Feature: Guardrails & Spending Adjustments
**Priority:** 🟢 Medium (Secondary Requirement)  
**Status:** ❌ Not Implemented

**Description:**
Automatically adjust spending when portfolio balance drops below specified thresholds to maintain portfolio viability.

**Requirements:**
- **Portfolio Balance Thresholds:**
  - Set threshold balance (e.g., $950,000)
  - When portfolio drops below threshold, trigger spending reduction
  - Reduce discretionary spending by specified percentage (e.g., 10%)
  - Keep fixed expenses unchanged (loan payments, etc.)

- **Spending Adjustment Rules:**
  - Automatic reduction when threshold breached
  - Configurable reduction percentage
  - Apply only to variable/discretionary spending
  - Fixed expenses remain unchanged

- **Monitoring & Alerts:**
  - Show current portfolio balance vs threshold
  - Alert when approaching threshold
  - Alert when threshold breached
  - Show recommended spending adjustments

**User Value:**
- Maintain portfolio viability
- Automatic protection against overspending
- Early warning system
- Peace of mind

**Acceptance Criteria:**
- User can set portfolio balance thresholds
- Spending automatically reduces when threshold breached
- Only discretionary spending is reduced
- Alerts shown when threshold approached/breached
- Recommendations provided

**Example:**
- Threshold: $950,000
- Current balance: $920,000 (below threshold)
- Action: Reduce discretionary spending by 10%
- Result: Spending reduced from $10,000/month to $9,500/month (fixed $5,000 unchanged, variable reduced from $5,000 to $4,500)

---

### Feature: Portfolio Rebalancing
**Priority:** 🟢 Medium  
**Status:** ⚠️ Partial (field exists, logic not implemented)

**Description:**
Maintain target asset allocation over time through periodic rebalancing.

**Requirements:**
- **Rebalancing Frequency:**
  - Monthly, quarterly, annually, or never
  - User-configurable per scenario

- **Rebalancing Logic:**
  - Calculate current allocation vs target allocation
  - Identify drift (deviation from target)
  - Rebalance to target allocation at specified frequency
  - Model impact of rebalancing on returns

- **Rebalancing Display:**
  - Show current vs target allocation
  - Show when rebalancing last occurred
  - Show when next rebalancing is due
  - Show drift percentage

**User Value:**
- Maintain target risk level
- Optimize returns through rebalancing
- Prevent portfolio drift
- Stay aligned with strategy

**Acceptance Criteria:**
- Rebalancing frequency can be set
- Current vs target allocation is shown
- Rebalancing is modeled in projections
- Drift is calculated and displayed
- Rebalancing recommendations provided

---

### Feature: Qualified Charitable Distributions (QCDs)
**Priority:** 🟢 Low (Secondary Requirement)  
**Status:** ❌ Not Implemented

**Description:**
Model Qualified Charitable Distributions from IRAs to reduce taxable RMDs.

**Requirements:**
- **QCD Configuration:**
  - Set annual QCD amount (up to $105,000/year, indexed)
  - QCDs count toward RMD requirement
  - QCDs are not included in taxable income
  - Available starting at age 70½

- **Tax Impact:**
  - Reduce taxable income from RMDs
  - Show tax savings from QCDs
  - Calculate effective tax rate reduction

**User Value:**
- Reduce taxes on RMDs
- Support charitable giving
- Optimize tax strategy
- Maximize after-tax income

**Acceptance Criteria:**
- Annual QCD amount can be set
- QCDs reduce taxable RMD income
- QCDs count toward RMD requirement
- Tax savings are calculated
- Available at age 70½+

**Example:**
- RMD: $50,000
- QCD: $20,000
- Taxable income: $30,000 (instead of $50,000)
- Tax savings: ~$4,400 (at 22% bracket)

---

### Feature: Annual Review & Monitoring
**Priority:** 🟢 Medium (Secondary Requirement)  
**Status:** ❌ Not Implemented

**Description:**
Provide annual review checklist and monitoring tools to track retirement plan health.

**Requirements:**
- **Annual Review Checklist:**
  - Portfolio review (returns vs expected, allocation, rebalancing)
  - Spending review (stayed within budget, major expenses)
  - Tax planning (Roth conversions, bracket management)
  - Social Security check (COLA adjustments, Medicare premiums)
  - Roth conversion decision (if under age 75)
  - Emergency fund status
  - RMD planning (if age 75+)

- **Portfolio Health Metrics:**
  - Track actual vs projected returns
  - Monitor portfolio balance vs targets
  - Track Roth growth vs targets
  - Monitor spending vs plan
  - Track tax efficiency

- **Success Metrics:**
  - Portfolio balance targets by age (e.g., $700K at age 76, $500K at age 86)
  - Roth growth targets (e.g., $100K by age 70, $250K by age 75)
  - Income coverage (SS + withdrawals cover spending)
  - Tax bracket management (staying in target brackets)

- **Recommendations:**
  - Suggest spending adjustments if needed
  - Recommend Roth conversion amounts
  - Suggest rebalancing if drift is significant
  - Alert if metrics are off-track

**User Value:**
- Stay on track with retirement plan
- Identify issues early
- Make informed adjustments
- Peace of mind through monitoring

**Acceptance Criteria:**
- Annual review checklist is provided
- Portfolio health metrics are tracked
- Success metrics are displayed
- Recommendations are provided
- Checklist items can be checked off
- Historical tracking of metrics

---

### Feature: Account Type Segregation
**Priority:** 🔴 Critical  
**Status:** ❌ Not Implemented

**Description:**
Track separate balances for pretax, Roth, taxable, and cash accounts throughout projections instead of aggregating everything.

**Requirements:**
- Projections show separate balances for each account type
- Withdrawals specify which account type is used
- Roth accounts can be preserved (not withdrawn)
- Account type balances are tracked year-by-year

**User Value:**
- Understand tax implications of withdrawals
- Optimize withdrawal sequencing
- Preserve Roth accounts for emergencies
- Plan for RMDs on pretax accounts

**Acceptance Criteria:**
- Projections show pretax_balance, roth_balance, taxable_balance, cash_balance
- Withdrawals specify source account type
- Roth preservation strategy can be configured
- Balances are tracked accurately over time

---

### Feature: Bucket Strategy
**Priority:** 🟡 High  
**Status:** ❌ Not Implemented

**Description:**
Implement time-based return rates that change over the projection period (conservative early, aggressive later).

**Requirements:**
- Years 1-3: 3.5% return (100% Cash)
- Years 4-7: 5.25% return (50/50 Balanced)
- Years 8-10: 6.0% return (100% Stocks)
- Years 11-30: 10.0% return (Historical average)

**User Value:**
- More accurate projections
- Models realistic retirement strategy
- Accounts for near-term safety needs

**Acceptance Criteria:**
- Return rates change based on projection year
- Rates match specified buckets
- Strategy can be enabled/disabled
- Default configuration matches markdown

---

### Feature: Withdrawal Sequencing
**Priority:** 🟡 High  
**Status:** ❌ Not Implemented

**Description:**
Withdraw from accounts in a specific order to optimize taxes and preserve Roth accounts.

**Requirements:**
- Withdraw 100% from pretax accounts first
- Then withdraw from taxable accounts if pretax depleted
- Preserve Roth accounts (only use for emergencies or if configured)
- Track which account type is used for each withdrawal

**User Value:**
- Minimize taxes
- Preserve tax-free Roth accounts
- Optimize long-term strategy

**Acceptance Criteria:**
- Withdrawals come from pretax first
- Roth accounts are preserved by default
- Sequence can be configured
- Withdrawals are tracked by source

---

### Feature: Roth Conversions
**Priority:** 🟡 High  
**Status:** ❌ Not Implemented

**Description:**
Model annual Roth conversions from pretax accounts with tax implications.

**Requirements:**
- Convert specified amount annually (e.g., $40,000/year)
- Conversions stop at age 75 (RMDs begin)
- Tax on conversions is calculated and paid
- Conversions move money from pretax to Roth

**User Value:**
- Optimize taxes before RMDs
- Build tax-free reserves
- Reduce future RMDs

**Acceptance Criteria:**
- Annual conversion amount can be set
- Conversions stop at specified age
- Taxes are calculated correctly
- Pretax balance decreases, Roth increases

---

### Feature: RMD Calculations
**Priority:** 🟡 High  
**Status:** ❌ Not Implemented

**Description:**
Calculate Required Minimum Distributions starting at age 75.

**Requirements:**
- RMDs start at age 75
- Use IRS Uniform Lifetime Table
- Calculate RMD from pretax account balance
- Enforce minimum withdrawal if RMD > spending needs

**User Value:**
- Plan for required withdrawals
- Understand tax implications
- Avoid penalties

**Acceptance Criteria:**
- RMD percentage is correct for age
- RMD is calculated from pretax balance
- Minimum withdrawal is enforced
- RMDs are shown in projections

---

### Feature: Partner/Spouse Social Security
**Priority:** 🟡 High  
**Status:** ❌ Not Implemented

**Description:**
Support dual Social Security benefits for married couples.

**Requirements:**
- Track both spouses' Social Security
- Calculate spousal benefits (up to 50% of higher earner)
- Calculate survivor benefits (up to 100% of deceased spouse)
- Model coordination strategies (one claims early, one delays)

**User Value:**
- Optimize dual benefits
- Plan for survivor benefits
- Coordinate claiming strategies

**Acceptance Criteria:**
- Both spouses' SS can be entered
- Spousal benefits are calculated correctly
- Survivor benefits are calculated correctly
- Coordination strategies can be modeled

---

### Feature: Time-Series Visualizations
**Priority:** 🟢 Medium  
**Status:** ❌ Not Implemented

**Description:**
Provide graphs showing retirement projections over time.

**Requirements:**
- Social Security income over time
- Withdrawals by account type over time
- Taxes paid over time
- Available spending over time
- Distance to next tax bracket over time
- Portfolio balance over time
- Income vs spending over time

**User Value:**
- Quickly understand trends
- Identify optimization opportunities
- Visualize long-term outcomes
- Share insights with advisors

**Acceptance Criteria:**
- Graphs are interactive
- Data is accurate
- Multiple graphs available
- Graphs can be exported
- Graphs update with scenario changes

---

### Feature: Historical Stress Testing
**Priority:** 🟡 High  
**Status:** ❌ Not Implemented

**Description:**
Test portfolio scenarios using actual historical market returns, particularly periods with poor initial performance, to understand sequence of returns risk.

**Requirements:**

#### Historical Period Selection

**Available Data:**
- Year-by-year historical returns: **1970-2025 (55 years)**
- Data includes: S&P 500, International stocks, Small cap value, Bonds, Money market
- All asset classes have complete data for this period

**Recommended Periods:**

1. **Last 30 Years (1996-2025) - DEFAULT** ⭐
   - **Rationale**: Most relevant to current market structure
   - **Includes**: Dot-com crash (2000-2002), Financial crisis (2008-2009), COVID (2020), Recent inflation (2022)
   - **Market cycles**: 3-4 complete cycles
   - **Relevance**: High - modern market structure, current regulations, similar to today
   - **Best for**: Most users, current retirees, modern portfolio strategies

2. **Last 50 Years (1976-2025) - OPTION**
   - **Rationale**: More market cycles, includes high inflation period
   - **Includes**: 1970s stagflation, 1980s recovery, all modern crises
   - **Market cycles**: 5-6 complete cycles
   - **Relevance**: High - still modern enough, includes inflation scenarios
   - **Best for**: Users concerned about inflation, longer-term planning

3. **All Available (1970-2025) - OPTION**
   - **Rationale**: Maximum data coverage, includes 1970s oil crisis
   - **Includes**: 1970s oil crisis/stagflation, all subsequent periods
   - **Market cycles**: 6+ complete cycles
   - **Relevance**: Moderate - 1970s market structure was different (fixed exchange rates, different regulations)
   - **Best for**: Maximum stress testing, academic analysis, worst-case scenarios

**User Selection:**
- Default: Last 30 years (most relevant)
- Option: User can select period range (30, 50, or all available)
- Option: User can select custom start/end years

**Automatic Worst-Case Finder:**
- System automatically identifies worst-case periods from selected range
- Ranked by:
  - Worst 10-year periods (lowest cumulative return)
  - Worst 5-year periods (lowest cumulative return)
  - Worst 3-year periods (lowest cumulative return)
  - Periods with worst first-year performance (sequence risk)
- Analysis runs on selected period range (default: last 30 years)

**Range Analysis:**
- Run multiple stress tests simultaneously
- Show range of outcomes (best, worst, median)
- Display distribution of final portfolio balances
- Identify success rate (% of periods where portfolio survives)

#### Return Application Method
- **Year-by-Year Application:**
  - Apply actual historical returns for each year from selected period
  - Map asset classes to historical data:
    - `total_us_stock` → S&P 500 returns
    - `total_foreign_stock` → MSCI EAFE returns
    - `us_small_cap_value` → Small Cap Value returns
    - `bonds` → Total US Bond returns
    - `short_term_treasuries` → Money Market/T-Bill returns
    - `cash` → Money Market/T-Bill returns

- **Blended Returns:**
  - Calculate blended return based on asset allocation
  - Apply blended return to total portfolio
  - Maintain account type segregation (if implemented)

- **Data Extension:**
  - When historical period ends before projection completes:
    - Use average returns from selected period range for remaining years
    - Calculate average return for each asset class from selected range (e.g., 1996-2025 for 30-year default)
    - Apply average returns to complete projection
  - Example: If stress test uses 2000-2009 (10 years) but projection is 30 years:
    - Years 1-10: Use actual 2000-2009 returns
    - Years 11-30: Use average returns from selected period range (default: 1996-2025)
  
- **Period Range Selection:**
  - User selects period range: 30 years, 50 years, or all available (1970-2025)
  - Average returns calculated from selected range
  - Worst-case finder searches within selected range
  - Default: Last 30 years (1996-2025) for maximum relevance

#### Comparison & Analysis
- **Range Analysis (Multiple Stress Tests):**
  - Automatically run multiple worst-case periods from last 30 years
  - Show range of outcomes:
    - **Best Case**: Highest final portfolio balance
    - **Worst Case**: Lowest final portfolio balance (may be negative/depleted)
    - **Median Case**: Middle outcome
    - **25th Percentile**: Lower quartile
    - **75th Percentile**: Upper quartile
  
- **Key Metrics for Each Period:**
  - Final portfolio balance
  - Years until depletion (if applicable)
  - Minimum portfolio balance reached
  - Total withdrawals possible
  - Success/Failure indicator (portfolio survives 30 years)

- **Summary Statistics:**
  - Success rate: % of stress test periods where portfolio survives
  - Average final balance across all stress tests
  - Worst-case final balance
  - Range: Best-case minus worst-case

- **Baseline Comparison:**
  - Always show baseline scenario alongside stress test range
  - Highlight if baseline falls within stress test range
  - Show how baseline compares to worst/median/best cases

#### User Interface
- **Stress Test Configuration:**
  - **Period Range Selection:**
    - Radio buttons or dropdown: "Last 30 years (1996-2025)" [Default] ⭐
    - Radio buttons or dropdown: "Last 50 years (1976-2025)"
    - Radio buttons or dropdown: "All available (1970-2025)"
    - Info tooltip: Explains relevance and what each period includes
  
  - **Test Options:**
    - Button: "Run Stress Test" (automatically finds worst cases from selected range)
    - Option: Select number of periods to test (default: 10 worst periods)
    - Option: Filter by period length (3-year, 5-year, 10-year, or all)
    - Option: "Include notable periods" checkbox (2000-2002, 2008-2009, 1973-1974, etc.)
    - Option: "Show individual results" checkbox (show each period separately)
  
  - **Help Text:**
    - "Last 30 years recommended for most users - most relevant to current market conditions"
    - "Last 50 years includes 1970s stagflation period - useful for inflation stress testing"
    - "All available includes maximum historical data - useful for worst-case analysis"

- **Results Display:**
  - **Summary Panel:**
    - Success rate: "X out of Y periods result in portfolio survival"
    - Range: Best-case to worst-case final balance
    - Baseline comparison: Where baseline falls in the range
    - Key insight: "Your portfolio survives X% of worst-case scenarios"
  
  - **Range Visualization:**
    - Graph: Portfolio balance over time showing:
      - Baseline (solid line)
      - Best case (upper bound, dashed)
      - Worst case (lower bound, dashed)
      - Median (dotted line)
      - Shaded area showing 25th-75th percentile range
  
  - **Comparison Table:**
    - Columns: Period, Start Year, Final Balance, Min Balance, Depletion Year, Status
    - Sortable by any column
    - Highlight worst-case period
    - Show baseline row for comparison
  
  - **Distribution Chart:**
    - Histogram or box plot showing distribution of final balances
    - Mark baseline position
    - Show percentiles
  
  - **Warning:** "Past performance does not predict future results. These stress tests use actual historical returns from the last 30 years."

**User Value:**
- Understand sequence of returns risk
- Test portfolio resilience
- Identify potential failure modes
- Make informed decisions about spending/strategy
- Build confidence in retirement plan

**Acceptance Criteria:**
- Historical returns are applied year-by-year accurately
- Asset class mapping is correct
- Multiple historical periods can be tested
- Comparison shows clear differences
- Results are clearly labeled and explained
- Warnings about past performance are displayed

**Technical Considerations:**
- Use `data/historical_returns.csv` for year-by-year data (1970-2025, 55 years)
- Handle periods where data may be incomplete (use average returns)
- Map current asset allocation to historical asset classes:
  - `total_us_stock` → "Total US Stock (S&P 500)"
  - `total_foreign_stock` → "Intl. Stock (MSCI EAFE)"
  - `us_small_cap_value` → "US Small Cap Value"
  - `bonds` → "Total US Bond (Agg)"
  - `short_term_treasuries` → "Money Market (3-Mo T-Bill)"
  - `cash` → "Money Market (3-Mo T-Bill)"
- Support projections longer than available historical data (use average returns)
- Calculate blended returns based on allocation
- Default to last 30 years (1996-2025) for maximum relevance
- Allow user to select period range (30, 50, or all available years)

**Example Scenarios:**

1. **Automatic Worst-Case Analysis:**
   - User clicks "Run Stress Test"
   - System identifies worst 10 periods from 1996-2025:
     - Worst 10-year: 2000-2009 (Dot-com + Financial crisis)
     - Worst 5-year: 2000-2004
     - Worst 3-year: 2000-2002
     - Worst first-year: 2008 (-37%)
     - Additional periods ranked by cumulative return
   - Run projection for each period:
     - Years 1-N: Use actual historical returns
     - Years N+1-30: Use average returns from 1996-2025
   - Display range: Best-case $1.2M, Worst-case $200K, Median $800K
   - Show baseline ($1.0M) falls at 60th percentile

2. **Range Visualization:**
   - Graph shows portfolio balance over 30 years
   - Baseline line: Steady growth to $1.0M
   - Shaded area: Range from worst-case ($200K) to best-case ($1.2M)
   - Median line: Middle outcome ($800K)
   - User can see: "Even in worst case, portfolio survives but is significantly reduced"

3. **Success Rate Analysis:**
   - Test 20 worst periods from last 30 years
   - Results: 18 periods show portfolio survival, 2 show depletion
   - Success rate: 90%
   - Insight: "Your strategy works in 90% of worst-case scenarios"
   - Recommendation: "Consider reducing spending by 10% to improve success rate to 95%"

---

## Non-Functional Requirements

### Performance
- **Page Load Time**: < 2 seconds
- **Projection Generation**: < 5 seconds for 30-year projection
- **Graph Rendering**: < 1 second
- **API Response Time**: < 500ms for standard endpoints

### Security
- **Data Privacy**: All data stored locally (no cloud sync required)
- **Input Validation**: All inputs validated on frontend and backend
- **SQL Injection Prevention**: Use parameterized queries
- **XSS Prevention**: Sanitize all user inputs

### Usability
- **Accessibility**: WCAG 2.1 AA compliance
- **Mobile Responsive**: Works on tablets and phones
- **Error Messages**: Clear, actionable error messages
- **Help Text**: Contextual help available

### Reliability
- **Uptime**: 99.9% availability
- **Data Persistence**: All data saved to database
- **Error Recovery**: Graceful error handling
- **Backup**: Database backups daily

### Scalability
- **Concurrent Users**: Support 100+ concurrent users
- **Data Volume**: Handle 1000+ scenarios per user
- **Projection Years**: Support up to 50-year projections

---

## Out of Scope

### Explicitly Excluded
- **Monte Carlo Simulations**: Not in initial scope (future consideration)
- **Real-time Market Data**: Uses static projections
- **Multi-user Collaboration**: Single-user application
- **Mobile App**: Web application only
- **Financial Advice**: Tool for planning, not advice
- **Account Aggregation**: Manual entry only
- **Bill Pay**: Not a banking application

### Secondary Requirements (Lower Priority)
- **Accumulation Phase Planning**: Features for users saving for retirement (30s-50s)
  - Different portfolios at different times
  - Contributions during accumulation phase
  - Long-term growth projections (30+ years)
  - Retirement goal tracking
  - **Note**: Core application focuses on withdrawal phase. Accumulation features can be added after core features are complete.

---

## Future Considerations

### Phase 2 Features (Post-MVP)
- Monte Carlo simulations
- Guardrail rules (spending adjustments)
- What-if scenario comparisons
- Advanced tax strategies
- Estate planning features
- Historical stress testing (using actual year-by-year returns)

### Phase 3 Features (Secondary Requirements)
- **Accumulation Phase Planning:**
  - Different portfolios at different times (age-based allocation changes)
  - Contributions during accumulation phase (monthly/annual)
  - Contribution changes over time (life stage modeling)
  - Long-term growth projections (30+ years)
  - Retirement goal tracking
  - Transition from accumulation to withdrawal phase
  - **Priority**: Lower - focus on withdrawal phase first

- **Guardrails & Monitoring:**
  - Portfolio balance thresholds
  - Automatic spending adjustments
  - Portfolio health metrics tracking
  - Success metrics monitoring
  - Annual review checklist

- **Portfolio Management:**
  - Rebalancing logic and modeling
  - Portfolio drift tracking
  - Rebalancing recommendations

- **Advanced Tax Strategies:**
  - Qualified Charitable Distributions (QCDs)
  - QCD impact on RMDs and taxes

- **Monitoring & Contingency Planning:**
  - Contingency scenario modeling (market underperformance, unexpected expenses, health issues)
  - Emergency fund management (Roth account tracking and usage guidelines)
  - Recommended actions for different scenarios

### Integration Opportunities
- Financial institution APIs (read-only)
- Tax software integration
- Financial advisor portal
- Export to common formats

---

## Appendix

### Related Documents
- `ARCHITECTURE.md` - System architecture and technical design
- `IMPLEMENTATION_ROADMAP.md` - Detailed implementation plan
- `COMPLETE_RETIREMENT_ANALYSIS.md` - Business analysis and strategies
- `SETUP_GUIDE.md` - Developer setup instructions

### Change Log
- **2026-02-05**: Initial PRD created

---

**Document Owner:** Product Team  
**Reviewers:** Engineering, Design, Business  
**Next Review Date:** TBD
