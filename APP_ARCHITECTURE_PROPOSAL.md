# Retirement Planning Application - Architecture Proposal

## Overview
A Docker-based retirement planning application with React frontend and FastAPI backend, using `uv` for Python dependency management.

## Technology Stack

### Backend
- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - ORM for database operations
- **Pydantic** - Data validation
- **uv** - Fast Python package manager
- **PostgreSQL** - Database (or SQLite for development)
- **pytest** - Testing framework

### Frontend
- **React** with **TypeScript**
- **Vite** - Build tool
- **React Query** - Data fetching and caching
- **Tailwind CSS** - Styling
- **React Hook Form** - Form management

### Infrastructure
- **Docker** & **Docker Compose** - Containerization
- **Nginx** - Reverse proxy (optional for production)

## Current Implementation Status

### Completed Features
- **Accounts**: Full CRUD with account types (Pre-Tax, Roth, Taxable, Cash)
- **Social Security**: Birth date entry, auto-calculated FRA, month-by-month projections age 62-70
- **Asset Projections**: 10-year institutional forecasts, long-term historical returns
- **Scenario Modeling**: Custom scenarios with blended returns, contributions, CSV/JSON export
- **Planned Spending**: Monthly spending amount, annual lump sum
- **Tax Configuration**: Filing status, deductions with senior deduction calculations
- **Other Income Sources**: ✅ COMPLETE - CRUD operations, income type categorization, date ranges, COLA adjustments, month-by-month projections
- **Holdings**: Portfolio holdings within accounts, asset class tracking, ticker symbols
- **Fixed Expenses**: Scenario-specific fixed expenses (not subject to inflation)
- **Planned Fixed Expenses**: Global fixed expenses that apply to all scenarios
- **Saved Scenarios**: Persistent scenario storage with full CRUD, duplication, and projection generation
- **Retirement Projections**: Year-by-year portfolio projections combining accounts, SS, other income, spending, and taxes

### Data Files
- `data/investment_return_projections.json` - 10-year forecasts from Vanguard, BlackRock, etc.
- `data/historical_asset_class_returns.json` - Long-term returns (1926-present)
- `data/us_federal_tax_tables.json` - Federal tax brackets and deductions
- `data/colorado_state_tax_tables.json` - Colorado state tax info

---

## Missing Features (From COMPLETE_RETIREMENT_ANALYSIS.md)

The following features are documented in the retirement analysis but not yet implemented:

- **Partner/Spouse Social Security**: Support for dual Social Security benefits
  - Spousal benefits (up to 50% of higher earner's benefit)
  - Survivor benefits (up to 100% of deceased spouse's benefit)
  - Coordination strategies (one claims early, one delays)
  - Dual benefit tracking (both spouses have their own benefits)
- **Account Type Segregation**: Separate tracking of pretax, Roth, taxable, and cash balances in projections
- **Bucket Strategy**: Time-based return rates (3.5% years 1-3, 5.25% years 4-7, 6% years 8-10, 10% years 11-30)
- **Withdrawal Sequencing**: Withdraw 100% from pretax first, preserve Roth accounts
- **Roth Conversions**: Track and model annual conversions from pretax to Roth with tax implications
- **RMD Calculations**: Required Minimum Distributions starting at age 75
- **Medicare IRMAA**: Medicare surcharge calculations based on MAGI
- **Tax Bracket Indexing**: Annual inflation adjustments to tax brackets and deductions
- **Time-Series Visualizations**: Graphs showing projections over time
  - Social Security income over time (with COLA adjustments)
  - Withdrawals by account type over time (pretax, Roth, taxable, cash)
  - Taxes paid over time (federal, state, total)
  - Available spending over time (after taxes)
  - Distance to next tax bracket over time (how much room until bracket change)
  - Portfolio balance over time (total and by account type)
  - Income vs spending over time (gap analysis)

See `IMPLEMENTATION_ROADMAP.md` for detailed implementation plan.

---

## Other Income Sources ✅ COMPLETE

**Status**: Fully implemented with all planned features.

### Purpose
Allow users to enter income from sources beyond Social Security:
- Pension payments
- Part-time work / consulting
- Rental income
- Annuity payments
- Dividend income (not reinvested)
- Any other periodic income

### Data Model

Each income source has:
- **Name/Description**: e.g., "Company Pension", "Rental Property"
- **Income Type**: Category for grouping (pension, employment, rental, annuity, other)
- **Monthly Amount**: The recurring monthly income
- **Start Date**: Month/year when income begins
- **End Date**: Optional month/year when income ends (null = continues indefinitely)
- **COLA %**: Optional annual cost-of-living adjustment
- **Taxable**: Whether this income is taxable

### Database Schema

```sql
CREATE TABLE other_income (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    income_type VARCHAR(50) NOT NULL,  -- 'pension', 'employment', 'rental', 'annuity', 'dividend', 'other'
    monthly_amount DECIMAL(15, 2) NOT NULL,
    start_month INTEGER NOT NULL,       -- 1-12
    start_year INTEGER NOT NULL,        -- e.g., 2025
    end_month INTEGER,                  -- null = continues indefinitely
    end_year INTEGER,                   -- null = continues indefinitely
    cola_rate DECIMAL(5, 3) DEFAULT 0,  -- e.g., 0.02 for 2%
    is_taxable BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### API Endpoints

```
GET    /api/v1/other-income              # List all income sources
GET    /api/v1/other-income/{id}         # Get single income source
POST   /api/v1/other-income              # Create income source
PUT    /api/v1/other-income/{id}         # Update income source
DELETE /api/v1/other-income/{id}         # Delete income source
GET    /api/v1/other-income/projections  # Get month-by-month projections for all sources
```

### Pydantic Schemas

```python
class IncomeType(str, Enum):
    PENSION = "pension"
    EMPLOYMENT = "employment"
    RENTAL = "rental"
    ANNUITY = "annuity"
    DIVIDEND = "dividend"
    OTHER = "other"

class OtherIncomeBase(BaseModel):
    name: str
    income_type: IncomeType
    monthly_amount: Decimal
    start_month: int  # 1-12
    start_year: int
    end_month: Optional[int] = None
    end_year: Optional[int] = None
    cola_rate: Decimal = Decimal("0")
    is_taxable: bool = True
    notes: Optional[str] = None

class OtherIncomeCreate(OtherIncomeBase):
    pass

class OtherIncomeUpdate(BaseModel):
    name: Optional[str] = None
    income_type: Optional[IncomeType] = None
    monthly_amount: Optional[Decimal] = None
    # ... all fields optional

class OtherIncome(OtherIncomeBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

class OtherIncomeProjection(BaseModel):
    """Monthly projection for a single income source"""
    income_id: UUID
    name: str
    income_type: IncomeType
    year: int
    month: int
    amount: Decimal
    is_taxable: bool

class OtherIncomeSummary(BaseModel):
    """Aggregated projections across all income sources"""
    year: int
    month: int
    total_amount: Decimal
    taxable_amount: Decimal
    non_taxable_amount: Decimal
    by_type: Dict[str, Decimal]  # e.g., {"pension": 2000, "rental": 1500}
```

### Frontend Page: Other Income

**Page Layout:**
1. **Header**: "Other Income Sources" with "Add Income" button
2. **Income List**: Cards showing each income source
   - Name and type badge
   - Monthly amount
   - Active period (e.g., "Jan 2025 - Dec 2030" or "Mar 2027 - Ongoing")
   - COLA rate if applicable
   - Edit/Delete actions
3. **Summary Section**:
   - Total monthly income (current month if active, or projected start)
   - Breakdown by income type
4. **Projection Table**: Month-by-month view similar to SS projections
   - Columns: Month/Year, Each Income Source, Total
   - Option to filter date range

**Add/Edit Form:**
- Name (text input)
- Income Type (dropdown)
- Monthly Amount (currency input)
- Start Date (month/year picker)
- End Date (optional month/year picker with "Ongoing" checkbox)
- COLA Rate (percentage input, default 0%)
- Taxable (checkbox, default checked)
- Notes (optional textarea)

### Integration with Retirement Projection Engine

The Other Income data feeds into the retirement projection:

```
Monthly Income = Social Security + Sum(Other Income for that month)
```

The projection engine will:
1. Query all other income sources
2. For each projection month, calculate which sources are active
3. Apply COLA adjustments based on years since start
4. Sum taxable vs non-taxable income separately for tax calculations

---

## Project Structure (Updated)

```
retirement_planner/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── account.py
│   │   │   ├── social_security.py
│   │   │   ├── planned_spending.py
│   │   │   ├── tax_config.py
│   │   │   ├── other_income.py        # ✅ COMPLETE
│   │   │   ├── holding.py             # ✅ COMPLETE
│   │   │   ├── fixed_expense.py       # ✅ COMPLETE
│   │   │   ├── planned_fixed_expense.py # ✅ COMPLETE
│   │   │   └── scenario.py            # ✅ COMPLETE (SavedScenario)
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   ├── account.py
│   │   │   ├── social_security.py
│   │   │   ├── planned_spending.py
│   │   │   ├── tax_config.py
│   │   │   ├── other_income.py        # ✅ COMPLETE
│   │   │   ├── holding.py             # ✅ COMPLETE
│   │   │   ├── fixed_expense.py       # ✅ COMPLETE
│   │   │   ├── planned_fixed_expense.py # ✅ COMPLETE
│   │   │   └── scenario.py            # ✅ COMPLETE
│   │   ├── api/v1/
│   │   │   ├── accounts.py
│   │   │   ├── social_security.py
│   │   │   ├── asset_projections.py
│   │   │   ├── scenarios.py
│   │   │   ├── planned_spending.py
│   │   │   ├── tax_config.py
│   │   │   ├── tax_tables.py
│   │   │   ├── other_income.py        # ✅ COMPLETE
│   │   │   ├── holdings.py           # ✅ COMPLETE
│   │   │   ├── fixed_expenses.py      # ✅ COMPLETE
│   │   │   ├── planned_fixed_expenses.py # ✅ COMPLETE
│   │   │   ├── saved_scenarios.py    # ✅ COMPLETE
│   │   │   └── router.py
│   │   ├── services/
│   │   │   ├── account_service.py
│   │   │   ├── social_security_service.py
│   │   │   ├── asset_projection_service.py
│   │   │   ├── scenario_service.py
│   │   │   ├── planned_spending_service.py
│   │   │   ├── tax_config_service.py
│   │   │   ├── other_income_service.py # ✅ COMPLETE
│   │   │   ├── holding_service.py      # ✅ COMPLETE
│   │   │   ├── retirement_scenario_service.py # ✅ COMPLETE
│   │   │   └── scenario_service.py    # ✅ COMPLETE
│   │   ├── repositories/
│   │   │   ├── account_repository.py
│   │   │   ├── social_security_repository.py
│   │   │   ├── planned_spending_repository.py
│   │   │   ├── tax_config_repository.py
│   │   │   ├── other_income_repository.py # ✅ COMPLETE
│   │   │   ├── holding_repository.py     # ✅ COMPLETE
│   │   │   └── scenario_repository.py    # ✅ COMPLETE
│   │   └── utils/
│   │       └── fra_calculator.py
│   ├── tests/
│   ├── pyproject.toml
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AccountCard.tsx
│   │   │   ├── AccountForm.tsx
│   │   │   ├── Navigation.tsx
│   │   │   └── OtherIncomeForm.tsx     # ✅ COMPLETE
│   │   ├── pages/
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── AccountsPage.tsx
│   │   │   ├── SocialSecurityPage.tsx
│   │   │   ├── AssetProjectionsPage.tsx
│   │   │   ├── ScenarioModelingPage.tsx
│   │   │   ├── PlannedSpendingPage.tsx
│   │   │   ├── TaxPage.tsx
│   │   │   ├── OtherIncomePage.tsx     # ✅ COMPLETE
│   │   │   └── PortfolioPage.tsx       # ✅ COMPLETE
│   │   ├── hooks/
│   │   │   ├── useAccounts.ts
│   │   │   ├── useSocialSecurity.ts
│   │   │   ├── useAssetProjections.ts
│   │   │   ├── useScenarios.ts
│   │   │   ├── usePlannedSpending.ts
│   │   │   ├── useTaxConfig.ts
│   │   │   ├── useOtherIncome.ts       # ✅ COMPLETE
│   │   │   ├── useHoldings.ts          # ✅ COMPLETE
│   │   │   ├── useFixedExpenses.ts     # ✅ COMPLETE
│   │   │   ├── usePlannedFixedExpenses.ts # ✅ COMPLETE
│   │   │   └── useSavedScenarios.ts    # ✅ COMPLETE
│   │   ├── services/
│   │   │   ├── api.ts
│   │   │   ├── social_security_api.ts
│   │   │   ├── asset_projections_api.ts
│   │   │   ├── scenario_api.ts
│   │   │   ├── planned_spending_api.ts
│   │   │   ├── tax_config_api.ts
│   │   │   ├── other_income_api.ts     # ✅ COMPLETE
│   │   │   ├── holdings_api.ts         # ✅ COMPLETE
│   │   │   ├── fixed_expenses_api.ts   # ✅ COMPLETE
│   │   │   ├── planned_fixed_expenses_api.ts # ✅ COMPLETE
│   │   │   └── saved_scenarios_api.ts  # ✅ COMPLETE
│   │   ├── types/
│   │   │   ├── account.ts
│   │   │   ├── social_security.ts
│   │   │   ├── asset_projections.ts
│   │   │   ├── scenario.ts
│   │   │   ├── planned_spending.ts
│   │   │   ├── tax_config.ts
│   │   │   ├── other_income.ts         # ✅ COMPLETE
│   │   │   ├── holding.ts               # ✅ COMPLETE
│   │   │   ├── fixed_expense.ts         # ✅ COMPLETE
│   │   │   ├── planned_fixed_expense.ts # ✅ COMPLETE
│   │   │   └── saved_scenario.ts        # ✅ COMPLETE
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── Dockerfile
│
├── data/
│   ├── investment_return_projections.json
│   ├── historical_asset_class_returns.json
│   ├── historical_returns.csv
│   ├── us_federal_tax_tables.json
│   └── colorado_state_tax_tables.json
│
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Implementation Phases (Updated)

### Phase 1: Account Management ✅ COMPLETE
- Account CRUD operations
- Account type validation
- Basic error handling
- Unit tests

### Phase 2: Core Configuration ✅ COMPLETE
- Social Security setup with auto-FRA calculation
- Planned spending (monthly + annual lump sum)
- Tax configuration with senior deductions
- Asset class projections from JSON files
- Scenario modeling with export

### Phase 3: Other Income Sources ✅ COMPLETE
- Other income CRUD ✅
- Income type categorization ✅
- Date range support (start/end month-year) ✅
- COLA adjustments ✅
- Month-by-month projections ✅
- Integration with retirement projections ✅

### Phase 4: Retirement Projection Engine ⚠️ PARTIAL
- ✅ Combine all inputs: accounts, SS, other income, spending, taxes
- ✅ Year-by-year portfolio projections
- ✅ Inflation adjustments
- ✅ Fixed expenses support
- ❌ Multiple withdrawal strategies (buckets, percentage-based) - **MISSING**
- ❌ Account type segregation in projections - **MISSING**
- ❌ Withdrawal sequencing (pretax first) - **MISSING**
- ❌ Success probability calculations - **MISSING**

### Phase 5: Advanced Analysis ❌ NOT STARTED
- ❌ Monte Carlo simulations
- ❌ Roth conversion optimization
- ❌ RMD calculations
- ❌ Guardrail rules (spending adjustments based on portfolio performance)
- ❌ What-if scenario comparisons

---

## Key Design Principles

1. **Layered Architecture**: Repository → Service → API
2. **Dependency Injection**: Easy testing and swapping implementations
3. **Type Safety**: Pydantic models + TypeScript types
4. **Testability**: Unit tests at each layer
5. **Scalability**: Structure supports adding features incrementally

---

## Dashboard Integration

After implementing Other Income, the Dashboard should show:

```
┌─────────────────────────────────────────────────────────────┐
│  RETIREMENT PLANNING DASHBOARD                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  PORTFOLIO                    INCOME (at age 67)            │
│  ┌─────────────────┐          ┌─────────────────────────┐   │
│  │ Total: $2.1M    │          │ Social Security: $4,000 │   │
│  │ Pre-Tax: $1.2M  │          │ Pension: $2,000         │   │
│  │ Roth: $400K     │          │ Rental: $1,500          │   │
│  │ Taxable: $450K  │          │ ─────────────────────── │   │
│  │ Cash: $50K      │          │ Total: $7,500/month     │   │
│  └─────────────────┘          └─────────────────────────┘   │
│                                                             │
│  SPENDING                     TAX STATUS                    │
│  ┌─────────────────┐          ┌─────────────────────────┐   │
│  │ Monthly: $8,000 │          │ Filing: Married Joint   │   │
│  │ Annual: $5,000  │          │ Deductions: $39,850     │   │
│  │ ─────────────── │          │ Est. Tax: ~$X,XXX       │   │
│  │ Total: $101K/yr │          └─────────────────────────┘   │
│  └─────────────────┘                                        │
│                                                             │
│  GAP ANALYSIS: Income $90K - Spending $101K = -$11K/year   │
│  (Must withdraw from portfolio to cover gap)                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Time-Series Visualization Feature (Planned)

### Purpose
Provide visual graphs showing retirement projections over time to help users understand trends, identify potential issues, and optimize their retirement strategy.

### Proposed Graphs

#### 1. Social Security Income Over Time
- **X-axis**: Years (or age)
- **Y-axis**: Monthly/annual Social Security amount
- **Features**:
  - Show COLA adjustments over time
  - Highlight when SS starts
  - Show different scenarios (age 66, 67, 70)
  - Include partner/spouse SS when implemented

#### 2. Withdrawals by Account Type Over Time
- **X-axis**: Years (or age)
- **Y-axis**: Withdrawal amount (annual)
- **Stacked area chart** showing:
  - Pretax withdrawals (blue)
  - Roth withdrawals (green)
  - Taxable withdrawals (orange)
  - Cash withdrawals (gray)
- **Features**:
  - Show withdrawal sequencing strategy
  - Highlight when account types are depleted
  - Show Roth preservation strategy

#### 3. Taxes Paid Over Time
- **X-axis**: Years (or age)
- **Y-axis**: Tax amount (annual)
- **Stacked bar chart** showing:
  - Federal taxes
  - State taxes
  - Total taxes
- **Features**:
  - Show tax bracket changes
  - Highlight high-tax years
  - Show impact of Roth conversions on taxes

#### 4. Available Spending Over Time
- **X-axis**: Years (or age)
- **Y-axis**: Spending amount (annual)
- **Line chart** showing:
  - Planned spending
  - Available spending (after taxes)
  - Gap (if spending exceeds available)
- **Features**:
  - Show spending reduction points
  - Highlight years with spending constraints
  - Compare income vs spending

#### 5. Distance to Next Tax Bracket Over Time
- **X-axis**: Years (or age)
- **Y-axis**: Dollars remaining until next bracket
- **Line chart** showing:
  - Current taxable income
  - Next tax bracket threshold
  - Room available (threshold - current income)
- **Features**:
  - Help optimize Roth conversions
  - Show tax optimization opportunities
  - Highlight years with room for conversions

#### 6. Portfolio Balance Over Time
- **X-axis**: Years (or age)
- **Y-axis**: Portfolio balance (dollars)
- **Multi-line chart** showing:
  - Total portfolio balance
  - Pretax balance
  - Roth balance
  - Taxable balance
  - Cash balance
- **Features**:
  - Show portfolio growth/decline
  - Highlight depletion points
  - Show impact of withdrawals

#### 7. Income vs Spending Over Time (Gap Analysis)
- **X-axis**: Years (or age)
- **Y-axis**: Amount (annual)
- **Stacked area chart** showing:
  - Total income (SS + other income)
  - Spending needs
  - Gap (withdrawals required)
- **Features**:
  - Show when portfolio withdrawals are needed
  - Highlight years with large gaps
  - Show impact of SS timing

### Implementation Requirements

**Frontend:**
- Install charting library (e.g., Recharts, Chart.js, or Plotly)
- Create visualization components
- Add chart controls (zoom, filter by year range, toggle series)
- Add export functionality (PNG, PDF)

**Backend:**
- Ensure projection data includes all necessary fields
- Add endpoint for chart data (if needed for optimization)
- Include tax bracket thresholds in projection data

**Data Requirements:**
- Year-by-year projection data already available
- Need to add: tax bracket thresholds, account type breakdowns
- Need to calculate: distance to next bracket, available spending

### User Experience

**Location:**
- New "Projections" or "Charts" tab in Scenario Modeling page
- Or dedicated "Visualizations" page
- Or expandable section in scenario details

**Interactions:**
- Select scenario(s) to visualize
- Toggle between different graphs
- Filter by year range
- Hover for detailed tooltips
- Export charts as images
- Compare multiple scenarios side-by-side
