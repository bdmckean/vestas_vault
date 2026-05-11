"""Monte Carlo API endpoints (data prep phase)."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.monte_carlo import MonteCarloDataPrepResponse
from app.schemas.monte_carlo import MonteCarloRunRequest, MonteCarloRunResponse
from app.services.monte_carlo_data_prep_service import MonteCarloDataPrepService

router = APIRouter(prefix="/monte-carlo", tags=["monte-carlo"])


@router.get("/data-prep", response_model=MonteCarloDataPrepResponse)
def get_monte_carlo_data_prep(
    period_key: str = Query(
        "30_year",
        description="Historical period key to normalize assumptions from (e.g., 30_year, since_1970)",
    ),
    db: Session = Depends(get_db),
):
    """Return normalized and validated assumptions for Monte Carlo Week 1 data prep."""
    service = MonteCarloDataPrepService(db)
    return service.prepare(period_key=period_key)


@router.post("/run", response_model=MonteCarloRunResponse)
def run_monte_carlo(payload: MonteCarloRunRequest, db: Session = Depends(get_db)):
    """Run fast Monte Carlo MVP and return fan-chart percentile paths."""
    service = MonteCarloDataPrepService(db)
    try:
        return service.run_mvp_simulation(
            scenario_id=payload.scenario_id,
            simulations=payload.simulations,
            period_key=payload.period_key,
            seed=payload.seed,
        )
    except ValueError as e:
        from fastapi import HTTPException, status

        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
