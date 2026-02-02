"""Scenario modeling Pydantic schemas."""

from datetime import date
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, Field


class AssetAllocation(BaseModel):
    """Asset allocation for a scenario."""

    total_us_stock: Decimal = Field(
        0, ge=0, le=100, description="Percentage allocation to US stocks"
    )
    total_foreign_stock: Decimal = Field(
        0, ge=0, le=100, description="Percentage allocation to foreign stocks"
    )
    us_small_cap_value: Decimal = Field(
        0, ge=0, le=100, description="Percentage allocation to US small-cap value"
    )
    bonds: Decimal = Field(0, ge=0, le=100, description="Percentage allocation to bonds")
    short_term_treasuries: Decimal = Field(
        0, ge=0, le=100, description="Percentage allocation to short-term treasuries"
    )
    cash: Decimal = Field(0, ge=0, le=100, description="Percentage allocation to cash")

    def validate_total(self) -> bool:
        """Validate that allocations sum to 100%."""
        total = (
            self.total_us_stock
            + self.total_foreign_stock
            + self.us_small_cap_value
            + self.bonds
            + self.short_term_treasuries
            + self.cash
        )
        return abs(float(total) - 100.0) < 0.01


class ScenarioCreate(BaseModel):
    """Schema for creating a scenario projection."""

    name: str = Field(..., description="Name of the scenario")
    initial_amount: Decimal = Field(..., ge=0, description="Initial investment amount")
    start_date: date = Field(..., description="Start date for the projection")
    end_date: date = Field(..., description="End date for the projection")
    asset_allocation: AssetAllocation = Field(..., description="Asset allocation percentages")
    return_source: Literal["10_year_projections", "historical_average", "historical_period"] = (
        Field(..., description="Source of return data")
    )
    historical_period_start: date | None = Field(
        None,
        description="Start date of historical period to use (if return_source is historical_period)",
    )
    historical_period_end: date | None = Field(
        None,
        description="End date of historical period to use (if return_source is historical_period)",
    )
    rebalance_frequency: Literal["monthly", "quarterly", "annually", "never"] = Field(
        "annually", description="How often to rebalance the portfolio"
    )
    contribution_amount: Decimal = Field(
        0, ge=0, description="Monthly contribution amount (0 for no contributions)"
    )
    contribution_frequency: Literal["monthly", "quarterly", "annually"] = Field(
        "monthly", description="Frequency of contributions"
    )


class ScenarioPeriod(BaseModel):
    """A single period (month or year) in a scenario projection."""

    period_start: date = Field(..., description="Start date of the period")
    period_end: date = Field(..., description="End date of the period")
    period_type: Literal["month", "year"] = Field(..., description="Type of period")
    period_number: int = Field(..., description="Period number (1-based)")
    starting_balance: Decimal = Field(..., description="Balance at start of period")
    contribution: Decimal = Field(..., description="Contribution during period")
    return_percent: Decimal = Field(..., description="Return percentage for this period")
    return_amount: Decimal = Field(..., description="Dollar return for this period")
    ending_balance: Decimal = Field(..., description="Balance at end of period")
    asset_values: dict[str, Decimal] = Field(
        ..., description="Value of each asset class at end of period"
    )


class ScenarioResult(BaseModel):
    """Complete scenario projection result."""

    scenario_name: str
    initial_amount: Decimal
    final_amount: Decimal
    total_return: Decimal
    total_return_percent: Decimal
    total_contributions: Decimal
    periods: list[ScenarioPeriod]
    summary_stats: dict[str, Decimal | int] = Field(
        ..., description="Summary statistics (total periods, average return, etc.)"
    )
