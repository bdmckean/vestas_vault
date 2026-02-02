"""Tax configuration Pydantic schemas."""

from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, Field


class TaxConfigBase(BaseModel):
    """Base schema for tax configuration."""

    filing_status: Literal[
        "single",
        "married_filing_jointly",
        "married_filing_separately",
        "head_of_household",
        "qualifying_widow",
    ] = Field(..., description="Federal tax filing status")
    total_deductions: Decimal = Field(
        ..., ge=0, description="Total deductions (standard + itemized + senior)"
    )
    primary_age: int | None = Field(
        None, ge=0, le=120, description="Age of primary filer (for senior deductions)"
    )
    spouse_age: int | None = Field(
        None, ge=0, le=120, description="Age of spouse (for married filing jointly)"
    )
    annual_income: Decimal | None = Field(
        None, ge=0, description="Annual income (for bonus senior deduction eligibility)"
    )


class TaxConfigCreate(TaxConfigBase):
    """Schema for creating tax configuration."""

    pass


class TaxConfigUpdate(TaxConfigBase):
    """Schema for updating tax configuration."""

    pass


class TaxConfig(TaxConfigBase):
    """Schema for tax configuration response."""

    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SeniorDeductionBreakdown(BaseModel):
    """Breakdown of senior deductions."""

    base_standard_deduction: Decimal
    additional_senior_deduction: Decimal
    bonus_senior_deduction: Decimal
    total_automatic_deduction: Decimal
    explanation: str
