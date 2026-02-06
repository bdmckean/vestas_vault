"""Planned fixed expense database model."""

from datetime import datetime
from uuid import uuid4

from sqlalchemy import Column, DateTime, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from app.database import Base


class PlannedFixedExpense(Base):
    """Model for fixed expenses (not subject to inflation) in planned spending.

    These represent fixed-rate expenses like loans that have a set monthly amount
    and an end date. When the expense ends, total spending will decrease.
    """

    __tablename__ = "planned_fixed_expenses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4, index=True)
    name = Column(String(255), nullable=False, comment="Name/description of the fixed expense")
    monthly_amount = Column(
        Numeric(12, 2), nullable=False, comment="Monthly amount of the fixed expense"
    )
    start_year = Column(
        Integer, nullable=False, default=2024, comment="Year when the expense starts"
    )
    end_year = Column(Integer, nullable=False, comment="Year when the expense ends")
    notes = Column(Text, nullable=True, comment="Additional notes about this expense")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )
