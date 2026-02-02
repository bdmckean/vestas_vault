"""Social Security repository for database operations."""

from uuid import UUID

from sqlalchemy.orm import Session

from app.models.social_security import SocialSecurity
from app.schemas.social_security import SocialSecurityCreate, SocialSecurityUpdate


class SocialSecurityRepository:
    """Repository for Social Security database operations."""

    def __init__(self, db: Session):
        """Initialize repository with database session."""
        self.db = db

    def get(self) -> SocialSecurity | None:
        """Get Social Security configuration (singleton - only one record)."""
        return self.db.query(SocialSecurity).first()

    def create(self, ss_data: SocialSecurityCreate) -> SocialSecurity:
        """Create Social Security configuration."""
        # Delete any existing record (singleton pattern)
        existing = self.get()
        if existing:
            self.db.delete(existing)
            self.db.commit()

        ss = SocialSecurity(**ss_data.model_dump())
        self.db.add(ss)
        self.db.commit()
        self.db.refresh(ss)
        return ss

    def update(self, ss_data: SocialSecurityUpdate) -> SocialSecurity | None:
        """Update Social Security configuration."""
        ss = self.get()
        if not ss:
            return None

        update_data = ss_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(ss, field, value)

        self.db.commit()
        self.db.refresh(ss)
        return ss

    def delete(self) -> bool:
        """Delete Social Security configuration."""
        ss = self.get()
        if not ss:
            return False

        self.db.delete(ss)
        self.db.commit()
        return True
