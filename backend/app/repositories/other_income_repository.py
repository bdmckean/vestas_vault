"""Repository for other income data access."""

from uuid import UUID

from sqlalchemy.orm import Session

from app.models.other_income import OtherIncome
from app.schemas.other_income import OtherIncomeCreate, OtherIncomeUpdate


class OtherIncomeRepository:
    """Repository for other income CRUD operations."""

    def __init__(self, db: Session):
        """Initialize repository with database session."""
        self.db = db

    def get_all(self) -> list[OtherIncome]:
        """Get all other income sources."""
        return (
            self.db.query(OtherIncome)
            .order_by(OtherIncome.start_year, OtherIncome.start_month)
            .all()
        )

    def get_by_id(self, income_id: UUID) -> OtherIncome | None:
        """Get other income by ID."""
        return self.db.query(OtherIncome).filter(OtherIncome.id == income_id).first()

    def create(self, income_data: OtherIncomeCreate) -> OtherIncome:
        """Create a new other income source."""
        income = OtherIncome(**income_data.model_dump())
        self.db.add(income)
        self.db.commit()
        self.db.refresh(income)
        return income

    def update(self, income_id: UUID, income_data: OtherIncomeUpdate) -> OtherIncome | None:
        """Update an existing other income source."""
        income = self.get_by_id(income_id)
        if not income:
            return None

        update_data = income_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(income, field, value)

        self.db.commit()
        self.db.refresh(income)
        return income

    def delete(self, income_id: UUID) -> bool:
        """Delete an other income source."""
        income = self.get_by_id(income_id)
        if not income:
            return False

        self.db.delete(income)
        self.db.commit()
        return True
