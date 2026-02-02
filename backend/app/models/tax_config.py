"""Tax configuration database model."""

from datetime import datetime

from sqlalchemy import Column, DateTime, Numeric, Integer, String
from sqlalchemy.sql import func

from app.database import Base


class TaxConfig(Base):
    """Model for tax configuration."""

    __tablename__ = "tax_config"

    id = Column(Integer, primary_key=True, index=True)
    filing_status = Column(
        String(50), nullable=False, comment="Filing status: single, married_filing_jointly, etc."
    )
    total_deductions = Column(
        Numeric(12, 2),
        nullable=False,
        default=0,
        comment="Total deductions (standard + itemized + senior)",
    )
    # Age information for senior deductions
    primary_age = Column(
        Integer, nullable=True, comment="Age of primary filer (for senior deductions)"
    )
    spouse_age = Column(
        Integer, nullable=True, comment="Age of spouse (for married filing jointly)"
    )
    annual_income = Column(
        Numeric(12, 2),
        nullable=True,
        comment="Annual income (for bonus senior deduction eligibility)",
    )
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )
