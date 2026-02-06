"""Repository for saved scenario data access."""

from uuid import UUID

from sqlalchemy.orm import Session

from app.models.scenario import SavedScenario
from app.schemas.scenario import SavedScenarioCreate, SavedScenarioUpdate


class ScenarioRepository:
    """Repository for saved scenario CRUD operations."""

    def __init__(self, db: Session):
        """Initialize repository with database session."""
        self.db = db

    def get_all(self) -> list[SavedScenario]:
        """Get all saved scenarios."""
        return self.db.query(SavedScenario).order_by(SavedScenario.updated_at.desc()).all()

    def get_by_id(self, scenario_id: UUID) -> SavedScenario | None:
        """Get scenario by ID."""
        return self.db.query(SavedScenario).filter(SavedScenario.id == scenario_id).first()

    def create(self, scenario_data: SavedScenarioCreate) -> SavedScenario:
        """Create a new saved scenario."""
        data = scenario_data.model_dump()
        # Convert AssetAllocation to dict for JSONB storage
        if "asset_allocation" in data and hasattr(data["asset_allocation"], "model_dump"):
            data["asset_allocation"] = data["asset_allocation"].model_dump()
        elif "asset_allocation" in data and isinstance(data["asset_allocation"], dict):
            # Convert Decimal to float for JSON serialization
            data["asset_allocation"] = {k: float(v) for k, v in data["asset_allocation"].items()}

        scenario = SavedScenario(**data)
        self.db.add(scenario)
        self.db.commit()
        self.db.refresh(scenario)
        return scenario

    def update(self, scenario_id: UUID, scenario_data: SavedScenarioUpdate) -> SavedScenario | None:
        """Update an existing scenario."""
        scenario = self.get_by_id(scenario_id)
        if not scenario:
            return None

        update_data = scenario_data.model_dump(exclude_unset=True)

        # Handle asset_allocation conversion
        if "asset_allocation" in update_data:
            if hasattr(update_data["asset_allocation"], "model_dump"):
                update_data["asset_allocation"] = update_data["asset_allocation"].model_dump()
            elif isinstance(update_data["asset_allocation"], dict):
                update_data["asset_allocation"] = {
                    k: float(v) for k, v in update_data["asset_allocation"].items()
                }

        for field, value in update_data.items():
            setattr(scenario, field, value)

        self.db.commit()
        self.db.refresh(scenario)
        return scenario

    def delete(self, scenario_id: UUID) -> bool:
        """Delete a scenario."""
        scenario = self.get_by_id(scenario_id)
        if not scenario:
            return False

        self.db.delete(scenario)
        self.db.commit()
        return True

    def duplicate(self, scenario_id: UUID, new_name: str) -> SavedScenario | None:
        """Duplicate an existing scenario with a new name."""
        original = self.get_by_id(scenario_id)
        if not original:
            return None

        # Create new scenario with copied data
        # Deep copy asset_allocation to avoid reference issues
        asset_allocation_copy = {}
        if original.asset_allocation:
            asset_allocation_copy = {k: v for k, v in original.asset_allocation.items()}

        new_scenario = SavedScenario(
            name=new_name,
            description=original.description,
            ss_start_age_years=original.ss_start_age_years,
            ss_start_age_months=original.ss_start_age_months,
            monthly_spending=original.monthly_spending,
            annual_lump_spending=original.annual_lump_spending,
            inflation_adjusted_percent=original.inflation_adjusted_percent,
            spending_reduction_percent=original.spending_reduction_percent,
            spending_reduction_start_year=original.spending_reduction_start_year,
            projection_years=original.projection_years,
            asset_allocation=asset_allocation_copy,
            return_source=original.return_source,
            custom_return_percent=original.custom_return_percent,
            inflation_rate=original.inflation_rate,
        )
        self.db.add(new_scenario)
        self.db.commit()
        self.db.refresh(new_scenario)
        return new_scenario
