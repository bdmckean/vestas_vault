"""Other income sources database model."""

import uuid
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from app.database import Base


class OtherIncome(Base):
    """Model for other income sources (pensions, rental, etc.)."""

    __tablename__ = "other_income"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    name = Column(String(255), nullable=False, comment="Name/description of income source")
    income_type = Column(
        String(50),
        nullable=False,
        comment="Type: pension, employment, rental, annuity, dividend, other",
    )
    monthly_amount = Column(Numeric(12, 2), nullable=False, comment="Monthly income amount")
    start_month = Column(Integer, nullable=False, comment="Start month (1-12)")
    start_year = Column(Integer, nullable=False, comment="Start year (e.g., 2025)")
    end_month = Column(Integer, nullable=True, comment="End month (null = ongoing)")
    end_year = Column(Integer, nullable=True, comment="End year (null = ongoing)")
    cola_rate = Column(
        Numeric(5, 3),
        nullable=False,
        default=0,
        comment="Annual COLA rate (e.g., 0.02 for 2%)",
    )
    is_taxable = Column(Boolean, nullable=False, default=True, comment="Is income taxable")
    notes = Column(Text, nullable=True, comment="Additional notes")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )
