"""Scenario modeling service for retirement projections."""

from datetime import date, timedelta
from decimal import Decimal

from sqlalchemy.orm import Session

from app.schemas.scenario import AssetAllocation, ScenarioCreate, ScenarioPeriod, ScenarioResult
from app.services.asset_projection_service import AssetProjectionService


class ScenarioService:
    """Service for generating scenario projections."""

    def __init__(self, db: Session):
        """Initialize service with database session."""
        self.db = db
        self.asset_service = AssetProjectionService(db)

    def generate_scenario(self, scenario_data: ScenarioCreate) -> ScenarioResult:
        """
        Generate a scenario projection based on the provided parameters.

        Returns monthly or yearly projections depending on the time period.
        """
        if not scenario_data.asset_allocation.validate_total():
            raise ValueError("Asset allocations must sum to 100%")

        periods = []
        current_balance = scenario_data.initial_amount
        total_contributions = Decimal("0")
        period_type = self._determine_period_type(scenario_data.start_date, scenario_data.end_date)

        # Get return rates for each asset class
        return_rates = self._get_return_rates(
            scenario_data.return_source,
            scenario_data.historical_period_start,
            scenario_data.historical_period_end,
        )

        # Calculate blended return based on allocation
        blended_return = self._calculate_blended_return(
            scenario_data.asset_allocation, return_rates
        )

        # Generate periods
        current_date = scenario_data.start_date
        period_number = 1

        while current_date < scenario_data.end_date:
            # Determine period end date
            if period_type == "month":
                period_end = self._add_months(current_date, 1) - timedelta(days=1)
            else:
                period_end = date(
                    current_date.year + 1, current_date.month, current_date.day
                ) - timedelta(days=1)

            if period_end > scenario_data.end_date:
                period_end = scenario_data.end_date

            # Calculate contribution for this period
            contribution = self._calculate_contribution(
                current_date,
                period_end,
                scenario_data.contribution_amount,
                scenario_data.contribution_frequency,
            )

            # Calculate return for this period
            period_return_pct = (
                blended_return / Decimal("12") if period_type == "month" else blended_return
            )
            period_return_amount = (
                (current_balance + contribution) * period_return_pct / Decimal("100")
            )
            ending_balance = current_balance + contribution + period_return_amount

            # Calculate asset class values
            asset_values = self._calculate_asset_values(
                ending_balance, scenario_data.asset_allocation, return_rates, period_return_pct
            )

            periods.append(
                ScenarioPeriod(
                    period_start=current_date,
                    period_end=period_end,
                    period_type=period_type,
                    period_number=period_number,
                    starting_balance=current_balance,
                    contribution=contribution,
                    return_percent=period_return_pct,
                    return_amount=period_return_amount,
                    ending_balance=ending_balance,
                    asset_values=asset_values,
                )
            )

            current_balance = ending_balance
            total_contributions += contribution
            current_date = period_end + timedelta(days=1)
            period_number += 1

        # Calculate summary statistics
        total_return = current_balance - scenario_data.initial_amount - total_contributions
        total_return_percent = (
            (total_return / scenario_data.initial_amount * Decimal("100"))
            if scenario_data.initial_amount > 0
            else Decimal("0")
        )

        summary_stats = {
            "total_periods": len(periods),
            "average_return_percent": blended_return,
            "total_return": total_return,
            "total_return_percent": total_return_percent,
            "total_contributions": total_contributions,
        }

        return ScenarioResult(
            scenario_name=scenario_data.name,
            initial_amount=scenario_data.initial_amount,
            final_amount=current_balance,
            total_return=total_return,
            total_return_percent=total_return_percent,
            total_contributions=total_contributions,
            periods=periods,
            summary_stats=summary_stats,
        )

    def _determine_period_type(self, start_date: date, end_date: date) -> str:
        """Determine if we should use monthly or yearly periods."""
        days_diff = (end_date - start_date).days
        if days_diff <= 365:
            return "month"
        return "year"

    def _get_return_rates(
        self, return_source: str, historical_start: date | None, historical_end: date | None
    ) -> dict[str, Decimal]:
        """Get return rates for each asset class based on the return source."""
        if return_source == "10_year_projections":
            # Use 10-year projections
            consolidated = self.asset_service.get_consolidated_10_year_projections()
            asset_classes = consolidated.get("asset_classes", {})

            def get_return(key: str, default: Decimal) -> Decimal:
                if key in asset_classes and "expected_return" in asset_classes[key]:
                    return Decimal(str(asset_classes[key]["expected_return"]))
                return default

            return {
                "total_us_stock": get_return("total_us_stock", Decimal("7.5")),
                "total_foreign_stock": get_return("total_foreign_stock", Decimal("7.0")),
                "us_small_cap_value": get_return("us_small_cap_value", Decimal("8.5")),
                "reits": get_return("reits", Decimal("9.5")),
                "bonds": get_return("bonds", Decimal("4.5")),
                "short_term_treasuries": get_return("short_term_treasuries", Decimal("4.0")),
                "cash": get_return("cash", Decimal("3.5")),
            }
        elif return_source == "historical_average":
            # Use long-term historical averages
            historical = self.asset_service.get_historical_returns()
            return {
                "total_us_stock": Decimal("10.0"),  # ~10% long-term average
                "total_foreign_stock": Decimal("8.5"),  # ~8.5% long-term average
                "us_small_cap_value": Decimal("13.0"),  # ~13% long-term average
                "reits": Decimal("9.35"),  # 30-year historical average
                "bonds": Decimal("4.5"),  # ~4.5% long-term average
                "short_term_treasuries": Decimal("4.0"),  # ~4% long-term average
                "cash": Decimal("3.31"),  # Historical T-bill average
            }
        else:  # historical_period
            # For now, use historical average - in future could use actual year-by-year data
            # This would require historical monthly/yearly return data
            return self._get_return_rates("historical_average", None, None)

    def _calculate_blended_return(
        self, allocation: AssetAllocation, return_rates: dict[str, Decimal]
    ) -> Decimal:
        """Calculate weighted average return based on allocation."""
        return (
            allocation.total_us_stock * return_rates["total_us_stock"] / Decimal("100")
            + allocation.total_foreign_stock * return_rates["total_foreign_stock"] / Decimal("100")
            + allocation.us_small_cap_value * return_rates["us_small_cap_value"] / Decimal("100")
            + allocation.reits * return_rates.get("reits", Decimal("9.5")) / Decimal("100")
            + allocation.bonds * return_rates["bonds"] / Decimal("100")
            + allocation.short_term_treasuries
            * return_rates["short_term_treasuries"]
            / Decimal("100")
            + allocation.cash * return_rates["cash"] / Decimal("100")
        )

    def _calculate_asset_values(
        self,
        total_balance: Decimal,
        allocation: AssetAllocation,
        return_rates: dict[str, Decimal],
        period_return: Decimal,
    ) -> dict[str, Decimal]:
        """Calculate the value of each asset class."""
        return {
            "total_us_stock": total_balance * allocation.total_us_stock / Decimal("100"),
            "total_foreign_stock": total_balance * allocation.total_foreign_stock / Decimal("100"),
            "us_small_cap_value": total_balance * allocation.us_small_cap_value / Decimal("100"),
            "reits": total_balance * allocation.reits / Decimal("100"),
            "bonds": total_balance * allocation.bonds / Decimal("100"),
            "short_term_treasuries": total_balance
            * allocation.short_term_treasuries
            / Decimal("100"),
            "cash": total_balance * allocation.cash / Decimal("100"),
        }

    def _calculate_contribution(
        self, period_start: date, period_end: date, monthly_amount: Decimal, frequency: str
    ) -> Decimal:
        """Calculate contribution amount for a given period."""
        if monthly_amount == 0:
            return Decimal("0")

        if frequency == "monthly":
            # Monthly contribution - assume contribution at start of each month
            return monthly_amount
        elif frequency == "quarterly":
            # Quarterly contribution (every 3 months) - 3x monthly amount
            # Check if this is a quarter boundary (Jan, Apr, Jul, Oct)
            if period_start.month in [1, 4, 7, 10] and period_start.day == 1:
                return monthly_amount * Decimal("3")
            return Decimal("0")
        else:  # annually
            # Annual contribution at start of year
            if period_start.month == 1 and period_start.day == 1:
                return monthly_amount * Decimal("12")
            return Decimal("0")

    def _add_months(self, start_date: date, months: int) -> date:
        """Add months to a date."""
        year = start_date.year
        month = start_date.month + months
        day = start_date.day

        while month > 12:
            month -= 12
            year += 1

        # Handle invalid dates (e.g., Feb 30)
        try:
            return date(year, month, day)
        except ValueError:
            # Use last day of month
            if month == 12:
                return date(year + 1, 1, 1) - timedelta(days=1)
            return date(year, month + 1, 1) - timedelta(days=1)
