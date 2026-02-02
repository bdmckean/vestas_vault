"""Full Retirement Age (FRA) calculator based on birth date."""

from datetime import date
from decimal import Decimal


def calculate_fra(birth_date: date) -> tuple[int, int]:
    """
    Calculate Full Retirement Age (FRA) in years and months based on birth date.

    Returns:
        tuple[int, int]: (years, months) where months is 0-11

    Rules:
        - Born 1937 or earlier: 65 years, 0 months
        - Born 1938: 65 years, 2 months
        - Born 1939: 65 years, 4 months
        - Born 1940: 65 years, 6 months
        - Born 1941: 65 years, 8 months
        - Born 1942: 65 years, 10 months
        - Born 1943-1954: 66 years, 0 months
        - Born 1955: 66 years, 2 months
        - Born 1956: 66 years, 4 months
        - Born 1957: 66 years, 6 months
        - Born 1958: 66 years, 8 months
        - Born 1959: 66 years, 10 months
        - Born 1960 or later: 67 years, 0 months

    Note: People born on January 1st should use the previous year's FRA.
    """
    birth_year = birth_date.year

    # Handle January 1st special case
    if birth_date.month == 1 and birth_date.day == 1:
        birth_year = birth_year - 1

    if birth_year <= 1937:
        return (65, 0)
    elif birth_year == 1938:
        return (65, 2)
    elif birth_year == 1939:
        return (65, 4)
    elif birth_year == 1940:
        return (65, 6)
    elif birth_year == 1941:
        return (65, 8)
    elif birth_year == 1942:
        return (65, 10)
    elif 1943 <= birth_year <= 1954:
        return (66, 0)
    elif birth_year == 1955:
        return (66, 2)
    elif birth_year == 1956:
        return (66, 4)
    elif birth_year == 1957:
        return (66, 6)
    elif birth_year == 1958:
        return (66, 8)
    elif birth_year == 1959:
        return (66, 10)
    else:  # 1960 or later
        return (67, 0)


def fra_to_decimal(years: int, months: int) -> Decimal:
    """Convert FRA from years and months to decimal format."""
    return Decimal(str(years)) + Decimal(str(months)) / Decimal("12")


def calculate_fra_decimal(birth_date: date) -> Decimal:
    """Calculate FRA as a decimal (e.g., 66.5 for 66 years 6 months)."""
    years, months = calculate_fra(birth_date)
    return fra_to_decimal(years, months)
