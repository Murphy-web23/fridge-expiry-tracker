from copy import deepcopy
from datetime import date, datetime

from app.models import FoodCreate


FAMILIES = {
    "demo-home": {
        "family_code": "demo-home",
        "family_name": "示範家庭",
        "created_at": "2026-07-16T15:29:15",
    }
}

MEMBERS = {
    "demo-home": [
        {
            "family_code": "demo-home",
            "member_name": "Murphy",
            "role": "admin",
            "joined_at": "2026-07-16T15:29:15",
        },
        {
            "family_code": "demo-home",
            "member_name": "NICK",
            "role": "member",
            "joined_at": "2026-07-16T15:29:15",
        },
        {
            "family_code": "demo-home",
            "member_name": "訪客",
            "role": "member",
            "joined_at": "2026-07-17T09:00:00",
        },
    ]
}

FOODS = {
    "demo-home": [
        {
            "id": 1,
            "family_code": "demo-home",
            "name": "牛奶",
            "category": "乳製品",
            "quantity": "一瓶",
            "purchase_date": "2026-07-05",
            "expiry_date": "2026-07-11",
            "status": "active",
            "note": "未開封",
            "added_by": "Murphy",
            "used_by": None,
            "used_at": None,
            "updated_by": None,
            "updated_at": None,
            "created_at": "2026-07-05T20:30:00",
        },
        {
            "id": 2,
            "family_code": "demo-home",
            "name": "雞蛋",
            "category": "其他",
            "quantity": "一盒",
            "purchase_date": "2026-07-07",
            "expiry_date": "2026-07-17",
            "status": "active",
            "note": "已開封",
            "added_by": "Murphy",
            "used_by": None,
            "used_at": None,
            "updated_by": None,
            "updated_at": None,
            "created_at": "2026-07-07T10:00:00",
        },
        {
            "id": 3,
            "family_code": "demo-home",
            "name": "雞胸肉",
            "category": "肉類",
            "quantity": "3包",
            "purchase_date": "2026-07-16",
            "expiry_date": "2026-07-22",
            "status": "active",
            "note": "冷藏未開封",
            "added_by": "NICK",
            "used_by": None,
            "used_at": None,
            "updated_by": None,
            "updated_at": None,
            "created_at": "2026-07-16T15:29:15",
        },
    ]
}


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
    item = deepcopy(food)
    days_left = calculate_days_left(item["expiry_date"])
    item["days_left"] = days_left
    item["status_label"] = status_label(item["status"], days_left)
    return item


def list_foods(family_code: str) -> list[dict]:
    return [with_calculated_fields(food) for food in FOODS.get(family_code, [])]


def add_food(family_code: str, food_create: FoodCreate) -> dict:
    now = datetime.now().isoformat(timespec="seconds")
    current_foods = FOODS.setdefault(family_code, [])
    next_id = max([food["id"] for food in current_foods], default=0) + 1
    food = {
        "id": next_id,
        "family_code": family_code,
        "name": food_create.name.strip(),
        "category": food_create.category,
        "quantity": food_create.quantity,
        "purchase_date": food_create.purchase_date,
        "expiry_date": food_create.expiry_date,
        "status": "active",
        "note": food_create.note,
        "added_by": food_create.added_by,
        "used_by": None,
        "used_at": None,
        "updated_by": None,
        "updated_at": None,
        "created_at": now,
    }
    current_foods.append(food)
    return with_calculated_fields(food)


def update_food_status(family_code: str, food_id: int, status: str, used_by: str) -> dict | None:
    for food in FOODS.get(family_code, []):
        if food["id"] == food_id:
            now = datetime.now().isoformat(timespec="seconds")
            food["status"] = status
            food["used_by"] = used_by if status == "used" else None
            food["used_at"] = now if status == "used" else None
            food["updated_by"] = used_by
            food["updated_at"] = now
            return with_calculated_fields(food)
    return None
