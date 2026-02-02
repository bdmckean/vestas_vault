"""Account service for business logic."""

from uuid import UUID

from sqlalchemy.orm import Session

from app.repositories.account_repository import AccountRepository
from app.schemas.account import Account, AccountCreate, AccountUpdate


class AccountService:
    """Service for account business logic."""

    def __init__(self, db: Session):
        """Initialize service with database session."""
        self.repository = AccountRepository(db)

    def get_all_accounts(self) -> list[Account]:
        """Get all accounts."""
        accounts = self.repository.get_all()
        return [Account.model_validate(account) for account in accounts]

    def get_account_by_id(self, account_id: UUID) -> Account | None:
        """Get account by ID."""
        account = self.repository.get_by_id(account_id)
        if not account:
            return None
        return Account.model_validate(account)

    def create_account(self, account_data: AccountCreate) -> Account:
        """Create a new account."""
        account = self.repository.create(account_data)
        return Account.model_validate(account)

    def update_account(self, account_id: UUID, account_data: AccountUpdate) -> Account | None:
        """Update an existing account."""
        account = self.repository.update(account_id, account_data)
        if not account:
            return None
        return Account.model_validate(account)

    def delete_account(self, account_id: UUID) -> bool:
        """Delete an account."""
        return self.repository.delete(account_id)
