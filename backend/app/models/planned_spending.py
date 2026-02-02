"""Planned spending database model."""

from datetime import datetime

from sqlalchemy import Column, DateTime, Numeric, Integer
from sqlalchemy.sql import func

from app.database import Base


class PlannedSpending(Base):
    """Model for planned spending configuration."""

    __tablename__ = "planned_spending"

    id = Column(Integer, primary_key=True, index=True)
    monthly_spending = Column(
        Numeric(12, 2), nullable=False, default=0, comment="Desired monthly spending amount"
    )
    annual_lump_sum = Column(
        Numeric(12, 2), nullable=False, default=0, comment="Annual lump sum spending amount"
    )
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )
