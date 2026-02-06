"""Pydantic schemas for API validation."""

from app.schemas.account import Account, AccountCreate, AccountUpdate
from app.schemas.fixed_expense import (
    FixedExpense,
    FixedExpenseCreate,
    FixedExpenseSummary,
    FixedExpenseUpdate,
)
from app.schemas.holding import (
    AccountHoldingsSummary,
    AssetClass,
    Holding,
    HoldingCreate,
    HoldingUpdate,
    HoldingWithAllocation,
    PortfolioAllocation,
)
from app.schemas.other_income import (
    IncomeType,
    OtherIncome,
    OtherIncomeCreate,
    OtherIncomeProjection,
    OtherIncomeSummary,
    OtherIncomeUpdate,
)
from app.schemas.planned_fixed_expense import (
    PlannedFixedExpense,
    PlannedFixedExpenseCreate,
    PlannedFixedExpenseSummary,
    PlannedFixedExpenseUpdate,
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
    "AssetClass",
    "FixedExpense",
    "FixedExpenseCreate",
    "FixedExpenseUpdate",
    "FixedExpenseSummary",
    "Holding",
    "HoldingCreate",
    "HoldingUpdate",
    "HoldingWithAllocation",
    "AccountHoldingsSummary",
    "PortfolioAllocation",
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
    "PlannedFixedExpense",
    "PlannedFixedExpenseCreate",
    "PlannedFixedExpenseSummary",
    "PlannedFixedExpenseUpdate",
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
