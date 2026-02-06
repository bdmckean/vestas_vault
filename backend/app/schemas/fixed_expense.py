"""Fixed expense Pydantic schemas."""

from datetime import datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class FixedExpenseBase(BaseModel):
    """Base schema for fixed expenses."""

    name: str = Field(..., max_length=255, description="Name of the expense (e.g., 'Mortgage')")
    monthly_amount: Decimal = Field(..., ge=0, description="Monthly payment amount")
    start_year: int = Field(1, ge=1, description="Projection year when expense starts")
    end_year: Optional[int] = Field(None, ge=1, description="Projection year when expense ends (null = forever)")
    notes: Optional[str] = Field(None, max_length=500, description="Optional notes")


class FixedExpenseCreate(FixedExpenseBase):
    """Schema for creating a fixed expense."""

    scenario_id: UUID = Field(..., description="ID of the scenario this expense belongs to")


class FixedExpenseUpdate(BaseModel):
    """Schema for updating a fixed expense (all fields optional)."""

    name: Optional[str] = Field(None, max_length=255)
    monthly_amount: Optional[Decimal] = Field(None, ge=0)
    start_year: Optional[int] = Field(None, ge=1)
    end_year: Optional[int] = Field(None, ge=1)
    notes: Optional[str] = Field(None, max_length=500)


class FixedExpense(FixedExpenseBase):
    """Schema for fixed expense response."""

    id: UUID
    scenario_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class FixedExpenseSummary(BaseModel):
    """Summary of fixed expenses for a projection year."""
    
    year: int
    total_monthly_fixed: Decimal = Field(..., description="Total monthly fixed expenses for this year")
    total_annual_fixed: Decimal = Field(..., description="Total annual fixed expenses (monthly × 12)")
    active_expenses: list[str] = Field(..., description="Names of active fixed expenses")
