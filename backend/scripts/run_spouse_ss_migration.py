"""
Run the spouse SS migration using the app's DATABASE_URL (same DB as the backend).
Usage: docker-compose exec backend python -m scripts.run_spouse_ss_migration
Or from repo root: cd backend && python -m scripts.run_spouse_ss_migration
"""

import os
import sys

# Add backend app to path when run as __main__
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text

from app.database import engine


def main() -> None:
    sql_path = os.path.join(os.path.dirname(__file__), "add_spouse_ss_columns.sql")
    with open(sql_path) as f:
        sql = f.read()
    # Run each ALTER statement only (skip comments and empty lines)
    statements = []
    for part in sql.split(";"):
        stmt = part.strip()
        # Remove leading comment lines from this part
        lines = [
            line for line in stmt.split("\n") if line.strip() and not line.strip().startswith("--")
        ]
        stmt = " ".join(lines).strip()
        if stmt.upper().startswith("ALTER"):
            statements.append(stmt)
    with engine.begin() as conn:
        for stmt in statements:
            conn.execute(text(stmt))
    print(
        "Migration finished. Restart the backend if it is running, then reload the Social Security page."
    )


if __name__ == "__main__":
    main()
