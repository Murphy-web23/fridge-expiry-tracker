"""v12 資料存取層：把 API 需要的家庭與食材操作寫成 SQL。

介面刻意維持成 v11.2 mock data 的形狀（回傳 dict、找不到資料回 None），
所以 `main.py` 的路由幾乎沒有跟著改，換掉的只有底下的儲存方式。
"""

from datetime import datetime

from app import db
from app.food_rules import adjust_quantity_text, quantity_amount, with_calculated_fields
from app.models import FoodCreate, FoodUpdate
from app.seed_data import SEED_FAMILY, SEED_MEMBERS, seed_foods_with_dates


FOOD_COLUMNS = """
    id, family_code, name, category, storage_location, quantity, price,
    purchase_date, expiry_date, note, status, added_by, used_by, used_at,
    updated_by, updated_at, created_at
"""


def _now() -> str:
    return datetime.now().isoformat(timespec="seconds")


def _row_to_food(row: dict) -> dict:
    """補上空值預設，舊資料或 Streamlit 版寫入的資料也能通過 API 的型別。"""
    return {
        "id": int(row["id"]),
        "family_code": row["family_code"] or db.DEFAULT_FAMILY_CODE,
        "name": row["name"],
        "category": row["category"] or "其他",
        "storage_location": row["storage_location"] or db.DEFAULT_STORAGE_LOCATION,
        "quantity": row["quantity"] or "未記錄",
        "price": int(row["price"] or 0),
        "purchase_date": row["purchase_date"] or None,
        "expiry_date": row["expiry_date"],
        "note": row["note"] or "未記錄",
        "status": row["status"] or "active",
        "added_by": row["added_by"] or "訪客",
        "used_by": row["used_by"],
        "used_at": row["used_at"],
        "updated_by": row["updated_by"],
        "updated_at": row["updated_at"],
        "created_at": row["created_at"] or "",
    }


def _select_food(conn, family_code: str, food_id: int) -> dict | None:
    row = db.fetch_one(
        conn,
        f"""
        SELECT {FOOD_COLUMNS}
        FROM foods
        WHERE id = {{p}} AND family_code = {{p}}
        """.format(p=db.placeholder()),
        (food_id, family_code),
    )
    return _row_to_food(row) if row else None


def list_families() -> list[dict]:
    with db.connection() as conn:
        rows = db.fetch_all(
            conn,
            """
            SELECT family_code, family_name, created_at
            FROM families
            ORDER BY created_at ASC, family_code ASC
            """,
        )
    return [
        {
            "family_code": row["family_code"],
            "family_name": row["family_name"] or row["family_code"],
            "created_at": row["created_at"] or "",
        }
        for row in rows
    ]


def get_family(family_code: str) -> dict | None:
    with db.connection() as conn:
        row = db.fetch_one(
            conn,
            """
            SELECT family_code, family_name, created_at
            FROM families
            WHERE family_code = {p}
            """.format(p=db.placeholder()),
            (family_code,),
        )
    if not row:
        return None
    return {
        "family_code": row["family_code"],
        "family_name": row["family_name"] or row["family_code"],
        "created_at": row["created_at"] or "",
    }


def list_members(family_code: str) -> list[dict]:
    with db.connection() as conn:
        rows = db.fetch_all(
            conn,
            """
            SELECT family_code, member_name, role, joined_at
            FROM family_members
            WHERE family_code = {p}
            ORDER BY joined_at ASC, member_name ASC
            """.format(p=db.placeholder()),
            (family_code,),
        )
    return [
        {
            "family_code": row["family_code"],
            "member_name": row["member_name"],
            "role": row["role"] or "member",
            "joined_at": row["joined_at"] or "",
        }
        for row in rows
    ]


def list_foods(family_code: str) -> list[dict]:
    with db.connection() as conn:
        rows = db.fetch_all(
            conn,
            f"""
            SELECT {FOOD_COLUMNS}
            FROM foods
            WHERE family_code = {{p}}
            ORDER BY expiry_date ASC, id ASC
            """.format(p=db.placeholder()),
            (family_code,),
        )
    return [with_calculated_fields(_row_to_food(row)) for row in rows]


def find_food(family_code: str, food_id: int) -> dict | None:
    with db.connection() as conn:
        food = _select_food(conn, family_code, food_id)
    return with_calculated_fields(food) if food else None


def count_foods() -> int:
    with db.connection() as conn:
        row = db.fetch_one(conn, "SELECT COUNT(*) AS total FROM foods")
    return int(row["total"]) if row else 0


def add_food(family_code: str, food_create: FoodCreate) -> dict:
    placeholder = db.placeholder()
    placeholders = ", ".join([placeholder] * 12)
    created_at = _now()

    with db.connection() as conn:
        food_id = db.insert_returning_id(
            conn,
            f"""
            INSERT INTO foods
                (
                    family_code, name, category, storage_location, quantity, price,
                    purchase_date, expiry_date, note, status, added_by, created_at
                )
            VALUES ({placeholders})
            """,
            (
                family_code,
                food_create.name.strip(),
                food_create.category,
                food_create.storage_location,
                food_create.quantity,
                food_create.price,
                food_create.purchase_date,
                food_create.expiry_date,
                food_create.note,
                "active",
                food_create.added_by,
                created_at,
            ),
        )
        food = _select_food(conn, family_code, food_id)

    return with_calculated_fields(food) if food else {}


def update_food(family_code: str, food_id: int, food_update: FoodUpdate) -> dict | None:
    """完整編輯食材，一次覆蓋所有可編輯欄位並記錄最後更新者。"""
    placeholder = db.placeholder()

    with db.connection() as conn:
        if not _select_food(conn, family_code, food_id):
            return None

        db.execute(
            conn,
            """
            UPDATE foods
            SET
                name = {p},
                category = {p},
                storage_location = {p},
                quantity = {p},
                price = {p},
                purchase_date = {p},
                expiry_date = {p},
                note = {p},
                updated_by = {p},
                updated_at = {p}
            WHERE id = {p} AND family_code = {p}
            """.format(p=placeholder),
            (
                food_update.name.strip(),
                food_update.category,
                food_update.storage_location,
                food_update.quantity.strip(),
                food_update.price,
                food_update.purchase_date,
                food_update.expiry_date,
                food_update.note,
                food_update.updated_by,
                _now(),
                food_id,
                family_code,
            ),
        )
        food = _select_food(conn, family_code, food_id)

    return with_calculated_fields(food) if food else None


def delete_food(family_code: str, food_id: int) -> bool:
    placeholder = db.placeholder()
    with db.connection() as conn:
        if not _select_food(conn, family_code, food_id):
            return False

        db.execute(
            conn,
            "DELETE FROM foods WHERE id = {p} AND family_code = {p}".format(p=placeholder),
            (food_id, family_code),
        )
    return True


def update_food_status(family_code: str, food_id: int, status: str, used_by: str) -> dict | None:
    placeholder = db.placeholder()
    now = _now()
    is_used = status == "used"

    with db.connection() as conn:
        if not _select_food(conn, family_code, food_id):
            return None

        db.execute(
            conn,
            """
            UPDATE foods
            SET status = {p}, used_by = {p}, used_at = {p}, updated_by = {p}, updated_at = {p}
            WHERE id = {p} AND family_code = {p}
            """.format(p=placeholder),
            (
                status,
                used_by if is_used else None,
                now if is_used else None,
                used_by,
                now,
                food_id,
                family_code,
            ),
        )
        food = _select_food(conn, family_code, food_id)

    return with_calculated_fields(food) if food else None


def update_food_quantity(family_code: str, food_id: int, delta: int, updated_by: str) -> dict | None:
    """以一個單位增減數量。

    數量歸零代表這項食材用完，會自動標記為已使用；補貨讓數量回到 1 以上時，
    狀態也會自動回到可使用。讀取與寫入放在同一條連線裡，避免中途被其他請求插隊。
    """
    placeholder = db.placeholder()
    now = _now()

    with db.connection() as conn:
        food = _select_food(conn, family_code, food_id)
        if not food:
            return None

        next_quantity = adjust_quantity_text(food["quantity"], delta)
        if next_quantity is None:
            return None

        if quantity_amount(next_quantity) == 0:
            status, used_by, used_at = "used", updated_by, now
        elif food["status"] == "used":
            status, used_by, used_at = "active", None, None
        else:
            status, used_by, used_at = food["status"], food["used_by"], food["used_at"]

        db.execute(
            conn,
            """
            UPDATE foods
            SET quantity = {p}, status = {p}, used_by = {p}, used_at = {p},
                updated_by = {p}, updated_at = {p}
            WHERE id = {p} AND family_code = {p}
            """.format(p=placeholder),
            (next_quantity, status, used_by, used_at, updated_by, now, food_id, family_code),
        )
        updated_food = _select_food(conn, family_code, food_id)

    return with_calculated_fields(updated_food) if updated_food else None


def ensure_seed_data() -> None:
    """只補資料庫還缺的部分：家庭、成員各自檢查，示範食材只在資料表全空時寫入一次。"""
    placeholder = db.placeholder()
    now = _now()

    with db.connection() as conn:
        family_exists = db.fetch_one(
            conn,
            "SELECT family_code FROM families WHERE family_code = {p}".format(p=placeholder),
            (SEED_FAMILY["family_code"],),
        )
        if not family_exists:
            db.execute(
                conn,
                """
                INSERT INTO families (family_code, family_name, invite_code, created_at)
                VALUES ({p}, {p}, {p}, {p})
                """.format(p=placeholder),
                (
                    SEED_FAMILY["family_code"],
                    SEED_FAMILY["family_name"],
                    SEED_FAMILY["invite_code"],
                    now,
                ),
            )

        member_count = db.fetch_one(
            conn,
            "SELECT COUNT(*) AS total FROM family_members WHERE family_code = {p}".format(p=placeholder),
            (SEED_FAMILY["family_code"],),
        )
        if not member_count or int(member_count["total"]) == 0:
            for member in SEED_MEMBERS:
                db.execute(
                    conn,
                    """
                    INSERT INTO family_members (family_code, member_name, role, joined_at)
                    VALUES ({p}, {p}, {p}, {p})
                    """.format(p=placeholder),
                    (SEED_FAMILY["family_code"], member["member_name"], member["role"], now),
                )

        food_count = db.fetch_one(conn, "SELECT COUNT(*) AS total FROM foods")
        if food_count and int(food_count["total"]) > 0:
            return

        placeholders = ", ".join([placeholder] * 12)
        for food in seed_foods_with_dates():
            db.execute(
                conn,
                f"""
                INSERT INTO foods
                    (
                        family_code, name, category, storage_location, quantity, price,
                        purchase_date, expiry_date, note, status, added_by, created_at
                    )
                VALUES ({placeholders})
                """,
                (
                    SEED_FAMILY["family_code"],
                    food["name"],
                    food["category"],
                    food["storage_location"],
                    food["quantity"],
                    food["price"],
                    food["purchase_date"],
                    food["expiry_date"],
                    food["note"],
                    "active",
                    food["added_by"],
                    now,
                ),
            )
