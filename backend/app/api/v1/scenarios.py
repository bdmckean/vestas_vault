"""Scenario modeling API endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.scenario import ScenarioCreate, ScenarioResult
from app.services.scenario_service import ScenarioService

router = APIRouter(prefix="/scenarios", tags=["scenarios"])


@router.post("", response_model=ScenarioResult, status_code=status.HTTP_201_CREATED)
def create_scenario(scenario_data: ScenarioCreate, db: Session = Depends(get_db)):
    """Generate a scenario projection."""
    service = ScenarioService(db)
    try:
        return service.generate_scenario(scenario_data)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating scenario: {str(e)}",
        )


@router.post("/export/csv")
def export_scenario_csv(scenario_data: ScenarioCreate, db: Session = Depends(get_db)):
    """Export scenario projection as CSV."""
    service = ScenarioService(db)
    try:
        result = service.generate_scenario(scenario_data)

        def generate_csv():
            """Generate CSV content."""
            # Header
            yield "Period,Start Date,End Date,Starting Balance,Contribution,Return %,Return Amount,Ending Balance"
            for asset in [
                "Total US Stock",
                "Total Foreign Stock",
                "US Small Cap Value",
                "REITs",
                "Bonds",
                "Short Term Treasuries",
                "Cash",
            ]:
                yield f",{asset}"
            yield "\n"

            # Data rows
            for period in result.periods:
                period_label = f"{period.period_type.capitalize()} {period.period_number}"
                yield (
                    f"{period_label},{period.period_start},{period.period_end},"
                    f"{period.starting_balance},{period.contribution},"
                    f"{period.return_percent},{period.return_amount},{period.ending_balance}"
                )
                # Asset values
                asset_keys = [
                    "total_us_stock",
                    "total_foreign_stock",
                    "us_small_cap_value",
                    "reits",
                    "bonds",
                    "short_term_treasuries",
                    "cash",
                ]
                for key in asset_keys:
                    yield f",{period.asset_values.get(key, 0)}"
                yield "\n"

            # Summary row
            yield (
                f"\nSUMMARY,{scenario_data.start_date},{scenario_data.end_date},"
                f"{result.initial_amount},Total: {result.total_contributions},"
                f"Avg: {result.summary_stats['average_return_percent']}%,"
                f"Total: {result.total_return},{result.final_amount}\n"
            )

        return StreamingResponse(
            generate_csv(),
            media_type="text/csv",
            headers={
                "Content-Disposition": f'attachment; filename="{scenario_data.name}_projection.csv"'
            },
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating scenario: {str(e)}",
        )


@router.post("/export/json")
def export_scenario_json(scenario_data: ScenarioCreate, db: Session = Depends(get_db)):
    """Export scenario projection as JSON."""
    service = ScenarioService(db)
    try:
        result = service.generate_scenario(scenario_data)
        return result
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating scenario: {str(e)}",
        )
