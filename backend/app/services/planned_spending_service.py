"""Service for planned spending business logic."""

from decimal import Decimal

from sqlalchemy.orm import Session

from app.models.planned_spending import PlannedSpending
from app.repositories.planned_spending_repository import PlannedSpendingRepository
from app.schemas.planned_spending import PlannedSpendingCreate, PlannedSpendingUpdate


class PlannedSpendingService:
    """Service for planned spending operations."""

    def __init__(self, db: Session):
        """Initialize service with database session."""
        self.db = db
        self.repository = PlannedSpendingRepository(db)

    def get_planned_spending(self):
        """Get the planned spending configuration."""
        return self.repository.get()

    def create_planned_spending(self, planned_spending_data: PlannedSpendingCreate):
        """Create a new planned spending configuration."""
        # Check if one already exists
        existing = self.repository.get()
        if existing:
            raise ValueError("Planned spending already exists. Use update instead.")

        planned_spending = PlannedSpending(
            monthly_spending=planned_spending_data.monthly_spending,
            annual_lump_sum=planned_spending_data.annual_lump_sum,
        )
        return self.repository.create(planned_spending)

    def update_planned_spending(self, planned_spending_data: PlannedSpendingUpdate):
        """Update existing planned spending configuration."""
        existing = self.repository.get()
        if not existing:
            raise ValueError("Planned spending not found. Use create instead.")

        return self.repository.update(
            existing,
            planned_spending_data.monthly_spending,
            planned_spending_data.annual_lump_sum,
        )

    def delete_planned_spending(self):
        """Delete planned spending configuration."""
        existing = self.repository.get()
        if not existing:
            raise ValueError("Planned spending not found.")

        self.repository.delete(existing)

    def get_total_annual_spending(self) -> Decimal:
        """Calculate total annual spending (monthly * 12 + annual lump sum)."""
        planned_spending = self.repository.get()
        if not planned_spending:
            return Decimal("0")

        monthly_total = planned_spending.monthly_spending * Decimal("12")
        return monthly_total + planned_spending.annual_lump_sum
