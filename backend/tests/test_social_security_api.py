"""Tests for Social Security API endpoints."""

from fastapi import status


def test_get_social_security_empty(client):
    """GET when no config returns 200 with null."""
    response = client.get("/api/v1/social-security")
    assert response.status_code == status.HTTP_200_OK
    assert response.json() is None


def test_create_social_security(client):
    """POST creates SS config and returns it."""
    response = client.post(
        "/api/v1/social-security",
        json={
            "birth_date": "1960-03-04",
            "fra_monthly_amount": "4000.00",
        },
    )
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert "id" in data
    assert data["birth_date"] == "1960-03-04"
    assert data["fra_monthly_amount"] == "4000.00"
    assert float(data["fra_age"]) == 67.0


def test_get_after_create(client):
    """GET after create returns the config."""
    client.post(
        "/api/v1/social-security",
        json={"birth_date": "1960-03-04", "fra_monthly_amount": "4000.00"},
    )
    response = client.get("/api/v1/social-security")
    assert response.status_code == status.HTTP_200_OK
    assert response.json() is not None
    assert response.json()["fra_monthly_amount"] == "4000.00"


def test_update_social_security(client):
    """PUT updates config."""
    client.post(
        "/api/v1/social-security",
        json={"birth_date": "1960-03-04", "fra_monthly_amount": "4000.00"},
    )
    response = client.put(
        "/api/v1/social-security",
        json={"fra_monthly_amount": "4200.00"},
    )
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["fra_monthly_amount"] == "4200.00"


def test_update_not_found(client):
    """PUT when no config returns 404."""
    response = client.put(
        "/api/v1/social-security",
        json={"fra_monthly_amount": "4000.00"},
    )
    assert response.status_code == status.HTTP_404_NOT_FOUND


def test_get_projections_requires_config(client):
    """GET /projections when no SS config returns 404."""
    response = client.get("/api/v1/social-security/projections")
    assert response.status_code == status.HTTP_404_NOT_FOUND


def test_get_projections_after_create(client):
    """GET /projections returns primary and optional spouse payment projections."""
    client.post(
        "/api/v1/social-security",
        json={"birth_date": "1960-03-04", "fra_monthly_amount": "4000.00"},
    )
    response = client.get("/api/v1/social-security/projections")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "primary_projections" in data
    assert isinstance(data["primary_projections"], list)
    assert len(data["primary_projections"]) > 0
    first = data["primary_projections"][0]
    assert "age_years" in first
    assert "monthly_amount" in first
    assert "annual_amount" in first
    assert data.get("spouse_projections") is None  # no spouse configured
