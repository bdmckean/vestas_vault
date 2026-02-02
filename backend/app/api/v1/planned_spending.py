"""Planned spending API endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.planned_spending import (
    PlannedSpending,
    PlannedSpendingCreate,
    PlannedSpendingUpdate,
)
from app.services.planned_spending_service import PlannedSpendingService

router = APIRouter(prefix="/planned-spending", tags=["planned-spending"])


@router.get("", response_model=PlannedSpending | None)
def get_planned_spending(db: Session = Depends(get_db)):
    """Get the planned spending configuration."""
    service = PlannedSpendingService(db)
    return service.get_planned_spending()


@router.post("", response_model=PlannedSpending, status_code=status.HTTP_201_CREATED)
def create_planned_spending(
    planned_spending_data: PlannedSpendingCreate, db: Session = Depends(get_db)
):
    """Create a new planned spending configuration."""
    service = PlannedSpendingService(db)
    try:
        return service.create_planned_spending(planned_spending_data)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.put("", response_model=PlannedSpending)
def update_planned_spending(
    planned_spending_data: PlannedSpendingUpdate, db: Session = Depends(get_db)
):
    """Update existing planned spending configuration."""
    service = PlannedSpendingService(db)
    try:
        return service.update_planned_spending(planned_spending_data)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
def delete_planned_spending(db: Session = Depends(get_db)):
    """Delete planned spending configuration."""
    service = PlannedSpendingService(db)
    try:
        service.delete_planned_spending()
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.get("/total-annual")
def get_total_annual_spending(db: Session = Depends(get_db)):
    """Get total annual spending (monthly * 12 + annual lump sum)."""
    service = PlannedSpendingService(db)
    total = service.get_total_annual_spending()
    return {"total_annual_spending": str(total)}
