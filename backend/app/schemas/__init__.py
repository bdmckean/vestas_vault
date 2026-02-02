"""Pydantic schemas for API validation."""

from app.schemas.account import Account, AccountCreate, AccountUpdate
from app.schemas.other_income import (
    IncomeType,
    OtherIncome,
    OtherIncomeCreate,
    OtherIncomeProjection,
    OtherIncomeSummary,
    OtherIncomeUpdate,
)
from app.schemas.planned_spending import (
    PlannedSpending,
    PlannedSpendingCreate,
    PlannedSpendingUpdate,
)
from app.schemas.scenario import (
    AssetAllocation,
    ScenarioCreate,
    ScenarioPeriod,
    ScenarioResult,
)
from app.schemas.social_security import (
    SocialSecurity,
    SocialSecurityCreate,
    SocialSecurityPaymentProjection,
    SocialSecurityUpdate,
)
from app.schemas.tax_config import (
    SeniorDeductionBreakdown,
    TaxConfig,
    TaxConfigCreate,
    TaxConfigUpdate,
)

__all__ = [
    "Account",
    "AccountCreate",
    "AccountUpdate",
    "IncomeType",
    "OtherIncome",
    "OtherIncomeCreate",
    "OtherIncomeUpdate",
    "OtherIncomeProjection",
    "OtherIncomeSummary",
    "SocialSecurity",
    "SocialSecurityCreate",
    "SocialSecurityUpdate",
    "SocialSecurityPaymentProjection",
    "PlannedSpending",
    "PlannedSpendingCreate",
    "PlannedSpendingUpdate",
    "TaxConfig",
    "TaxConfigCreate",
    "TaxConfigUpdate",
    "SeniorDeductionBreakdown",
    "AssetAllocation",
    "ScenarioCreate",
    "ScenarioPeriod",
    "ScenarioResult",
]
