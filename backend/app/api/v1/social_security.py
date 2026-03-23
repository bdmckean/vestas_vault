"""Social Security API endpoints."""

import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.social_security import (
    SocialSecurity,
    SocialSecurityCreate,
    SocialSecurityProjectionsResponse,
    SocialSecurityUpdate,
)
from app.services.social_security_service import SocialSecurityService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/social-security", tags=["social-security"])


@router.get("/db-check")
def social_security_db_check(db: Session = Depends(get_db)):
    """
    Diagnostic: check if social_security table exists and which columns it has.
    Returns 200 with JSON; use to verify migration or debug 500s.
    """
    try:
        r = db.execute(
            text(
                "SELECT column_name FROM information_schema.columns WHERE table_name = 'social_security' ORDER BY ordinal_position"
            )
        )
        columns = [row[0] for row in r.fetchall()]
        required = {"id", "birth_date", "fra_monthly_amount", "fra_age", "created_at", "updated_at"}
        optional = {
            "spouse_birth_date",
            "spouse_fra_monthly_amount",
            "spouse_fra_age",
            "spouse_benefit_source",
            "default_ss_start_age_years",
            "default_ss_start_age_months",
            "default_spouse_ss_start_age_years",
            "default_spouse_ss_start_age_months",
        }
        missing_optional = optional - set(columns)
        missing_required = required - set(columns)
        return {
            "table_exists": len(columns) > 0,
            "columns": columns,
            "missing_required": list(missing_required) if missing_required else None,
            "missing_optional": list(missing_optional) if missing_optional else None,
            "run_migration": (
                "./scripts/run_spouse_ss_migration.sh"
                if (missing_optional or missing_required)
                else None
            ),
        }
    except Exception as e:  # noqa: BLE001
        logger.exception("db-check failed")
        return {
            "table_exists": False,
            "error": str(e),
            "run_migration": "./scripts/run_spouse_ss_migration.sh",
        }


@router.get("", response_model=SocialSecurity | None)
def get_social_security(db: Session = Depends(get_db)):
    """Get Social Security configuration."""
    try:
        service = SocialSecurityService(db)
        return service.get_social_security()
    except Exception as e:  # noqa: BLE001
        logger.exception("GET /social-security failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Server error loading Social Security: {e!s}. Run migration: backend/scripts/add_spouse_ss_columns.sql",
        ) from e


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


@router.get("/projections", response_model=SocialSecurityProjectionsResponse)
def get_payment_projections(db: Session = Depends(get_db)):
    """Get Social Security payment projections for primary and spouse (age 62–70) by start age."""
    service = SocialSecurityService(db)
    ss = service.get_social_security()

    if not ss:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Social Security configuration not found. Please configure it first.",
        )

    return service.get_primary_and_spouse_projections(ss)
