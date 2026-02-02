"""Other income API endpoints."""

from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.other_income import (
    OtherIncome,
    OtherIncomeCreate,
    OtherIncomeProjection,
    OtherIncomeSummary,
    OtherIncomeUpdate,
)
from app.services.other_income_service import OtherIncomeService

router = APIRouter(prefix="/other-income", tags=["other-income"])


@router.get("", response_model=list[OtherIncome])
def list_other_income(db: Session = Depends(get_db)):
    """Get all other income sources."""
    service = OtherIncomeService(db)
    return service.get_all_income()


@router.get("/projections", response_model=list[OtherIncomeProjection])
def get_projections(
    start_year: int = Query(..., ge=1900, le=2100, description="Start year"),
    start_month: int = Query(..., ge=1, le=12, description="Start month"),
    end_year: int = Query(..., ge=1900, le=2100, description="End year"),
    end_month: int = Query(..., ge=1, le=12, description="End month"),
    db: Session = Depends(get_db),
):
    """Get month-by-month projections for all income sources."""
    service = OtherIncomeService(db)
    return service.get_projections(start_year, start_month, end_year, end_month)


@router.get("/summary", response_model=list[OtherIncomeSummary])
def get_monthly_summary(
    start_year: int = Query(..., ge=1900, le=2100, description="Start year"),
    start_month: int = Query(..., ge=1, le=12, description="Start month"),
    end_year: int = Query(..., ge=1900, le=2100, description="End year"),
    end_month: int = Query(..., ge=1, le=12, description="End month"),
    db: Session = Depends(get_db),
):
    """Get aggregated monthly summaries across all income sources."""
    service = OtherIncomeService(db)
    return service.get_monthly_summary(start_year, start_month, end_year, end_month)


@router.get("/total/{year}/{month}")
def get_total_monthly(
    year: int,
    month: int,
    db: Session = Depends(get_db),
):
    """Get total other income for a specific month."""
    if month < 1 or month > 12:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Month must be between 1 and 12",
        )

    service = OtherIncomeService(db)
    total = service.get_total_monthly_income(year, month)
    return {"year": year, "month": month, "total_amount": str(total)}


@router.get("/{income_id}", response_model=OtherIncome)
def get_other_income(income_id: UUID, db: Session = Depends(get_db)):
    """Get other income by ID."""
    service = OtherIncomeService(db)
    income = service.get_income_by_id(income_id)
    if not income:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Other income with id {income_id} not found",
        )
    return income


@router.post("", response_model=OtherIncome, status_code=status.HTTP_201_CREATED)
def create_other_income(income_data: OtherIncomeCreate, db: Session = Depends(get_db)):
    """Create a new other income source."""
    service = OtherIncomeService(db)
    try:
        return service.create_income(income_data)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.put("/{income_id}", response_model=OtherIncome)
def update_other_income(
    income_id: UUID,
    income_data: OtherIncomeUpdate,
    db: Session = Depends(get_db),
):
    """Update an existing other income source."""
    service = OtherIncomeService(db)
    income = service.update_income(income_id, income_data)
    if not income:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Other income with id {income_id} not found",
        )
    return income


@router.delete("/{income_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_other_income(income_id: UUID, db: Session = Depends(get_db)):
    """Delete an other income source."""
    service = OtherIncomeService(db)
    success = service.delete_income(income_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Other income with id {income_id} not found",
        )
    return None
