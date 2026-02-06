"""API endpoints for fixed expenses."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.fixed_expense import FixedExpense as FixedExpenseModel
from app.schemas.fixed_expense import (
    FixedExpense,
    FixedExpenseCreate,
    FixedExpenseUpdate,
)

router = APIRouter(prefix="/fixed-expenses", tags=["fixed-expenses"])


@router.get("", response_model=list[FixedExpense])
def list_fixed_expenses(
    scenario_id: UUID | None = None,
    db: Session = Depends(get_db),
):
    """List all fixed expenses, optionally filtered by scenario."""
    query = db.query(FixedExpenseModel)
    if scenario_id:
        query = query.filter(FixedExpenseModel.scenario_id == scenario_id)
    return query.order_by(FixedExpenseModel.start_year, FixedExpenseModel.name).all()


@router.get("/{expense_id}", response_model=FixedExpense)
def get_fixed_expense(
    expense_id: UUID,
    db: Session = Depends(get_db),
):
    """Get a specific fixed expense."""
    expense = db.query(FixedExpenseModel).filter(FixedExpenseModel.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Fixed expense not found")
    return expense


@router.post("", response_model=FixedExpense, status_code=status.HTTP_201_CREATED)
def create_fixed_expense(
    expense: FixedExpenseCreate,
    db: Session = Depends(get_db),
):
    """Create a new fixed expense."""
    # Validate end_year > start_year if both are set
    if expense.end_year and expense.end_year < expense.start_year:
        raise HTTPException(
            status_code=400,
            detail="End year must be greater than or equal to start year"
        )
    
    db_expense = FixedExpenseModel(
        scenario_id=expense.scenario_id,
        name=expense.name,
        monthly_amount=expense.monthly_amount,
        start_year=expense.start_year,
        end_year=expense.end_year,
        notes=expense.notes,
    )
    db.add(db_expense)
    db.commit()
    db.refresh(db_expense)
    return db_expense


@router.put("/{expense_id}", response_model=FixedExpense)
def update_fixed_expense(
    expense_id: UUID,
    expense: FixedExpenseUpdate,
    db: Session = Depends(get_db),
):
    """Update a fixed expense."""
    db_expense = db.query(FixedExpenseModel).filter(FixedExpenseModel.id == expense_id).first()
    if not db_expense:
        raise HTTPException(status_code=404, detail="Fixed expense not found")
    
    update_data = expense.model_dump(exclude_unset=True)
    
    # Validate end_year if being updated
    new_start = update_data.get("start_year", db_expense.start_year)
    new_end = update_data.get("end_year", db_expense.end_year)
    if new_end and new_end < new_start:
        raise HTTPException(
            status_code=400,
            detail="End year must be greater than or equal to start year"
        )
    
    for key, value in update_data.items():
        setattr(db_expense, key, value)
    
    db.commit()
    db.refresh(db_expense)
    return db_expense


@router.delete("/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_fixed_expense(
    expense_id: UUID,
    db: Session = Depends(get_db),
):
    """Delete a fixed expense."""
    db_expense = db.query(FixedExpenseModel).filter(FixedExpenseModel.id == expense_id).first()
    if not db_expense:
        raise HTTPException(status_code=404, detail="Fixed expense not found")
    
    db.delete(db_expense)
    db.commit()
