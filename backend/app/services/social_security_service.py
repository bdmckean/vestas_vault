"""Social Security service for business logic and calculations."""

from datetime import date, timedelta
from decimal import Decimal

from sqlalchemy.orm import Session

from app.repositories.social_security_repository import SocialSecurityRepository
from app.schemas.social_security import (
    SocialSecurity,
    SocialSecurityCreate,
    SocialSecurityPaymentProjection,
    SocialSecurityUpdate,
)
from app.utils.fra_calculator import calculate_fra_decimal


class SocialSecurityService:
    """Service for Social Security business logic and calculations."""

    def __init__(self, db: Session):
        """Initialize service with database session."""
        self.repository = SocialSecurityRepository(db)
        self.db = db

    def get_social_security(self) -> SocialSecurity | None:
        """Get Social Security configuration."""
        ss = self.repository.get()
        if not ss:
            return None
        return SocialSecurity.model_validate(ss)

    def create_social_security(self, ss_data: SocialSecurityCreate) -> SocialSecurity:
        """Create Social Security configuration."""
        # Calculate FRA from birth date
        fra_age = calculate_fra_decimal(ss_data.birth_date)

        # Delete any existing record first (singleton pattern)
        existing = self.repository.get()
        if existing:
            self.db.delete(existing)
            self.db.commit()

        # Create the model with fra_age included
        from app.models.social_security import SocialSecurity as SocialSecurityModel

        ss_dict = ss_data.model_dump()
        ss_dict["fra_age"] = fra_age

        ss = SocialSecurityModel(**ss_dict)
        self.db.add(ss)
        self.db.commit()
        self.db.refresh(ss)
        return SocialSecurity.model_validate(ss)

    def update_social_security(self, ss_data: SocialSecurityUpdate) -> SocialSecurity | None:
        """Update Social Security configuration."""
        ss = self.repository.get()
        if not ss:
            return None

        # Get update data
        update_dict = ss_data.model_dump(exclude_unset=True)

        # If birth_date is being updated, recalculate fra_age
        if "birth_date" in update_dict:
            new_birth_date = update_dict["birth_date"]
            update_dict["fra_age"] = calculate_fra_decimal(new_birth_date)
        # If birth_date is not being updated but we need to ensure fra_age is correct
        elif "birth_date" not in update_dict and ss.birth_date:
            # Recalculate fra_age from current birth_date to ensure it's correct
            update_dict["fra_age"] = calculate_fra_decimal(ss.birth_date)

        # Update the model directly
        for field, value in update_dict.items():
            setattr(ss, field, value)

        self.db.commit()
        self.db.refresh(ss)
        return SocialSecurity.model_validate(ss)

    def delete_social_security(self) -> bool:
        """Delete Social Security configuration."""
        return self.repository.delete()

    def calculate_payment_at_age_months(
        self,
        start_years: int,
        start_months: int,
        fra_years: int,
        fra_months: int,
        fra_amount: Decimal,
    ) -> Decimal:
        """
        Calculate Social Security monthly payment based on start age (years and months).

        Rules (SSA official formulas):
        - Early retirement (before FRA):
          * First 36 months: reduce by 5/9 of 1% per month
          * Beyond 36 months: additional reduction of 5/12 of 1% per month
        - Maximum reduction: ~30% (if starting at 62 when FRA is 67 = 60 months early)
        - Delayed retirement (after FRA): increase by 2/3 of 1% per month (8% per year)
        - Maximum increase: 24% (if starting at 70 when FRA is 67 = 36 months delay)
        """
        # Calculate total months difference
        start_total_months = start_years * 12 + start_months
        fra_total_months = fra_years * 12 + fra_months
        months_diff = start_total_months - fra_total_months

        if months_diff < 0:
            # Early retirement
            months_early = abs(months_diff)

            # SSA formula: (min(36, months_early) × 5/9 + max(0, months_early - 36) × 5/12) × 0.01
            first_36_months = min(36, months_early)
            additional_months = max(0, months_early - 36)

            reduction_percent = (
                Decimal(str(first_36_months)) * Decimal("5") / Decimal("9")
                + Decimal(str(additional_months)) * Decimal("5") / Decimal("12")
            ) * Decimal("0.01")

            # Cap at 30% reduction (though mathematically max is ~30% for 60 months early)
            reduction_percent = min(reduction_percent, Decimal("0.30"))
            return fra_amount * (Decimal("1.0") - reduction_percent)
        elif months_diff > 0:
            # Delayed retirement - increase by 2/3 of 1% per month
            # DRCs are applied to the PIA (Primary Insurance Amount), not current benefit
            months_delayed = months_diff
            # Cap at 36 months delay (24% max increase)
            months_delayed = min(months_delayed, 36)

            # Calculate total DRC amount: PIA × months × (2/3) × 0.01
            # Then round DOWN to nearest $0.10, then add to PIA
            drc_amount = (
                fra_amount
                * Decimal(str(months_delayed))
                * Decimal("2")
                / Decimal("3")
                * Decimal("0.01")
            )
            # Round down to nearest $0.10 (SSA rounding rule)
            drc_amount_rounded = (drc_amount / Decimal("0.1")).quantize(
                Decimal("1"), rounding="ROUND_DOWN"
            ) * Decimal("0.1")

            return fra_amount + drc_amount_rounded
        else:
            # At FRA
            return fra_amount

    def calculate_start_date(self, birth_date: date, start_years: int, start_months: int) -> date:
        """
        Calculate the date when Social Security benefits start at a given age (years and months).
        Uses the actual birth day of the month.
        """
        # Calculate the target date by adding years and months to birth date
        target_year = birth_date.year + start_years
        target_month = birth_date.month + start_months

        # Handle month overflow
        while target_month > 12:
            target_month -= 12
            target_year += 1

        # Use the actual birth day of the month, but handle invalid dates (e.g., Feb 30)
        birth_day = birth_date.day
        try:
            start_date = date(target_year, target_month, birth_day)
        except ValueError:
            # If the day doesn't exist in that month (e.g., Feb 30), use the last day of the month
            # This handles edge cases like being born on Jan 31 and calculating Feb 31
            if target_month == 12:
                last_day = 31
            elif target_month in [4, 6, 9, 11]:
                last_day = 30
            elif target_month == 2:
                # Check for leap year
                if (target_year % 4 == 0 and target_year % 100 != 0) or (target_year % 400 == 0):
                    last_day = 29
                else:
                    last_day = 28
            else:
                last_day = 31
            start_date = date(target_year, target_month, min(birth_day, last_day))

        return start_date

    def get_payment_projections(
        self, birth_date: date, fra_age: Decimal, fra_amount: Decimal
    ) -> list[SocialSecurityPaymentProjection]:
        """
        Get month-by-month Social Security payment projections from age 62 to 70.

        Returns projections for each month from age 62 years 0 months to 70 years 11 months.
        Uses actual birth day of the month for date calculations.
        """
        projections = []

        # Convert FRA from decimal to years and months
        fra_years = int(fra_age)
        fra_months = int((fra_age - Decimal(str(fra_years))) * Decimal("12"))

        # Generate projections for each month from 62 to 70
        for year in range(62, 71):
            for month in range(12):
                start_years = year
                start_months = month

                # Calculate payment amount
                monthly_amount = self.calculate_payment_at_age_months(
                    start_years, start_months, fra_years, fra_months, fra_amount
                )

                # Calculate start date using actual birth day
                start_date = self.calculate_start_date(birth_date, start_years, start_months)
                annual_amount = monthly_amount * Decimal("12")

                # Calculate percentage change vs FRA
                start_total_months = start_years * 12 + start_months
                fra_total_months = fra_years * 12 + fra_months
                months_diff = start_total_months - fra_total_months

                if months_diff < 0:
                    # Early retirement
                    months_early = abs(months_diff)
                    first_36_months = min(36, months_early)
                    additional_months = max(0, months_early - 36)
                    reduction_percent = Decimal(str(first_36_months)) * Decimal("5") / Decimal(
                        "9"
                    ) + Decimal(str(additional_months)) * Decimal("5") / Decimal("12")
                    reduction_percent = min(reduction_percent, Decimal("30"))  # Max 30%
                    increase_percent = None
                elif months_diff > 0:
                    # Delayed retirement
                    months_delayed = min(months_diff, 36)  # Cap at 36 months
                    # Calculate percentage increase for display
                    increase_percent = Decimal(str(months_delayed)) * Decimal("2") / Decimal("3")
                    increase_percent = min(increase_percent, Decimal("24"))  # Max 24%
                    reduction_percent = None
                else:
                    reduction_percent = None
                    increase_percent = None

                projections.append(
                    SocialSecurityPaymentProjection(
                        age_years=start_years,
                        age_months=start_months,
                        start_date=start_date,
                        monthly_amount=monthly_amount,
                        annual_amount=annual_amount,
                        reduction_percent=reduction_percent,
                        increase_percent=increase_percent,
                    )
                )

        return projections
