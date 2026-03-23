"""Social Security database model."""

from datetime import datetime
from uuid import uuid4

from sqlalchemy import Column, Date, DateTime, Integer, Numeric, String
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base


class SocialSecurity(Base):
    """Social Security model representing SS benefit configuration (primary and optional spouse)."""

    __tablename__ = "social_security"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    birth_date = Column(Date, nullable=False)
    fra_monthly_amount = Column(Numeric(10, 2), nullable=False)  # Amount at Full Retirement Age
    fra_age = Column(Numeric(4, 2), nullable=False)  # Full Retirement Age (e.g., 67.0)
    # Spouse (optional)
    spouse_birth_date = Column(Date, nullable=True)
    spouse_fra_monthly_amount = Column(Numeric(10, 2), nullable=True)
    spouse_fra_age = Column(Numeric(4, 2), nullable=True)
    spouse_benefit_source = Column(
        String(20), nullable=True, default="own"
    )  # "own" = use spouse_fra_monthly_amount; "half_of_partner" = use 50% of primary FRA
    # Default scenario SS start ages (used when creating/updating Default Scenario)
    default_ss_start_age_years = Column(
        Integer, nullable=True, comment="Default scenario primary SS start age (years)"
    )
    default_ss_start_age_months = Column(
        Integer, nullable=True, comment="Default scenario primary SS start age (months)"
    )
    default_spouse_ss_start_age_years = Column(
        Integer, nullable=True, comment="Default scenario spouse SS start age (years)"
    )
    default_spouse_ss_start_age_months = Column(
        Integer, nullable=True, comment="Default scenario spouse SS start age (months)"
    )
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<SocialSecurity(id={self.id}, birth_date={self.birth_date}, fra_amount={self.fra_monthly_amount}, fra_age={self.fra_age})>"
