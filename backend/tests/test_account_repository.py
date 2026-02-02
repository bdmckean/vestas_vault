"""Tests for account repository layer."""

from decimal import Decimal

import pytest

from app.models.account import Account
from app.repositories.account_repository import AccountRepository
from app.schemas.account import AccountCreate, AccountUpdate


def test_repository_get_all(db_session):
    """Test repository get_all method."""
    repo = AccountRepository(db_session)
    accounts = repo.get_all()
    assert isinstance(accounts, list)


def test_repository_create(db_session):
    """Test repository create method."""
    repo = AccountRepository(db_session)
    account_data = AccountCreate(
        name="Repository Test",
        account_type="pretax",
        balance=Decimal("10000.00"),
    )
    account = repo.create(account_data)
    assert account.id is not None
    assert account.name == "Repository Test"
    assert isinstance(account, Account)


def test_repository_get_by_id(db_session):
    """Test repository get_by_id method."""
    repo = AccountRepository(db_session)
    account_data = AccountCreate(
        name="Test Account",
        account_type="roth",
        balance=Decimal("5000.00"),
    )
    created = repo.create(account_data)

    retrieved = repo.get_by_id(created.id)
    assert retrieved is not None
    assert retrieved.id == created.id


def test_repository_update(db_session):
    """Test repository update method."""
    repo = AccountRepository(db_session)
    account_data = AccountCreate(
        name="Original",
        account_type="pretax",
        balance=Decimal("10000.00"),
    )
    created = repo.create(account_data)

    update_data = AccountUpdate(name="Updated")
    updated = repo.update(created.id, update_data)

    assert updated is not None
    assert updated.name == "Updated"
    assert updated.balance == Decimal("10000.00")  # Unchanged


def test_repository_delete(db_session):
    """Test repository delete method."""
    repo = AccountRepository(db_session)
    account_data = AccountCreate(
        name="To Delete",
        account_type="pretax",
        balance=Decimal("10000.00"),
    )
    created = repo.create(account_data)

    success = repo.delete(created.id)
    assert success is True

    # Verify deleted
    retrieved = repo.get_by_id(created.id)
    assert retrieved is None
