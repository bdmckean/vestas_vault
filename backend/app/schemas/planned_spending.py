"""Planned spending Pydantic schemas."""

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field


class PlannedSpendingBase(BaseModel):
    """Base schema for planned spending."""

    monthly_spending: Decimal = Field(..., ge=0, description="Desired monthly spending amount")
    annual_lump_sum: Decimal = Field(..., ge=0, description="Annual lump sum spending amount")


class PlannedSpendingCreate(PlannedSpendingBase):
    """Schema for creating planned spending."""

    pass


class PlannedSpendingUpdate(PlannedSpendingBase):
    """Schema for updating planned spending."""

    pass


class PlannedSpending(PlannedSpendingBase):
    """Schema for planned spending response."""

    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
