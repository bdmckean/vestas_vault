# Setup Guide - Retirement Planner Application

## Initial Setup Steps

### 1. Verify Docker is Running
```bash
docker --version
docker-compose --version
```

### 2. Create Environment File
```bash
cp .env.example .env
# Edit .env if needed (defaults should work for Docker setup)
```

### 3. Start the Application
```bash
docker-compose up --build
```

This will:
- Build PostgreSQL database container
- Build and start FastAPI backend
- Build and start React frontend
- Create database tables automatically

### 4. Verify Everything is Running

- **Frontend**: http://localhost:3005
- **Backend API**: http://localhost:8005
- **API Documentation**: http://localhost:8005/docs
- **Health Check**: http://localhost:8005/health

### 5. Test the Application

1. Open http://localhost:3005 in your browser
2. Click "Add Account"
3. Fill in:
   - Name: "401(k) Account"
   - Type: "Pretax"
   - Balance: "100000.00"
4. Click "Create Account"
5. Verify the account appears in the list

### 6. Run Backend Tests

```bash
# In a new terminal
docker-compose exec backend pytest
```

Or run tests locally:
```bash
cd backend
uv pip install -e ".[dev]"
pytest
```

## Development Workflow

### Backend Development

1. **Make changes** to Python files in `backend/app/`
2. **FastAPI auto-reloads** (thanks to `--reload` flag)
3. **Check API docs** at http://localhost:8005/docs
4. **Run tests**: `docker-compose exec backend pytest`

### Frontend Development

1. **Make changes** to React files in `frontend/src/`
2. **Vite hot-reloads** automatically
3. **Check browser** at http://localhost:3005

### Database Changes

If you modify models:
1. Stop containers: `docker-compose down`
2. Remove volume: `docker-compose down -v`
3. Restart: `docker-compose up --build`

Or use Alembic migrations (to be added in future phases).

## Troubleshooting

### Port Already in Use
```bash
# Check what's using the port
lsof -i :8005  # Backend
lsof -i :3005  # Frontend
lsof -i :5432  # Database

# Change ports in docker-compose.yml if needed
```

### Database Connection Issues
```bash
# Check database is healthy
docker-compose ps

# View database logs
docker-compose logs db

# Connect to database directly
docker-compose exec db psql -U retirement_user -d retirement_planner
```

### Backend Won't Start
```bash
# Check backend logs
docker-compose logs backend

# Rebuild backend
docker-compose build backend
docker-compose up backend
```

### Frontend Won't Start
```bash
# Check frontend logs
docker-compose logs frontend

# Rebuild frontend
docker-compose build frontend
docker-compose up frontend
```

## Next Steps

### ✅ Completed Features

The following features are already implemented:

1. **Phase 2**: Asset class return projections ✅
   - Loads from `investment_return_projections.json`
   - Projection service implemented
   - Projection endpoints available

2. **Phase 3**: Other Income Sources ✅
   - Full CRUD operations
   - Month-by-month projections
   - COLA adjustments

3. **Additional Features**: ✅
   - Portfolio Holdings tracking
   - Fixed Expenses (scenario-specific)
   - Planned Fixed Expenses (global)
   - Saved Scenarios with projections
   - Retirement projection engine (combines accounts, SS, other income, spending, taxes)

### ❌ Missing Features

The following features from `COMPLETE_RETIREMENT_ANALYSIS.md` are not yet implemented:

1. **Partner/Spouse Social Security**: Support for dual Social Security benefits
   - Spousal benefits (up to 50% of higher earner's benefit)
   - Survivor benefits (up to 100% of deceased spouse's benefit)
   - Coordination strategies (one claims early, one delays)
   - Dual benefit tracking (both spouses have their own benefits)
2. **Time-Series Visualizations**: Graphs showing projections over time
   - Social Security income over time (with COLA adjustments)
   - Withdrawals by account type over time (pretax, Roth, taxable, cash)
   - Taxes paid over time (federal, state, total)
   - Available spending over time (after taxes)
   - Distance to next tax bracket over time (how much room until bracket change)
   - Portfolio balance over time (total and by account type)
   - Income vs spending over time (gap analysis)
3. **Account Type Segregation**: Separate tracking of pretax, Roth, taxable, cash in projections
4. **Bucket Strategy**: Time-based return rates (3.5% years 1-3, 5.25% years 4-7, etc.)
5. **Withdrawal Sequencing**: Withdraw 100% from pretax first, preserve Roth
6. **Roth Conversions**: Track and model annual conversions
7. **RMD Calculations**: Required Minimum Distributions starting at age 75
8. **Medicare IRMAA**: Surcharge calculations based on MAGI
9. **Tax Bracket Indexing**: Annual inflation adjustments

See `IMPLEMENTATION_ROADMAP.md` for detailed implementation plan (9 phases, 54 tasks).

## Code Structure Benefits

- **Layered Architecture**: Easy to test and maintain
- **Type Safety**: Pydantic + TypeScript catch errors early
- **Separation of Concerns**: Repository → Service → API
- **Testability**: Unit tests at each layer
- **Scalability**: Easy to add new features
