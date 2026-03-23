"""Tests for Social Security service."""

from datetime import date
from decimal import Decimal


from app.schemas.social_security import SocialSecurityCreate, SocialSecurityUpdate
from app.services.social_security_service import SocialSecurityService


def test_get_social_security_empty(db_session):
    """When no SS config exists, get_social_security returns None."""
    service = SocialSecurityService(db_session)
    result = service.get_social_security()
    assert result is None


def test_create_social_security(db_session):
    """Create SS config and retrieve it."""
    service = SocialSecurityService(db_session)
    data = SocialSecurityCreate(
        birth_date=date(1960, 3, 4),
        fra_monthly_amount=Decimal("4000.00"),
    )
    created = service.create_social_security(data)
    assert created.id is not None
    assert created.birth_date == date(1960, 3, 4)
    assert created.fra_monthly_amount == Decimal("4000.00")
    assert created.fra_age == Decimal("67")

    got = service.get_social_security()
    assert got is not None
    assert got.id == created.id
    assert got.fra_age == Decimal("67")


def test_create_replaces_existing(db_session):
    """Creating SS config replaces any existing (singleton)."""
    service = SocialSecurityService(db_session)
    data1 = SocialSecurityCreate(
        birth_date=date(1960, 1, 1),
        fra_monthly_amount=Decimal("3000.00"),
    )
    first = service.create_social_security(data1)
    data2 = SocialSecurityCreate(
        birth_date=date(1955, 6, 15),
        fra_monthly_amount=Decimal("3500.00"),
    )
    second = service.create_social_security(data2)
    assert second.id != first.id
    got = service.get_social_security()
    assert got.birth_date == date(1955, 6, 15)
    assert got.fra_monthly_amount == Decimal("3500.00")


def test_update_social_security(db_session):
    """Update existing SS config."""
    service = SocialSecurityService(db_session)
    data = SocialSecurityCreate(
        birth_date=date(1960, 3, 4),
        fra_monthly_amount=Decimal("4000.00"),
    )
    service.create_social_security(data)
    update_data = SocialSecurityUpdate(fra_monthly_amount=Decimal("4200.00"))
    updated = service.update_social_security(update_data)
    assert updated is not None
    assert updated.fra_monthly_amount == Decimal("4200.00")


def test_update_returns_none_when_empty(db_session):
    """Update when no config exists returns None."""
    service = SocialSecurityService(db_session)
    update_data = SocialSecurityUpdate(fra_monthly_amount=Decimal("4000.00"))
    result = service.update_social_security(update_data)
    assert result is None


def test_delete_social_security(db_session):
    """Delete removes config; get then returns None."""
    service = SocialSecurityService(db_session)
    data = SocialSecurityCreate(
        birth_date=date(1960, 3, 4),
        fra_monthly_amount=Decimal("4000.00"),
    )
    service.create_social_security(data)
    success = service.delete_social_security()
    assert success is True
    assert service.get_social_security() is None


def test_delete_returns_false_when_empty(db_session):
    """Delete when no config returns False."""
    service = SocialSecurityService(db_session)
    assert service.delete_social_security() is False
