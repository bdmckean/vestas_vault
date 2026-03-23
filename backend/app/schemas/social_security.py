"""Social Security Pydantic schemas."""

from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from typing import Literal

from pydantic import BaseModel, Field, field_validator


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
    spouse_birth_date: date | None = Field(None, description="Spouse date of birth")
    spouse_fra_monthly_amount: Decimal | None = Field(
        None,
        ge=0,
        description="Spouse monthly benefit at Full Retirement Age (when spouse_benefit_source is own)",
        decimal_places=2,
    )
    spouse_benefit_source: Literal["own", "half_of_partner"] | None = Field(
        "own",
        description="Spouse benefit: own amount at FRA, or 50% of partner's FRA",
    )
    default_ss_start_age_years: int | None = Field(None, ge=62, le=70)
    default_ss_start_age_months: int | None = Field(None, ge=0, le=11)
    default_spouse_ss_start_age_years: int | None = Field(None, ge=62, le=70)
    default_spouse_ss_start_age_months: int | None = Field(None, ge=0, le=11)


class SocialSecurityUpdate(BaseModel):
    """Schema for updating Social Security configuration."""

    birth_date: date | None = None
    fra_monthly_amount: Decimal | None = Field(None, ge=0, decimal_places=2)
    spouse_birth_date: date | None = None
    spouse_fra_monthly_amount: Decimal | None = Field(None, ge=0, decimal_places=2)
    spouse_benefit_source: Literal["own", "half_of_partner"] | None = None
    default_ss_start_age_years: int | None = Field(None, ge=62, le=70)
    default_ss_start_age_months: int | None = Field(None, ge=0, le=11)
    default_spouse_ss_start_age_years: int | None = Field(None, ge=62, le=70)
    default_spouse_ss_start_age_months: int | None = Field(None, ge=0, le=11)


class SocialSecurity(BaseModel):
    """Schema for Social Security response."""

    id: UUID
    birth_date: date
    fra_monthly_amount: Decimal
    fra_age: Decimal  # Computed from birth_date
    spouse_birth_date: date | None = None
    spouse_fra_monthly_amount: Decimal | None = None
    spouse_fra_age: Decimal | None = None  # Computed from spouse_birth_date
    spouse_benefit_source: Literal["own", "half_of_partner"] | None = None
    default_ss_start_age_years: int | None = None
    default_ss_start_age_months: int | None = None
    default_spouse_ss_start_age_years: int | None = None
    default_spouse_ss_start_age_months: int | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

    @field_validator("spouse_benefit_source", mode="before")
    @classmethod
    def coerce_spouse_benefit_source(cls, v: object) -> Literal["own", "half_of_partner"] | None:
        """Tolerate empty string or invalid DB values from before the spouse feature."""
        if v is None:
            return None
        s = str(v).strip().lower() if v else None
        if s in ("own", "half_of_partner"):
            return s  # type: ignore[return-value]
        return None

    @field_validator(
        "fra_age",
        "fra_monthly_amount",
        "spouse_fra_age",
        "spouse_fra_monthly_amount",
        mode="before",
    )
    @classmethod
    def coerce_decimal(cls, v: object) -> Decimal | None:
        """Coerce float from DB driver to Decimal; allow None for optional fields."""
        if v is None:
            return None
        if isinstance(v, Decimal):
            return v
        if isinstance(v, (int, float)):
            return Decimal(str(v))
        return v  # type: ignore[return-value]


class SocialSecurityPaymentProjection(BaseModel):
    """Schema for Social Security payment projection by age."""

    age_years: int = Field(..., description="Years component of age when benefit starts")
    age_months: int = Field(..., description="Months component of age when benefit starts (0-11)")
    start_date: date = Field(..., description="Date when benefit starts")
    monthly_amount: Decimal = Field(..., description="Monthly benefit amount")
    annual_amount: Decimal = Field(..., description="Annual benefit amount")
    reduction_percent: Decimal | None = Field(None, description="Reduction percentage vs FRA")
    increase_percent: Decimal | None = Field(None, description="Increase percentage vs FRA")


class SocialSecurityProjectionsResponse(BaseModel):
    """Response with primary and optional spouse payment projections (by start age)."""

    primary_projections: list[SocialSecurityPaymentProjection] = Field(
        ..., description="Primary benefit by start age (62–70)"
    )
    spouse_projections: list[SocialSecurityPaymentProjection] | None = Field(
        None,
        description="Spouse benefit by start age when spouse is configured",
    )
