"""Scenario modeling Pydantic schemas."""

from datetime import date, datetime
from decimal import Decimal
from typing import Literal, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class AssetAllocation(BaseModel):
    """Asset allocation for a scenario with Vanguard ETF equivalents."""

    # US Equities
    total_us_stock: Decimal = Field(0, ge=0, le=100, description="Total US Stock (VTI)")
    us_small_cap_value: Decimal = Field(0, ge=0, le=100, description="US Small Cap Value (VBR)")

    # International Equities
    total_foreign_stock: Decimal = Field(
        0, ge=0, le=100, description="Total International Stock (VXUS)"
    )
    international_small_cap_value: Decimal = Field(
        0, ge=0, le=100, description="International Small Cap Value (VSS)"
    )
    developed_markets: Decimal = Field(0, ge=0, le=100, description="Developed Markets (VEA)")
    emerging_markets: Decimal = Field(0, ge=0, le=100, description="Emerging Markets (VWO)")

    # Fixed Income
    bonds: Decimal = Field(0, ge=0, le=100, description="Total Bond Market (BND)")
    short_term_treasuries: Decimal = Field(
        0, ge=0, le=100, description="Short-Term Treasury (VGSH)"
    )
    intermediate_term_treasuries: Decimal = Field(
        0, ge=0, le=100, description="Intermediate-Term Treasury (VGIT)"
    )
    municipal_bonds: Decimal = Field(0, ge=0, le=100, description="Municipal Bonds (VTEB)")

    # Cash & Other
    cash: Decimal = Field(0, ge=0, le=100, description="Cash / Money Market (VMFXX)")
    other: Decimal = Field(0, ge=0, le=100, description="Other investments")

    def validate_total(self) -> bool:
        """Validate that allocations sum to 100%."""
        total = (
            self.total_us_stock
            + self.total_foreign_stock
            + self.us_small_cap_value
            + self.international_small_cap_value
            + self.developed_markets
            + self.emerging_markets
            + self.bonds
            + self.short_term_treasuries
            + self.intermediate_term_treasuries
            + self.municipal_bonds
            + self.cash
            + self.other
        )
        return abs(float(total) - 100.0) < 0.01


# ===== SAVED SCENARIO SCHEMAS =====


class SavedScenarioBase(BaseModel):
    """Base schema for saved scenarios."""

    name: str = Field(..., max_length=255, description="Name of the scenario")
    description: Optional[str] = Field(None, description="Description of the scenario")

    # Social Security
    ss_start_age_years: int = Field(67, ge=62, le=70, description="Age (years) to start SS")
    ss_start_age_months: int = Field(0, ge=0, le=11, description="Additional months (0-11)")

    # Spending
    monthly_spending: Decimal = Field(Decimal("10000"), ge=0, description="Monthly spending amount")
    annual_lump_spending: Decimal = Field(
        Decimal("0"), ge=0, description="Annual lump sum spending"
    )
    inflation_adjusted_percent: Decimal = Field(
        Decimal("50"),
        ge=0,
        le=100,
        description="% of spending subject to inflation (rest is fixed like loans)",
    )
    spending_reduction_percent: Decimal = Field(
        Decimal("0"), ge=0, le=100, description="% to reduce spending"
    )
    spending_reduction_start_year: Optional[int] = Field(
        None, ge=1, description="Year to start reduction"
    )

    # Time
    projection_years: int = Field(35, ge=1, le=50, description="Years to project (to age 100)")

    # Asset allocation
    asset_allocation: AssetAllocation = Field(default_factory=AssetAllocation)

    # Returns
    return_source: Literal["10_year_projections", "historical_average", "custom"] = Field(
        "10_year_projections", description="Source of return assumptions"
    )
    custom_return_percent: Optional[Decimal] = Field(
        None, ge=-20, le=30, description="Custom return %"
    )

    # Inflation
    inflation_rate: Decimal = Field(
        Decimal("2.5"), ge=0, le=15, description="Annual inflation rate"
    )


class SavedScenarioCreate(SavedScenarioBase):
    """Schema for creating a saved scenario."""

    pass


class SavedScenarioUpdate(BaseModel):
    """Schema for updating a saved scenario (all fields optional)."""

    name: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    ss_start_age_years: Optional[int] = Field(None, ge=62, le=70)
    ss_start_age_months: Optional[int] = Field(None, ge=0, le=11)
    monthly_spending: Optional[Decimal] = Field(None, ge=0)
    annual_lump_spending: Optional[Decimal] = Field(None, ge=0)
    inflation_adjusted_percent: Optional[Decimal] = Field(None, ge=0, le=100)
    spending_reduction_percent: Optional[Decimal] = Field(None, ge=0, le=100)
    spending_reduction_start_year: Optional[int] = Field(None, ge=1)
    projection_years: Optional[int] = Field(None, ge=1, le=50)
    asset_allocation: Optional[AssetAllocation] = None
    return_source: Optional[Literal["10_year_projections", "historical_average", "custom"]] = None
    custom_return_percent: Optional[Decimal] = Field(None, ge=-20, le=30)
    inflation_rate: Optional[Decimal] = Field(None, ge=0, le=15)


class SavedScenario(SavedScenarioBase):
    """Schema for saved scenario response."""

    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ===== SCENARIO PROJECTION SCHEMAS =====


class ScenarioYearProjection(BaseModel):
    """Projection data for a single year."""

    year: int = Field(..., description="Year number (1-based)")
    calendar_year: int = Field(..., description="Actual calendar year")
    age: int = Field(..., description="Age at start of year")

    # Balances
    starting_balance: Decimal = Field(..., description="Portfolio balance at start of year")
    ending_balance: Decimal = Field(..., description="Portfolio balance at end of year")

    # Income
    social_security_income: Decimal = Field(..., description="SS income for the year")
    other_income: Decimal = Field(..., description="Other income sources")
    total_income: Decimal = Field(..., description="Total income")

    # Spending breakdown
    fixed_spending: Decimal = Field(
        Decimal("0"), description="Fixed expenses (not inflation-adjusted)"
    )
    variable_spending: Decimal = Field(
        Decimal("0"), description="Variable expenses (inflation-adjusted)"
    )
    monthly_spending: Decimal = Field(..., description="Total monthly spending")
    annual_spending: Decimal = Field(..., description="Total annual spending")
    annual_lump_spending: Decimal = Field(..., description="Lump sum spending")
    total_spending: Decimal = Field(..., description="Total spending")

    # Portfolio activity
    portfolio_withdrawal: Decimal = Field(..., description="Amount withdrawn from portfolio")
    investment_return: Decimal = Field(..., description="Investment gains/losses")
    return_percent: Decimal = Field(..., description="Return percentage for year")

    # Taxes
    taxable_income: Decimal = Field(Decimal("0"), description="Total taxable income for the year")
    federal_tax: Decimal = Field(Decimal("0"), description="Federal income tax")
    state_tax: Decimal = Field(Decimal("0"), description="State income tax")
    total_tax: Decimal = Field(Decimal("0"), description="Total taxes paid")
    after_tax_income: Decimal = Field(Decimal("0"), description="Income after taxes")

    # Status
    is_depleted: bool = Field(False, description="Whether portfolio is depleted")


class ScenarioProjectionResult(BaseModel):
    """Complete scenario projection result."""

    scenario_id: Optional[UUID] = Field(None, description="ID if saved")
    scenario_name: str

    # Summary
    initial_portfolio: Decimal
    final_portfolio: Decimal
    years_until_depletion: Optional[int] = Field(None, description="Years until portfolio runs out")
    total_ss_received: Decimal
    total_other_income: Decimal
    total_spending: Decimal
    total_withdrawals: Decimal

    # Key metrics
    ss_start_age: str = Field(..., description="SS start age (e.g., '67 years 0 months')")
    average_return_percent: Decimal
    inflation_rate: Decimal

    # Year-by-year projections
    projections: list[ScenarioYearProjection]


class ScenarioComparisonResult(BaseModel):
    """Result comparing multiple scenarios."""

    scenarios: list[ScenarioProjectionResult]
    comparison_summary: dict[str, dict]  # scenario_name -> summary metrics


# ===== LEGACY SCHEMAS (for backward compatibility) =====


class ScenarioCreate(BaseModel):
    """Schema for creating a scenario projection (legacy)."""

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
    """Complete scenario projection result (legacy)."""

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
