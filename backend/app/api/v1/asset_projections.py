"""Asset class projection API endpoints."""

import json
from pathlib import Path

from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/asset-projections", tags=["asset-projections"])

# Path to JSON files
# Files are mounted at /app/data/ in Docker container
PROJECTIONS_FILE = Path("/app/data/investment_return_projections.json")
HISTORICAL_FILE = Path("/app/data/historical_asset_class_returns.json")

# Fallback for local development (files in data/ directory)
if not PROJECTIONS_FILE.exists():
    BASE_DIR = Path(__file__).parent.parent.parent.parent
    PROJECTIONS_FILE = BASE_DIR / "data" / "investment_return_projections.json"
if not HISTORICAL_FILE.exists():
    BASE_DIR = Path(__file__).parent.parent.parent.parent
    HISTORICAL_FILE = BASE_DIR / "data" / "historical_asset_class_returns.json"


@router.get("/10-year")
def get_10_year_projections():
    """Get 10-year investment return projections from various institutions."""
    try:
        with open(PROJECTIONS_FILE, "r") as f:
            data = json.load(f)
        return data
    except FileNotFoundError:
        raise HTTPException(
            status_code=404,
            detail="Investment projections file not found",
        )
    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error parsing projections file: {str(e)}",
        )


@router.get("/10-year/consolidated")
def get_consolidated_10_year_projections():
    """Get consolidated 10-year projections for key asset classes."""
    try:
        with open(PROJECTIONS_FILE, "r") as f:
            data = json.load(f)

        # Extract consolidated projections if available
        consolidated = data.get("consolidated_10_year_projections")
        if consolidated:
            return consolidated

        # If not available, return the full data
        return data
    except FileNotFoundError:
        raise HTTPException(
            status_code=404,
            detail="Investment projections file not found",
        )
    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error parsing projections file: {str(e)}",
        )


@router.get("/historical")
def get_historical_returns():
    """Get long-term historical asset class returns."""
    try:
        with open(HISTORICAL_FILE, "r") as f:
            data = json.load(f)
        return data
    except FileNotFoundError:
        raise HTTPException(
            status_code=404,
            detail="Historical returns file not found",
        )
    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error parsing historical returns file: {str(e)}",
        )


@router.get("/asset-classes")
def get_asset_classes():
    """Get list of available asset classes with their projections."""
    try:
        with open(PROJECTIONS_FILE, "r") as f:
            data = json.load(f)

        # Extract consolidated asset classes
        consolidated = data.get("consolidated_10_year_projections", {})
        asset_classes = consolidated.get("asset_classes", {})

        # Format for frontend
        result = []
        for key, value in asset_classes.items():
            result.append(
                {
                    "key": key,
                    "name": key.replace("_", " ").title(),
                    "expected_return": value.get("expected_return"),
                    "range": value.get("range"),
                    "notes": value.get("notes"),
                }
            )

        return {"asset_classes": result}
    except FileNotFoundError:
        raise HTTPException(
            status_code=404,
            detail="Investment projections file not found",
        )
    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error parsing projections file: {str(e)}",
        )
