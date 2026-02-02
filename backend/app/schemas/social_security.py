"""Social Security Pydantic schemas."""

from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field


class SocialSecurityBase(BaseModel):
    """Base Social Security schema with common fields."""

    birth_date: date = Field(..., description="Date of birth")
    fra_monthly_amount: Decimal = Field(
        ...,
        ge=0,
        description="Monthly Social Security benefit at Full Retirement Age",
        decimal_places=2,
    )
    # fra_age is computed from birth_date, not user input


class SocialSecurityCreate(BaseModel):
    """Schema for creating Social Security configuration."""

    birth_date: date = Field(..., description="Date of birth")
    fra_monthly_amount: Decimal = Field(
        ...,
        ge=0,
        description="Monthly Social Security benefit at Full Retirement Age",
        decimal_places=2,
    )
    # fra_age will be calculated automatically from birth_date


class SocialSecurityUpdate(BaseModel):
    """Schema for updating Social Security configuration."""

    birth_date: date | None = None
    fra_monthly_amount: Decimal | None = Field(None, ge=0, decimal_places=2)
    # fra_age will be recalculated automatically if birth_date changes


class SocialSecurity(BaseModel):
    """Schema for Social Security response."""

    id: UUID
    birth_date: date
    fra_monthly_amount: Decimal
    fra_age: Decimal  # Computed from birth_date
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class SocialSecurityPaymentProjection(BaseModel):
    """Schema for Social Security payment projection by age."""

    age_years: int = Field(..., description="Years component of age when benefit starts")
    age_months: int = Field(..., description="Months component of age when benefit starts (0-11)")
    start_date: date = Field(..., description="Date when benefit starts")
    monthly_amount: Decimal = Field(..., description="Monthly benefit amount")
    annual_amount: Decimal = Field(..., description="Annual benefit amount")
    reduction_percent: Decimal | None = Field(None, description="Reduction percentage vs FRA")
    increase_percent: Decimal | None = Field(None, description="Increase percentage vs FRA")
