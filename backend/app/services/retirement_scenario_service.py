"""Retirement scenario modeling service."""

from datetime import date
from decimal import Decimal
from uuid import UUID

from sqlalchemy.orm import Session

from app.repositories.account_repository import AccountRepository
from app.repositories.holding_repository import HoldingRepository
from app.repositories.planned_spending_repository import PlannedSpendingRepository
from app.repositories.scenario_repository import ScenarioRepository
from app.repositories.social_security_repository import SocialSecurityRepository
from app.schemas.scenario import (
    AssetAllocation,
    SavedScenarioCreate,
    SavedScenarioUpdate,
    SavedScenario as SavedScenarioSchema,
    ScenarioProjectionResult,
    ScenarioYearProjection,
    ScenarioComparisonResult,
)
from app.services.asset_projection_service import AssetProjectionService
from app.services.holding_service import HoldingService


class RetirementScenarioService:
    """Service for retirement scenario projections."""

    def __init__(self, db: Session):
        """Initialize service with database session."""
        self.db = db
        self.repository = ScenarioRepository(db)
        self.account_repository = AccountRepository(db)
        self.asset_service = AssetProjectionService(db)
        self.holding_repository = HoldingRepository(db)
        self.planned_spending_repository = PlannedSpendingRepository(db)
        self.ss_repository = SocialSecurityRepository(db)

    # ===== CRUD Operations =====

    def get_all_scenarios(self) -> list[SavedScenarioSchema]:
        """Get all saved scenarios."""
        scenarios = self.repository.get_all()
        return [SavedScenarioSchema.model_validate(s) for s in scenarios]

    def get_scenario_by_id(self, scenario_id: UUID) -> SavedScenarioSchema | None:
        """Get scenario by ID."""
        scenario = self.repository.get_by_id(scenario_id)
        if not scenario:
            return None
        return SavedScenarioSchema.model_validate(scenario)

    def create_scenario(self, scenario_data: SavedScenarioCreate) -> SavedScenarioSchema:
        """Create a new scenario."""
        scenario = self.repository.create(scenario_data)
        return SavedScenarioSchema.model_validate(scenario)

    def update_scenario(
        self, scenario_id: UUID, scenario_data: SavedScenarioUpdate
    ) -> SavedScenarioSchema | None:
        """Update an existing scenario."""
        scenario = self.repository.update(scenario_id, scenario_data)
        if not scenario:
            return None
        return SavedScenarioSchema.model_validate(scenario)

    def delete_scenario(self, scenario_id: UUID) -> bool:
        """Delete a scenario."""
        return self.repository.delete(scenario_id)

    def duplicate_scenario(self, scenario_id: UUID, new_name: str) -> SavedScenarioSchema | None:
        """Duplicate a scenario with a new name, including all fixed expenses."""
        from app.models.fixed_expense import FixedExpense

        scenario = self.repository.duplicate(scenario_id, new_name)
        if not scenario:
            return None

        # Copy fixed expenses from original scenario
        original_fixed_expenses = (
            self.db.query(FixedExpense).filter(FixedExpense.scenario_id == scenario_id).all()
        )

        for original_fe in original_fixed_expenses:
            new_fe = FixedExpense(
                scenario_id=scenario.id,
                name=original_fe.name,
                monthly_amount=original_fe.monthly_amount,
                start_year=original_fe.start_year,
                end_year=original_fe.end_year,
                notes=original_fe.notes,
            )
            self.db.add(new_fe)

        self.db.commit()

        return SavedScenarioSchema.model_validate(scenario)

    def generate_default_scenario(self) -> SavedScenarioSchema:
        """
        Generate a default scenario from all configured data sources.

        Pulls data from:
        - Social Security: SS start age (defaults to FRA)
        - Planned Spending: monthly spending, annual lump sum
        - Planned Fixed Expenses: converted to scenario fixed expenses
        - Portfolio: asset allocation from holdings
        - Defaults for other fields
        """
        from app.models.planned_fixed_expense import PlannedFixedExpense
        from app.models.fixed_expense import FixedExpense

        # Get Social Security config
        ss_config = self.ss_repository.get()
        if not ss_config:
            raise ValueError(
                "Social Security configuration required - configure in Social Security page"
            )

        # SS start age: use default scenario ages from SS config if set, else FRA
        default_years = getattr(ss_config, "default_ss_start_age_years", None)
        default_months = getattr(ss_config, "default_ss_start_age_months", None)
        if default_years is not None and default_months is not None:
            ss_start_years = default_years
            ss_start_months = default_months
        else:
            fra_age = float(ss_config.fra_age) if ss_config.fra_age else 67.0
            ss_start_years = int(fra_age)
            ss_start_months = int((fra_age - ss_start_years) * 12)

        # Get Planned Spending
        planned_spending = self.planned_spending_repository.get()
        monthly_spending = Decimal("8500")  # Default
        annual_lump_spending = Decimal("5000")  # Default
        if planned_spending:
            monthly_spending = Decimal(str(planned_spending.monthly_spending))
            annual_lump_spending = Decimal(str(planned_spending.annual_lump_sum))

        # Get Portfolio Allocation
        holding_service = HoldingService(self.db)
        portfolio_allocation = holding_service.get_portfolio_allocation()

        # Convert portfolio allocation percentages to AssetAllocation
        # Map asset classes from holdings to scenario asset classes
        asset_allocation = AssetAllocation()
        by_asset_class_pct = portfolio_allocation.by_asset_class_percent

        # Map common asset class names
        asset_allocation.total_us_stock = Decimal(str(by_asset_class_pct.get("total_us_stock", 0)))
        asset_allocation.us_small_cap_value = Decimal(
            str(by_asset_class_pct.get("us_small_cap_value", 0))
        )
        asset_allocation.total_foreign_stock = Decimal(
            str(by_asset_class_pct.get("total_foreign_stock", 0))
        )
        asset_allocation.international_small_cap_value = Decimal(
            str(by_asset_class_pct.get("international_small_cap_value", 0))
        )
        asset_allocation.developed_markets = Decimal(
            str(by_asset_class_pct.get("developed_markets", 0))
        )
        asset_allocation.emerging_markets = Decimal(
            str(by_asset_class_pct.get("emerging_markets", 0))
        )
        asset_allocation.reits = Decimal(str(by_asset_class_pct.get("reits", 0)))
        asset_allocation.bonds = Decimal(str(by_asset_class_pct.get("bonds", 0)))
        asset_allocation.short_term_treasuries = Decimal(
            str(by_asset_class_pct.get("short_term_treasuries", 0))
        )
        asset_allocation.intermediate_term_treasuries = Decimal(
            str(by_asset_class_pct.get("intermediate_term_treasuries", 0))
        )
        asset_allocation.municipal_bonds = Decimal(
            str(by_asset_class_pct.get("municipal_bonds", 0))
        )
        asset_allocation.cash = Decimal(str(by_asset_class_pct.get("cash", 0)))
        asset_allocation.other = Decimal(str(by_asset_class_pct.get("other", 0)))

        # If allocation doesn't sum to 100%, normalize it
        total = sum(
            [
                asset_allocation.total_us_stock,
                asset_allocation.us_small_cap_value,
                asset_allocation.total_foreign_stock,
                asset_allocation.international_small_cap_value,
                asset_allocation.developed_markets,
                asset_allocation.emerging_markets,
                asset_allocation.reits,
                asset_allocation.bonds,
                asset_allocation.short_term_treasuries,
                asset_allocation.intermediate_term_treasuries,
                asset_allocation.municipal_bonds,
                asset_allocation.cash,
                asset_allocation.other,
            ]
        )

        if total > 0 and abs(float(total) - 100.0) > 0.01:
            # Normalize to 100%
            factor = Decimal("100") / total
            asset_allocation.total_us_stock *= factor
            asset_allocation.us_small_cap_value *= factor
            asset_allocation.total_foreign_stock *= factor
            asset_allocation.international_small_cap_value *= factor
            asset_allocation.developed_markets *= factor
            asset_allocation.emerging_markets *= factor
            asset_allocation.reits *= factor
            asset_allocation.bonds *= factor
            asset_allocation.short_term_treasuries *= factor
            asset_allocation.intermediate_term_treasuries *= factor
            asset_allocation.municipal_bonds *= factor
            asset_allocation.cash *= factor
            asset_allocation.other *= factor

        # Spouse SS start age for default scenario (from SS config if set)
        default_spouse_years = getattr(ss_config, "default_spouse_ss_start_age_years", None)
        default_spouse_months = getattr(ss_config, "default_spouse_ss_start_age_months", None)

        # Create default scenario
        default_scenario_data = SavedScenarioCreate(
            name="Default Scenario",
            description="Auto-generated from your current configuration (Accounts, SS, Spending, etc.)",
            ss_start_age_years=ss_start_years,
            ss_start_age_months=ss_start_months,
            spouse_ss_start_age_years=default_spouse_years,
            spouse_ss_start_age_months=default_spouse_months,
            monthly_spending=monthly_spending,
            annual_lump_spending=annual_lump_spending,
            inflation_adjusted_percent=Decimal(
                "100"
            ),  # All spending is variable unless fixed expenses exist
            spending_reduction_percent=Decimal("0"),
            spending_reduction_start_year=None,
            projection_years=35,  # To age 100
            asset_allocation=asset_allocation,
            return_source="10_year_projections",
            custom_return_percent=None,
            inflation_rate=Decimal("2.5"),
        )

        # Check if default scenario already exists
        existing_scenarios = self.repository.get_all()
        default_scenario = None
        for s in existing_scenarios:
            if s.name == "Default Scenario":
                default_scenario = s
                break

        if default_scenario:
            # Update existing default scenario
            update_data = SavedScenarioUpdate(**default_scenario_data.model_dump())
            scenario = self.repository.update(default_scenario.id, update_data)
        else:
            # Create new default scenario
            scenario = self.repository.create(default_scenario_data)

        # Copy planned fixed expenses to scenario fixed expenses
        planned_fixed_expenses = self.db.query(PlannedFixedExpense).all()
        if planned_fixed_expenses:
            # Get current year to convert calendar years to projection years
            from datetime import date

            current_year = date.today().year

            # Delete existing fixed expenses for this scenario
            self.db.query(FixedExpense).filter(FixedExpense.scenario_id == scenario.id).delete()

            # Create fixed expenses from planned fixed expenses
            # Convert calendar years to projection years (projection starts at year 1 = current year)
            for pfe in planned_fixed_expenses:
                # Calculate projection start year (1-based, where 1 = current year)
                projection_start_year = max(1, pfe.start_year - current_year + 1)
                projection_end_year = pfe.end_year - current_year + 1

                # Only add if it hasn't already ended
                if projection_end_year > 0:
                    # Store original calendar years in notes for display purposes
                    original_years_note = f"Original: {pfe.start_year}-{pfe.end_year}"
                    combined_notes = (
                        f"{pfe.notes or ''} {original_years_note}".strip()
                        if pfe.notes
                        else original_years_note
                    )

                    fixed_expense = FixedExpense(
                        scenario_id=scenario.id,
                        name=pfe.name,
                        monthly_amount=pfe.monthly_amount,
                        start_year=projection_start_year,
                        end_year=projection_end_year,
                        notes=combined_notes,
                    )
                    self.db.add(fixed_expense)

            self.db.commit()

        return SavedScenarioSchema.model_validate(scenario)

    # ===== Projection Generation =====

    def generate_projection(
        self,
        scenario_id: UUID | None = None,
        scenario_data: SavedScenarioCreate | None = None,
        birth_date: date | None = None,
        ss_fra_amount: Decimal | None = None,
    ) -> ScenarioProjectionResult:
        """
        Generate a retirement projection.

        Can be called with either a saved scenario ID or ad-hoc scenario data.
        Requires birth_date and ss_fra_amount from Social Security configuration.
        """
        if scenario_id:
            scenario = self.repository.get_by_id(scenario_id)
            if not scenario:
                raise ValueError(f"Scenario {scenario_id} not found")
            # Convert to schema
            scenario_schema = SavedScenarioSchema.model_validate(scenario)
        elif scenario_data:
            scenario_schema = SavedScenarioCreate.model_validate(scenario_data)
            scenario_id = None
        else:
            raise ValueError("Must provide either scenario_id or scenario_data")

        # Get current portfolio value and group by account type
        accounts = self.account_repository.get_all()
        initial_portfolio = sum((Decimal(str(a.balance)) for a in accounts), Decimal("0"))

        # Initialize account balances by type
        account_balances = {
            "pretax": Decimal("0"),
            "roth": Decimal("0"),
            "taxable": Decimal("0"),
            "cash": Decimal("0"),
        }

        # Initialize cost basis by type (for taxable accounts)
        account_cost_basis = {
            "pretax": Decimal("0"),
            "roth": Decimal("0"),
            "taxable": Decimal("0"),
            "cash": Decimal("0"),
        }

        # Group accounts by type and sum balances and cost basis
        for account in accounts:
            account_type = account.account_type.lower()
            if account_type in account_balances:
                account_balances[account_type] += Decimal(str(account.balance))
                # Track cost basis (only relevant for taxable accounts, but track for all)
                if account.cost_basis is not None:
                    account_cost_basis[account_type] += Decimal(str(account.cost_basis))
            else:
                # Handle unknown account types - default to taxable
                account_balances["taxable"] += Decimal(str(account.balance))
                if account.cost_basis is not None:
                    account_cost_basis["taxable"] += Decimal(str(account.cost_basis))

        # Get birth date and SS from database if not provided (primary and optional spouse)
        primary_fra_age: Decimal = Decimal("67")  # default
        spouse_birth_date: date | None = None
        spouse_fra_amount: Decimal | None = None
        spouse_fra_age: Decimal | None = None
        spouse_benefit_source: str = "own"  # "own" or "half_of_partner"
        if birth_date is None or ss_fra_amount is None:
            from app.repositories.social_security_repository import SocialSecurityRepository

            ss_repo = SocialSecurityRepository(self.db)
            ss_config = ss_repo.get()
            if ss_config:
                birth_date = birth_date or ss_config.birth_date
                ss_fra_amount = ss_fra_amount or Decimal(str(ss_config.fra_monthly_amount))
                primary_fra_age = (
                    Decimal(str(ss_config.fra_age))
                    if getattr(ss_config, "fra_age", None) is not None
                    else Decimal("67")
                )
                if getattr(ss_config, "spouse_birth_date", None):
                    spouse_birth_date = ss_config.spouse_birth_date
                    spouse_fra_age = (
                        Decimal(str(ss_config.spouse_fra_age))
                        if getattr(ss_config, "spouse_fra_age", None) is not None
                        else None
                    )
                    if spouse_fra_age is None and spouse_birth_date is not None:
                        from app.utils.fra_calculator import calculate_fra_decimal

                        spouse_fra_age = calculate_fra_decimal(spouse_birth_date)
                    spouse_benefit_source = (
                        getattr(ss_config, "spouse_benefit_source", None) or "own"
                    )
                    if spouse_benefit_source == "half_of_partner":
                        spouse_fra_amount = None  # Use 50% of primary FRA only
                    elif getattr(ss_config, "spouse_fra_monthly_amount", None) is not None:
                        spouse_fra_amount = Decimal(str(ss_config.spouse_fra_monthly_amount))
                    else:
                        spouse_fra_amount = None

        if birth_date is None:
            raise ValueError("Birth date required - configure in Social Security page")
        if ss_fra_amount is None:
            ss_fra_amount = Decimal("0")

        # Calculate current age
        today = date.today()
        current_age = today.year - birth_date.year
        if (today.month, today.day) < (birth_date.month, birth_date.day):
            current_age -= 1

        # Get return rate (will be recalculated each year based on year number)
        # Default: Years 1-10 use 10-year projections, Years 11+ use historical averages
        annual_return = self._get_annual_return(
            scenario_schema, 1
        )  # Initial value, will be updated in loop

        # Get other income
        from app.services.other_income_service import OtherIncomeService

        other_income_service = OtherIncomeService(self.db)

        # Get tax configuration
        from app.repositories.tax_config_repository import TaxConfigRepository

        tax_config_repo = TaxConfigRepository(self.db)
        tax_config = tax_config_repo.get()

        # Default tax parameters if not configured
        filing_status = tax_config.filing_status if tax_config else "married_filing_jointly"
        total_deductions = (
            Decimal(str(tax_config.total_deductions)) if tax_config else Decimal("30000")
        )
        state_of_residence = getattr(tax_config, "state", None) or "CO" if tax_config else "CO"

        # Spouse age for state tax (CO: no SS tax for residents 65+)
        spouse_birth_for_state: date | None = spouse_birth_date
        if spouse_birth_for_state is None:
            from app.repositories.social_security_repository import SocialSecurityRepository

            _ss = SocialSecurityRepository(self.db).get()
            spouse_birth_for_state = getattr(_ss, "spouse_birth_date", None) if _ss else None
        spouse_current_age: int | None = None
        if spouse_birth_for_state is not None:
            spouse_current_age = today.year - spouse_birth_for_state.year
            if (today.month, today.day) < (
                spouse_birth_for_state.month,
                spouse_birth_for_state.day,
            ):
                spouse_current_age -= 1

        # Get fixed expenses for this scenario
        from app.models.fixed_expense import FixedExpense as FixedExpenseModel

        fixed_expenses = []
        if scenario_id:
            fixed_expenses = (
                self.db.query(FixedExpenseModel)
                .filter(FixedExpenseModel.scenario_id == scenario_id)
                .all()
            )

        # Generate year-by-year projections
        projections = []
        # Track balances by account type throughout projection
        current_account_balances = {
            "pretax": account_balances["pretax"],
            "roth": account_balances["roth"],
            "taxable": account_balances["taxable"],
            "cash": account_balances["cash"],
        }

        # Track cost basis by account type (for calculating taxable gains)
        current_cost_basis = {
            "pretax": account_cost_basis["pretax"],
            "roth": account_cost_basis["roth"],
            "taxable": account_cost_basis["taxable"],
            "cash": account_cost_basis["cash"],
        }
        total_ss = Decimal("0")
        total_other = Decimal("0")
        total_spending = Decimal("0")
        total_withdrawals = Decimal("0")
        years_until_depletion = None

        calendar_year = today.year
        base_monthly_spending = scenario_schema.monthly_spending

        # Initialize bucket strategy if enabled
        use_bucket_strategy = getattr(scenario_schema, "use_bucket_strategy", False)
        bucket_strategy_type = getattr(scenario_schema, "bucket_strategy_type", "A")
        bucket_1_years = getattr(scenario_schema, "bucket_1_years", 3)
        bucket_2_years = getattr(scenario_schema, "bucket_2_years", 4)
        rebalancing_threshold = Decimal(
            str(getattr(scenario_schema, "rebalancing_threshold", Decimal("5.0")))
        )
        recovery_threshold_pct = Decimal(
            str(getattr(scenario_schema, "recovery_threshold_pct", 100))
        )

        # Bucket tracking variables
        bucket_balances = {
            "bucket_1": Decimal("0"),  # Cash
            "bucket_2_stocks": Decimal("0"),  # Balanced - stocks portion
            "bucket_2_bonds": Decimal("0"),  # Balanced - bonds portion
            "bucket_3": Decimal("0"),  # Growth stocks
        }
        bucket_3_previous_high = Decimal("0")  # Track previous high for recovery detection
        stocks_in_recovery = False  # Track if we're waiting for stock recovery

        # Initialize buckets if bucket strategy is enabled
        if use_bucket_strategy:
            # Calculate annual spending needs (approximate for initialization)
            annual_spending_estimate = (
                base_monthly_spending * Decimal("12") + scenario_schema.annual_lump_spending
            )

            # Calculate bucket sizes based on spending
            bucket_1_target = annual_spending_estimate * Decimal(str(bucket_1_years))
            bucket_2_target = annual_spending_estimate * Decimal(str(bucket_2_years))

            # Allocate initial portfolio to buckets
            total_portfolio = (
                account_balances["pretax"]
                + account_balances["roth"]
                + account_balances["taxable"]
                + account_balances["cash"]
            )

            # Allocate remaining buckets
            remaining_for_buckets = total_portfolio - bucket_1_target - bucket_2_target
            bucket_3_target = max(Decimal("0"), remaining_for_buckets)

            # Initialize bucket balances
            bucket_balances["bucket_1"] = bucket_1_target
            if bucket_strategy_type == "B":
                # Strategy B: Bucket 2 is 100% bonds
                bucket_balances["bucket_2_stocks"] = Decimal("0")
                bucket_balances["bucket_2_bonds"] = bucket_2_target
            else:
                # Strategy A: Bucket 2 is 50/50 balanced
                bucket_balances["bucket_2_stocks"] = bucket_2_target / Decimal("2")
                bucket_balances["bucket_2_bonds"] = bucket_2_target / Decimal("2")
            bucket_balances["bucket_3"] = bucket_3_target

            # Adjust account balances to reflect bucket allocation
            # This is a simplification - in reality, buckets span across account types
            # For now, we'll track buckets separately but still use account balances for tax calculations
            bucket_3_previous_high = bucket_balances["bucket_3"]

        for year_num in range(1, scenario_schema.projection_years + 1):
            age = current_age + year_num - 1
            spouse_age_this_year = (
                (spouse_current_age + year_num - 1) if spouse_current_age is not None else None
            )
            # Calculate total starting balance from all account types
            starting_balance = (
                current_account_balances["pretax"]
                + current_account_balances["roth"]
                + current_account_balances["taxable"]
                + current_account_balances["cash"]
            )

            # Calculate SS income for this year (primary + optional spouse with spousal benefit)
            ss_age_years = scenario_schema.ss_start_age_years
            ss_age_months = scenario_schema.ss_start_age_months
            primary_ss_income = self._calculate_ss_income(
                birth_date,
                ss_fra_amount,
                primary_fra_age,
                ss_age_years,
                ss_age_months,
                calendar_year,
                year_num,
                reference_year=today.year,
                inflation_rate=scenario_schema.inflation_rate,
            )
            spouse_ss_income = Decimal("0")
            if spouse_birth_date is not None and spouse_fra_age is not None:
                # Use scenario's spouse SS start age if set; else default to spouse's FRA
                scenario_spouse_years = getattr(scenario_schema, "spouse_ss_start_age_years", None)
                scenario_spouse_months = getattr(
                    scenario_schema, "spouse_ss_start_age_months", None
                )
                if scenario_spouse_years is not None and scenario_spouse_months is not None:
                    spouse_start_years = scenario_spouse_years
                    spouse_start_months = scenario_spouse_months
                else:
                    spouse_start_years = int(spouse_fra_age)
                    spouse_start_months = int(
                        round((spouse_fra_age - Decimal(str(spouse_start_years))) * Decimal("12"))
                    )
                    spouse_start_months = min(11, max(0, spouse_start_months))
                # Spousal benefit: 50% of primary's FRA, reduced if spouse claims before their FRA
                spousal_at_fra = ss_fra_amount * Decimal("0.5")
                spousal_amount = self._calculate_ss_income(
                    spouse_birth_date,
                    spousal_at_fra,
                    spouse_fra_age,
                    spouse_start_years,
                    spouse_start_months,
                    calendar_year,
                    year_num,
                    reference_year=today.year,
                    inflation_rate=scenario_schema.inflation_rate,
                )
                if spouse_benefit_source == "half_of_partner":
                    spouse_ss_income = spousal_amount
                else:
                    # Own benefit: spouse gets max(own benefit, spousal benefit)
                    if spouse_fra_amount is not None and spouse_fra_amount > 0:
                        spouse_own = self._calculate_ss_income(
                            spouse_birth_date,
                            spouse_fra_amount,
                            spouse_fra_age,
                            spouse_start_years,
                            spouse_start_months,
                            calendar_year,
                            year_num,
                            reference_year=today.year,
                            inflation_rate=scenario_schema.inflation_rate,
                        )
                        spouse_ss_income = max(spouse_own, spousal_amount)
                    else:
                        spouse_ss_income = spousal_amount
            ss_income = primary_ss_income + spouse_ss_income

            # Get other income for this year
            other_income = self._calculate_other_income(other_income_service, calendar_year)

            # Calculate fixed expenses active this year (not subject to inflation)
            # Fixed expenses are ADDITIONAL to the base monthly spending
            active_fixed_monthly = Decimal("0")
            for fe in fixed_expenses:
                if fe.start_year <= year_num:
                    if fe.end_year is None or year_num <= fe.end_year:
                        active_fixed_monthly += Decimal(str(fe.monthly_amount))

            # Variable spending = base monthly spending (subject to inflation)
            # If no fixed expenses, use percentage-based fallback
            if fixed_expenses:
                # Fixed expenses are ADDED to base spending
                variable_monthly = base_monthly_spending
            else:
                # Fallback to percentage-based method if no fixed expenses defined
                inflation_pct = getattr(
                    scenario_schema, "inflation_adjusted_percent", Decimal("50")
                ) / Decimal("100")
                variable_monthly = base_monthly_spending * inflation_pct
                active_fixed_monthly = base_monthly_spending * (Decimal("1") - inflation_pct)

            # Apply spending reduction if configured (to variable portion only)
            if (
                scenario_schema.spending_reduction_start_year
                and year_num >= scenario_schema.spending_reduction_start_year
            ):
                reduction = Decimal("1") - (
                    scenario_schema.spending_reduction_percent / Decimal("100")
                )
                variable_monthly = variable_monthly * reduction

            # Apply inflation to variable spending only
            if year_num > 1:
                inflation_factor = (
                    Decimal("1") + scenario_schema.inflation_rate / Decimal("100")
                ) ** (year_num - 1)
                inflated_variable_monthly = variable_monthly * inflation_factor
                # Annual lump is typically discretionary, so fully inflation-adjusted
                annual_lump = scenario_schema.annual_lump_spending * inflation_factor
            else:
                inflated_variable_monthly = variable_monthly
                annual_lump = scenario_schema.annual_lump_spending

            # Total monthly = variable (with inflation) + fixed (no inflation, ends when paid off)
            adjusted_monthly = inflated_variable_monthly + active_fixed_monthly

            annual_spending = adjusted_monthly * Decimal("12")
            total_year_spending = annual_spending + annual_lump

            # Calculate required withdrawal (gross, before taxes)
            total_income = ss_income + other_income
            gross_needed = max(Decimal("0"), total_year_spending - total_income)

            # Bucket strategy: Calculate returns and handle rebalancing
            # Note: Bucket strategy affects returns and rebalancing, but withdrawals still follow
            # account sequencing (pretax -> taxable -> cash -> roth) for tax purposes
            bucket_adjusted_return = None
            if use_bucket_strategy:
                # Get base return for the year (year-based: 10-year for years 1-10, historical for 11+)
                # NOTE: For bucket strategy, we'll compute bucket 3 ("stocks") return as a weighted blend of
                # the user's selected stock fund types, not as a single generic "base_return".
                base_return = self._get_annual_return(scenario_schema, year_num)

                # Track bucket 3 (stocks) value before returns
                bucket_3_before_return = bucket_balances["bucket_3"]

                # Apply returns to each bucket based on their asset allocation
                bucket_1_return = Decimal("3.5") / Decimal("100")  # Cash return
                bucket_2_stock_return = Decimal("7.5") / Decimal("100")  # Stock portion return
                bucket_2_bond_return = Decimal("4.5") / Decimal("100")  # Bond portion return
                # Weighted stocks return based on user stock allocation sub-types.
                # Only include stock keys; ignore cash/bonds for bucket 3.
                stock_returns_by_key = {
                    # US equities
                    "total_us_stock": Decimal("7.5"),  # VTI
                    "us_small_cap_value": Decimal("8.5"),  # VBR
                    # International equities
                    "total_foreign_stock": Decimal("7.0"),  # VXUS
                    "international_small_cap_value": Decimal("8.0"),  # VSS
                    "developed_markets": Decimal("6.5"),  # VEA
                    "emerging_markets": Decimal("8.0"),  # VWO
                    # Real estate (treated as part of growth bucket for now)
                    "reits": Decimal("9.5"),  # VNQ
                    # Other placeholder equity-like bucket
                    "other": Decimal("5.0"),
                }
                historical_stock_returns_by_key = {
                    "total_us_stock": Decimal("10.0"),
                    "us_small_cap_value": Decimal("13.0"),
                    "total_foreign_stock": Decimal("8.5"),
                    "international_small_cap_value": Decimal("10.0"),
                    "developed_markets": Decimal("8.0"),
                    "emerging_markets": Decimal("9.0"),
                    "reits": Decimal("9.35"),
                    "other": Decimal("5.0"),
                }

                return_source = getattr(scenario_schema, "return_source", "10_year_projections")
                # For hybrid, years 1-10 use 10-year assumptions; 11+ use historical.
                use_historical_for_year = return_source == "historical_average" or (
                    return_source == "10_year_projections"
                    and year_num is not None
                    and year_num > 10
                )
                returns_map = (
                    historical_stock_returns_by_key
                    if use_historical_for_year
                    else stock_returns_by_key
                )

                allocation_data = scenario_schema.asset_allocation
                if not isinstance(allocation_data, dict) and hasattr(allocation_data, "model_dump"):
                    allocation_data = allocation_data.model_dump()

                stock_total_pct = Decimal("0")
                for k, v in allocation_data.items():
                    if k in returns_map:
                        stock_total_pct += Decimal(str(v))

                # Avoid divide-by-zero; if stock_total_pct is 0, fall back to base_return.
                if stock_total_pct > 0:
                    stock_blended_return = Decimal("0")
                    for k, expected in returns_map.items():
                        if k in allocation_data:
                            pct = Decimal(str(allocation_data.get(k) or "0"))
                            stock_blended_return += (pct / stock_total_pct) * expected
                else:
                    stock_blended_return = base_return

                bucket_3_return = stock_blended_return / Decimal("100")

                # Apply returns
                bucket_balances["bucket_1"] *= Decimal("1") + bucket_1_return
                if bucket_strategy_type == "B":
                    # Strategy B: Bucket 2 is bonds only (bucket_2_stocks stays 0)
                    bucket_balances["bucket_2_bonds"] *= Decimal("1") + bucket_2_bond_return
                else:
                    bucket_balances["bucket_2_stocks"] *= Decimal("1") + bucket_2_stock_return
                    bucket_balances["bucket_2_bonds"] *= Decimal("1") + bucket_2_bond_return
                bucket_balances["bucket_3"] *= Decimal("1") + bucket_3_return

                # Calculate bucket 3 return percentage for rebalancing logic
                if bucket_3_before_return > 0:
                    bucket_3_return_pct = (
                        (bucket_balances["bucket_3"] - bucket_3_before_return)
                        / bucket_3_before_return
                    ) * Decimal("100")
                else:
                    bucket_3_return_pct = Decimal("0")

                # Update previous high if bucket 3 exceeds it
                if (
                    bucket_3_before_return > 0
                    and bucket_balances["bucket_3"] > bucket_3_previous_high
                ):
                    bucket_3_previous_high = bucket_balances["bucket_3"]
                    if stocks_in_recovery:
                        stocks_in_recovery = False  # Stocks have recovered

                # Calculate total bucket value for weighted return calculation
                total_bucket_value = (
                    bucket_balances["bucket_1"]
                    + bucket_balances["bucket_2_stocks"]
                    + bucket_balances["bucket_2_bonds"]
                    + bucket_balances["bucket_3"]
                )

                # Calculate weighted average return based on bucket allocation
                if total_bucket_value > 0:
                    if bucket_strategy_type == "B":
                        bucket_2_return = bucket_2_bond_return  # Bonds only
                    else:
                        bucket_2_return = (bucket_2_stock_return + bucket_2_bond_return) / Decimal(
                            "2"
                        )
                    bucket_weighted_return = (
                        (bucket_balances["bucket_1"] / total_bucket_value) * bucket_1_return
                        + (
                            (bucket_balances["bucket_2_stocks"] + bucket_balances["bucket_2_bonds"])
                            / total_bucket_value
                        )
                        * bucket_2_return
                        + (bucket_balances["bucket_3"] / total_bucket_value) * bucket_3_return
                    ) * Decimal("100")
                    bucket_adjusted_return = bucket_weighted_return
                else:
                    bucket_adjusted_return = base_return

                # Handle bucket rebalancing logic (will be applied after withdrawals)
                # We'll store the rebalancing actions to apply later
                bucket_rebalancing_needed = False
                refill_bucket_1_amount = Decimal("0")

                # Calculate annual spending for bucket target calculations
                annual_spending_for_buckets = total_year_spending
                bucket_1_target = annual_spending_for_buckets * Decimal(str(bucket_1_years))

                # Scenario 1: Stocks increased - refill Bucket 1 if needed
                if bucket_3_return_pct > 0 and not stocks_in_recovery:
                    if bucket_balances["bucket_1"] < bucket_1_target:
                        refill_needed = bucket_1_target - bucket_balances["bucket_1"]
                        if bucket_balances["bucket_3"] >= refill_needed:
                            refill_bucket_1_amount = refill_needed
                            bucket_rebalancing_needed = True

                # Scenario 2: Stocks decreased - mark as in recovery
                elif bucket_3_return_pct < 0:
                    stocks_in_recovery = True
                    bucket_rebalancing_needed = True  # Rebalance Bucket 2

                # Scenario 3: Stocks recovered - refill Bucket 1
                # Recovery = bucket 3 at or above (recovery_threshold_pct % of) previous high
                elif (
                    stocks_in_recovery
                    and bucket_balances["bucket_3"]
                    >= (recovery_threshold_pct / Decimal("100")) * bucket_3_previous_high
                ):
                    if bucket_balances["bucket_1"] < bucket_1_target:
                        refill_needed = bucket_1_target - bucket_balances["bucket_1"]
                        if bucket_balances["bucket_3"] >= refill_needed:
                            refill_bucket_1_amount = refill_needed
                    stocks_in_recovery = False
                    bucket_rebalancing_needed = True

                # Apply rebalancing
                if bucket_rebalancing_needed:
                    # Refill Bucket 1 from Bucket 3 if needed
                    if refill_bucket_1_amount > 0:
                        bucket_balances["bucket_3"] -= refill_bucket_1_amount
                        bucket_balances["bucket_1"] += refill_bucket_1_amount

                    # Rebalance Bucket 2 to 50/50 (Strategy A only) when drift >= threshold
                    if bucket_strategy_type == "A":
                        bucket_2_total = (
                            bucket_balances["bucket_2_stocks"] + bucket_balances["bucket_2_bonds"]
                        )
                        if bucket_2_total > 0:
                            stock_pct = (
                                bucket_balances["bucket_2_stocks"] / bucket_2_total * Decimal("100")
                            )
                            drift = abs(stock_pct - Decimal("50"))
                            if drift >= rebalancing_threshold:
                                bucket_balances["bucket_2_stocks"] = bucket_2_total / Decimal("2")
                                bucket_balances["bucket_2_bonds"] = bucket_2_total / Decimal("2")

                # Use bucket-adjusted return for this year's projection
                annual_return = bucket_adjusted_return

                # Handle bucket withdrawals - this affects which accounts we withdraw from
                # Withdrawals come from buckets, but we need to map to account types for tax purposes
                bucket_withdrawal_needed = gross_needed
                withdrawal_from_bucket_1 = Decimal("0")
                withdrawal_from_bucket_2_bonds = Decimal("0")
                withdrawal_from_bucket_3 = Decimal("0")

                # Withdraw from Bucket 1 (Cash) first
                if bucket_withdrawal_needed > 0 and bucket_balances["bucket_1"] > 0:
                    withdrawal_from_bucket_1 = min(
                        bucket_withdrawal_needed, bucket_balances["bucket_1"]
                    )
                    bucket_balances["bucket_1"] -= withdrawal_from_bucket_1
                    bucket_withdrawal_needed -= withdrawal_from_bucket_1

                # Scenario 4: Bucket 1 exhausted, withdraw from Bucket 2 bonds
                if bucket_withdrawal_needed > 0 and bucket_balances["bucket_1"] <= 0:
                    if bucket_balances["bucket_2_bonds"] > 0:
                        withdrawal_from_bucket_2_bonds = min(
                            bucket_withdrawal_needed, bucket_balances["bucket_2_bonds"]
                        )
                        bucket_balances["bucket_2_bonds"] -= withdrawal_from_bucket_2_bonds
                        bucket_withdrawal_needed -= withdrawal_from_bucket_2_bonds

                        # Rebalance Bucket 2 after withdrawal (Strategy A only) when drift >= threshold
                        if bucket_strategy_type == "A":
                            bucket_2_total = (
                                bucket_balances["bucket_2_stocks"]
                                + bucket_balances["bucket_2_bonds"]
                            )
                            if bucket_2_total > 0:
                                stock_pct = (
                                    bucket_balances["bucket_2_stocks"]
                                    / bucket_2_total
                                    * Decimal("100")
                                )
                                drift = abs(stock_pct - Decimal("50"))
                                if drift >= rebalancing_threshold:
                                    bucket_balances["bucket_2_stocks"] = bucket_2_total / Decimal(
                                        "2"
                                    )
                                    bucket_balances["bucket_2_bonds"] = bucket_2_total / Decimal(
                                        "2"
                                    )

                # Last resort: Withdraw from Bucket 3 if everything else exhausted
                if bucket_withdrawal_needed > 0:
                    withdrawal_from_bucket_3 = min(
                        bucket_withdrawal_needed, bucket_balances["bucket_3"]
                    )
                    bucket_balances["bucket_3"] -= withdrawal_from_bucket_3
                    bucket_withdrawal_needed -= withdrawal_from_bucket_3
                    # Reduce recovery level by withdrawals so "100% recovery" is relative to post-withdrawal baseline
                    if withdrawal_from_bucket_3 > 0:
                        bucket_3_previous_high = max(
                            Decimal("0"),
                            bucket_3_previous_high - withdrawal_from_bucket_3,
                        )

                # Map bucket withdrawals to account types for tax calculations
                # Bucket 1 (Cash) -> cash accounts
                # Bucket 2 bonds -> pretax/taxable accounts (bonds)
                # Bucket 3 (Stocks) -> pretax/taxable accounts (stocks)
                # For simplicity, we'll prioritize: cash -> pretax -> taxable -> roth
                # This maintains tax efficiency while respecting bucket withdrawals
                gross_needed = (
                    withdrawal_from_bucket_1
                    + withdrawal_from_bucket_2_bonds
                    + withdrawal_from_bucket_3
                )
            else:
                # Non-bucket strategy: use year-based return calculation
                # Years 1-10: 10-year projections, Years 11+: historical averages
                annual_return = self._get_annual_return(scenario_schema, year_num)

            # Initial tax estimation (assuming pretax withdrawals, which matches our sequencing strategy)
            # We'll recalculate after withdrawals to be more accurate
            # Taxable income = SS (85% taxable at high income) + pretax withdrawals - deductions
            ss_taxable_pct = (
                Decimal("0.85")
                if (ss_income + gross_needed) > Decimal("44000")
                else Decimal("0.50")
            )
            taxable_ss = ss_income * ss_taxable_pct

            # Estimate taxes assuming pretax withdrawals (matches withdrawal sequencing)
            estimated_taxable_withdrawal = max(Decimal("0"), gross_needed)
            gross_taxable_income = taxable_ss + estimated_taxable_withdrawal + other_income
            estimated_taxable_income = max(Decimal("0"), gross_taxable_income - total_deductions)

            # Calculate estimated federal tax
            estimated_federal_tax = self._calculate_federal_tax(
                estimated_taxable_income, filing_status
            )

            # State tax (CO: 4.4%, SS fully excluded for 65+; OTHER: 4.4% on federal taxable)
            estimated_state_tax = self._calculate_state_tax(
                estimated_taxable_income,
                primary_ss_income,
                spouse_ss_income,
                state_of_residence,
                age,
                spouse_age_this_year,
                filing_status,
            )

            estimated_total_tax = estimated_federal_tax + estimated_state_tax

            # Required withdrawal must cover spending + taxes
            required_withdrawal = max(Decimal("0"), gross_needed + estimated_total_tax)

            # Check if we have any money available before attempting withdrawals
            total_available = (
                current_account_balances["pretax"]
                + current_account_balances["taxable"]
                + current_account_balances["cash"]
                + current_account_balances["roth"]
            )

            # If no money available, skip withdrawals
            if total_available <= 0:
                required_withdrawal = Decimal("0")
                pretax_withdrawal = Decimal("0")
                taxable_account_withdrawal = Decimal("0")
                cash_withdrawal = Decimal("0")
                roth_withdrawal = Decimal("0")
                remaining_withdrawal = Decimal("0")
            else:
                # Withdrawal sequencing based on bucket strategy or standard sequencing
                pretax_withdrawal = Decimal("0")
                taxable_account_withdrawal = Decimal("0")
                cash_withdrawal = Decimal("0")
                roth_withdrawal = Decimal("0")

                remaining_withdrawal = required_withdrawal

                if use_bucket_strategy:
                    # Bucket strategy withdrawals: prioritize cash accounts, then pretax/taxable
                    # Map bucket withdrawals to account types
                    # Bucket 1 (Cash) -> cash accounts first
                    # Bucket 2 bonds -> pretax accounts (bonds typically in pretax)
                    # Bucket 3 stocks -> pretax/taxable accounts

                    # Withdraw from cash accounts first (Bucket 1)
                    if remaining_withdrawal > 0 and current_account_balances["cash"] > 0:
                        cash_withdrawal = min(
                            remaining_withdrawal, current_account_balances["cash"]
                        )
                        remaining_withdrawal -= cash_withdrawal

                    # Then pretax (may include Bucket 2 bonds and Bucket 3 stocks)
                    if remaining_withdrawal > 0 and current_account_balances["pretax"] > 0:
                        pretax_withdrawal = min(
                            remaining_withdrawal, current_account_balances["pretax"]
                        )
                        remaining_withdrawal -= pretax_withdrawal

                    # Then taxable (may include Bucket 3 stocks)
                    if remaining_withdrawal > 0 and current_account_balances["taxable"] > 0:
                        taxable_account_withdrawal = min(
                            remaining_withdrawal, current_account_balances["taxable"]
                        )
                        remaining_withdrawal -= taxable_account_withdrawal

                    # Finally Roth (only if others depleted)
                    if remaining_withdrawal > 0 and current_account_balances["roth"] > 0:
                        roth_withdrawal = min(
                            remaining_withdrawal, current_account_balances["roth"]
                        )
                        remaining_withdrawal -= roth_withdrawal
                else:
                    # Standard withdrawal sequencing: pretax first, then taxable, then cash, preserve Roth
                    # Sequence: 1. Pretax, 2. Taxable, 3. Cash, 4. Roth (only if others depleted)

                    # 1. Withdraw from pretax first (100% of withdrawal until depleted)
                    if remaining_withdrawal > 0 and current_account_balances["pretax"] > 0:
                        pretax_withdrawal = min(
                            remaining_withdrawal, current_account_balances["pretax"]
                        )
                        remaining_withdrawal -= pretax_withdrawal

                    # 2. If pretax depleted, withdraw from taxable
                    if remaining_withdrawal > 0 and current_account_balances["taxable"] > 0:
                        taxable_account_withdrawal = min(
                            remaining_withdrawal, current_account_balances["taxable"]
                        )
                        remaining_withdrawal -= taxable_account_withdrawal

                    # 3. If taxable also depleted, withdraw from cash
                    if remaining_withdrawal > 0 and current_account_balances["cash"] > 0:
                        cash_withdrawal = min(
                            remaining_withdrawal, current_account_balances["cash"]
                        )
                        remaining_withdrawal -= cash_withdrawal

                    # 4. Only use Roth if pretax + taxable + cash are all depleted
                    if remaining_withdrawal > 0 and current_account_balances["roth"] > 0:
                        roth_withdrawal = min(
                            remaining_withdrawal, current_account_balances["roth"]
                        )
                        remaining_withdrawal -= roth_withdrawal

                # Calculate actual withdrawal amount (may be less than required if accounts depleted)
                actual_withdrawal = (
                    pretax_withdrawal
                    + taxable_account_withdrawal
                    + cash_withdrawal
                    + roth_withdrawal
                )

                # If we couldn't withdraw the full amount needed, adjust required_withdrawal
                # This prevents showing withdrawals when accounts are depleted
                if actual_withdrawal < required_withdrawal:
                    # Can't withdraw more than available - set to actual amount
                    required_withdrawal = actual_withdrawal
                    # If no money available, set to 0
                    if actual_withdrawal == 0:
                        required_withdrawal = Decimal("0")

            # Recalculate taxes based on actual withdrawals (only if we actually withdrew)
            # If no withdrawals, taxes should be based on SS and other income only
            if required_withdrawal > 0:
                # Pretax withdrawals: 100% taxable
                # Taxable account withdrawals: gains only (calculate from cost basis)
                # Roth withdrawals: 0% taxable
                # Cash withdrawals: 0% taxable (already taxed)

                # Calculate taxable gains from taxable account withdrawals
                taxable_gains = Decimal("0")
                if taxable_account_withdrawal > 0 and current_account_balances["taxable"] > 0:
                    # Calculate cost basis ratio for taxable accounts
                    cost_basis_ratio = (
                        current_cost_basis["taxable"] / current_account_balances["taxable"]
                        if current_account_balances["taxable"] > 0
                        else Decimal("0")
                    )
                    # Ensure ratio doesn't exceed 1.0 (can't have more cost basis than balance)
                    cost_basis_ratio = min(cost_basis_ratio, Decimal("1.0"))
                    # Taxable gain = withdrawal * (1 - cost_basis_ratio)
                    # Only the gain portion is taxable, not the principal
                    taxable_gains = taxable_account_withdrawal * (Decimal("1") - cost_basis_ratio)

                # Total taxable withdrawal amount
                taxable_withdrawal_amount = pretax_withdrawal + taxable_gains

                # Recalculate taxable income with actual withdrawals
                actual_gross_taxable_income = taxable_ss + taxable_withdrawal_amount + other_income
                actual_taxable_income = max(
                    Decimal("0"), actual_gross_taxable_income - total_deductions
                )

                # Recalculate taxes
                federal_tax = self._calculate_federal_tax(actual_taxable_income, filing_status)
                state_tax = self._calculate_state_tax(
                    actual_taxable_income,
                    primary_ss_income,
                    spouse_ss_income,
                    state_of_residence,
                    age,
                    spouse_age_this_year,
                    filing_status,
                )
                total_tax = federal_tax + state_tax

                # Optimization: If Roth was used, recalculate optimal required_withdrawal
                # This prevents showing over-withdrawal when Roth (tax-free) is used
                # The issue: required_withdrawal was calculated assuming all pretax (taxable)
                # But if Roth is used, we don't need extra tax on Roth portion
                if roth_withdrawal > 0:
                    # Calculate optimal withdrawal amount:
                    # We need: gross_needed (spending - other income)
                    # Tax is only on pretax/taxable/cash withdrawals, not on Roth
                    # So optimal = gross_needed + tax_on_taxable_withdrawals
                    # Since tax is already calculated on actual taxable withdrawals:
                    optimal_withdrawal = gross_needed + total_tax

                    # Adjust required_withdrawal to reflect optimal amount
                    # This ensures display shows correct "required" amount
                    if actual_withdrawal >= optimal_withdrawal:
                        # We withdrew at least the optimal amount
                        required_withdrawal = optimal_withdrawal
                    else:
                        # We couldn't withdraw optimal amount (accounts depleted)
                        required_withdrawal = actual_withdrawal
            else:
                # No withdrawals - taxes based on SS and other income only
                actual_gross_taxable_income = taxable_ss + other_income
                actual_taxable_income = max(
                    Decimal("0"), actual_gross_taxable_income - total_deductions
                )
                federal_tax = self._calculate_federal_tax(actual_taxable_income, filing_status)
                state_tax = self._calculate_state_tax(
                    actual_taxable_income,
                    primary_ss_income,
                    spouse_ss_income,
                    state_of_residence,
                    age,
                    spouse_age_this_year,
                    filing_status,
                )
                total_tax = federal_tax + state_tax

            # Calculate balances after withdrawals (before returns)
            pretax_after_withdrawal = current_account_balances["pretax"] - pretax_withdrawal
            taxable_after_withdrawal = (
                current_account_balances["taxable"] - taxable_account_withdrawal
            )
            cash_after_withdrawal = current_account_balances["cash"] - cash_withdrawal
            roth_after_withdrawal = current_account_balances["roth"] - roth_withdrawal

            # Update bucket balances after withdrawals (if bucket strategy enabled)
            if use_bucket_strategy:
                # Map account withdrawals to bucket withdrawals
                # This is a simplification - in reality buckets span account types
                total_withdrawal = (
                    pretax_withdrawal
                    + taxable_account_withdrawal
                    + cash_withdrawal
                    + roth_withdrawal
                )

                # Reduce bucket balances proportionally based on withdrawals
                # Bucket 1 (Cash) gets reduced by cash withdrawals
                if total_withdrawal > 0:
                    # Estimate which bucket the withdrawal came from
                    # Cash withdrawals come from Bucket 1
                    bucket_1_withdrawal = cash_withdrawal
                    # Pretax/taxable withdrawals come from Buckets 2/3 proportionally
                    # For simplicity, assume pretax = Bucket 2 bonds, taxable = Bucket 3 stocks
                    bucket_2_withdrawal = pretax_withdrawal  # Simplified
                    bucket_3_withdrawal = taxable_account_withdrawal  # Simplified

                    # Update bucket balances
                    bucket_balances["bucket_1"] = max(
                        Decimal("0"), bucket_balances["bucket_1"] - bucket_1_withdrawal
                    )
                    bucket_balances["bucket_2_bonds"] = max(
                        Decimal("0"), bucket_balances["bucket_2_bonds"] - bucket_2_withdrawal
                    )
                    bucket_balances["bucket_3"] = max(
                        Decimal("0"), bucket_balances["bucket_3"] - bucket_3_withdrawal
                    )

                    # Rebalance Bucket 2 if drift >= threshold (Strategy A only)
                    if bucket_strategy_type == "A":
                        bucket_2_total = (
                            bucket_balances["bucket_2_stocks"] + bucket_balances["bucket_2_bonds"]
                        )
                        if bucket_2_total > 0:
                            stock_pct = (
                                bucket_balances["bucket_2_stocks"] / bucket_2_total * Decimal("100")
                            )
                            drift = abs(stock_pct - Decimal("50"))
                            if drift >= rebalancing_threshold:
                                bucket_balances["bucket_2_stocks"] = bucket_2_total / Decimal("2")
                                bucket_balances["bucket_2_bonds"] = bucket_2_total / Decimal("2")

            # Update cost basis proportionally when withdrawing from taxable accounts
            # Cost basis is reduced by the same proportion as the withdrawal
            if taxable_account_withdrawal > 0 and current_account_balances["taxable"] > 0:
                withdrawal_ratio = taxable_account_withdrawal / current_account_balances["taxable"]
                cost_basis_reduction = current_cost_basis["taxable"] * withdrawal_ratio
                current_cost_basis["taxable"] -= cost_basis_reduction
                # Ensure cost basis doesn't go negative
                current_cost_basis["taxable"] = max(Decimal("0"), current_cost_basis["taxable"])

            # Calculate average balance per account type (for return calculation)
            # Average = (starting + after_withdrawal) / 2
            pretax_avg = (current_account_balances["pretax"] + pretax_after_withdrawal) / Decimal(
                "2"
            )
            taxable_avg = (
                current_account_balances["taxable"] + taxable_after_withdrawal
            ) / Decimal("2")
            cash_avg = (current_account_balances["cash"] + cash_after_withdrawal) / Decimal("2")
            roth_avg = (current_account_balances["roth"] + roth_after_withdrawal) / Decimal("2")

            # Calculate investment returns per account type (on remaining balances)
            pretax_return = pretax_avg * (annual_return / Decimal("100"))
            taxable_return = taxable_avg * (annual_return / Decimal("100"))
            cash_return = cash_avg * (annual_return / Decimal("100"))
            roth_return = roth_avg * (annual_return / Decimal("100"))
            investment_return = pretax_return + taxable_return + cash_return + roth_return

            # Calculate ending balances per account type (after withdrawals and returns)
            pretax_ending = pretax_after_withdrawal + pretax_return
            taxable_ending = taxable_after_withdrawal + taxable_return
            cash_ending = cash_after_withdrawal + cash_return
            roth_ending = roth_after_withdrawal + roth_return

            # Ensure no negative balances
            pretax_ending = max(Decimal("0"), pretax_ending)
            taxable_ending = max(Decimal("0"), taxable_ending)
            cash_ending = max(Decimal("0"), cash_ending)
            roth_ending = max(Decimal("0"), roth_ending)

            # Calculate total ending balance
            ending_balance = pretax_ending + roth_ending + taxable_ending + cash_ending

            # Check for depletion
            is_depleted = ending_balance <= 0
            if is_depleted and years_until_depletion is None:
                years_until_depletion = year_num
                ending_balance = Decimal("0")
                pretax_ending = roth_ending = taxable_ending = cash_ending = Decimal("0")
                # If depleted, ensure no withdrawals are shown
                if actual_withdrawal == 0:
                    required_withdrawal = Decimal("0")

            after_tax_income = total_income + required_withdrawal - total_tax

            # Validation: Ensure after_tax_income covers spending
            # If actual tax was higher than estimated, we may need additional withdrawal
            shortfall = total_year_spending - after_tax_income
            if shortfall > Decimal("0.01"):  # Allow small rounding differences
                # Need to withdraw additional amount to cover shortfall
                # Account for taxes on additional withdrawal (if from pretax/taxable)
                # Estimate: if withdrawing from pretax, need ~1.3x to cover tax (rough estimate)
                # We'll refine this iteratively if needed, but limit to one iteration to avoid loops
                tax_multiplier = Decimal(
                    "1.3"
                )  # Rough estimate for pretax (accounts for ~23% effective tax)
                additional_needed_gross = shortfall * tax_multiplier
                remaining_additional = additional_needed_gross

                # Track additional withdrawals for tax recalculation
                additional_pretax = Decimal("0")
                additional_taxable = Decimal("0")
                additional_cash = Decimal("0")
                additional_roth = Decimal("0")

                # Try to cover shortfall from remaining accounts (same sequence)
                if remaining_additional > 0 and pretax_ending > 0:
                    additional_pretax = min(remaining_additional, pretax_ending)
                    pretax_ending -= additional_pretax
                    pretax_withdrawal += additional_pretax
                    remaining_additional -= additional_pretax
                    required_withdrawal += additional_pretax

                if remaining_additional > 0 and taxable_ending > 0:
                    additional_taxable = min(remaining_additional, taxable_ending)
                    taxable_ending -= additional_taxable
                    taxable_account_withdrawal += additional_taxable
                    remaining_additional -= additional_taxable
                    required_withdrawal += additional_taxable

                if remaining_additional > 0 and cash_ending > 0:
                    additional_cash = min(remaining_additional, cash_ending)
                    cash_ending -= additional_cash
                    cash_withdrawal += additional_cash
                    remaining_additional -= additional_cash
                    required_withdrawal += additional_cash

                if remaining_additional > 0 and roth_ending > 0:
                    additional_roth = min(remaining_additional, roth_ending)
                    roth_ending -= additional_roth
                    roth_withdrawal += additional_roth
                    remaining_additional -= additional_roth
                    required_withdrawal += additional_roth

                # Recalculate taxes with additional withdrawals
                if additional_pretax > 0 or additional_taxable > 0:
                    # Calculate taxable gains from taxable account withdrawals (including additional)
                    updated_taxable_gains = Decimal("0")
                    total_taxable_withdrawal = taxable_account_withdrawal + additional_taxable
                    if total_taxable_withdrawal > 0 and taxable_ending > 0:
                        # Use current cost basis ratio (already updated from initial withdrawal)
                        cost_basis_ratio = (
                            current_cost_basis["taxable"] / taxable_ending
                            if taxable_ending > 0
                            else Decimal("0")
                        )
                        cost_basis_ratio = min(cost_basis_ratio, Decimal("1.0"))
                        updated_taxable_gains = total_taxable_withdrawal * (
                            Decimal("1") - cost_basis_ratio
                        )

                    updated_taxable_withdrawal_amount = pretax_withdrawal + updated_taxable_gains

                    # Update cost basis for additional taxable withdrawal
                    if additional_taxable > 0 and taxable_ending > 0:
                        additional_withdrawal_ratio = additional_taxable / taxable_ending
                        additional_cost_basis_reduction = (
                            current_cost_basis["taxable"] * additional_withdrawal_ratio
                        )
                        current_cost_basis["taxable"] -= additional_cost_basis_reduction
                        current_cost_basis["taxable"] = max(
                            Decimal("0"), current_cost_basis["taxable"]
                        )
                    updated_gross_taxable_income = (
                        taxable_ss + updated_taxable_withdrawal_amount + other_income
                    )
                    updated_taxable_income = max(
                        Decimal("0"), updated_gross_taxable_income - total_deductions
                    )
                    federal_tax = self._calculate_federal_tax(updated_taxable_income, filing_status)
                    state_tax = self._calculate_state_tax(
                        updated_taxable_income,
                        primary_ss_income,
                        spouse_ss_income,
                        state_of_residence,
                        age,
                        spouse_age_this_year,
                        filing_status,
                    )
                    total_tax = federal_tax + state_tax

                # Recalculate after_tax_income with additional withdrawal and updated taxes
                after_tax_income = total_income + required_withdrawal - total_tax

                # Recalculate ending balance
                ending_balance = pretax_ending + roth_ending + taxable_ending + cash_ending

                # Recalculate actual withdrawal after additional withdrawals
                actual_withdrawal = (
                    pretax_withdrawal
                    + taxable_account_withdrawal
                    + cash_withdrawal
                    + roth_withdrawal
                )

                # Ensure required_withdrawal doesn't exceed actual withdrawal
                if required_withdrawal > actual_withdrawal:
                    required_withdrawal = actual_withdrawal

                # If still shortfall after using all accounts, mark as depleted
                final_shortfall = total_year_spending - after_tax_income
                if final_shortfall > Decimal("0.01") and ending_balance <= 0:
                    is_depleted = True
                    if years_until_depletion is None:
                        years_until_depletion = year_num
                    # If depleted, ensure no withdrawals shown
                    if actual_withdrawal == 0:
                        required_withdrawal = Decimal("0")

            # Withdrawal rate: portfolio withdrawal as % of starting balance (retirement accounts)
            withdrawal_rate_pct = (
                (required_withdrawal / starting_balance * Decimal("100"))
                if starting_balance > 0
                else Decimal("0")
            )

            projections.append(
                ScenarioYearProjection(
                    year=year_num,
                    calendar_year=calendar_year,
                    age=age,
                    starting_balance=starting_balance.quantize(Decimal("0.01")),
                    ending_balance=ending_balance.quantize(Decimal("0.01")),
                    pretax_starting_balance=current_account_balances["pretax"].quantize(
                        Decimal("0.01")
                    ),
                    roth_starting_balance=current_account_balances["roth"].quantize(
                        Decimal("0.01")
                    ),
                    taxable_starting_balance=current_account_balances["taxable"].quantize(
                        Decimal("0.01")
                    ),
                    cash_starting_balance=current_account_balances["cash"].quantize(
                        Decimal("0.01")
                    ),
                    pretax_ending_balance=pretax_ending.quantize(Decimal("0.01")),
                    roth_ending_balance=roth_ending.quantize(Decimal("0.01")),
                    taxable_ending_balance=taxable_ending.quantize(Decimal("0.01")),
                    cash_ending_balance=cash_ending.quantize(Decimal("0.01")),
                    social_security_income=ss_income.quantize(Decimal("0.01")),
                    primary_ss_income=primary_ss_income.quantize(Decimal("0.01")),
                    spouse_ss_income=spouse_ss_income.quantize(Decimal("0.01")),
                    other_income=other_income.quantize(Decimal("0.01")),
                    total_income=total_income.quantize(Decimal("0.01")),
                    fixed_spending=(active_fixed_monthly * Decimal("12")).quantize(Decimal("0.01")),
                    variable_spending=(inflated_variable_monthly * Decimal("12")).quantize(
                        Decimal("0.01")
                    ),
                    monthly_spending=adjusted_monthly.quantize(Decimal("0.01")),
                    annual_spending=annual_spending.quantize(Decimal("0.01")),
                    annual_lump_spending=annual_lump.quantize(Decimal("0.01")),
                    total_spending=total_year_spending.quantize(Decimal("0.01")),
                    portfolio_withdrawal=required_withdrawal.quantize(Decimal("0.01")),
                    pretax_withdrawal=pretax_withdrawal.quantize(Decimal("0.01")),
                    taxable_withdrawal=taxable_account_withdrawal.quantize(Decimal("0.01")),
                    cash_withdrawal=cash_withdrawal.quantize(Decimal("0.01")),
                    roth_withdrawal=roth_withdrawal.quantize(Decimal("0.01")),
                    withdrawal_rate_percent=withdrawal_rate_pct.quantize(Decimal("0.01")),
                    investment_return=investment_return.quantize(Decimal("0.01")),
                    return_percent=annual_return.quantize(Decimal("0.01")),
                    taxable_income=actual_taxable_income.quantize(Decimal("0.01")),
                    federal_tax=federal_tax.quantize(Decimal("0.01")),
                    state_tax=state_tax.quantize(Decimal("0.01")),
                    total_tax=total_tax.quantize(Decimal("0.01")),
                    after_tax_income=after_tax_income.quantize(Decimal("0.01")),
                    is_depleted=is_depleted,
                )
            )

            # Update totals
            total_ss += ss_income
            total_other += other_income
            total_spending += total_year_spending
            total_withdrawals += required_withdrawal

            # Update account balances for next iteration
            current_account_balances["pretax"] = pretax_ending
            current_account_balances["roth"] = roth_ending
            current_account_balances["taxable"] = taxable_ending
            current_account_balances["cash"] = cash_ending

            calendar_year += 1

        ss_start_age_str = f"{scenario_schema.ss_start_age_years} years {scenario_schema.ss_start_age_months} months"

        # Calculate final portfolio from account balances
        final_portfolio = (
            current_account_balances["pretax"]
            + current_account_balances["roth"]
            + current_account_balances["taxable"]
            + current_account_balances["cash"]
        )

        return ScenarioProjectionResult(
            scenario_id=scenario_id,
            scenario_name=scenario_schema.name,
            initial_portfolio=initial_portfolio.quantize(Decimal("0.01")),
            final_portfolio=final_portfolio.quantize(Decimal("0.01")),
            initial_pretax=account_balances["pretax"].quantize(Decimal("0.01")),
            initial_roth=account_balances["roth"].quantize(Decimal("0.01")),
            initial_taxable=account_balances["taxable"].quantize(Decimal("0.01")),
            initial_cash=account_balances["cash"].quantize(Decimal("0.01")),
            final_pretax=current_account_balances["pretax"].quantize(Decimal("0.01")),
            final_roth=current_account_balances["roth"].quantize(Decimal("0.01")),
            final_taxable=current_account_balances["taxable"].quantize(Decimal("0.01")),
            final_cash=current_account_balances["cash"].quantize(Decimal("0.01")),
            years_until_depletion=years_until_depletion,
            total_ss_received=total_ss.quantize(Decimal("0.01")),
            total_other_income=total_other.quantize(Decimal("0.01")),
            total_spending=total_spending.quantize(Decimal("0.01")),
            total_withdrawals=total_withdrawals.quantize(Decimal("0.01")),
            ss_start_age=ss_start_age_str,
            average_return_percent=annual_return.quantize(Decimal("0.01")),
            inflation_rate=scenario_schema.inflation_rate.quantize(Decimal("0.01")),
            projections=projections,
        )

    def compare_scenarios(self, scenario_ids: list[UUID]) -> ScenarioComparisonResult:
        """Compare multiple scenarios."""
        results = []
        for scenario_id in scenario_ids:
            try:
                result = self.generate_projection(scenario_id=scenario_id)
                results.append(result)
            except Exception:
                # Skip scenarios that fail to generate
                continue

        # Build comparison summary
        summary = {}
        for result in results:
            summary[result.scenario_name] = {
                "final_portfolio": str(result.final_portfolio),
                "years_until_depletion": result.years_until_depletion,
                "total_ss_received": str(result.total_ss_received),
                "total_withdrawals": str(result.total_withdrawals),
            }

        return ScenarioComparisonResult(
            scenarios=results,
            comparison_summary=summary,
        )

    def _get_annual_return(self, scenario, year_num: int | None = None) -> Decimal:
        """
        Get annual return based on scenario configuration and year number.

        Default behavior (10_year_projections):
        - Years 1-10: Use 10-year institutional projections
        - Years 11+: Use long-term historical averages

        Other options:
        - historical_average: Use historical averages for all years
        - custom: Use custom return percent for all years
        """
        if hasattr(scenario, "return_source"):
            return_source = scenario.return_source
        else:
            return_source = "10_year_projections"

        if (
            return_source == "custom"
            and hasattr(scenario, "custom_return_percent")
            and scenario.custom_return_percent is not None
        ):
            return Decimal(str(scenario.custom_return_percent))
        elif return_source == "historical_average":
            # Use historical averages for all years
            return self._get_historical_blended_return(scenario)
        else:  # 10_year_projections (default)
            # Hybrid approach: 10-year projections for years 1-10, historical for years 11+
            if year_num is not None and year_num > 10:
                # Years 11+: Use historical averages
                return self._get_historical_blended_return(scenario)
            else:
                # Years 1-10: Use 10-year institutional projections
                return self._get_10_year_blended_return(scenario)

    def _get_10_year_blended_return(self, scenario) -> Decimal:
        """Calculate blended return using 10-year institutional projections."""
        if hasattr(scenario, "asset_allocation"):
            allocation = scenario.asset_allocation
            if isinstance(allocation, dict):
                # 10-year expected returns by asset class (Vanguard ETFs)
                returns = {
                    # US Equities
                    "total_us_stock": Decimal("7.5"),  # VTI
                    "us_small_cap_value": Decimal("8.5"),  # VBR
                    # International Equities
                    "total_foreign_stock": Decimal("7.0"),  # VXUS
                    "international_small_cap_value": Decimal("8.0"),  # VSS
                    "developed_markets": Decimal("6.5"),  # VEA
                    "emerging_markets": Decimal("8.0"),  # VWO
                    # Real Estate
                    "reits": Decimal("9.5"),  # VNQ - 10-year forecast
                    # Fixed Income
                    "bonds": Decimal("4.5"),  # BND
                    "short_term_treasuries": Decimal("4.0"),  # VGSH
                    "intermediate_term_treasuries": Decimal("4.2"),  # VGIT
                    "municipal_bonds": Decimal("3.5"),  # VTEB (tax-exempt)
                    # Cash & Other
                    "cash": Decimal("3.5"),  # VMFXX
                    "other": Decimal("5.0"),  # Default assumption
                }
                blended = Decimal("0")
                for key, pct in allocation.items():
                    if key in returns:
                        blended += Decimal(str(pct)) * returns[key] / Decimal("100")
                return blended if blended > 0 else Decimal("6.0")
        return Decimal("6.0")  # Default

    def _get_historical_blended_return(self, scenario) -> Decimal:
        """Calculate blended return using long-term historical averages."""
        if hasattr(scenario, "asset_allocation"):
            allocation = scenario.asset_allocation
            if isinstance(allocation, dict):
                # Long-term historical averages by asset class
                returns = {
                    # US Equities
                    "total_us_stock": Decimal("10.0"),  # ~10% long-term average
                    "us_small_cap_value": Decimal("13.0"),  # ~13% long-term average
                    # International Equities
                    "total_foreign_stock": Decimal("8.5"),  # ~8.5% long-term average
                    "international_small_cap_value": Decimal("10.0"),  # ~10% long-term average
                    "developed_markets": Decimal("8.0"),  # ~8% long-term average
                    "emerging_markets": Decimal("9.0"),  # ~9% long-term average
                    # Real Estate
                    "reits": Decimal("9.35"),  # 30-year historical average
                    # Fixed Income
                    "bonds": Decimal("4.5"),  # ~4.5% long-term average
                    "short_term_treasuries": Decimal("4.0"),  # ~4% long-term average
                    "intermediate_term_treasuries": Decimal("4.2"),  # ~4.2% long-term average
                    "municipal_bonds": Decimal("4.2"),  # ~4.2% long-term average
                    # Cash & Other
                    "cash": Decimal("3.31"),  # Historical T-bill average
                    "other": Decimal("5.0"),  # Default assumption
                }
                blended = Decimal("0")
                for key, pct in allocation.items():
                    if key in returns:
                        blended += Decimal(str(pct)) * returns[key] / Decimal("100")
                return blended if blended > 0 else Decimal("10.0")
        return Decimal("10.0")  # Default historical average

    def _calculate_federal_tax(self, taxable_income: Decimal, filing_status: str) -> Decimal:
        """Calculate federal income tax based on 2024 brackets."""
        if taxable_income <= 0:
            return Decimal("0")

        # 2024 Federal Tax Brackets
        if filing_status == "married_filing_jointly":
            brackets = [
                (Decimal("23200"), Decimal("0.10")),
                (Decimal("94300"), Decimal("0.12")),
                (Decimal("201050"), Decimal("0.22")),
                (Decimal("383900"), Decimal("0.24")),
                (Decimal("487450"), Decimal("0.32")),
                (Decimal("731200"), Decimal("0.35")),
                (Decimal("999999999"), Decimal("0.37")),
            ]
        elif filing_status == "single":
            brackets = [
                (Decimal("11600"), Decimal("0.10")),
                (Decimal("47150"), Decimal("0.12")),
                (Decimal("100525"), Decimal("0.22")),
                (Decimal("191950"), Decimal("0.24")),
                (Decimal("243725"), Decimal("0.32")),
                (Decimal("609350"), Decimal("0.35")),
                (Decimal("999999999"), Decimal("0.37")),
            ]
        else:  # head_of_household or default
            brackets = [
                (Decimal("16550"), Decimal("0.10")),
                (Decimal("63100"), Decimal("0.12")),
                (Decimal("100500"), Decimal("0.22")),
                (Decimal("191950"), Decimal("0.24")),
                (Decimal("243700"), Decimal("0.32")),
                (Decimal("609350"), Decimal("0.35")),
                (Decimal("999999999"), Decimal("0.37")),
            ]

        tax = Decimal("0")
        remaining_income = taxable_income
        prev_bracket = Decimal("0")

        for bracket_limit, rate in brackets:
            if remaining_income <= 0:
                break
            bracket_income = min(remaining_income, bracket_limit - prev_bracket)
            tax += bracket_income * rate
            remaining_income -= bracket_income
            prev_bracket = bracket_limit

        return tax

    def _calculate_state_tax(
        self,
        federal_taxable_income: Decimal,
        primary_ss_income: Decimal,
        spouse_ss_income: Decimal,
        state: str,
        primary_age: int,
        spouse_age: int | None,
        filing_status: str,
    ) -> Decimal:
        """
        State income tax. Colorado: 4.4% flat. For each recipient 65+, 100% of their
        Social Security is excluded from state taxable income; under 65, SS is taxed like federal.
        Other states: 4.4% on federal taxable (placeholder).
        """
        if federal_taxable_income <= 0:
            return Decimal("0")
        state_taxable = federal_taxable_income
        if state == "CO":
            # CO: exclude only the SS of each recipient who is 65+
            exempt_ss = Decimal("0")
            if primary_age >= 65:
                exempt_ss += primary_ss_income
            if spouse_age is not None and spouse_age >= 65:
                exempt_ss += spouse_ss_income
            state_taxable = max(Decimal("0"), federal_taxable_income - exempt_ss)
        # CO and OTHER: 4.4% flat (Colorado rate)
        return state_taxable * Decimal("0.044")

    def _calculate_ss_income(
        self,
        birth_date: date,
        fra_amount: Decimal,
        fra_age: Decimal,
        ss_start_age_years: int,
        ss_start_age_months: int,
        calendar_year: int,
        year_num: int,
        reference_year: int,
        inflation_rate: Decimal = Decimal("2.5"),
    ) -> Decimal:
        """
        Calculate Social Security income for a given year with COLA adjustments.

        FRA amount is in "reference year" (e.g. today) dollars. We apply COLA for each
        future year from reference_year until the year SS starts, then for each year
        after that. So benefit in calendar_year = base * (1+cola)^(calendar_year - reference_year).
        If SS started in the past (ss_start_date.year < reference_year), we apply COLA
        only from SS start year: base * (1+cola)^(calendar_year - ss_start_date.year).
        """
        # Calculate the date when SS starts (retirement/claiming date)
        ss_start_date = date(
            birth_date.year + ss_start_age_years,
            birth_date.month + ss_start_age_months,
            birth_date.day,
        )
        # Adjust for month overflow
        while ss_start_date.month > 12:
            ss_start_date = date(
                ss_start_date.year + 1, ss_start_date.month - 12, min(ss_start_date.day, 28)
            )

        fra_years = int(fra_age)
        fra_months = int(round((fra_age - Decimal(str(fra_years))) * Decimal("12")))

        # Calculate SS amount based on claiming age vs FRA (in reference-year dollars)
        claiming_months_from_fra = (ss_start_age_years - fra_years) * 12 + (
            ss_start_age_months - fra_months
        )

        if claiming_months_from_fra < 0:
            # Early claiming - reduce by 5/9 of 1% for first 36 months, 5/12 of 1% thereafter
            months_early = abs(claiming_months_from_fra)
            if months_early <= 36:
                reduction = (
                    Decimal(str(months_early)) * Decimal("5") / Decimal("9") / Decimal("100")
                )
            else:
                reduction = Decimal("36") * Decimal("5") / Decimal("9") / Decimal("100")
                reduction += (
                    Decimal(str(months_early - 36)) * Decimal("5") / Decimal("12") / Decimal("100")
                )
            base_monthly_ss = fra_amount * (Decimal("1") - reduction)
        elif claiming_months_from_fra > 0:
            # Delayed claiming - increase by 8% per year (2/3% per month)
            months_delayed = claiming_months_from_fra
            increase = Decimal(str(months_delayed)) * Decimal("2") / Decimal("3") / Decimal("100")
            base_monthly_ss = fra_amount * (Decimal("1") + increase)
        else:
            base_monthly_ss = fra_amount

        # Check if SS has started in this calendar year
        year_start = date(calendar_year, 1, 1)
        year_end = date(calendar_year, 12, 31)

        if ss_start_date > year_end:
            # SS hasn't started yet
            return Decimal("0")

        # COLA: apply for each year from reference (current) to this calendar year.
        # If SS start is in the future (>= reference_year), benefit grows from reference_year
        # to start year, then keeps growing each year after. So exponent = calendar_year - reference_year.
        # If SS started in the past (ss_start_date.year < reference_year), treat base as already
        # in start-year dollars and only grow from ss_start_date.year.
        if ss_start_date.year >= reference_year:
            years_of_cola = calendar_year - reference_year
        else:
            years_of_cola = calendar_year - ss_start_date.year
        cola_factor = (Decimal("1") + inflation_rate / Decimal("100")) ** years_of_cola
        monthly_ss = base_monthly_ss * cola_factor

        if ss_start_date > year_start:
            # SS starts partway through year (first year)
            months_receiving = 12 - ss_start_date.month + 1
            return monthly_ss * Decimal(str(months_receiving))
        else:
            # Full year of SS
            return monthly_ss * Decimal("12")

    def _calculate_other_income(self, other_income_service, calendar_year: int) -> Decimal:
        """Calculate other income for a given year."""
        try:
            total = Decimal("0")
            for month in range(1, 13):
                monthly = other_income_service.get_total_monthly_income(calendar_year, month)
                total += monthly
            return total
        except Exception:
            return Decimal("0")
