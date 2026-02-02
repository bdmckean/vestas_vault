"""Service for other income business logic."""

from decimal import Decimal
from typing import Optional
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.other_income import OtherIncome as OtherIncomeModel
from app.repositories.other_income_repository import OtherIncomeRepository
from app.schemas.other_income import (
    IncomeType,
    OtherIncome,
    OtherIncomeCreate,
    OtherIncomeProjection,
    OtherIncomeSummary,
    OtherIncomeUpdate,
)


class OtherIncomeService:
    """Service for other income operations."""

    def __init__(self, db: Session):
        """Initialize service with database session."""
        self.db = db
        self.repository = OtherIncomeRepository(db)

    def get_all_income(self) -> list[OtherIncome]:
        """Get all other income sources."""
        incomes = self.repository.get_all()
        return [OtherIncome.model_validate(income) for income in incomes]

    def get_income_by_id(self, income_id: UUID) -> OtherIncome | None:
        """Get other income by ID."""
        income = self.repository.get_by_id(income_id)
        if not income:
            return None
        return OtherIncome.model_validate(income)

    def create_income(self, income_data: OtherIncomeCreate) -> OtherIncome:
        """Create a new other income source."""
        # Validate end date consistency
        if (income_data.end_month is not None) != (income_data.end_year is not None):
            raise ValueError("Both end_month and end_year must be set together or neither")

        # Validate end date is after start date if set
        if income_data.end_year is not None:
            start_date_value = income_data.start_year * 12 + income_data.start_month
            end_date_value = income_data.end_year * 12 + income_data.end_month
            if end_date_value < start_date_value:
                raise ValueError("End date must be on or after start date")

        income = self.repository.create(income_data)
        return OtherIncome.model_validate(income)

    def update_income(self, income_id: UUID, income_data: OtherIncomeUpdate) -> OtherIncome | None:
        """Update an existing other income source."""
        income = self.repository.update(income_id, income_data)
        if not income:
            return None
        return OtherIncome.model_validate(income)

    def delete_income(self, income_id: UUID) -> bool:
        """Delete an other income source."""
        return self.repository.delete(income_id)

    def _is_income_active(
        self,
        income: OtherIncomeModel,
        year: int,
        month: int,
    ) -> bool:
        """Check if an income source is active for a given month/year."""
        # Check if after or equal to start date
        current_value = year * 12 + month
        start_value = income.start_year * 12 + income.start_month

        if current_value < start_value:
            return False

        # Check if before or equal to end date (if set)
        if income.end_year is not None and income.end_month is not None:
            end_value = income.end_year * 12 + income.end_month
            if current_value > end_value:
                return False

        return True

    def _calculate_amount_with_cola(
        self,
        income: OtherIncomeModel,
        year: int,
    ) -> Decimal:
        """Calculate income amount with COLA adjustment."""
        base_amount = Decimal(str(income.monthly_amount))
        cola_rate = Decimal(str(income.cola_rate))

        if cola_rate == 0:
            return base_amount

        # Calculate years since start for COLA
        years_elapsed = year - income.start_year
        if years_elapsed <= 0:
            return base_amount

        # Apply compound COLA
        multiplier = (1 + cola_rate) ** years_elapsed
        return (base_amount * multiplier).quantize(Decimal("0.01"))

    def get_projections(
        self,
        start_year: int,
        start_month: int,
        end_year: int,
        end_month: int,
    ) -> list[OtherIncomeProjection]:
        """Get month-by-month projections for all income sources."""
        incomes = self.repository.get_all()
        projections = []

        current_year = start_year
        current_month = start_month

        while (current_year < end_year) or (
            current_year == end_year and current_month <= end_month
        ):
            for income in incomes:
                if self._is_income_active(income, current_year, current_month):
                    amount = self._calculate_amount_with_cola(income, current_year)
                    projections.append(
                        OtherIncomeProjection(
                            income_id=income.id,
                            name=income.name,
                            income_type=IncomeType(income.income_type),
                            year=current_year,
                            month=current_month,
                            amount=amount,
                            is_taxable=income.is_taxable,
                        )
                    )

            # Move to next month
            current_month += 1
            if current_month > 12:
                current_month = 1
                current_year += 1

        return projections

    def get_monthly_summary(
        self,
        start_year: int,
        start_month: int,
        end_year: int,
        end_month: int,
    ) -> list[OtherIncomeSummary]:
        """Get aggregated monthly summaries."""
        projections = self.get_projections(start_year, start_month, end_year, end_month)

        # Group by year/month
        monthly_data: dict[tuple[int, int], list[OtherIncomeProjection]] = {}
        for proj in projections:
            key = (proj.year, proj.month)
            if key not in monthly_data:
                monthly_data[key] = []
            monthly_data[key].append(proj)

        summaries = []
        for (year, month), month_projections in sorted(monthly_data.items()):
            total_amount = Decimal("0")
            taxable_amount = Decimal("0")
            non_taxable_amount = Decimal("0")
            by_type: dict[str, Decimal] = {}
            by_source: dict[str, Decimal] = {}

            for proj in month_projections:
                total_amount += proj.amount
                if proj.is_taxable:
                    taxable_amount += proj.amount
                else:
                    non_taxable_amount += proj.amount

                # Aggregate by type
                type_key = proj.income_type.value
                if type_key not in by_type:
                    by_type[type_key] = Decimal("0")
                by_type[type_key] += proj.amount

                # Aggregate by source
                by_source[proj.name] = proj.amount

            summaries.append(
                OtherIncomeSummary(
                    year=year,
                    month=month,
                    total_amount=total_amount,
                    taxable_amount=taxable_amount,
                    non_taxable_amount=non_taxable_amount,
                    by_type=by_type,
                    by_source=by_source,
                )
            )

        return summaries

    def get_total_monthly_income(self, year: int, month: int) -> Decimal:
        """Get total other income for a specific month."""
        incomes = self.repository.get_all()
        total = Decimal("0")

        for income in incomes:
            if self._is_income_active(income, year, month):
                amount = self._calculate_amount_with_cola(income, year)
                total += amount

        return total
