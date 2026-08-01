"""食材規則的純函式，不碰資料庫。

v12 把資料存取搬到 `repository.py` 之後，這些規則獨立出來，
可以不開資料庫就單獨測試，SQL 那層也只負責讀寫。
"""

import re
from datetime import date
from decimal import Decimal


QUANTITY_PATTERN = re.compile(r"^\s*(\d+(?:\.\d+)?)\s*(.*)$")


def calculate_days_left(expiry_date: str) -> int:
    return (date.fromisoformat(expiry_date) - date.today()).days


def status_label(status: str, days_left: int) -> str:
    if status == "used":
        return "Used"
    if days_left < 0:
        return "Expired"
    if days_left == 0:
        return "Today"
    if days_left <= 7:
        return "Soon"
    return "Safe"


def with_calculated_fields(food: dict) -> dict:
    """剩餘天數與狀態標籤都是當天算出來的，所以不存進資料庫。"""
    item = dict(food)
    days_left = calculate_days_left(item["expiry_date"])
    item["days_left"] = days_left
    item["status_label"] = status_label(item["status"], days_left)
    return item


def adjust_quantity_text(quantity: str, delta: int) -> str | None:
    """以一個單位增減數量，最低停在 0，並保留原本量詞。

    數量是自由文字（例如「2 盒」「500 g」），前面沒有數字時回傳 None，
    代表這筆資料不適合用加減按鈕。
    """
    match = QUANTITY_PATTERN.match(quantity or "")
    if not match:
        return None

    amount = max(Decimal("0"), Decimal(match.group(1)) + Decimal(delta))
    amount_text = str(int(amount)) if amount == amount.to_integral() else format(amount.normalize(), "f")
    unit = match.group(2).strip()
    return f"{amount_text} {unit}".strip()


def quantity_amount(quantity: str) -> Decimal | None:
    match = QUANTITY_PATTERN.match(quantity or "")
    return Decimal(match.group(1)) if match else None
