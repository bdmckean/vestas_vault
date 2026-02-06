"""Service for holding business logic."""

from decimal import Decimal
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.holding import Holding as HoldingModel
from app.repositories.account_repository import AccountRepository
from app.repositories.holding_repository import HoldingRepository
from app.schemas.holding import (
    AccountHoldingsSummary,
    Holding,
    HoldingCreate,
    HoldingUpdate,
    HoldingWithAllocation,
    PortfolioAllocation,
)


class HoldingService:
    """Service for holding operations."""

    def __init__(self, db: Session):
        """Initialize service with database session."""
        self.db = db
        self.repository = HoldingRepository(db)
        self.account_repository = AccountRepository(db)

    def get_all_holdings(self) -> list[Holding]:
        """Get all holdings."""
        holdings = self.repository.get_all()
        return [Holding.model_validate(h) for h in holdings]

    def get_holding_by_id(self, holding_id: UUID) -> Holding | None:
        """Get holding by ID."""
        holding = self.repository.get_by_id(holding_id)
        if not holding:
            return None
        return Holding.model_validate(holding)

    def get_holdings_by_account(self, account_id: UUID) -> list[Holding]:
        """Get all holdings for an account."""
        holdings = self.repository.get_by_account(account_id)
        return [Holding.model_validate(h) for h in holdings]

    def create_holding(self, holding_data: HoldingCreate) -> Holding:
        """Create a new holding."""
        # Verify account exists
        account = self.account_repository.get_by_id(holding_data.account_id)
        if not account:
            raise ValueError(f"Account {holding_data.account_id} not found")

        holding = self.repository.create(holding_data)
        return Holding.model_validate(holding)

    def update_holding(self, holding_id: UUID, holding_data: HoldingUpdate) -> Holding | None:
        """Update an existing holding."""
        holding = self.repository.update(holding_id, holding_data)
        if not holding:
            return None
        return Holding.model_validate(holding)

    def delete_holding(self, holding_id: UUID) -> bool:
        """Delete a holding."""
        return self.repository.delete(holding_id)

    def get_account_holdings_summary(self, account_id: UUID) -> AccountHoldingsSummary | None:
        """Get holdings summary for an account with allocation percentages."""
        account = self.account_repository.get_by_id(account_id)
        if not account:
            return None

        holdings = self.repository.get_by_account(account_id)
        account_balance = Decimal(str(account.balance))
        holdings_total = sum(Decimal(str(h.amount)) for h in holdings)

        holdings_with_allocation = []
        for h in holdings:
            amount = Decimal(str(h.amount))
            percent = (amount / account_balance * 100) if account_balance > 0 else Decimal("0")
            holdings_with_allocation.append(
                HoldingWithAllocation(
                    id=h.id,
                    account_id=h.account_id,
                    asset_class=h.asset_class,
                    ticker=h.ticker,
                    name=h.name,
                    amount=amount,
                    notes=h.notes,
                    created_at=h.created_at,
                    updated_at=h.updated_at,
                    allocation_percent=percent.quantize(Decimal("0.01")),
                )
            )

        return AccountHoldingsSummary(
            account_id=account.id,
            account_name=account.name,
            account_balance=account_balance,
            holdings_total=holdings_total,
            difference=account_balance - holdings_total,
            holdings=holdings_with_allocation,
        )

    def get_portfolio_allocation(self) -> PortfolioAllocation:
        """Get portfolio-wide allocation across all accounts."""
        accounts = self.account_repository.get_all()
        all_holdings = self.repository.get_all()

        total_portfolio_value = sum(Decimal(str(a.balance)) for a in accounts)

        # Aggregate by asset class
        by_asset_class: dict[str, Decimal] = {}
        for h in all_holdings:
            asset_class = h.asset_class
            amount = Decimal(str(h.amount))
            by_asset_class[asset_class] = by_asset_class.get(asset_class, Decimal("0")) + amount

        # Calculate percentages
        by_asset_class_percent: dict[str, Decimal] = {}
        for asset_class, amount in by_asset_class.items():
            percent = (
                (amount / total_portfolio_value * 100)
                if total_portfolio_value > 0
                else Decimal("0")
            )
            by_asset_class_percent[asset_class] = percent.quantize(Decimal("0.01"))

        # Get per-account summaries
        account_summaries = []
        for account in accounts:
            summary = self.get_account_holdings_summary(account.id)
            if summary:
                account_summaries.append(summary)

        return PortfolioAllocation(
            total_portfolio_value=total_portfolio_value,
            by_asset_class={k: v for k, v in by_asset_class.items()},
            by_asset_class_percent=by_asset_class_percent,
            by_account=account_summaries,
        )
