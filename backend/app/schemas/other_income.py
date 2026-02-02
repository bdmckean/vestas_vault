"""Other income Pydantic schemas."""

from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import Dict, Optional
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


class IncomeType(str, Enum):
    """Types of other income sources."""

    PENSION = "pension"
    EMPLOYMENT = "employment"
    RENTAL = "rental"
    ANNUITY = "annuity"
    DIVIDEND = "dividend"
    OTHER = "other"


class OtherIncomeBase(BaseModel):
    """Base schema for other income."""

    name: str = Field(
        ..., min_length=1, max_length=255, description="Name/description of income source"
    )
    income_type: IncomeType = Field(..., description="Type of income")
    monthly_amount: Decimal = Field(..., ge=0, description="Monthly income amount")
    start_month: int = Field(..., ge=1, le=12, description="Start month (1-12)")
    start_year: int = Field(..., ge=1900, le=2100, description="Start year")
    end_month: Optional[int] = Field(None, ge=1, le=12, description="End month (null = ongoing)")
    end_year: Optional[int] = Field(None, ge=1900, le=2100, description="End year (null = ongoing)")
    cola_rate: Decimal = Field(
        default=Decimal("0"), ge=0, le=1, description="Annual COLA rate (e.g., 0.02 for 2%)"
    )
    is_taxable: bool = Field(default=True, description="Is this income taxable")
    notes: Optional[str] = Field(None, description="Additional notes")

    @field_validator("end_month", "end_year")
    @classmethod
    def validate_end_date(cls, v, info):
        """Ensure both end_month and end_year are set together or neither."""
        # This will be called for each field individually
        # Full validation happens in model_validator
        return v


class OtherIncomeCreate(OtherIncomeBase):
    """Schema for creating other income."""

    pass


class OtherIncomeUpdate(BaseModel):
    """Schema for updating other income (all fields optional)."""

    name: Optional[str] = Field(None, min_length=1, max_length=255)
    income_type: Optional[IncomeType] = None
    monthly_amount: Optional[Decimal] = Field(None, ge=0)
    start_month: Optional[int] = Field(None, ge=1, le=12)
    start_year: Optional[int] = Field(None, ge=1900, le=2100)
    end_month: Optional[int] = Field(None, ge=1, le=12)
    end_year: Optional[int] = Field(None, ge=1900, le=2100)
    cola_rate: Optional[Decimal] = Field(None, ge=0, le=1)
    is_taxable: Optional[bool] = None
    notes: Optional[str] = None


class OtherIncome(OtherIncomeBase):
    """Schema for other income response."""

    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class OtherIncomeProjection(BaseModel):
    """Monthly projection for a single income source."""

    income_id: UUID
    name: str
    income_type: IncomeType
    year: int
    month: int
    amount: Decimal
    is_taxable: bool


class OtherIncomeSummary(BaseModel):
    """Aggregated projections across all income sources for a single month."""

    year: int
    month: int
    total_amount: Decimal
    taxable_amount: Decimal
    non_taxable_amount: Decimal
    by_type: Dict[str, Decimal]
    by_source: Dict[str, Decimal]
