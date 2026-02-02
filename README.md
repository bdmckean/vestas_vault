# Retirement Planner Application

A Docker-based retirement planning application with React frontend and FastAPI backend.

## Features (Phase 1 - Complete ✅)

- ✅ Account management (CRUD operations)
- ✅ Account type validation (pretax, roth, taxable, cash)
- ✅ Responsive UI with Tailwind CSS
- ✅ Comprehensive unit tests
- ✅ Well-structured, expandable codebase
- ✅ Dashboard page with summary and navigation
- ✅ Social Security setup page
- ✅ FRA calculation from birth date
- ✅ Social Security payment projections (age 62-70)

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

## Phase 1 Status: ✅ COMPLETE

All Phase 1 requirements have been implemented:
- Account CRUD operations with validation
- Unit tests for all layers
- Dashboard and navigation
- Social Security setup with FRA calculation
- Payment projections calculator

See `PHASE_1_CHECKLIST.md` for detailed completion status.

## Future Phases

- **Phase 2:** Asset class return projections (0-10 years, 10+ years)
- **Phase 3:** Withdrawal planning and tax calculations
- **Phase 4:** Portfolio projections and scenario analysis

## Development Notes

- Backend uses layered architecture: Repository → Service → API
- Frontend uses React Query for data fetching and caching
- All code is type-safe (Pydantic + TypeScript)
- Comprehensive unit tests at each layer
