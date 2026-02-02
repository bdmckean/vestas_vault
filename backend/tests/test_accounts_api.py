"""Tests for account API endpoints."""

from decimal import Decimal
from uuid import uuid4

import pytest
from fastapi import status


def test_create_account(client):
    """Test creating an account."""
    response = client.post(
        "/api/v1/accounts",
        json={
            "name": "401(k) Account",
            "account_type": "pretax",
            "balance": "100000.00",
        },
    )
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["name"] == "401(k) Account"
    assert data["account_type"] == "pretax"
    assert data["balance"] == "100000.00"
    assert "id" in data


def test_create_account_invalid_type(client):
    """Test creating an account with invalid type."""
    response = client.post(
        "/api/v1/accounts",
        json={
            "name": "Test Account",
            "account_type": "invalid",
            "balance": "1000.00",
        },
    )
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


def test_get_all_accounts(client):
    """Test getting all accounts."""
    # Create test accounts
    client.post(
        "/api/v1/accounts",
        json={"name": "Account 1", "account_type": "pretax", "balance": "10000.00"},
    )
    client.post(
        "/api/v1/accounts",
        json={"name": "Account 2", "account_type": "roth", "balance": "5000.00"},
    )

    response = client.get("/api/v1/accounts")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data) == 2


def test_get_account_by_id(client):
    """Test getting account by ID."""
    # Create account
    create_response = client.post(
        "/api/v1/accounts",
        json={"name": "Test Account", "account_type": "pretax", "balance": "10000.00"},
    )
    account_id = create_response.json()["id"]

    # Get account
    response = client.get(f"/api/v1/accounts/{account_id}")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["id"] == account_id
    assert data["name"] == "Test Account"


def test_get_account_not_found(client):
    """Test getting non-existent account."""
    fake_id = str(uuid4())
    response = client.get(f"/api/v1/accounts/{fake_id}")
    assert response.status_code == status.HTTP_404_NOT_FOUND


def test_update_account(client):
    """Test updating an account."""
    # Create account
    create_response = client.post(
        "/api/v1/accounts",
        json={"name": "Old Name", "account_type": "pretax", "balance": "10000.00"},
    )
    account_id = create_response.json()["id"]

    # Update account
    response = client.put(
        f"/api/v1/accounts/{account_id}",
        json={"name": "New Name", "balance": "15000.00"},
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["name"] == "New Name"
    assert data["balance"] == "15000.00"


def test_delete_account(client):
    """Test deleting an account."""
    # Create account
    create_response = client.post(
        "/api/v1/accounts",
        json={"name": "To Delete", "account_type": "pretax", "balance": "10000.00"},
    )
    account_id = create_response.json()["id"]

    # Delete account
    response = client.delete(f"/api/v1/accounts/{account_id}")
    assert response.status_code == status.HTTP_204_NO_CONTENT

    # Verify deleted
    get_response = client.get(f"/api/v1/accounts/{account_id}")
    assert get_response.status_code == status.HTTP_404_NOT_FOUND
