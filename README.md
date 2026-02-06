# Retirement Planner Application

A Docker-based retirement planning application with React frontend and FastAPI backend.

## Features

### Phase 1: Account Management ✅ COMPLETE
- ✅ Account management (CRUD operations)
- ✅ Account type validation (pretax, roth, taxable, cash)
- ✅ Responsive UI with Tailwind CSS
- ✅ Comprehensive unit tests
- ✅ Well-structured, expandable codebase
- ✅ Dashboard page with summary and navigation

### Phase 2: Core Configuration ✅ COMPLETE
- ✅ Social Security setup page
- ✅ FRA calculation from birth date
- ✅ Social Security payment projections (age 62-70)
- ✅ Asset class return projections (10-year forecasts, historical averages)
- ✅ Planned spending (monthly amount + annual lump sum)
- ✅ Tax configuration (filing status, deductions, senior deductions)
- ✅ Scenario modeling with custom asset allocations
- ✅ CSV/JSON export of projections

### Phase 3: Additional Features ✅ COMPLETE
- ✅ Other Income Sources (pensions, rental, employment, etc.)
  - CRUD operations
  - Income type categorization
  - Date ranges (start/end month-year)
  - COLA adjustments
  - Month-by-month projections
- ✅ Portfolio Holdings
  - Track holdings within accounts
  - Asset class tracking
  - Ticker symbols and fund names
  - Portfolio allocation summaries
- ✅ Fixed Expenses
  - Scenario-specific fixed expenses
  - Not subject to inflation
  - Year-based duration tracking
- ✅ Planned Fixed Expenses
  - Global fixed expenses for all scenarios
  - Calendar year-based tracking
- ✅ Saved Scenarios
  - Persistent scenario storage
  - Full CRUD operations
  - Scenario duplication
  - Year-by-year retirement projections

### Missing Features (From COMPLETE_RETIREMENT_ANALYSIS.md)
- ❌ **Partner/Spouse Social Security**: Support for dual Social Security benefits
  - Spousal benefits (up to 50% of higher earner's benefit)
  - Survivor benefits (up to 100% of deceased spouse's benefit)
  - Coordination strategies (one claims early, one delays)
  - Dual benefit tracking (both spouses have their own benefits)
- ❌ **Time-Series Visualizations**: Graphs showing projections over time
  - Social Security income over time (with COLA adjustments)
  - Withdrawals by account type over time (pretax, Roth, taxable, cash)
  - Taxes paid over time (federal, state, total)
  - Available spending over time (after taxes)
  - Distance to next tax bracket over time (how much room until bracket change)
  - Portfolio balance over time (total and by account type)
  - Income vs spending over time (gap analysis)
- ❌ Account type segregation in projections (separate pretax/Roth/taxable/cash tracking)
- ❌ Bucket strategy (time-based return rates)
- ❌ Withdrawal sequencing (100% pretax first, preserve Roth)
- ❌ Roth conversions tracking and modeling
- ❌ RMD calculations (Required Minimum Distributions)
- ❌ Medicare IRMAA surcharge calculations
- ❌ Tax bracket inflation indexing

See `IMPLEMENTATION_ROADMAP.md` for detailed implementation plan.

## Tech Stack

### Backend
- FastAPI
- SQLAlchemy
- PostgreSQL
- uv (Python package manager)
- pytest

### Frontend
- React + TypeScript
- Vite
- React Query
- Tailwind CSS
- React Hook Form

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 20+ (for local frontend development)
- Python 3.11+ (for local backend development)

### Using Docker (Recommended)

1. **Clone and navigate to the project:**
   ```bash
   cd retirement_planner
   ```

2. **Start all services:**
   ```bash
   docker-compose up --build
   ```

3. **Access the application:**
   - Frontend: http://localhost:3005
   - Backend API: http://localhost:8005
   - API Docs: http://localhost:8005/docs

4. **Initialize the database:**
   The database tables are created automatically on first startup.

### Local Development

#### Backend Setup

1. **Install uv:**
   ```bash
   curl -LsSf https://astral.sh/uv/install.sh | sh
   ```

2. **Install dependencies:**
   ```bash
   cd backend
   uv pip install -e ".[dev]"
   ```

3. **Set up environment:**
   ```bash
   cp ../.env.example .env
   # Edit .env with your database URL
   ```

4. **Run migrations (create tables):**
   ```bash
   python -c "from app.database import Base, engine; Base.metadata.create_all(bind=engine)"
   ```

5. **Run the server:**
   ```bash
   uvicorn app.main:app --reload
   ```

6. **Run tests:**
   ```bash
   pytest
   ```

#### Frontend Setup

1. **Install dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **Run development server:**
   ```bash
   npm run dev
   ```

## Project Structure

```
retirement_planner/
├── backend/          # FastAPI backend
│   ├── app/         # Application code
│   └── tests/       # Unit tests
├── frontend/         # React frontend
│   └── src/         # Source code
└── docker-compose.yml
```

## API Endpoints

### Accounts
- `GET /api/v1/accounts` - List all accounts
- `GET /api/v1/accounts/{id}` - Get account by ID
- `POST /api/v1/accounts` - Create new account
- `PUT /api/v1/accounts/{id}` - Update account
- `DELETE /api/v1/accounts/{id}` - Delete account

### Social Security
- `GET /api/v1/social-security` - Get Social Security configuration
- `POST /api/v1/social-security` - Create/update Social Security configuration
- `PUT /api/v1/social-security` - Update Social Security configuration
- `DELETE /api/v1/social-security` - Delete Social Security configuration
- `GET /api/v1/social-security/projections` - Get payment projections (age 62-70)

### Other Income
- `GET /api/v1/other-income` - List all income sources
- `GET /api/v1/other-income/{id}` - Get income source by ID
- `POST /api/v1/other-income` - Create income source
- `PUT /api/v1/other-income/{id}` - Update income source
- `DELETE /api/v1/other-income/{id}` - Delete income source
- `GET /api/v1/other-income/projections` - Get month-by-month projections

### Holdings
- `GET /api/v1/holdings` - List all holdings
- `GET /api/v1/holdings/{id}` - Get holding by ID
- `GET /api/v1/holdings/account/{account_id}` - Get holdings for an account
- `POST /api/v1/holdings` - Create holding
- `PUT /api/v1/holdings/{id}` - Update holding
- `DELETE /api/v1/holdings/{id}` - Delete holding
- `GET /api/v1/holdings/portfolio/allocation` - Get portfolio-wide allocation

### Planned Spending
- `GET /api/v1/planned-spending` - Get planned spending configuration
- `POST /api/v1/planned-spending` - Create/update planned spending
- `PUT /api/v1/planned-spending` - Update planned spending
- `DELETE /api/v1/planned-spending` - Delete planned spending

### Fixed Expenses
- `GET /api/v1/fixed-expenses` - List fixed expenses for a scenario
- `GET /api/v1/fixed-expenses/{id}` - Get fixed expense by ID
- `POST /api/v1/fixed-expenses` - Create fixed expense
- `PUT /api/v1/fixed-expenses/{id}` - Update fixed expense
- `DELETE /api/v1/fixed-expenses/{id}` - Delete fixed expense

### Planned Fixed Expenses
- `GET /api/v1/planned-fixed-expenses` - List all planned fixed expenses
- `GET /api/v1/planned-fixed-expenses/{id}` - Get planned fixed expense by ID
- `POST /api/v1/planned-fixed-expenses` - Create planned fixed expense
- `PUT /api/v1/planned-fixed-expenses/{id}` - Update planned fixed expense
- `DELETE /api/v1/planned-fixed-expenses/{id}` - Delete planned fixed expense

### Tax Configuration
- `GET /api/v1/tax-config` - Get tax configuration
- `POST /api/v1/tax-config` - Create/update tax configuration
- `PUT /api/v1/tax-config` - Update tax configuration
- `DELETE /api/v1/tax-config` - Delete tax configuration

### Tax Tables
- `GET /api/v1/tax-tables/federal` - Get federal tax tables
- `GET /api/v1/tax-tables/state/{state}` - Get state tax tables

### Asset Projections
- `GET /api/v1/asset-projections` - Get asset class return projections
- `GET /api/v1/asset-projections/10-year` - Get 10-year institutional forecasts
- `GET /api/v1/asset-projections/historical` - Get historical average returns

### Scenarios
- `GET /api/v1/scenarios` - Generate ad-hoc scenario projection
- `POST /api/v1/scenarios` - Generate scenario with custom parameters

### Saved Scenarios
- `GET /api/v1/saved-scenarios` - List all saved scenarios
- `GET /api/v1/saved-scenarios/{id}` - Get scenario by ID
- `POST /api/v1/saved-scenarios` - Create scenario
- `PUT /api/v1/saved-scenarios/{id}` - Update scenario
- `DELETE /api/v1/saved-scenarios/{id}` - Delete scenario
- `POST /api/v1/saved-scenarios/{id}/duplicate` - Duplicate scenario
- `POST /api/v1/saved-scenarios/{id}/generate-default` - Generate default scenario from current config
- `POST /api/v1/saved-scenarios/{id}/projection` - Generate projection for scenario

## Testing

### Backend Tests
```bash
cd backend
pytest
pytest -v  # Verbose output
pytest tests/test_accounts_api.py  # Run specific test file
```

### Test Coverage
```bash
pytest --cov=app --cov-report=html
```

## Implementation Status

### ✅ Completed Phases

**Phase 1: Account Management** - Complete
- Account CRUD operations with validation
- Unit tests for all layers
- Dashboard and navigation

**Phase 2: Core Configuration** - Complete
- Social Security setup with FRA calculation
- Payment projections calculator
- Asset class return projections
- Planned spending configuration
- Tax configuration
- Scenario modeling

**Phase 3: Additional Features** - Complete
- Other Income Sources (fully implemented)
- Portfolio Holdings tracking
- Fixed Expenses (scenario-specific)
- Planned Fixed Expenses (global)
- Saved Scenarios with projections

See `PHASE_1_CHECKLIST.md` for detailed Phase 1 completion status.
See `APP_ARCHITECTURE_PROPOSAL.md` for complete feature list.

### ❌ Missing Features

The following features are documented in `COMPLETE_RETIREMENT_ANALYSIS.md` but not yet implemented:
- Account type segregation in projections
- Bucket strategy (time-based returns)
- Withdrawal sequencing (pretax first)
- Roth conversions
- RMD calculations
- Medicare IRMAA
- Tax bracket indexing

See `IMPLEMENTATION_ROADMAP.md` for detailed implementation plan (9 phases, 54 tasks).

## Development Notes

- Backend uses layered architecture: Repository → Service → API
- Frontend uses React Query for data fetching and caching
- All code is type-safe (Pydantic + TypeScript)
- Comprehensive unit tests at each layer
