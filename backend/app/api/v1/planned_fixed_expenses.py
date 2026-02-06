"""API endpoints for planned fixed expenses."""

from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.planned_fixed_expense import PlannedFixedExpense as PlannedFixedExpenseModel
from app.schemas.planned_fixed_expense import (
    PlannedFixedExpense,
    PlannedFixedExpenseCreate,
    PlannedFixedExpenseSummary,
    PlannedFixedExpenseUpdate,
)

router = APIRouter(prefix="/planned-fixed-expenses", tags=["planned-fixed-expenses"])


@router.get("", response_model=List[PlannedFixedExpense])
def get_all_planned_fixed_expenses(db: Session = Depends(get_db)):
    """Get all planned fixed expenses."""
    expenses = db.query(PlannedFixedExpenseModel).order_by(PlannedFixedExpenseModel.end_year).all()
    return expenses


@router.get("/summary", response_model=PlannedFixedExpenseSummary)
def get_planned_fixed_expenses_summary(db: Session = Depends(get_db)):
    """Get summary of all planned fixed expenses including total monthly amount."""
    expenses = db.query(PlannedFixedExpenseModel).order_by(PlannedFixedExpenseModel.end_year).all()

    total_monthly = sum(float(e.monthly_amount) for e in expenses)

    return PlannedFixedExpenseSummary(
        total_monthly=str(total_monthly),
        expenses=expenses,
    )


@router.get("/{expense_id}", response_model=PlannedFixedExpense)
def get_planned_fixed_expense(expense_id: UUID, db: Session = Depends(get_db)):
    """Get a specific planned fixed expense by ID."""
    expense = (
        db.query(PlannedFixedExpenseModel).filter(PlannedFixedExpenseModel.id == expense_id).first()
    )

    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Planned fixed expense not found",
        )

    return expense


@router.post("", response_model=PlannedFixedExpense, status_code=status.HTTP_201_CREATED)
def create_planned_fixed_expense(
    expense_data: PlannedFixedExpenseCreate,
    db: Session = Depends(get_db),
):
    """Create a new planned fixed expense."""
    # Validate end_year > start_year
    if expense_data.end_year <= expense_data.start_year:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="End year must be greater than start year",
        )

    expense = PlannedFixedExpenseModel(
        name=expense_data.name,
        monthly_amount=expense_data.monthly_amount,
        start_year=expense_data.start_year,
        end_year=expense_data.end_year,
        notes=expense_data.notes,
    )

    db.add(expense)
    db.commit()
    db.refresh(expense)

    return expense


@router.patch("/{expense_id}", response_model=PlannedFixedExpense)
def update_planned_fixed_expense(
    expense_id: UUID,
    expense_data: PlannedFixedExpenseUpdate,
    db: Session = Depends(get_db),
):
    """Update a planned fixed expense."""
    expense = (
        db.query(PlannedFixedExpenseModel).filter(PlannedFixedExpenseModel.id == expense_id).first()
    )

    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Planned fixed expense not found",
        )

    update_data = expense_data.model_dump(exclude_unset=True)

    # Validate end_year > start_year if either is being updated
    new_start_year = update_data.get("start_year", expense.start_year)
    new_end_year = update_data.get("end_year", expense.end_year)
    if new_end_year <= new_start_year:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="End year must be greater than start year",
        )

    for field, value in update_data.items():
        setattr(expense, field, value)

    db.commit()
    db.refresh(expense)

    return expense


@router.delete("/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_planned_fixed_expense(expense_id: UUID, db: Session = Depends(get_db)):
    """Delete a planned fixed expense."""
    expense = (
        db.query(PlannedFixedExpenseModel).filter(PlannedFixedExpenseModel.id == expense_id).first()
    )

    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Planned fixed expense not found",
        )

    db.delete(expense)
    db.commit()

    return None
