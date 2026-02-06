#!/usr/bin/env python3
"""Bootstrap script to seed initial holdings data from CSV."""

import csv
import os
import sys
from decimal import Decimal
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base
from app.models.account import Account
from app.models.holding import Holding

# Database URL - use environment variable or default for Docker
DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql://retirement_user:retirement_pass@db:5432/retirement_db"
)

# CSV file paths
SCRIPT_DIR = Path(__file__).parent
DEFAULT_CSV_FILE = SCRIPT_DIR / "bootstrap_holdings.csv"
EXAMPLE_CSV_FILE = SCRIPT_DIR / "bootstrap_holdings.example.csv"


def load_holdings_from_csv(csv_path: Path) -> list[dict]:
    """Load holdings data from CSV file."""
    holdings = []
    with open(csv_path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            holdings.append(
                {
                    "account_name": row["account_name"].strip(),
                    "asset_class": row["asset_class"].strip(),
                    "ticker": row.get("ticker", "").strip() or None,
                    "name": row.get("name", "").strip() or None,
                    "amount": Decimal(row["amount"].strip()),
                    "notes": row.get("notes", "").strip() or None,
                }
            )
    return holdings


def bootstrap_holdings(clear_existing: bool = True):
    """Seed the database with initial holdings."""
    # Determine which CSV file to use
    if DEFAULT_CSV_FILE.exists():
        csv_file = DEFAULT_CSV_FILE
        print(f"Using holdings file: {csv_file}")
    elif EXAMPLE_CSV_FILE.exists():
        csv_file = EXAMPLE_CSV_FILE
        print(f"Default file not found, using example: {csv_file}")
    else:
        print("Error: No holdings CSV file found!")
        print(f"  Expected: {DEFAULT_CSV_FILE}")
        print(f"  Or: {EXAMPLE_CSV_FILE}")
        sys.exit(1)

    # Allow override via command line
    if len(sys.argv) > 1:
        csv_file = Path(sys.argv[1])
        if not csv_file.exists():
            print(f"Error: Specified file not found: {csv_file}")
            sys.exit(1)
        print(f"Using specified file: {csv_file}")

    # Load holdings from CSV
    holdings_data = load_holdings_from_csv(csv_file)
    print(f"Loaded {len(holdings_data)} holdings from CSV")

    # Create database connection
    engine = create_engine(DATABASE_URL)
    Session = sessionmaker(bind=engine)
    session = Session()

    try:
        # Get all accounts by name
        accounts = session.query(Account).all()
        account_map = {acc.name: acc for acc in accounts}
        print(f"Found {len(accounts)} accounts in database")

        if clear_existing:
            # Clear existing holdings
            deleted = session.query(Holding).delete()
            print(f"Cleared {deleted} existing holdings")

        # Create holdings
        created = 0
        skipped = 0
        for h in holdings_data:
            account = account_map.get(h["account_name"])
            if not account:
                print(f"  Warning: Account '{h['account_name']}' not found, skipping holding")
                skipped += 1
                continue

            holding = Holding(
                account_id=account.id,
                asset_class=h["asset_class"],
                ticker=h["ticker"],
                name=h["name"],
                amount=h["amount"],
                notes=h["notes"],
            )
            session.add(holding)
            created += 1
            print(
                f"  Added: {h['ticker'] or h['asset_class']} - ${h['amount']:,.2f} to {h['account_name']}"
            )

        session.commit()
        print(f"\nBootstrap complete: {created} holdings created, {skipped} skipped")

        # Print summary
        print("\n--- Holdings Summary ---")
        for acc_name, account in account_map.items():
            holdings = session.query(Holding).filter(Holding.account_id == account.id).all()
            total = sum(Decimal(str(h.amount)) for h in holdings)
            balance = Decimal(str(account.balance))
            diff = balance - total
            status = "✓" if abs(diff) < 1 else f"(diff: ${diff:,.2f})"
            print(f"{acc_name}: ${total:,.2f} / ${balance:,.2f} {status}")

    except Exception as e:
        session.rollback()
        print(f"Error: {e}")
        raise
    finally:
        session.close()


if __name__ == "__main__":
    bootstrap_holdings()
