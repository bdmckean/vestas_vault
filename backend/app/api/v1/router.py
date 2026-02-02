"""API v1 router aggregation."""

from fastapi import APIRouter

from app.api.v1 import (
    accounts,
    asset_projections,
    other_income,
    planned_spending,
    scenarios,
    social_security,
    tax_config,
    tax_tables,
)

api_router = APIRouter()

api_router.include_router(accounts.router)
api_router.include_router(social_security.router)
api_router.include_router(asset_projections.router)
api_router.include_router(scenarios.router)
api_router.include_router(planned_spending.router)
api_router.include_router(tax_config.router)
api_router.include_router(tax_tables.router)
api_router.include_router(other_income.router)
