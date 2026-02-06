"""Repository for holding data access."""

from uuid import UUID

from sqlalchemy.orm import Session

from app.models.holding import Holding
from app.schemas.holding import HoldingCreate, HoldingUpdate


class HoldingRepository:
    """Repository for holding CRUD operations."""

    def __init__(self, db: Session):
        """Initialize repository with database session."""
        self.db = db

    def get_all(self) -> list[Holding]:
        """Get all holdings."""
        return self.db.query(Holding).all()

    def get_by_id(self, holding_id: UUID) -> Holding | None:
        """Get holding by ID."""
        return self.db.query(Holding).filter(Holding.id == holding_id).first()

    def get_by_account(self, account_id: UUID) -> list[Holding]:
        """Get all holdings for a specific account."""
        return self.db.query(Holding).filter(Holding.account_id == account_id).all()

    def create(self, holding_data: HoldingCreate) -> Holding:
        """Create a new holding."""
        holding = Holding(**holding_data.model_dump())
        self.db.add(holding)
        self.db.commit()
        self.db.refresh(holding)
        return holding

    def update(self, holding_id: UUID, holding_data: HoldingUpdate) -> Holding | None:
        """Update an existing holding."""
        holding = self.get_by_id(holding_id)
        if not holding:
            return None

        update_data = holding_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(holding, field, value)

        self.db.commit()
        self.db.refresh(holding)
        return holding

    def delete(self, holding_id: UUID) -> bool:
        """Delete a holding."""
        holding = self.get_by_id(holding_id)
        if not holding:
            return False

        self.db.delete(holding)
        self.db.commit()
        return True

    def delete_by_account(self, account_id: UUID) -> int:
        """Delete all holdings for an account. Returns count deleted."""
        count = self.db.query(Holding).filter(Holding.account_id == account_id).delete()
        self.db.commit()
        return count
