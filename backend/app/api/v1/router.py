"""API v1 router aggregation."""

from fastapi import APIRouter

from app.api.v1 import (
    accounts,
    asset_projections,
    fixed_expenses,
    holdings,
    other_income,
    planned_fixed_expenses,
    planned_spending,
    saved_scenarios,
    scenarios,
    social_security,
    tax_config,
    tax_tables,
)

api_router = APIRouter()

api_router.include_router(accounts.router)
api_router.include_router(holdings.router)
api_router.include_router(social_security.router)
api_router.include_router(asset_projections.router)
api_router.include_router(scenarios.router)
api_router.include_router(saved_scenarios.router)
api_router.include_router(fixed_expenses.router)
api_router.include_router(planned_fixed_expenses.router)
api_router.include_router(planned_spending.router)
api_router.include_router(tax_config.router)
api_router.include_router(tax_tables.router)
api_router.include_router(other_income.router)
