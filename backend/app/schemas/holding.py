"""Portfolio holding Pydantic schemas."""

from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class AssetClass(str, Enum):
    """Supported asset classes for holdings."""

    TOTAL_US_STOCK = "total_us_stock"
    TOTAL_FOREIGN_STOCK = "total_foreign_stock"
    US_SMALL_CAP_VALUE = "us_small_cap_value"
    INTERNATIONAL_SMALL_CAP_VALUE = "international_small_cap_value"
    DEVELOPED_MARKETS = "developed_markets"
    EMERGING_MARKETS = "emerging_markets"
    BONDS = "bonds"
    SHORT_TERM_TREASURIES = "short_term_treasuries"
    INTERMEDIATE_TERM_TREASURIES = "intermediate_term_treasuries"
    MUNICIPAL_BONDS = "municipal_bonds"
    CASH = "cash"
    OTHER = "other"


class HoldingBase(BaseModel):
    """Base schema for holding."""

    asset_class: AssetClass = Field(..., description="Asset class of the holding")
    ticker: Optional[str] = Field(None, max_length=20, description="Ticker symbol (e.g., VTSAX)")
    name: Optional[str] = Field(None, max_length=255, description="Fund name")
    amount: Decimal = Field(..., ge=0, description="Dollar amount invested")
    notes: Optional[str] = Field(None, description="Additional notes")


class HoldingCreate(HoldingBase):
    """Schema for creating a holding."""

    account_id: UUID = Field(..., description="ID of the account this holding belongs to")


class HoldingUpdate(BaseModel):
    """Schema for updating a holding (all fields optional)."""

    asset_class: Optional[AssetClass] = None
    ticker: Optional[str] = Field(None, max_length=20)
    name: Optional[str] = Field(None, max_length=255)
    amount: Optional[Decimal] = Field(None, ge=0)
    notes: Optional[str] = None


class Holding(HoldingBase):
    """Schema for holding response."""

    id: UUID
    account_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class HoldingWithAllocation(Holding):
    """Holding with allocation percentage."""

    allocation_percent: Decimal = Field(..., description="Percentage of account balance")


class AccountHoldingsSummary(BaseModel):
    """Summary of holdings for an account."""

    account_id: UUID
    account_name: str
    account_balance: Decimal
    holdings_total: Decimal
    difference: Decimal  # Should be 0 if holdings match balance
    holdings: list[HoldingWithAllocation]


class PortfolioAllocation(BaseModel):
    """Portfolio-wide allocation across all accounts."""

    total_portfolio_value: Decimal
    by_asset_class: dict[str, Decimal]  # asset_class -> total amount
    by_asset_class_percent: dict[str, Decimal]  # asset_class -> percentage
    by_account: list[AccountHoldingsSummary]
