# Product Requirements Document (PRD)
## Retirement Planning Application - Vestas Vault

**Version:** 1.2
**Last Updated:** April 11, 2026
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
10. [Strategic Direction: Future Planners, SaaS & Deployment](#strategic-direction-future-planners-saas--deployment)

---

## Executive Summary

### Product Vision
A comprehensive retirement planning application that helps **current and future retirees** optimize their strategy by modeling scenarios, analyzing Social Security timing, managing account types, and projecting long-term outcomes—including **years or decades before retirement** when allocation and contributions change over time.

### Product Mission
Enable users to make informed retirement decisions by providing accurate, personalized projections that account for Social Security timing, tax implications, account types, spending patterns, and investment strategies—whether they are **already retired** or **planning toward a future retirement date**.

### Key Value Propositions
- **Accurate Projections**: Model retirement scenarios 30+ years into the future
- **Tax Optimization**: Understand tax implications of different withdrawal strategies
- **Social Security Optimization**: Compare claiming strategies (age 62-70)
- **Account Type Management**: Track and optimize pretax, Roth, taxable, and cash accounts
- **Scenario Comparison**: Compare multiple retirement strategies side-by-side
- **Visual Insights**: See trends over time through graphs and charts
- **Phased allocation**: Model different asset mixes over defined calendar or plan-year ranges (see [Strategic Direction](#strategic-direction-future-planners-saas--deployment))
- **SaaS readiness**: Authenticated users, account management, and optional paid access (see same section)

---

## Strategic Direction: Future Planners, SaaS & Deployment

This section captures **product direction** agreed for 2026: the app should serve people **planning retirement in the future**, not only those already in the withdrawal phase; the product should be **commercializable** (sign-in, user lifecycle, payments); and **deployment** will align with a **separate hosting platform** under development.

### Future retirement planning (pre-retirement)
- Treat **accumulation and glide-path years** as first-class, alongside today’s withdrawal-focused flows.
- Users should be able to set a **retirement start** (or plan anchor) and see projections that include years **before** that date (savings, growth, changing assumptions) and **after** (spending, taxes, withdrawals).
- Requirements that today live under “secondary” accumulation planning should be **prioritized and specified** for implementation order—not deferred indefinitely.

### Time-period asset allocation
- Users must be able to define **one or more allocation schedules** per scenario (or per plan), each with:
  - **Effective range**: calendar years and/or plan years (e.g. ages 35–49, 50–59, 60–retirement).
  - **Allocation**: same asset-class keys as today’s scenario allocation, summing to 100% within each band.
  - **Behavior at boundaries**: step change on band boundary (MVP); optional smooth glide (future).
- Projection and Monte Carlo engines must apply the **allocation in force for that year** when computing returns (and volatility where used).
- UX: timeline or table editor, validation (no gaps/overlaps or explicit overlap rules), preview of effective mix by year.

### User identity and account management
- **Authentication**: sign-up, sign-in, sign-out, password reset (or delegated identity provider); secure session handling.
- **User profile**: minimal PII; preference for email as identifier; regional/tax jurisdiction where relevant.
- **Data tenancy**: each user’s scenarios, accounts, and configuration are **isolated** to that user (no cross-user reads).
- **Administration (phase 2+)**: optional internal tools for support (read-only user lookup, subscription status)—scope TBD.

### Monetization (charging for use)
- **Business model TBD** (examples: flat subscription, tiered plans, trial + paywall, usage-based limits on simulations).
- **Requirements**:
  - Integrate a **payment provider** (e.g. Stripe or equivalent) for checkout, invoices, and webhooks.
  - Map **subscription or entitlement state** to product features (e.g. max scenarios, Monte Carlo runs, export).
  - **Grace period / failed payment** handling and read-only or degraded access policy (product decision).
  - Clear **billing page** and cancellation flow; compliance with tax receipts where applicable.
- **Privacy**: payment data handled only by the provider; app stores tokens/ids, not full card numbers.

### Deployment and hosting
- **Short term**: continue current deployment model (e.g. Docker) for development and demos.
- **Long term**: deployment target is **TBD** and will follow a **separately developed organization-wide platform for hosting applications**. This product should:
  - Keep **12-factor** style configuration (env-based secrets, stateless app, external database).
  - Avoid hard-coding a single vendor; document **interfaces** (health checks, migrations, background jobs) the hosting platform must support.
- **Until the hosting platform exists**: no commitment to a specific cloud or PaaS in this PRD; revisit when the platform’s contract is defined.

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

### Co-Primary Persona: Future Planner / Accumulator (Age 30–55)
**Name:** Jessica
**Age:** 35
**Situation:** Mid-career, **retirement is 20–30+ years away**; actively saving; expects **allocation and contribution rates to change** by life stage and calendar period.

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

**Key Differences from Near-Retirees / Retirees:**
- Focus on **accumulation** (contributions) and **glide path** vs **withdrawal** (decumulation)
- Longer time horizon; must support **plan-years before retirement** as clearly as years after
- **Time-segmented asset allocation** is a core expectation (see [Strategic Direction](#strategic-direction-future-planners-saas--deployment))
- Contributions may vary by life stage; may have multiple goals (retirement, housing, education)

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
- Partner/spouse benefits can be modeled (dual SS, spousal 50%, own vs ½ partner's, default scenario ages)
- COLA applied from current date to benefit start year (and each year after) in scenario projections; SS page shows primary and spouse projections by start age

**Status:** ✅ Implemented (incl. partner/spouse benefits, default scenario ages, COLA from current date to start)

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
- **US-4.7**: As a user, I want to model medical expenses separately from general spending so I can plan healthcare costs more accurately
- **US-4.8**: As a user, I want a separate medical inflation assumption so healthcare costs can grow differently than CPI


**Acceptance Criteria:**
- Monthly and annual spending can be set
- Inflation is applied only to variable portion
- Fixed expenses are tracked separately
- Spending reductions can be scheduled
- Total spending is calculated correctly
- Medical expenses can be modeled as a separate category
- Medical inflation rate can be configured separately from general inflation

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

**Status:** ⚠️ Partial — Account type segregation and withdrawals by type done; RMDs not yet implemented.

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

### Epic 9: Accumulation Phase & Future Retirement Planning
**As a** user planning retirement in the future
**I want to** model savings growth, changing contributions, and **asset allocation by time period**
**So that** I can plan how much to save, when to retire, and how risk should evolve before retirement

#### User Stories
- **US-9.1**: As a user, I want to set **different portfolio allocations for specific calendar or plan-year ranges** so I can model aggressive early, conservative later (and any staged glide path)
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

**Status:** ❌ Not Implemented — **Priority raised**: required for “future planner” positioning (see [Strategic Direction](#strategic-direction-future-planners-saas--deployment)); sequencing vs Epic 17 to be set in roadmap.

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

### Epic 11: Stress Testing & Monte Carlo
**As a** user
**I want to** test my portfolio against historical downturns and probabilistic outcomes
**So that** I can understand sequence-of-returns risk and the range of possible futures

#### User Stories — Historical Stress Testing
- **US-11.1**: As a user, I want to run my scenario using actual historical returns so I can see real-world outcomes
- **US-11.2**: As a user, I want to select specific historical periods (e.g., 2000-2002, 2008-2009) so I can test against known crashes
- **US-11.3**: As a user, I want to use worst-case historical periods so I can see my portfolio's resilience
- **US-11.4**: As a user, I want to compare baseline vs stress test side-by-side so I can see the impact
- **US-11.5**: As a user, I want to see which historical periods would cause portfolio depletion so I can adjust my strategy
- **US-11.6**: As a user, I want to test multiple historical periods at once so I can see a range of outcomes

#### User Stories — Monte Carlo Simulations
- **US-11.7**: As a user, I want to run Monte Carlo simulations so I can see a distribution of outcomes (e.g., success rate, percentiles)
- **US-11.8**: As a user, I want to set the number of simulations and time horizon so I can balance speed vs insight
- **US-11.9**: As a user, I want to see success rate (e.g., % of paths where portfolio survives) so I can gauge plan robustness
- **US-11.10**: As a user, I want to see percentile outcomes (e.g., 10th, 50th, 90th final balance) so I can plan for a range of futures
- **US-11.11**: As a user, I want return assumptions (mean, volatility, possibly correlation) to drive the simulations so results reflect my asset allocation

**Acceptance Criteria:**
- **Historical:** Returns applied year-by-year; user can select period; worst-case finder; baseline vs stress comparison; warnings about past performance
- **Monte Carlo:** User can run N simulations over projection horizon; success rate and percentile outcomes (e.g., 10th/50th/90th) shown; assumptions configurable or derived from scenario; clear labeling that outcomes are probabilistic

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

### Epic 17: Identity, Subscriptions & Billing (SaaS)
**As a** product operator
**I want** authenticated users and a way to charge for access
**So that** the application can be offered as a sustainable commercial service

#### User Stories
- **US-17.1**: As a new user, I want to create an account and sign in so my data is private to me.
- **US-17.2**: As a user, I want to reset my password (or use SSO) so I can recover access securely.
- **US-17.3**: As a user, I want to subscribe or purchase a plan so I can use premium features within clear limits.
- **US-17.4**: As a user, I want to manage billing (payment method, invoices, cancel) so I stay in control of charges.
- **US-17.5**: As a user, I want entitlements enforced transparently (e.g. which features require paid tier) so expectations are clear.

**Acceptance Criteria:**
- All scenario, account, and projection data are scoped to the authenticated user.
- Sessions are secure; credentials are never stored in plain text.
- Payment integration supports subscription lifecycle (active, past_due, canceled) via provider webhooks.
- Feature flags or limits derived from subscription state are documented and testable.

**Status:** ❌ Not Implemented

---

## Feature Specifications

### Feature: Accumulation Phase Planning
**Priority:** 🟡 High (core to “future planner” positioning; pairs with [Time-Period Asset Allocation](#feature-time-period-asset-allocation-cross-phase))
**Status:** ❌ Not Implemented

**Description:**
Support retirement planning for users **before and through** retirement: accumulation, changing contributions, and (with time-period allocation) evolving portfolio mix—then transition into withdrawal modeling.

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

**Priority note:** Sequencing vs **authentication / billing (Epic 17)** is a roadmap decision; time-period allocation should land early because withdrawal-only users also benefit (e.g. post-retirement glide).

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
**Status:** ✅ Implemented

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
**Status:** ⚠️ Partial — **Strategy A** and **Strategy B** implemented (A: 3yr cash, 4yr balanced, growth; B: 1yr cash, 5yr bonds, stocks). Rebalancing, refill, and withdrawal sequencing in place. **Remaining:** Scenario builder locking (when bucket is on, fix cash/bond allocation and only allow editing stock allocation for remaining assets) not yet implemented.

**Description:**
Implement a dynamic bucket strategy that organizes retirement assets into separate buckets based on time horizon and risk tolerance, with intelligent rebalancing and withdrawal sequencing that responds to market conditions. This strategy protects near-term spending needs while allowing long-term growth assets to recover from market downturns.

**Background:**
The bucket strategy (also known as time-segmented portfolio strategy) divides retirement assets into separate buckets, each invested according to when the money will be needed. Unlike a simple time-based return approach, this strategy includes dynamic rebalancing logic that responds to market performance, avoiding forced selling of depressed assets during market downturns.

**Bucket Structure:**

**Strategy A: 3-Year Cash / 4-Year Balanced / Growth (default)**

The portfolio is divided into three buckets:

1. **Bucket 1 - Cash (Years 1-3):**
   - **Initial Allocation:** 3 years of spending needs
   - **Asset Allocation:** 100% Cash / Money Market
   - **Expected Return:** 3.5% (VMFXX - Vanguard Money Market)
   - **Purpose:** Provides immediate liquidity to avoid selling assets during market downturns

2. **Bucket 2 - Balanced (Years 4-7):**
   - **Initial Allocation:** 4 years of spending needs
   - **Asset Allocation:** 50% Stocks / 50% Bonds
   - **Expected Return:** 5.25% (blended return)
   - **Purpose:** Intermediate-term assets with moderate risk

3. **Bucket 3 - Growth (Years 8+):**
   - **Initial Allocation:** Remaining portfolio balance
   - **Asset Allocation:** 100% Stocks (with international diversification)
   - **Expected Return:** 6.0% (years 8-10), 10.0% (years 11+)
   - **Purpose:** Long-term growth assets with minimal near-term withdrawal pressure

**Strategy B: 1-Year Cash / 5-Year Bonds / Stocks**

Alternative bucket structure for users who prefer a smaller cash buffer and a dedicated bond bucket:

1. **Bucket 1 - Cash (1 year):**
   - **Initial Allocation:** 1 year of spending needs
   - **Asset Allocation:** 100% Cash / Money Market
   - **Expected Return:** ~3.5% (e.g. Vanguard Money Market)
   - **Purpose:** Minimal near-term liquidity; more capital in bonds and stocks

2. **Bucket 2 - Bonds (Years 2–6):**
   - **Initial Allocation:** 5 years of spending needs
   - **Asset Allocation:** 100% Bonds (e.g. intermediate-term, aggregate)
   - **Expected Return:** ~4–5% (bond market assumptions)
   - **Purpose:** Stable income and capital for years 2–6; no equity in this bucket

3. **Bucket 3 - Stocks (Remaining):**
   - **Initial Allocation:** Remaining portfolio balance
   - **Asset Allocation:** 100% Stocks (with international diversification)
   - **Expected Return:** Per long-term equity assumptions (e.g. 6–10% depending on horizon)
   - **Purpose:** Long-term growth; withdrawn only after cash and bonds are used or per rebalancing rules

**Withdrawal sequencing for Strategy B:** Withdraw spending from Bucket 1 (Cash) first, then from Bucket 2 (Bonds), then from Bucket 3 (Stocks). Rebalancing and refill rules (e.g. when to top up cash from bonds or stocks) can mirror Strategy A’s logic or be simplified (e.g. annual refill of cash from bonds, then from stocks if needed).

**Withdrawal Sequencing:**

- **Primary Source:** Always withdraw from Bucket 1 (Cash) first
- **Rationale:** Preserves growth assets and avoids forced selling during market downturns
- **Annual Process:** Each year, withdraw annual spending needs from Bucket 1

**Rebalancing Logic:**

The strategy includes dynamic rebalancing that responds to market conditions:

#### Scenario 1: Stocks Increase (Bull Market)

**When:** Stock returns are positive for the year

**Actions:**
1. **Withdraw annual spending** from Bucket 1 (Cash)
2. **Move excess from Bucket 3 to Bucket 1:** If Bucket 3 (Stocks) has grown, transfer enough to maintain 3 years of spending in Bucket 1
3. **Rebalance Bucket 2:** Rebalance the 50/50 allocation back to target if drift has occurred
4. **Rebalance Bucket 3:** Ensure Bucket 3 maintains target stock allocation

**Example:**
- Bucket 1 has 2 years remaining after withdrawal
- Bucket 3 stocks increased 15%
- Transfer 1 year of spending from Bucket 3 to Bucket 1
- Rebalance Bucket 2 to 50/50

#### Scenario 2: Stocks Decrease (Bear Market)

**When:** Stock returns are negative for the year

**Actions:**
1. **Withdraw annual spending** from Bucket 1 (Cash) only
2. **Do NOT sell stocks:** Do not transfer from Bucket 3 (Stocks) to Bucket 1
3. **Rebalance Bucket 2:** Rebalance the 50/50 allocation back to target (may involve selling bonds to buy stocks if stocks are down)
4. **Wait for recovery:** Allow Bucket 3 stocks to recover before refilling cash

**Rationale:** Avoids locking in losses by selling depressed stocks

**Example:**
- Bucket 1 has 2 years remaining after withdrawal
- Bucket 3 stocks decreased 20%
- Do NOT transfer from Bucket 3
- Rebalance Bucket 2 to 50/50 (buy stocks with bond proceeds if stocks are down)

#### Scenario 3: Stocks Recover After Decline

**When:** Stocks have recovered to previous high (or exceeded it) after a decline

**Actions:**
1. **Refill Bucket 1:** Transfer enough from Bucket 3 to restore 3 years of spending in Bucket 1
2. **Rebalance Bucket 2:** Ensure 50/50 allocation is maintained
3. **Continue normal operations:** Resume Scenario 1 logic going forward

**Example:**
- Bucket 1 has 1 year remaining
- Bucket 3 stocks have recovered to pre-decline levels
- Transfer 2 years of spending from Bucket 3 to Bucket 1 (restore to 3 years)
- Rebalance Bucket 2 to 50/50

#### Scenario 4: Cash Exhausted, Stocks Still Down

**When:** Bucket 1 (Cash) is depleted but stocks have not yet recovered

**Actions:**
1. **Withdraw from Bucket 2 bonds:** Take 1 year of spending from the bond portion of Bucket 2 (50/50)
2. **Rebalance Bucket 2:** After withdrawal, rebalance remaining Bucket 2 assets back to 50/50
3. **Continue waiting:** Do not sell stocks from Bucket 3 until they recover
4. **Monitor:** Track Bucket 2 depletion and Bucket 3 recovery status

**Rationale:** Uses intermediate-term bonds before forcing stock sales, giving stocks more time to recover

**Example:**
- Bucket 1 is empty
- Bucket 3 stocks are still down 15% from peak
- Withdraw 1 year of spending from Bucket 2 bonds
- Rebalance Bucket 2 remaining assets to 50/50
- Continue monitoring for stock recovery

**Edge Cases:**

- **Bucket 2 Exhausted:** If Bucket 2 is also depleted and stocks haven't recovered, then (and only then) withdraw from Bucket 3 stocks, accepting the loss
- **Multiple Years of Decline:** Continue withdrawing from Bucket 2 bonds, rebalancing each year, until stocks recover or Bucket 2 is exhausted
- **Rapid Recovery:** If stocks recover quickly, immediately refill Bucket 1 to 3 years

**Configuration Options:**

- **Enable/Disable:** Users can enable or disable bucket strategy per scenario
- **Strategy Type:** Users can choose:
  - **Strategy A (default):** 3 years cash, 4 years balanced (50/50), remaining in stocks
  - **Strategy B:** 1 year cash, 5 years bonds, remaining in stocks
- **Number of years per bucket (user-editable):** The user must be able to set the number of years of expenses for each bucket. Defaults are provided, but the user can change them.
  - **Strategy A:** User can set cash bucket years (default: 3), balanced bucket years (default: 4). The stocks bucket is the remaining balance (no year count).
  - **Strategy B:** User can set cash bucket years (default: 1), bond bucket years (default: 5). The stocks bucket is the remaining balance (no year count).
- **Bucket Sizes (Strategy A):** In addition to years, users can customize:
  - Initial allocation percentages within the balanced bucket (50/50 default)
- **Bucket Sizes (Strategy B):** Bond and stock buckets have fixed 100% allocation; only the number of years for cash and bonds is set by the user
- **Rebalancing Threshold:** Set drift threshold before rebalancing (default: 5%)
- **Recovery Definition:** Define what constitutes "recovery" (default: stocks return to previous high)

**Scenario Builder Behavior When Bucket Strategy Is Enabled:**

When a bucket strategy is enabled for a scenario, the Scenario builder must treat cash and bond allocation as **fixed** (derived from the bucket strategy) and only allow the user to control **stock** allocation for the remaining assets.

- **Fixed (non-editable) in the Scenario builder:**
  - **Cash allocation:** Determined by the bucket strategy (e.g. 1 year or 3 years of spending in cash). The dollar amount or percentage reserved for cash is set by the strategy and spending; the user does not edit overall cash allocation.
  - **Bond allocation:** Determined by the bucket strategy (e.g. 5 years of spending in bonds, or 4 years balanced). The dollar amount or percentage reserved for bonds is set by the strategy and spending; the user does not edit overall bond allocation.
- **User-editable in the Scenario builder:**
  - **Stock allocation (remaining assets only):** The portion of the portfolio that is in the “stocks” bucket (Strategy A: Bucket 3; Strategy B: Bucket 3) is the only portion for which the user can set allocation. Within that portion, the user can allocate among stock sub-asset classes (e.g. US vs international, large vs small cap) as percentages that sum to 100% of the stock bucket.

**Rationale:** The bucket strategy defines how much is in cash and bonds by design (years of expenses). The Scenario builder should not allow overriding those amounts; it should only allow the user to decide how the **remaining** (stock) portion is allocated across equity sub-asset classes.

**User Value:**
- **Protection from sequence risk:** Avoids forced selling during market downturns
- **Psychological comfort:** Clear separation of short-term vs long-term assets
- **Optimized returns:** Allows growth assets time to recover before withdrawal
- **Flexibility:** Responds to actual market conditions rather than rigid calendar-based transfers

**Acceptance Criteria:**
- Buckets are initialized correctly based on spending needs
- Withdrawals always come from Cash bucket first
- Rebalancing logic correctly responds to stock performance
- Bucket 1 is refilled when stocks recover
- Bucket 2 bonds are used before Bucket 3 stocks during downturns
- Rebalancing maintains target allocations within buckets
- Strategy can be enabled/disabled per scenario
- User can set the number of years for each bucket (cash, balanced/bonds) per strategy; defaults are provided but editable
- Bucket sizes and thresholds are configurable
- Edge cases are handled correctly (exhausted buckets, multiple year declines)
- **When bucket strategy is enabled:** Scenario builder fixes cash and bond allocation (per strategy); user can only set stock (and stock sub-asset) allocation for the remaining assets.

**Technical Implementation Notes:**

- Track bucket balances separately: `bucket_1_balance`, `bucket_2_balance`, `bucket_3_balance`
- Track stock performance: `bucket_3_previous_high`, `bucket_3_current_value`, `bucket_3_return_pct`
- Track recovery status: `stocks_in_recovery` (boolean), `recovery_threshold_met` (boolean)
- Annual rebalancing function: `rebalance_buckets(year, stock_return, spending_needs)`
- Transfer function: `transfer_between_buckets(from_bucket, to_bucket, amount)`

**References:**
- Morningstar: "The Bucket Investor's Guide to Setting Retirement Asset Allocation"
- AAII: "Using the Bucket Approach With Your Retirement Portfolio"
- Advisor Perspectives: "Time Segmentation as the Compromise Solution for Retirement Income"

---

### Feature: Withdrawal Sequencing
**Priority:** 🟡 High
**Status:** ✅ Implemented

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
**Status:** ⚠️ Partial — Dual/spousal benefits and coordination implemented; survivor benefits (100% of deceased spouse) not yet implemented.

**Description:**
Support dual Social Security benefits for married couples.

**Requirements:**
- Track both spouses' Social Security ✅
- Calculate spousal benefits (up to 50% of higher earner) ✅
- Calculate survivor benefits (up to 100% of deceased spouse) — not yet
- Model coordination strategies (one claims early, one delays) ✅

**User Value:**
- Optimize dual benefits
- Plan for survivor benefits (future)
- Coordinate claiming strategies

**Acceptance Criteria:**
- Both spouses' SS can be entered ✅
- Spousal benefits are calculated correctly ✅
- Survivor benefits are calculated correctly — not yet
- Coordination strategies can be modeled ✅

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

### Feature: Monte Carlo Simulations
**Priority:** 🟡 High
**Status:** ❌ Not Implemented

**Description:**
Run probabilistic simulations (Monte Carlo) to produce a distribution of portfolio outcomes over the projection horizon. Each simulation uses random return paths consistent with the scenario’s expected returns and volatility (and optionally correlation across asset classes), so users can see success rate and percentile outcomes (e.g., 10th/50th/90th final balance) rather than a single deterministic projection.

**Requirements:**

#### Simulation Configuration
- **Number of simulations:** User-configurable (e.g., 500, 1,000, 5,000); default sufficient for stable percentiles (e.g., 1,000).
- **Time horizon:** Use scenario’s projection years (e.g., 30 years).
- **Return assumptions:** Derived from scenario asset allocation and expected-return inputs, or explicit mean/volatility (and optionally correlation) per asset class. Returns can be lognormal or normal; document assumption.

#### Outputs
- **Success rate:** Percentage of paths where portfolio remains positive (or above a user-defined floor) through the end of the horizon.
- **Percentile outcomes:** e.g., 10th, 25th, 50th (median), 75th, 90th percentile of terminal portfolio value (and optionally by year).
- **Distribution view:** Histogram or CDF of final balance; optional display of sample paths (e.g., 5th, 50th, 95th by year).
- **Baseline comparison:** Show where the single deterministic baseline projection falls within the Monte Carlo distribution (e.g., “Baseline ≈ 55th percentile”).

#### User Experience
- **Run control:** “Run Monte Carlo” (or similar) with optional number of simulations and horizon.
- **Performance:** Run simulations in reasonable time (e.g., &lt; 30 seconds for 1,000 × 30-year paths); consider backend batch or async if needed.
- **Disclaimer:** Clear labeling that results are probabilistic and that past performance does not predict future results.

**User Value:**
- Understand range of possible outcomes, not just one path
- Gauge plan robustness via success rate and percentiles
- Compare baseline strategy to full distribution
- Support conversations with advisors using percentile outcomes

**Acceptance Criteria:**
- User can run N Monte Carlo simulations for the current scenario
- Success rate and percentile outcomes (e.g., 10th/50th/90th final balance) are displayed
- Return assumptions are documented and driven by scenario (or user input)
- Baseline projection is comparable to the Monte Carlo distribution
- Performance is acceptable for default simulation count
- Appropriate disclaimers are shown

**Technical Considerations:**
- Reuse existing projection engine; for each path, draw random returns (e.g., from lognormal or normal) per asset class per year and apply same spending/withdrawal/tax logic
- Asset allocation and expected-return inputs from scenario; volatility (and correlation) from configuration or defaults
- Consider caching or sampling if full N paths are too heavy for UI (e.g., store percentiles and success rate; optionally store subset of paths for charts)

---

### Feature: Medical Expenses & Medical Inflation
**Priority:** 🟡 High
**Status:** ❌ Not Implemented

**Description:**
Support a dedicated medical-expense model with an independent medical inflation rate, so users can project healthcare costs separately from baseline spending.

**Requirements:**
- **Medical Expense Categories:**
  - Baseline recurring medical expense (monthly or annual)
  - Optional one-time/episodic medical events (year-based)
  - Optional spouse/household medical expense support
- **Medical Inflation:**
  - Separate medical inflation rate (e.g., 4-7%) distinct from general CPI
  - Medical inflation applied only to medical expense components
  - Ability to set defaults and override per scenario
- **Projection Integration:**
  - Medical expenses included in annual spending and withdrawal needs
  - Medical expense and non-medical expense shown separately in outputs/charts

**User Value:**
- Better healthcare planning accuracy
- More realistic retirement spending projections
- Better stress testing for late-retirement cost growth

**Acceptance Criteria:**
- User can enter recurring and one-time medical expenses
- User can set a separate medical inflation rate
- Medical costs inflate independently from non-medical spending
- Projections and visuals show medical vs non-medical spending components

---

### Feature: Real Estate Portfolio (Primary + Rental)
**Priority:** 🟡 High
**Status:** ❌ Not Implemented

**Description:**
Track real-estate holdings as portfolio components, including owner-occupied residence and rental properties, with cash-flow and valuation treatment in projections.

**Requirements:**
- **Property Types:**
  - Primary residence (lived in)
  - Rental property (one or more)
- **Data Model:**
  - Current value, debt/mortgage balance, interest rate, payment, taxes/insurance/HOA
  - Appreciation assumption by property type
  - Rental income, vacancy/maintenance assumptions, net cash flow
- **Projection Behavior:**
  - Primary residence can be excluded from liquid withdrawal pool by default
  - Rental net income included in other-income stream
  - Property value/equity tracked over time
  - Optional sale events and downsizing scenarios (future extension)
- **Reporting:**
  - Show liquid portfolio vs total net worth including real estate
  - Show property-level and aggregate real-estate contributions to plan outcomes

**User Value:**
- Reflects real household balance sheet
- Improves income and net-worth realism for real-estate owners
- Better planning for housing and rental cash-flow decisions

**Acceptance Criteria:**
- User can add/edit/delete primary and rental properties
- Rental cash flow is incorporated into annual projection income
- Property values/equity are projected and displayed separately
- Scenario output distinguishes liquid portfolio from real-estate value

---

### Feature: Time-Period Asset Allocation (Cross-Phase)
**Priority:** 🔴 High (enables future planners; supports Epic 9)
**Status:** ❌ Not Implemented

**Description:**
Let users define **multiple asset-allocation bands over time** within a scenario (or linked plan), instead of a single static allocation for all projection years. Applies to **accumulation and withdrawal** years wherever returns are driven by allocation.

**Requirements:**
- **Band model:** Ordered list of `{ start_year, end_year, allocation }` using existing asset-class keys; each allocation sums to 100%.
- **Resolution:** For each projection year, select the band whose range contains that year; if none, fall back to scenario default or show validation error.
- **Overlap / gaps:** MVP either forbids overlaps and requires full coverage, or allows gaps with explicit default-allocation fallback (product choice—document in implementation).
- **Engine:** `RetirementScenarioService` (and Monte Carlo / stress paths that read scenario returns) use **year-specific weights** when blending returns.
- **UX:** Table or timeline editor; copy band; reorder; validate sums.

**Acceptance Criteria:**
Changing a later band only affects years in that range; year-by-year effective allocation is visible in exports or a summary row.

---

### Feature: User Authentication & Account Management
**Priority:** 🔴 High (prerequisite for SaaS and billing)
**Status:** ❌ Not Implemented

**Description:**
Register, authenticate, and isolate data per user.

**Requirements:**
- Email/password or OIDC (e.g. Auth0, Cognito, Clerk)—**provider TBD**.
- JWT or cookie session; HTTPS-only in production.
- Password hashing (bcrypt/argon2) if local passwords; rate limiting on auth endpoints.
- **Multi-tenancy:** `user_id` on all user-owned rows; API enforces ownership on every mutation/read.

**Acceptance Criteria:**
Two users cannot read or modify each other’s scenarios; logout invalidates session.

---

### Feature: Subscriptions & Payments
**Priority:** 🟡 High (commercialization)
**Status:** ❌ Not Implemented

**Description:**
Charge users for access via a third-party payment provider; map subscription state to entitlements.

**Requirements:**
- Checkout, customer portal (or equivalent), webhooks for `customer.subscription.*` events.
- Store minimal billing state: customer id, subscription id, plan tier, status, current period end.
- **Entitlements:** e.g. free tier caps vs paid unlimited (exact limits **TBD** by business).
- **Compliance:** Terms, privacy policy links; no card data in application DB.

**Acceptance Criteria:**
User who cancels retains access until period end (or policy defined); failed payment moves account to a defined state without silent data loss.

---

## Non-Functional Requirements

### Performance
- **Page Load Time**: < 2 seconds
- **Projection Generation**: < 5 seconds for 30-year projection
- **Graph Rendering**: < 1 second
- **API Response Time**: < 500ms for standard endpoints

### Security
- **Data privacy & tenancy**: With authentication, all persisted user data is **scoped to the owning account**; no cross-tenant leakage. (Self-hosted or single-user deployments may still exist for development; production assumes **identified users** per [Strategic Direction](#strategic-direction-future-planners-saas--deployment).)
- **Secrets**: API keys, DB URLs, and payment webhooks live in environment/config—not in source control.
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
- **Real-time Market Data**: Uses static projections
- **Multi-user collaboration** (shared workspaces, advisor–client joint editing): out of scope; **multi-tenant individual accounts** are in scope per Epic 17.
- **Mobile App**: Web application only
- **Financial Advice**: Tool for planning, not advice
- **Account Aggregation**: Manual entry only
- **Bill Pay**: Not a banking application

### Secondary Requirements (Lower Priority)
- **Accumulation-only extras** (e.g. employer match modeling, education savings buckets): may follow **time-period allocation** and **pre-retirement projection years**; see [Strategic Direction](#strategic-direction-future-planners-saas--deployment) for reprioritization.

---

## Future Considerations

### Phase 2 Features (Post-MVP)
- Guardrail rules (spending adjustments)
- What-if scenario comparisons
- Advanced tax strategies
- Estate planning features
- Historical stress testing (using actual year-by-year returns)
- Medical expenses with separate medical inflation
- Real-estate portfolio modeling (primary + rental)

### Phase 3 Features (Secondary Requirements)
- **Accumulation phase depth** (contributions, life-stage contribution changes, goal tracking, transition UX): builds on **time-period allocation** and **Epic 9**; priority relative to Epic 17 set in roadmap—not “withdrawal-only first” by default anymore.

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
- **2026-04-11** (v1.2): Added **Strategic Direction** (future planners, time-period asset allocation, auth, billing, deployment TBD / hosting platform). Added **Epic 17** (identity, subscriptions, billing) and feature specs for **time-period allocation**, **authentication**, and **payments**. Elevated **Jessica** to co-primary persona; retitled and reprioritized **Epic 9**; updated NFR security/tenancy, out-of-scope wording, and Phase 3 notes.
- **2026-03-26**: Added spending enhancements for medical expenses with separate medical inflation (new user stories US-4.7/US-4.8 and feature spec). Added real-estate portfolio scope for primary residence and rental properties with projection and reporting requirements.
- **2026-02-23**: Monte Carlo simulations moved into current scope: removed from Out of Scope and Phase 2; Epic 11 expanded to "Stress Testing & Monte Carlo" with new user stories (US-11.7–US-11.11) and acceptance criteria; added Feature Specification "Monte Carlo Simulations" with requirements, outputs, and technical considerations.
- **2026-02-23**: Updated implementation status: Account Type Segregation and Withdrawal Sequencing set to Implemented; Partner/Spouse Social Security set to Partial (dual/spousal implemented; survivor benefits not yet); Bucket Strategy updated (Strategy A and B implemented, scenario builder locking remaining); Epic 2 acceptance criteria updated for COLA from current date to start; version 1.1.
- **2026-02-05**: Initial PRD created

---

**Document Owner:** Product Team
**Reviewers:** Engineering, Design, Business
**Next Review Date:** TBD
