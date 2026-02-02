"""Repository for tax configuration data access."""

from decimal import Decimal

from sqlalchemy.orm import Session

from app.models.tax_config import TaxConfig


class TaxConfigRepository:
    """Repository for tax configuration CRUD operations."""

    def __init__(self, db: Session):
        """Initialize repository with database session."""
        self.db = db

    def get(self) -> TaxConfig | None:
        """Get the tax configuration (singleton)."""
        return self.db.query(TaxConfig).first()

    def create(self, tax_config: TaxConfig) -> TaxConfig:
        """Create a new tax configuration."""
        self.db.add(tax_config)
        self.db.commit()
        self.db.refresh(tax_config)
        return tax_config

    def update(
        self,
        tax_config: TaxConfig,
        filing_status: str,
        total_deductions,
        primary_age: int | None = None,
        spouse_age: int | None = None,
        annual_income: Decimal | None = None,
    ) -> TaxConfig:
        """Update existing tax configuration."""
        tax_config.filing_status = filing_status
        tax_config.total_deductions = total_deductions
        tax_config.primary_age = primary_age
        tax_config.spouse_age = spouse_age
        tax_config.annual_income = annual_income
        self.db.commit()
        self.db.refresh(tax_config)
        return tax_config

    def delete(self, tax_config: TaxConfig) -> None:
        """Delete tax configuration."""
        self.db.delete(tax_config)
        self.db.commit()
