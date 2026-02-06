"""Portfolio holding database model."""

import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class Holding(Base):
    """Model for investment holdings within an account."""

    __tablename__ = "holdings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    account_id = Column(
        UUID(as_uuid=True),
        ForeignKey("accounts.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    asset_class = Column(
        String(50),
        nullable=False,
        comment="Asset class: total_us_stock, total_foreign_stock, us_small_cap_value, bonds, short_term_treasuries, cash, etc.",
    )
    ticker = Column(
        String(20),
        nullable=True,
        comment="Optional ticker symbol: VTSAX, VXUS, BND, etc.",
    )
    name = Column(
        String(255),
        nullable=True,
        comment="Optional fund name: Vanguard Total Stock Market Index",
    )
    amount = Column(
        Numeric(15, 2),
        nullable=False,
        comment="Dollar amount invested",
    )
    notes = Column(Text, nullable=True, comment="Additional notes")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationship back to account
    account = relationship("Account", back_populates="holdings")
