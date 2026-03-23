"""Unit tests for Full Retirement Age (FRA) calculator."""

from datetime import date
from decimal import Decimal


from app.utils.fra_calculator import (
    calculate_fra,
    calculate_fra_decimal,
    fra_to_decimal,
)


class TestCalculateFRA:
    """Tests for calculate_fra (years, months)."""

    def test_born_1937_or_earlier(self):
        assert calculate_fra(date(1937, 6, 15)) == (65, 0)
        assert calculate_fra(date(1930, 1, 1)) == (65, 0)

    def test_born_1960_or_later(self):
        assert calculate_fra(date(1960, 3, 4)) == (67, 0)
        assert calculate_fra(date(1970, 1, 1)) == (67, 0)

    def test_born_1943_to_1954(self):
        assert calculate_fra(date(1950, 7, 1)) == (66, 0)

    def test_born_1959(self):
        assert calculate_fra(date(1959, 5, 20)) == (66, 10)

    def test_born_1955(self):
        assert calculate_fra(date(1955, 12, 31)) == (66, 2)

    def test_january_1_uses_previous_year(self):
        # Jan 1, 1960 should use 1959 FRA (66 years 10 months)
        assert calculate_fra(date(1960, 1, 1)) == (66, 10)


class TestFraToDecimal:
    """Tests for fra_to_decimal."""

    def test_whole_years(self):
        assert fra_to_decimal(67, 0) == Decimal("67")

    def test_years_and_months(self):
        assert fra_to_decimal(66, 6) == Decimal("66.5")
        assert fra_to_decimal(66, 10) == Decimal("66") + Decimal("10") / Decimal("12")


class TestCalculateFraDecimal:
    """Tests for calculate_fra_decimal."""

    def test_1960_returns_67(self):
        assert calculate_fra_decimal(date(1960, 3, 4)) == Decimal("67")

    def test_1950_returns_66(self):
        assert calculate_fra_decimal(date(1950, 1, 15)) == Decimal("66")

    def test_1959_returns_66_10_months(self):
        result = calculate_fra_decimal(date(1959, 1, 2))
        expected = Decimal("66") + Decimal("10") / Decimal("12")
        assert result == expected
