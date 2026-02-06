"""Fixed expense model for tracking non-inflation-adjusted spending."""

from datetime import datetime
from decimal import Decimal
from uuid import uuid4

from sqlalchemy import Column, DateTime, ForeignKey, Numeric, String, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class FixedExpense(Base):
    """Fixed expense that is not subject to inflation (e.g., fixed-rate loans)."""

    __tablename__ = "fixed_expenses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    scenario_id = Column(UUID(as_uuid=True), ForeignKey("saved_scenarios.id", ondelete="CASCADE"), nullable=False)
    
    name = Column(String(255), nullable=False)  # e.g., "Mortgage", "Car Loan"
    monthly_amount = Column(Numeric(12, 2), nullable=False, default=Decimal("0"))
    
    # Duration: projection year when expense starts and ends
    start_year = Column(Integer, nullable=False, default=1)  # Year 1 of projection by default
    end_year = Column(Integer, nullable=True)  # Null means continues forever, otherwise ends after this year
    
    notes = Column(String(500), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship back to scenario
    scenario = relationship("SavedScenario", back_populates="fixed_expenses")

    def __repr__(self):
        return f"<FixedExpense {self.name}: ${self.monthly_amount}/mo, years {self.start_year}-{self.end_year}>"
