"""Tax configuration API endpoints."""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.tax_config import (
    SeniorDeductionBreakdown,
    TaxConfig,
    TaxConfigCreate,
    TaxConfigUpdate,
)
from app.services.tax_config_service import TaxConfigService

router = APIRouter(prefix="/tax-config", tags=["tax-config"])


@router.get("", response_model=TaxConfig | None)
def get_tax_config(db: Session = Depends(get_db)):
    """Get the tax configuration."""
    service = TaxConfigService(db)
    return service.get_tax_config()


@router.post("", response_model=TaxConfig, status_code=status.HTTP_201_CREATED)
def create_tax_config(tax_config_data: TaxConfigCreate, db: Session = Depends(get_db)):
    """Create a new tax configuration."""
    service = TaxConfigService(db)
    try:
        return service.create_tax_config(tax_config_data)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.put("", response_model=TaxConfig)
def update_tax_config(tax_config_data: TaxConfigUpdate, db: Session = Depends(get_db)):
    """Update existing tax configuration."""
    service = TaxConfigService(db)
    try:
        return service.update_tax_config(tax_config_data)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
def delete_tax_config(db: Session = Depends(get_db)):
    """Delete tax configuration."""
    service = TaxConfigService(db)
    try:
        service.delete_tax_config()
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.get("/senior-deductions", response_model=SeniorDeductionBreakdown)
def calculate_senior_deductions(
    filing_status: str = Query(..., description="Filing status"),
    primary_age: int | None = Query(None, description="Age of primary filer"),
    spouse_age: int | None = Query(None, description="Age of spouse"),
    annual_income: float | None = Query(None, description="Annual income"),
    tax_year: int = Query(2026, description="Tax year"),
    db: Session = Depends(get_db),
):
    """Calculate senior deductions breakdown."""
    from decimal import Decimal

    service = TaxConfigService(db)
    income_decimal = Decimal(str(annual_income)) if annual_income else None
    return service.calculate_senior_deductions(
        filing_status, primary_age, spouse_age, income_decimal, tax_year
    )
