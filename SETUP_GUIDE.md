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

Once Phase 1 (Account Management) is working:

1. **Phase 2**: Add asset class return projections
   - Load from `investment_return_projections.json`
   - Create projection service
   - Add projection endpoints

2. **Phase 3**: Add withdrawal planning
   - Social Security calculations
   - Withdrawal strategy models
   - Tax calculations

3. **Phase 4**: Portfolio projections
   - Multi-year projections
   - Scenario analysis
   - Guardrails implementation

## Code Structure Benefits

- **Layered Architecture**: Easy to test and maintain
- **Type Safety**: Pydantic + TypeScript catch errors early
- **Separation of Concerns**: Repository → Service → API
- **Testability**: Unit tests at each layer
- **Scalability**: Easy to add new features
