"""Monte Carlo data preparation service.

Week 1 scope:
- Load historical assumptions JSON
- Normalize selected period returns for scenario asset keys
- Normalize inflation assumption
- Validate completeness and surface warnings
"""

import json
import math
import random
import re
from pathlib import Path
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.account import Account
from app.repositories.scenario_repository import ScenarioRepository
from app.services.retirement_scenario_service import RetirementScenarioService
from app.schemas.monte_carlo import (
    MonteCarloDataPrepResponse,
    MonteCarloRunResponse,
    MonteCarloDataPrepSummary,
    MonteCarloYearPercentile,
    MonteCarloBaselineYear,
    MonteCarloPreparedSeries,
)

HISTORICAL_FILE = Path("/app/data/historical_asset_class_returns.json")
if not HISTORICAL_FILE.exists():
    BASE_DIR = Path(__file__).parent.parent.parent.parent
    HISTORICAL_FILE = BASE_DIR / "data" / "historical_asset_class_returns.json"


class MonteCarloDataPrepService:
    """Prepares normalized assumptions data for Monte Carlo simulations."""

    # Map scenario allocation keys -> location in historical assumptions JSON
    # tuple: (top_level_section, asset_node_key)
    ASSET_CLASS_MAPPING: dict[str, tuple[str, str]] = {
        "total_us_stock": ("us_equities", "total_us_stock"),
        "us_small_cap_value": ("us_equities", "small_cap_value"),
        "total_foreign_stock": ("international_equities", "total_foreign_stock"),
        "international_small_cap_value": (
            "international_equities",
            "international_small_cap_value",
        ),
        "developed_markets": ("international_equities", "developed_markets"),
        "emerging_markets": ("international_equities", "emerging_markets"),
        "reits": ("real_estate", "reits"),
        "bonds": ("fixed_income", "us_aggregate_bonds"),
        "short_term_treasuries": ("fixed_income", "short_term_treasuries"),
        "intermediate_term_treasuries": ("fixed_income", "intermediate_term_treasuries"),
        "municipal_bonds": ("fixed_income", "municipal_bonds"),
        "cash": ("fixed_income", "cash_treasury_bills"),
        # No dedicated long history for "other" - conservative placeholder
        "other": ("fixed_income", "us_aggregate_bonds"),
    }
    # MVP volatility assumptions (annual stdev %, nominal)
    VOLATILITY_PCT: dict[str, float] = {
        "total_us_stock": 18.0,
        "us_small_cap_value": 24.0,
        "total_foreign_stock": 19.0,
        "international_small_cap_value": 22.0,
        "developed_markets": 18.0,
        "emerging_markets": 28.0,
        "reits": 20.0,
        "bonds": 7.0,
        "short_term_treasuries": 3.0,
        "intermediate_term_treasuries": 5.0,
        "municipal_bonds": 5.0,
        "cash": 1.0,
        "other": 10.0,
    }

    def __init__(self, db: Session):
        self.db = db

    def prepare(self, period_key: str = "30_year") -> MonteCarloDataPrepResponse:
        raw = self._load_historical_assumptions()
        warnings: list[str] = []
        prepared_series: list[MonteCarloPreparedSeries] = []

        for scenario_key, (section_key, node_key) in self.ASSET_CLASS_MAPPING.items():
            node = raw.get(section_key, {}).get(node_key)
            if not node:
                warnings.append(f"Missing node: {section_key}.{node_key} for {scenario_key}")
                continue

            periods = node.get("periods", {})
            selected_period = periods.get(period_key)
            if selected_period is None:
                selected_period = (
                    periods.get("since_1970")
                    or periods.get("since_1928")
                    or next(iter(periods.values()), None)
                )
                warnings.append(
                    f"{scenario_key}: period '{period_key}' missing; used fallback period"
                )

            if not selected_period:
                warnings.append(f"{scenario_key}: no usable period data")
                continue

            nominal = self._to_float(selected_period.get("nominal"))
            if nominal is None:
                warnings.append(f"{scenario_key}: nominal return missing/unparseable")
                continue

            years = selected_period.get("years")
            prepared_series.append(
                MonteCarloPreparedSeries(
                    scenario_asset_key=scenario_key,
                    source_section=section_key,
                    source_node=node_key,
                    selected_period=period_key,
                    expected_return_pct=round(nominal, 4),
                    source_years=int(years) if isinstance(years, (int, float)) else None,
                )
            )

        inflation_node = raw.get("inflation", {}).get("cpi_all_urban", {}).get("periods", {})
        infl_selected = (
            inflation_node.get(period_key)
            or inflation_node.get("since_1980")
            or next(iter(inflation_node.values()), {})
        )
        inflation_rate = self._to_float(infl_selected.get("nominal"))
        if inflation_rate is None:
            inflation_rate = 2.5
            warnings.append("Inflation nominal missing/unparseable; defaulted to 2.5%")

        missing_asset_keys = sorted(
            set(self.ASSET_CLASS_MAPPING.keys()) - {s.scenario_asset_key for s in prepared_series}
        )
        if missing_asset_keys:
            warnings.append(
                f"Missing normalized assumptions for keys: {', '.join(missing_asset_keys)}"
            )

        summary = MonteCarloDataPrepSummary(
            period_key=period_key,
            asset_keys_expected=len(self.ASSET_CLASS_MAPPING),
            asset_keys_prepared=len(prepared_series),
            inflation_rate_pct=round(float(inflation_rate), 4),
            warnings_count=len(warnings),
        )
        return MonteCarloDataPrepResponse(
            summary=summary,
            series=sorted(prepared_series, key=lambda s: s.scenario_asset_key),
            mapping=self.ASSET_CLASS_MAPPING,
            warnings=warnings,
        )

    def run_mvp_simulation(
        self,
        scenario_id: UUID,
        simulations: int = 1000,
        period_key: str = "30_year",
        seed: int | None = None,
    ) -> MonteCarloRunResponse:
        """Run fast Monte Carlo MVP and return fan-chart-ready percentiles."""
        scenario = ScenarioRepository(self.db).get_by_id(scenario_id)
        if not scenario:
            raise ValueError(f"Scenario {scenario_id} not found")

        prep = self.prepare(period_key=period_key)
        series_by_key = {s.scenario_asset_key: s for s in prep.series}

        # Portfolio starting balance from all accounts
        accounts = self.db.query(Account).all()
        start_balance = sum(float(a.balance or 0) for a in accounts)
        if start_balance <= 0:
            raise ValueError("No account balance available for simulation")

        inflation_mean = float(prep.summary.inflation_rate_pct)

        # Weighted expected return + variance from scenario allocation
        alloc = scenario.asset_allocation or {}
        expected_return = 0.0
        variance = 0.0
        for k, allocation_pct in alloc.items():
            w = float(allocation_pct or 0) / 100.0
            series = series_by_key.get(k)
            mu = float(series.expected_return_pct) if series is not None else 0.0
            sigma = self.VOLATILITY_PCT.get(k, 12.0)
            expected_return += w * mu
            variance += (w * sigma) ** 2
        return_std = math.sqrt(max(variance, 1e-9))

        # Use scenario engine's computed yearly portfolio withdrawals so MC respects
        # scenario-specific income + spending dynamics (SS, other income, taxes, reductions, etc.).
        baseline_projection = RetirementScenarioService(self.db).generate_projection(
            scenario_id=scenario_id
        )
        yearly_withdrawals = [
            float(getattr(y, "portfolio_withdrawal", 0) or 0)
            for y in baseline_projection.projections
        ]
        # Extract baseline ending balances for overlay
        baseline_balances = [
            float(getattr(y, "ending_balance", 0) or 0) for y in baseline_projection.projections
        ]
        start_age = (
            float(getattr(baseline_projection.projections[0], "age", 0))
            if baseline_projection.projections
            else 0.0
        )

        rng = random.Random(seed)
        horizon = int(scenario.projection_years or 30)
        if len(yearly_withdrawals) < horizon:
            # Defensive fallback if projection rows are shorter than horizon
            yearly_withdrawals.extend(
                [yearly_withdrawals[-1] if yearly_withdrawals else 0.0]
                * (horizon - len(yearly_withdrawals))
            )
        all_paths: list[list[float]] = []
        terminal_values: list[float] = []
        survived = 0

        for _ in range(simulations):
            bal = start_balance
            path: list[float] = []
            for year in range(1, horizon + 1):
                infl = max(-2.0, min(12.0, rng.gauss(inflation_mean, 1.25)))
                # Start from scenario-derived withdrawal and apply sampled inflation drift
                # so simulated paths can diverge while still anchored to scenario economics.
                base_withdrawal = yearly_withdrawals[year - 1]
                spend = base_withdrawal * ((1.0 + infl / 100.0) ** max(0, year - 1))
                r = max(-80.0, min(80.0, rng.gauss(expected_return, return_std)))
                bal = max(0.0, (bal - spend) * (1.0 + r / 100.0))
                path.append(bal)
            if path[-1] > 0:
                survived += 1
            terminal_values.append(path[-1])
            all_paths.append(path)

        def percentile(values: list[float], p: float) -> float:
            if not values:
                return 0.0
            s = sorted(values)
            idx = min(len(s) - 1, max(0, int(round((p / 100.0) * (len(s) - 1)))))
            return float(round(s[idx], 2))

        yearly_percentiles: list[MonteCarloYearPercentile] = []
        for y in range(horizon):
            column = [path[y] for path in all_paths]
            yearly_percentiles.append(
                MonteCarloYearPercentile(
                    year=y + 1,
                    p10=percentile(column, 10),
                    p25=percentile(column, 25),
                    p50=percentile(column, 50),
                    p75=percentile(column, 75),
                    p90=percentile(column, 90),
                )
            )

        success_rate = round((survived / simulations) * 100.0, 2)
        terminal_percentiles = {
            "p10": percentile(terminal_values, 10),
            "p25": percentile(terminal_values, 25),
            "p50": percentile(terminal_values, 50),
            "p75": percentile(terminal_values, 75),
            "p90": percentile(terminal_values, 90),
        }

        # Build baseline projection for overlay
        baseline_years: list[MonteCarloBaselineYear] = []
        for i, balance in enumerate(baseline_balances[:horizon]):
            baseline_years.append(MonteCarloBaselineYear(year=i + 1, balance=round(balance, 2)))

        # Calculate where baseline terminal value falls in distribution
        baseline_terminal = baseline_balances[min(horizon - 1, len(baseline_balances) - 1)]
        sorted_terminals = sorted(terminal_values)
        baseline_rank = sum(1 for v in sorted_terminals if v <= baseline_terminal)
        baseline_percentile = round((baseline_rank / len(sorted_terminals)) * 100.0, 1)

        return MonteCarloRunResponse(
            scenario_id=scenario.id,
            scenario_name=scenario.name,
            simulations=simulations,
            horizon_years=horizon,
            success_rate_pct=success_rate,
            terminal_percentiles=terminal_percentiles,
            yearly_percentiles=yearly_percentiles,
            baseline_projection=baseline_years,
            baseline_percentile=baseline_percentile,
            assumptions={
                "period_key": period_key,
                "expected_return_pct": round(expected_return, 4),
                "return_std_pct": round(return_std, 4),
                "inflation_mean_pct": round(inflation_mean, 4),
                "start_age": round(start_age, 2),
            },
        )

    def _load_historical_assumptions(self) -> dict:
        with open(HISTORICAL_FILE, "r") as f:
            return json.load(f)

    @staticmethod
    def _to_float(value) -> float | None:
        if value is None:
            return None
        if isinstance(value, (int, float)):
            return float(value)
        if isinstance(value, str):
            match = re.search(r"-?\d+(?:\.\d+)?", value)
            if match:
                return float(match.group(0))
        return None
