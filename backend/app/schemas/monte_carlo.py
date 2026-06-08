"""Pydantic schemas for Monte Carlo prep outputs."""

from pydantic import BaseModel, Field
from uuid import UUID


class MonteCarloPreparedSeries(BaseModel):
    """Normalized return assumption for a scenario asset key."""

    scenario_asset_key: str = Field(..., description="Scenario asset allocation key")
    source_section: str = Field(..., description="Top-level section in historical assumptions file")
    source_node: str = Field(..., description="Node key in historical assumptions file")
    selected_period: str = Field(..., description="Requested period key (e.g., 30_year)")
    expected_return_pct: float = Field(..., description="Nominal expected annual return percent")
    source_years: int | None = Field(None, description="Data span years for selected period")


class MonteCarloDataPrepSummary(BaseModel):
    """Summary metadata for prep run."""

    period_key: str
    asset_keys_expected: int
    asset_keys_prepared: int
    inflation_rate_pct: float
    warnings_count: int


class MonteCarloDataPrepResponse(BaseModel):
    """Response for MC data prep endpoint."""

    summary: MonteCarloDataPrepSummary
    series: list[MonteCarloPreparedSeries]
    mapping: dict[str, tuple[str, str]]
    warnings: list[str]


class MonteCarloRunRequest(BaseModel):
    """Request payload for Monte Carlo run (MVP)."""

    scenario_id: UUID
    simulations: int = Field(1000, ge=100, le=10000)
    period_key: str = Field("30_year", description="Assumption period key")
    seed: int | None = Field(None, description="Optional RNG seed for reproducibility")


class MonteCarloYearPercentile(BaseModel):
    year: int
    p10: float
    p25: float
    p50: float
    p75: float
    p90: float


class MonteCarloBaselineYear(BaseModel):
    """Baseline (deterministic) projection for comparison."""

    year: int
    balance: float


class MonteCarloRunResponse(BaseModel):
    """Monte Carlo fan-chart ready output (MVP)."""

    scenario_id: UUID
    scenario_name: str
    simulations: int
    horizon_years: int
    success_rate_pct: float
    terminal_percentiles: dict[str, float]
    yearly_percentiles: list[MonteCarloYearPercentile]
    baseline_projection: list[MonteCarloBaselineYear]
    baseline_percentile: float = Field(
        ..., description="Percentile rank of baseline terminal value (0-100)"
    )
    assumptions: dict[str, float | str]
