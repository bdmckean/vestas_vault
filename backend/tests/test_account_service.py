"""Tests for account service layer."""

from decimal import Decimal
from uuid import uuid4

import pytest

from app.schemas.account import AccountCreate, AccountUpdate
from app.services.account_service import AccountService


def test_get_all_accounts(db_session):
    """Test getting all accounts."""
    service = AccountService(db_session)
    accounts = service.get_all_accounts()
    assert isinstance(accounts, list)


def test_create_account(db_session):
    """Test creating an account."""
    service = AccountService(db_session)
    account_data = AccountCreate(
        name="Test Account",
        account_type="pretax",
        balance=Decimal("10000.00"),
    )
    account = service.create_account(account_data)
    assert account.name == "Test Account"
    assert account.account_type == "pretax"
    assert account.balance == Decimal("10000.00")
    assert account.id is not None


def test_get_account_by_id(db_session):
    """Test getting account by ID."""
    service = AccountService(db_session)
    account_data = AccountCreate(
        name="Test Account",
        account_type="roth",
        balance=Decimal("5000.00"),
    )
    created = service.create_account(account_data)

    retrieved = service.get_account_by_id(created.id)
    assert retrieved is not None
    assert retrieved.id == created.id
    assert retrieved.name == "Test Account"


def test_get_account_by_id_not_found(db_session):
    """Test getting non-existent account."""
    service = AccountService(db_session)
    fake_id = uuid4()
    account = service.get_account_by_id(fake_id)
    assert account is None


def test_update_account(db_session):
    """Test updating an account."""
    service = AccountService(db_session)
    account_data = AccountCreate(
        name="Original Name",
        account_type="pretax",
        balance=Decimal("10000.00"),
    )
    created = service.create_account(account_data)

    update_data = AccountUpdate(name="Updated Name", balance=Decimal("15000.00"))
    updated = service.update_account(created.id, update_data)

    assert updated is not None
    assert updated.name == "Updated Name"
    assert updated.balance == Decimal("15000.00")
    assert updated.account_type == "pretax"  # Unchanged


def test_delete_account(db_session):
    """Test deleting an account."""
    service = AccountService(db_session)
    account_data = AccountCreate(
        name="To Delete",
        account_type="pretax",
        balance=Decimal("10000.00"),
    )
    created = service.create_account(account_data)

    success = service.delete_account(created.id)
    assert success is True

    # Verify deleted
    retrieved = service.get_account_by_id(created.id)
    assert retrieved is None
