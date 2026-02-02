"""Account API endpoints."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.account import Account, AccountCreate, AccountUpdate
from app.services.account_service import AccountService

router = APIRouter(prefix="/accounts", tags=["accounts"])


@router.get("", response_model=list[Account])
def list_accounts(db: Session = Depends(get_db)):
    """Get all accounts."""
    service = AccountService(db)
    return service.get_all_accounts()


@router.get("/{account_id}", response_model=Account)
def get_account(account_id: UUID, db: Session = Depends(get_db)):
    """Get account by ID."""
    service = AccountService(db)
    account = service.get_account_by_id(account_id)
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Account with id {account_id} not found",
        )
    return account


@router.post("", response_model=Account, status_code=status.HTTP_201_CREATED)
def create_account(account_data: AccountCreate, db: Session = Depends(get_db)):
    """Create a new account."""
    service = AccountService(db)
    return service.create_account(account_data)


@router.put("/{account_id}", response_model=Account)
def update_account(
    account_id: UUID,
    account_data: AccountUpdate,
    db: Session = Depends(get_db),
):
    """Update an existing account."""
    service = AccountService(db)
    account = service.update_account(account_id, account_data)
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Account with id {account_id} not found",
        )
    return account


@router.delete("/{account_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_account(account_id: UUID, db: Session = Depends(get_db)):
    """Delete an account."""
    service = AccountService(db)
    success = service.delete_account(account_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Account with id {account_id} not found",
        )
    return None
