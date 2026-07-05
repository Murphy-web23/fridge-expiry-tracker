from datetime import date, datetime


DATE_FORMAT = "%Y-%m-%d"


def parse_date(value: str) -> date:
    """Parse a YYYY-MM-DD string into a date."""
    return datetime.strptime(value, DATE_FORMAT).date()


def format_date(value: date) -> str:
    return value.strftime(DATE_FORMAT)
