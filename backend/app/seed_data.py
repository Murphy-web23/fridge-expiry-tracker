"""第一次啟動時要放進資料庫的示範資料。

v11.2 以前這份資料就是 API 的全部內容（存在記憶體裡），v12 之後改成只在
資料庫還空著的時候寫入一次，後面的新增與修改都直接存進資料庫。
到期日用「今天加上幾天」算，示範資料才會固定涵蓋已過期、今天到期與即期三種狀態。
"""

from datetime import date, timedelta


DEFAULT_FAMILY_CODE = "demo-home"

SEED_FAMILY = {
    "family_code": DEFAULT_FAMILY_CODE,
    "family_name": "示範家庭",
    "invite_code": "demo123",
}

SEED_MEMBERS = [
    {"member_name": "Murphy", "role": "admin"},
    {"member_name": "NICK", "role": "member"},
    {"member_name": "訪客", "role": "member"},
]

SEED_FOODS = [
    {
        "name": "牛奶",
        "category": "乳製品",
        "storage_location": "冰箱冷藏",
        "quantity": "1 瓶",
        "price": 95,
        "purchase_days_ago": 7,
        "expires_in_days": -1,
        "note": "未開封",
        "added_by": "Murphy",
    },
    {
        "name": "雞胸肉",
        "category": "肉類",
        "storage_location": "冰箱冷藏",
        "quantity": "3 包",
        "price": 249,
        "purchase_days_ago": 3,
        "expires_in_days": 0,
        "note": "冷藏未開封",
        "added_by": "NICK",
    },
    {
        "name": "雞蛋",
        "category": "其他",
        "storage_location": "冰箱冷藏",
        "quantity": "1 盒",
        "price": 120,
        "purchase_days_ago": 2,
        "expires_in_days": 5,
        "note": "已開封",
        "added_by": "Murphy",
    },
    {
        "name": "冷凍水餃",
        "category": "冷凍食品",
        "storage_location": "冷凍庫",
        "quantity": "2 包",
        "price": 180,
        "purchase_days_ago": 5,
        "expires_in_days": 60,
        "note": "備用晚餐",
        "added_by": "NICK",
    },
]


def seed_foods_with_dates(today: date | None = None) -> list[dict]:
    """把相對天數換成實際日期。"""
    base_date = today or date.today()
    relative_keys = {"purchase_days_ago", "expires_in_days"}
    foods = []
    for food in SEED_FOODS:
        item = {key: value for key, value in food.items() if key not in relative_keys}
        item["purchase_date"] = (base_date - timedelta(days=food["purchase_days_ago"])).isoformat()
        item["expiry_date"] = (base_date + timedelta(days=food["expires_in_days"])).isoformat()
        foods.append(item)
    return foods
