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

### Data Files
- `data/investment_return_projections.json` - 10-year forecasts from Vanguard, BlackRock, etc.
- `data/historical_asset_class_returns.json` - Long-term returns (1926-present)
- `data/us_federal_tax_tables.json` - Federal tax brackets and deductions
- `data/colorado_state_tax_tables.json` - Colorado state tax info

---

## Next Feature: Other Income Sources

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
│   │   │   └── other_income.py        # NEW
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   ├── account.py
│   │   │   ├── social_security.py
│   │   │   ├── planned_spending.py
│   │   │   ├── tax_config.py
│   │   │   └── other_income.py        # NEW
│   │   ├── api/v1/
│   │   │   ├── accounts.py
│   │   │   ├── social_security.py
│   │   │   ├── asset_projections.py
│   │   │   ├── scenarios.py
│   │   │   ├── planned_spending.py
│   │   │   ├── tax_config.py
│   │   │   ├── tax_tables.py
│   │   │   ├── other_income.py        # NEW
│   │   │   └── router.py
│   │   ├── services/
│   │   │   ├── account_service.py
│   │   │   ├── social_security_service.py
│   │   │   ├── asset_projection_service.py
│   │   │   ├── scenario_service.py
│   │   │   ├── planned_spending_service.py
│   │   │   ├── tax_config_service.py
│   │   │   └── other_income_service.py # NEW
│   │   ├── repositories/
│   │   │   ├── account_repository.py
│   │   │   ├── social_security_repository.py
│   │   │   ├── planned_spending_repository.py
│   │   │   ├── tax_config_repository.py
│   │   │   └── other_income_repository.py # NEW
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
│   │   │   └── OtherIncomeForm.tsx     # NEW
│   │   ├── pages/
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── AccountsPage.tsx
│   │   │   ├── SocialSecurityPage.tsx
│   │   │   ├── AssetProjectionsPage.tsx
│   │   │   ├── ScenarioModelingPage.tsx
│   │   │   ├── PlannedSpendingPage.tsx
│   │   │   ├── TaxPage.tsx
│   │   │   └── OtherIncomePage.tsx     # NEW
│   │   ├── hooks/
│   │   │   ├── useAccounts.ts
│   │   │   ├── useSocialSecurity.ts
│   │   │   ├── useAssetProjections.ts
│   │   │   ├── useScenarios.ts
│   │   │   ├── usePlannedSpending.ts
│   │   │   ├── useTaxConfig.ts
│   │   │   └── useOtherIncome.ts       # NEW
│   │   ├── services/
│   │   │   ├── api.ts
│   │   │   ├── social_security_api.ts
│   │   │   ├── asset_projections_api.ts
│   │   │   ├── scenario_api.ts
│   │   │   ├── planned_spending_api.ts
│   │   │   ├── tax_config_api.ts
│   │   │   └── other_income_api.ts     # NEW
│   │   ├── types/
│   │   │   ├── account.ts
│   │   │   ├── social_security.ts
│   │   │   ├── asset_projections.ts
│   │   │   ├── scenario.ts
│   │   │   ├── planned_spending.ts
│   │   │   ├── tax_config.ts
│   │   │   └── other_income.ts         # NEW
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

### Phase 3: Other Income Sources ← NEXT
- Other income CRUD
- Income type categorization
- Date range support (start/end month-year)
- COLA adjustments
- Month-by-month projections
- Integration with dashboard

### Phase 4: Retirement Projection Engine
- Combine all inputs: accounts, SS, other income, spending, taxes
- Year-by-year portfolio projections
- Multiple withdrawal strategies (buckets, percentage-based)
- Inflation adjustments
- Success probability calculations

### Phase 5: Advanced Analysis
- Monte Carlo simulations
- Roth conversion optimization
- RMD calculations
- Guardrail rules (spending adjustments based on portfolio performance)
- What-if scenario comparisons

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
