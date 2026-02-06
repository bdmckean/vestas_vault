"""Tax configuration API endpoints."""

from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.tax_config import (
    SeniorDeductionBreakdown,
    TaxConfig,
    TaxConfigCreate,
    TaxConfigUpdate,
)
from app.services.other_income_service import OtherIncomeService
from app.services.social_security_service import SocialSecurityService
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
    service = TaxConfigService(db)
    income_decimal = Decimal(str(annual_income)) if annual_income else None
    return service.calculate_senior_deductions(
        filing_status, primary_age, spouse_age, income_decimal, tax_year
    )


@router.get("/estimated-annual-income")
def get_estimated_annual_income(db: Session = Depends(get_db)):
    """
    Calculate estimated annual income from Social Security and Other Income sources.

    Returns breakdown of income sources for tax planning purposes.
    """
    ss_service = SocialSecurityService(db)
    other_income_service = OtherIncomeService(db)

    # Get Social Security (FRA amount * 12)
    ss_config = ss_service.get_social_security()
    ss_annual = Decimal("0")
    ss_monthly = Decimal("0")
    if ss_config:
        ss_monthly = Decimal(str(ss_config.fra_monthly_amount))
        ss_annual = ss_monthly * 12

    # Get Other Income (sum of all active sources * 12)
    # For simplicity, use current monthly total and annualize
    other_incomes = other_income_service.get_all_income()
    other_income_annual = Decimal("0")
    other_income_monthly = Decimal("0")
    taxable_other_income_annual = Decimal("0")

    income_breakdown = []
    for income in other_incomes:
        monthly = Decimal(str(income.monthly_amount))
        annual = monthly * 12
        other_income_monthly += monthly
        other_income_annual += annual
        if income.is_taxable:
            taxable_other_income_annual += annual
        income_breakdown.append(
            {
                "name": income.name,
                "income_type": income.income_type,
                "monthly_amount": str(monthly),
                "annual_amount": str(annual),
                "is_taxable": income.is_taxable,
            }
        )

    # Total estimated annual income
    total_annual = ss_annual + other_income_annual
    total_monthly = ss_monthly + other_income_monthly

    # For senior deduction eligibility, we need total income
    # Social Security is partially taxable based on provisional income,
    # but for the $150k threshold, we use total gross income

    return {
        "social_security": {
            "monthly_amount": str(ss_monthly),
            "annual_amount": str(ss_annual),
            "note": "FRA monthly amount (may vary if claiming early/late)",
        },
        "other_income": {
            "monthly_amount": str(other_income_monthly),
            "annual_amount": str(other_income_annual),
            "taxable_annual_amount": str(taxable_other_income_annual),
            "sources": income_breakdown,
        },
        "total": {
            "monthly_amount": str(total_monthly),
            "annual_amount": str(total_annual),
        },
        "note": "This is an estimate based on current configuration. Actual income may vary based on claiming age, COLA adjustments, and income source timing.",
    }
