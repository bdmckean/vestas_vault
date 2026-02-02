"""Social Security API endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.social_security import (
    SocialSecurity,
    SocialSecurityCreate,
    SocialSecurityPaymentProjection,
    SocialSecurityUpdate,
)
from app.services.social_security_service import SocialSecurityService

router = APIRouter(prefix="/social-security", tags=["social-security"])


@router.get("", response_model=SocialSecurity | None)
def get_social_security(db: Session = Depends(get_db)):
    """Get Social Security configuration."""
    service = SocialSecurityService(db)
    return service.get_social_security()


@router.post("", response_model=SocialSecurity, status_code=status.HTTP_201_CREATED)
def create_social_security(ss_data: SocialSecurityCreate, db: Session = Depends(get_db)):
    """Create or update Social Security configuration."""
    service = SocialSecurityService(db)
    return service.create_social_security(ss_data)


@router.put("", response_model=SocialSecurity)
def update_social_security(ss_data: SocialSecurityUpdate, db: Session = Depends(get_db)):
    """Update Social Security configuration."""
    service = SocialSecurityService(db)
    ss = service.update_social_security(ss_data)
    if not ss:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Social Security configuration not found. Create it first.",
        )
    return ss


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
def delete_social_security(db: Session = Depends(get_db)):
    """Delete Social Security configuration."""
    service = SocialSecurityService(db)
    success = service.delete_social_security()
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Social Security configuration not found",
        )
    return None


@router.get("/projections", response_model=list[SocialSecurityPaymentProjection])
def get_payment_projections(db: Session = Depends(get_db)):
    """Get Social Security payment projections from age 62 to 70."""
    service = SocialSecurityService(db)
    ss = service.get_social_security()

    if not ss:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Social Security configuration not found. Please configure it first.",
        )

    return service.get_payment_projections(ss.birth_date, ss.fra_age, ss.fra_monthly_amount)
