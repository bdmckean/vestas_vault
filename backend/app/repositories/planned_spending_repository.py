"""Repository for planned spending data access."""

from sqlalchemy.orm import Session

from app.models.planned_spending import PlannedSpending


class PlannedSpendingRepository:
    """Repository for planned spending CRUD operations."""

    def __init__(self, db: Session):
        """Initialize repository with database session."""
        self.db = db

    def get(self) -> PlannedSpending | None:
        """Get the planned spending configuration (singleton)."""
        return self.db.query(PlannedSpending).first()

    def create(self, planned_spending: PlannedSpending) -> PlannedSpending:
        """Create a new planned spending configuration."""
        self.db.add(planned_spending)
        self.db.commit()
        self.db.refresh(planned_spending)
        return planned_spending

    def update(
        self, planned_spending: PlannedSpending, monthly_spending, annual_lump_sum
    ) -> PlannedSpending:
        """Update existing planned spending configuration."""
        planned_spending.monthly_spending = monthly_spending
        planned_spending.annual_lump_sum = annual_lump_sum
        self.db.commit()
        self.db.refresh(planned_spending)
        return planned_spending

    def delete(self, planned_spending: PlannedSpending) -> None:
        """Delete planned spending configuration."""
        self.db.delete(planned_spending)
        self.db.commit()
