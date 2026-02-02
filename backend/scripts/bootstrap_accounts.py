"""Bootstrap script to seed database with initial account data from CSV."""

import csv
import sys
from pathlib import Path

# Add parent directory to path to import app modules
sys.path.insert(0, str(Path(__file__).parent.parent))

from decimal import Decimal

from sqlalchemy.orm import Session

from app.database import SessionLocal, engine, Base
from app.models.account import Account
from app.schemas.account import AccountCreate
from app.services.account_service import AccountService

# Default CSV file path
SCRIPT_DIR = Path(__file__).parent
DEFAULT_CSV_FILE = SCRIPT_DIR / "bootstrap_accounts.csv"
EXAMPLE_CSV_FILE = SCRIPT_DIR / "bootstrap_accounts.example.csv"


def load_accounts_from_csv(csv_path: Path) -> list[dict]:
    """Load account data from a CSV file."""
    accounts = []
    with open(csv_path, "r", newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            accounts.append(
                {
                    "name": row["name"],
                    "account_type": row["account_type"],
                    "balance": Decimal(row["balance"]),
                }
            )
    return accounts


def bootstrap_accounts(csv_file: Path = None):
    """Create initial accounts in the database from CSV file."""
    # Determine which CSV file to use
    if csv_file is None:
        if DEFAULT_CSV_FILE.exists():
            csv_file = DEFAULT_CSV_FILE
        elif EXAMPLE_CSV_FILE.exists():
            csv_file = EXAMPLE_CSV_FILE
            print(f"Note: Using example data from {EXAMPLE_CSV_FILE.name}")
            print(f"      Copy bootstrap_accounts.example.csv to bootstrap_accounts.csv")
            print(f"      and customize with your own data.\n")
        else:
            print("Error: No CSV file found.")
            print(f"  Expected: {DEFAULT_CSV_FILE}")
            print(f"  Or: {EXAMPLE_CSV_FILE}")
            return

    if not csv_file.exists():
        print(f"Error: CSV file not found: {csv_file}")
        return

    print(f"Loading accounts from: {csv_file.name}")

    # Load accounts from CSV
    try:
        initial_accounts = load_accounts_from_csv(csv_file)
    except Exception as e:
        print(f"Error reading CSV file: {e}")
        return

    if not initial_accounts:
        print("No accounts found in CSV file.")
        return

    # Create tables if they don't exist
    Base.metadata.create_all(bind=engine)

    db: Session = SessionLocal()
    try:
        service = AccountService(db)

        # Check if accounts already exist
        existing_accounts = service.get_all_accounts()
        if existing_accounts:
            print(f"\nFound {len(existing_accounts)} existing accounts:")
            for account in existing_accounts:
                print(f"  - {account.name}: ${account.balance:,.2f} ({account.account_type})")
            response = input("\nDo you want to add the accounts from CSV anyway? (y/n): ")
            if response.lower() != "y":
                print("Skipping bootstrap.")
                return

        # Create accounts
        print("\nCreating accounts from CSV...")
        created_accounts = []
        for account_data in initial_accounts:
            try:
                account = service.create_account(AccountCreate(**account_data))
                created_accounts.append(account)
                print(
                    f"✓ Created: {account.name} - ${account.balance:,.2f} ({account.account_type})"
                )
            except Exception as e:
                print(f"✗ Error creating {account_data['name']}: {e}")

        # Display summary
        if created_accounts:
            total = sum(float(acc.balance) for acc in created_accounts)
            print(f"\n✓ Successfully created {len(created_accounts)} accounts")
            print(f"  Total balance: ${total:,.2f}")
        else:
            print("\nNo accounts were created.")

    finally:
        db.close()


if __name__ == "__main__":
    # Allow passing CSV file path as argument
    csv_path = None
    if len(sys.argv) > 1:
        csv_path = Path(sys.argv[1])

    bootstrap_accounts(csv_path)
