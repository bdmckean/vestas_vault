"""Pydantic schemas for planned fixed expenses."""

from datetime import datetime
from decimal import Decimal
from typing import Optional, Union
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


class PlannedFixedExpenseBase(BaseModel):
    """Base schema for planned fixed expense."""

    name: str = Field(..., min_length=1, max_length=255, description="Name of the fixed expense")
    monthly_amount: str = Field(..., description="Monthly amount of the fixed expense")
    start_year: int = Field(
        default=2024, ge=2000, le=2100, description="Year when the expense starts"
    )
    end_year: int = Field(..., ge=2000, le=2100, description="Year when the expense ends")
    notes: Optional[str] = Field(None, description="Additional notes")

    @field_validator("monthly_amount", mode="before")
    @classmethod
    def convert_decimal_to_str(cls, v: Union[str, Decimal, float]) -> str:
        """Convert Decimal or float to string."""
        if isinstance(v, (Decimal, float)):
            return str(v)
        return v

    @field_validator("end_year")
    @classmethod
    def validate_end_year(cls, v: int, info) -> int:
        """Ensure end_year is greater than start_year."""
        start_year = info.data.get("start_year", 2024)
        if v <= start_year:
            raise ValueError("end_year must be greater than start_year")
        return v


class PlannedFixedExpenseCreate(PlannedFixedExpenseBase):
    """Schema for creating a planned fixed expense."""

    pass


class PlannedFixedExpenseUpdate(BaseModel):
    """Schema for updating a planned fixed expense."""

    name: Optional[str] = Field(None, min_length=1, max_length=255)
    monthly_amount: Optional[str] = None
    start_year: Optional[int] = Field(None, ge=2000, le=2100)
    end_year: Optional[int] = Field(None, ge=2000, le=2100)
    notes: Optional[str] = None


class PlannedFixedExpense(PlannedFixedExpenseBase):
    """Schema for planned fixed expense response."""

    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PlannedFixedExpenseSummary(BaseModel):
    """Summary of all planned fixed expenses."""

    total_monthly: str
    expenses: list[PlannedFixedExpense]
