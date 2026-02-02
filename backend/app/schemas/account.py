"""Account Pydantic schemas."""

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


class AccountBase(BaseModel):
    """Base account schema with common fields."""

    name: str = Field(..., min_length=1, max_length=255, description="Account name")
    account_type: str = Field(..., description="Account type: pretax, roth, taxable, or cash")
    balance: Decimal = Field(
        default=Decimal("0.00"),
        ge=0,
        description="Account balance",
        decimal_places=2,
    )

    @field_validator("account_type")
    @classmethod
    def validate_account_type(cls, v: str) -> str:
        """Validate account type."""
        allowed_types = {"pretax", "roth", "taxable", "cash"}
        if v.lower() not in allowed_types:
            raise ValueError(f"account_type must be one of {allowed_types}")
        return v.lower()


class AccountCreate(AccountBase):
    """Schema for creating an account."""

    pass


class AccountUpdate(BaseModel):
    """Schema for updating an account."""

    name: str | None = Field(None, min_length=1, max_length=255)
    account_type: str | None = None
    balance: Decimal | None = Field(None, ge=0, decimal_places=2)

    @field_validator("account_type")
    @classmethod
    def validate_account_type(cls, v: str | None) -> str | None:
        """Validate account type."""
        if v is None:
            return v
        allowed_types = {"pretax", "roth", "taxable", "cash"}
        if v.lower() not in allowed_types:
            raise ValueError(f"account_type must be one of {allowed_types}")
        return v.lower()


class Account(AccountBase):
    """Schema for account response."""

    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
