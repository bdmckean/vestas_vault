"""Service for tax configuration business logic."""

from decimal import Decimal

from sqlalchemy.orm import Session

from app.models.tax_config import TaxConfig
from app.repositories.tax_config_repository import TaxConfigRepository
from app.schemas.tax_config import SeniorDeductionBreakdown, TaxConfigCreate, TaxConfigUpdate


class TaxConfigService:
    """Service for tax configuration operations."""

    def __init__(self, db: Session):
        """Initialize service with database session."""
        self.db = db
        self.repository = TaxConfigRepository(db)

    def get_tax_config(self):
        """Get the tax configuration."""
        return self.repository.get()

    def create_tax_config(self, tax_config_data: TaxConfigCreate):
        """Create a new tax configuration."""
        # Check if one already exists
        existing = self.repository.get()
        if existing:
            raise ValueError("Tax configuration already exists. Use update instead.")

        tax_config = TaxConfig(
            filing_status=tax_config_data.filing_status,
            total_deductions=tax_config_data.total_deductions,
            primary_age=tax_config_data.primary_age,
            spouse_age=tax_config_data.spouse_age,
            annual_income=tax_config_data.annual_income,
        )
        return self.repository.create(tax_config)

    def update_tax_config(self, tax_config_data: TaxConfigUpdate):
        """Update existing tax configuration."""
        existing = self.repository.get()
        if not existing:
            raise ValueError("Tax configuration not found. Use create instead.")

        return self.repository.update(
            existing,
            tax_config_data.filing_status,
            tax_config_data.total_deductions,
            tax_config_data.primary_age,
            tax_config_data.spouse_age,
            tax_config_data.annual_income,
        )

    def delete_tax_config(self):
        """Delete tax configuration."""
        existing = self.repository.get()
        if not existing:
            raise ValueError("Tax configuration not found.")

        self.repository.delete(existing)

    def calculate_senior_deductions(
        self,
        filing_status: str,
        primary_age: int | None,
        spouse_age: int | None,
        annual_income: Decimal | None,
        tax_year: int = 2026,
    ) -> SeniorDeductionBreakdown:
        """
        Calculate senior deductions based on age and income.

        For 2026:
        - Base Standard Deduction: Varies by filing status
        - Additional Senior Deduction: $1,650 per person 65+
        - Bonus Senior Deduction: $6,000 per person 65+ if income under $150k
        """
        import json
        from pathlib import Path

        # Load standard deductions
        # Files are mounted at /app/data/ in Docker container
        federal_file = Path("/app/data/us_federal_tax_tables.json")

        # Fallback for local development
        if not federal_file.exists():
            BASE_DIR = Path(__file__).parent.parent.parent.parent.parent
            federal_file = BASE_DIR / "data" / "us_federal_tax_tables.json"

        with open(federal_file, "r") as f:
            tax_data = json.load(f)

        # Get base standard deduction for the filing status
        standard_deductions = tax_data.get("standard_deductions", {})
        if str(tax_year) not in standard_deductions:
            # Fall back to 2025 if 2026 not available
            tax_year = 2025

        base_standard = Decimal(
            str(standard_deductions.get(str(tax_year), {}).get(filing_status, 0))
        )

        # Calculate additional senior deduction ($1,650 per person 65+)
        additional_senior = Decimal("0")
        if primary_age and primary_age >= 65:
            additional_senior += Decimal("1650")
        if (
            filing_status in ["married_filing_jointly", "qualifying_widow"]
            and spouse_age
            and spouse_age >= 65
        ):
            additional_senior += Decimal("1650")

        # Calculate bonus senior deduction ($6,000 per person 65+ if income < $150k)
        bonus_senior = Decimal("0")
        income_threshold = Decimal("150000")
        if annual_income and annual_income < income_threshold:
            if primary_age and primary_age >= 65:
                bonus_senior += Decimal("6000")
            if (
                filing_status in ["married_filing_jointly", "qualifying_widow"]
                and spouse_age
                and spouse_age >= 65
            ):
                bonus_senior += Decimal("6000")

        total_automatic = base_standard + additional_senior + bonus_senior

        # Build explanation
        explanation_parts = []
        explanation_parts.append(f"Base Standard Deduction: ${base_standard:,.0f}")
        if additional_senior > 0:
            explanation_parts.append(
                f"Additional Senior Deduction: ${additional_senior:,.0f} ($1,650 per person 65+)"
            )
        if bonus_senior > 0:
            explanation_parts.append(
                f"Bonus Senior Deduction: ${bonus_senior:,.0f} ($6,000 per person 65+ with income < $150k)"
            )
        explanation = " + ".join(explanation_parts)

        return SeniorDeductionBreakdown(
            base_standard_deduction=base_standard,
            additional_senior_deduction=additional_senior,
            bonus_senior_deduction=bonus_senior,
            total_automatic_deduction=total_automatic,
            explanation=explanation,
        )
