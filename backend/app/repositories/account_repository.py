"""Account repository for database operations."""

from uuid import UUID

from sqlalchemy.orm import Session

from app.models.account import Account
from app.schemas.account import AccountCreate, AccountUpdate


class AccountRepository:
    """Repository for account database operations."""

    def __init__(self, db: Session):
        """Initialize repository with database session."""
        self.db = db

    def get_all(self) -> list[Account]:
        """Get all accounts."""
        return self.db.query(Account).all()

    def get_by_id(self, account_id: UUID) -> Account | None:
        """Get account by ID."""
        return self.db.query(Account).filter(Account.id == account_id).first()

    def create(self, account_data: AccountCreate) -> Account:
        """Create a new account."""
        account = Account(**account_data.model_dump())
        self.db.add(account)
        self.db.commit()
        self.db.refresh(account)
        return account

    def update(self, account_id: UUID, account_data: AccountUpdate) -> Account | None:
        """Update an existing account."""
        account = self.get_by_id(account_id)
        if not account:
            return None

        update_data = account_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(account, field, value)

        self.db.commit()
        self.db.refresh(account)
        return account

    def delete(self, account_id: UUID) -> bool:
        """Delete an account."""
        account = self.get_by_id(account_id)
        if not account:
            return False

        self.db.delete(account)
        self.db.commit()
        return True
