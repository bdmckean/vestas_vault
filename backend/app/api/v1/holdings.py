"""Holdings API endpoints."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.holding import (
    AccountHoldingsSummary,
    Holding,
    HoldingCreate,
    HoldingUpdate,
    PortfolioAllocation,
)
from app.services.holding_service import HoldingService

router = APIRouter(prefix="/holdings", tags=["holdings"])


@router.get("", response_model=list[Holding])
def list_holdings(db: Session = Depends(get_db)):
    """Get all holdings across all accounts."""
    service = HoldingService(db)
    return service.get_all_holdings()


@router.get("/portfolio-allocation", response_model=PortfolioAllocation)
def get_portfolio_allocation(db: Session = Depends(get_db)):
    """Get portfolio-wide allocation across all accounts."""
    service = HoldingService(db)
    return service.get_portfolio_allocation()


@router.get("/account/{account_id}", response_model=list[Holding])
def get_account_holdings(account_id: UUID, db: Session = Depends(get_db)):
    """Get all holdings for a specific account."""
    service = HoldingService(db)
    return service.get_holdings_by_account(account_id)


@router.get("/account/{account_id}/summary", response_model=AccountHoldingsSummary)
def get_account_holdings_summary(account_id: UUID, db: Session = Depends(get_db)):
    """Get holdings summary for an account with allocation percentages."""
    service = HoldingService(db)
    summary = service.get_account_holdings_summary(account_id)
    if not summary:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Account {account_id} not found",
        )
    return summary


@router.get("/{holding_id}", response_model=Holding)
def get_holding(holding_id: UUID, db: Session = Depends(get_db)):
    """Get holding by ID."""
    service = HoldingService(db)
    holding = service.get_holding_by_id(holding_id)
    if not holding:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Holding {holding_id} not found",
        )
    return holding


@router.post("", response_model=Holding, status_code=status.HTTP_201_CREATED)
def create_holding(holding_data: HoldingCreate, db: Session = Depends(get_db)):
    """Create a new holding."""
    service = HoldingService(db)
    try:
        return service.create_holding(holding_data)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.put("/{holding_id}", response_model=Holding)
def update_holding(
    holding_id: UUID,
    holding_data: HoldingUpdate,
    db: Session = Depends(get_db),
):
    """Update an existing holding."""
    service = HoldingService(db)
    holding = service.update_holding(holding_id, holding_data)
    if not holding:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Holding {holding_id} not found",
        )
    return holding


@router.delete("/{holding_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_holding(holding_id: UUID, db: Session = Depends(get_db)):
    """Delete a holding."""
    service = HoldingService(db)
    success = service.delete_holding(holding_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Holding {holding_id} not found",
        )
    return None
