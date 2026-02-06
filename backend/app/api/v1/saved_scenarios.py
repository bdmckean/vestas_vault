"""Saved Scenarios API endpoints."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.scenario import (
    SavedScenario,
    SavedScenarioCreate,
    SavedScenarioUpdate,
    ScenarioProjectionResult,
    ScenarioComparisonResult,
)
from app.services.retirement_scenario_service import RetirementScenarioService

router = APIRouter(prefix="/saved-scenarios", tags=["saved-scenarios"])


@router.get("", response_model=list[SavedScenario])
def list_scenarios(db: Session = Depends(get_db)):
    """Get all saved scenarios."""
    service = RetirementScenarioService(db)
    return service.get_all_scenarios()


@router.get("/{scenario_id}", response_model=SavedScenario)
def get_scenario(scenario_id: UUID, db: Session = Depends(get_db)):
    """Get a saved scenario by ID."""
    service = RetirementScenarioService(db)
    scenario = service.get_scenario_by_id(scenario_id)
    if not scenario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Scenario {scenario_id} not found",
        )
    return scenario


@router.post("", response_model=SavedScenario, status_code=status.HTTP_201_CREATED)
def create_scenario(scenario_data: SavedScenarioCreate, db: Session = Depends(get_db)):
    """Create a new saved scenario."""
    service = RetirementScenarioService(db)
    return service.create_scenario(scenario_data)


@router.put("/{scenario_id}", response_model=SavedScenario)
def update_scenario(
    scenario_id: UUID,
    scenario_data: SavedScenarioUpdate,
    db: Session = Depends(get_db),
):
    """Update an existing scenario."""
    service = RetirementScenarioService(db)
    scenario = service.update_scenario(scenario_id, scenario_data)
    if not scenario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Scenario {scenario_id} not found",
        )
    return scenario


@router.delete("/{scenario_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_scenario(scenario_id: UUID, db: Session = Depends(get_db)):
    """Delete a saved scenario."""
    service = RetirementScenarioService(db)
    success = service.delete_scenario(scenario_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Scenario {scenario_id} not found",
        )
    return None


@router.post("/{scenario_id}/duplicate", response_model=SavedScenario)
def duplicate_scenario(
    scenario_id: UUID,
    new_name: str = Query(..., min_length=1, description="Name for the duplicated scenario"),
    db: Session = Depends(get_db),
):
    """Duplicate an existing scenario with a new name."""
    service = RetirementScenarioService(db)
    scenario = service.duplicate_scenario(scenario_id, new_name)
    if not scenario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Scenario {scenario_id} not found",
        )
    return scenario


@router.get("/{scenario_id}/projection", response_model=ScenarioProjectionResult)
def get_scenario_projection(scenario_id: UUID, db: Session = Depends(get_db)):
    """Generate projection for a saved scenario."""
    service = RetirementScenarioService(db)
    try:
        return service.generate_projection(scenario_id=scenario_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/projection", response_model=ScenarioProjectionResult)
def generate_adhoc_projection(scenario_data: SavedScenarioCreate, db: Session = Depends(get_db)):
    """Generate projection for ad-hoc scenario data (without saving)."""
    service = RetirementScenarioService(db)
    try:
        return service.generate_projection(scenario_data=scenario_data)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/compare", response_model=ScenarioComparisonResult)
def compare_scenarios(
    scenario_ids: list[UUID],
    db: Session = Depends(get_db),
):
    """Compare multiple saved scenarios."""
    if len(scenario_ids) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least 2 scenarios required for comparison",
        )
    service = RetirementScenarioService(db)
    return service.compare_scenarios(scenario_ids)


@router.post("/default", response_model=SavedScenario, status_code=status.HTTP_201_CREATED)
def create_or_update_default_scenario(db: Session = Depends(get_db)):
    """Create or update the default scenario from current configuration."""
    service = RetirementScenarioService(db)
    try:
        return service.generate_default_scenario()
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
