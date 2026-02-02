"""Social Security database model."""

from datetime import datetime
from decimal import Decimal
from uuid import uuid4

from sqlalchemy import Column, Date, DateTime, Numeric, String
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base


class SocialSecurity(Base):
    """Social Security model representing SS benefit configuration."""

    __tablename__ = "social_security"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    birth_date = Column(Date, nullable=False)
    fra_monthly_amount = Column(Numeric(10, 2), nullable=False)  # Amount at Full Retirement Age
    fra_age = Column(Numeric(4, 2), nullable=False)  # Full Retirement Age (e.g., 67.0)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<SocialSecurity(id={self.id}, birth_date={self.birth_date}, fra_amount={self.fra_monthly_amount}, fra_age={self.fra_age})>"
