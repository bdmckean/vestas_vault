"""Tax tables API endpoints for reading tax bracket data."""

import json
from pathlib import Path

from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/tax-tables", tags=["tax-tables"])

# Path to JSON files
US_FEDERAL_FILE = Path("/app/data/us_federal_tax_tables.json")
COLORADO_FILE = Path("/app/data/colorado_state_tax_tables.json")

# Fallback for local development
if not US_FEDERAL_FILE.exists():
    BASE_DIR = Path(__file__).parent.parent.parent.parent.parent
    US_FEDERAL_FILE = BASE_DIR / "data" / "us_federal_tax_tables.json"
if not COLORADO_FILE.exists():
    BASE_DIR = Path(__file__).parent.parent.parent.parent.parent
    COLORADO_FILE = BASE_DIR / "data" / "colorado_state_tax_tables.json"


@router.get("/us-federal")
def get_us_federal_tax_tables():
    """Get US federal tax brackets and standard deductions."""
    try:
        with open(US_FEDERAL_FILE, "r") as f:
            data = json.load(f)
        return data
    except FileNotFoundError:
        raise HTTPException(
            status_code=404,
            detail="US federal tax tables file not found",
        )
    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error parsing US federal tax tables file: {str(e)}",
        )


@router.get("/colorado")
def get_colorado_tax_tables():
    """Get Colorado state tax information."""
    try:
        with open(COLORADO_FILE, "r") as f:
            data = json.load(f)
        return data
    except FileNotFoundError:
        raise HTTPException(
            status_code=404,
            detail="Colorado tax tables file not found",
        )
    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error parsing Colorado tax tables file: {str(e)}",
        )


@router.get("/standard-deductions/{tax_year}")
def get_standard_deductions(tax_year: int):
    """Get standard deductions for a specific tax year."""
    try:
        with open(US_FEDERAL_FILE, "r") as f:
            data = json.load(f)

        if str(tax_year) not in data.get("standard_deductions", {}):
            raise HTTPException(
                status_code=404,
                detail=f"Standard deductions for tax year {tax_year} not found",
            )

        return {
            "tax_year": tax_year,
            "standard_deductions": data["standard_deductions"][str(tax_year)],
        }
    except FileNotFoundError:
        raise HTTPException(
            status_code=404,
            detail="US federal tax tables file not found",
        )
    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error parsing tax tables file: {str(e)}",
        )
