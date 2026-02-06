"""Account database model."""

from datetime import datetime
from decimal import Decimal
from uuid import uuid4

from sqlalchemy import Column, DateTime, Numeric, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class Account(Base):
    """Account model representing a retirement account."""

    __tablename__ = "accounts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    name = Column(String(255), nullable=False)
    account_type = Column(String(50), nullable=False)  # pretax, roth, taxable, cash
    balance = Column(Numeric(15, 2), nullable=False, default=Decimal("0.00"))
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationship to holdings
    holdings = relationship("Holding", back_populates="account", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Account(id={self.id}, name={self.name}, type={self.account_type}, balance={self.balance})>"
