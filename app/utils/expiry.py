from datetime import date

from app.models.enums import ExpiryStatus


def calculate_expiry_details(
    expiry_date: date,
    warning_days: int,
) -> tuple[int, ExpiryStatus]:

    today = date.today()

    days_to_expiry = (
        expiry_date - today
    ).days

    if days_to_expiry < 0:
        expiry_status = ExpiryStatus.EXPIRED

    elif days_to_expiry <= warning_days:
        expiry_status = ExpiryStatus.EXPIRING_SOON

    else:
        expiry_status = ExpiryStatus.FRESH

    return days_to_expiry, expiry_status