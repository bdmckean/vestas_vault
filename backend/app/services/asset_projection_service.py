"""Asset projection service for accessing projection data."""

import json
from pathlib import Path

from sqlalchemy.orm import Session

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


class AssetProjectionService:
    """Service for accessing asset projection data."""

    def __init__(self, db: Session):
        """Initialize service with database session."""
        self.db = db

    def get_consolidated_10_year_projections(self) -> dict:
        """Get consolidated 10-year projections."""
        with open(PROJECTIONS_FILE, "r") as f:
            data = json.load(f)
        return data.get("consolidated_10_year_projections", {})

    def get_historical_returns(self) -> dict:
        """Get historical returns data."""
        with open(HISTORICAL_FILE, "r") as f:
            return json.load(f)
