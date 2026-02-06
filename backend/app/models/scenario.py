"""Saved scenario database model."""

import uuid
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Column, Date, DateTime, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class SavedScenario(Base):
    """Model for saved retirement scenarios."""

    __tablename__ = "saved_scenarios"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)

    # Social Security parameters
    ss_start_age_years = Column(
        Integer, nullable=False, default=67, comment="Age (years) to start SS"
    )
    ss_start_age_months = Column(Integer, nullable=False, default=0, comment="Additional months")

    # Spending parameters
    monthly_spending = Column(
        Numeric(12, 2), nullable=False, default=Decimal("10000"), comment="Monthly spending"
    )
    annual_lump_spending = Column(
        Numeric(12, 2), nullable=False, default=Decimal("0"), comment="Annual lump sum spending"
    )
    inflation_adjusted_percent = Column(
        Numeric(5, 2),
        nullable=False,
        default=Decimal("50"),
        comment="% of spending subject to inflation (rest is fixed like loans)",
    )
    spending_reduction_percent = Column(
        Numeric(5, 2),
        nullable=False,
        default=Decimal("0"),
        comment="% to reduce spending after year X",
    )
    spending_reduction_start_year = Column(
        Integer, nullable=True, comment="Year to start spending reduction"
    )

    # Time parameters
    projection_years = Column(Integer, nullable=False, default=30, comment="Years to project")

    # Asset allocation (stored as JSON)
    asset_allocation = Column(JSONB, nullable=False, default=dict)

    # Return assumptions
    return_source = Column(String(50), nullable=False, default="10_year_projections")
    custom_return_percent = Column(
        Numeric(5, 2), nullable=True, comment="Custom annual return if specified"
    )

    # Inflation
    inflation_rate = Column(
        Numeric(5, 2), nullable=False, default=Decimal("2.5"), comment="Annual inflation rate"
    )

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    fixed_expenses = relationship("FixedExpense", back_populates="scenario", cascade="all, delete-orphan")
