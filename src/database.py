import os
import sqlite3
from contextlib import closing
from datetime import datetime
from pathlib import Path
from typing import Iterable


BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
DB_PATH = DATA_DIR / "fridge.db"
DEFAULT_FAMILY_CODE = "demo-home"
DATABASE_URL = os.getenv("DATABASE_URL", "").strip()


def configure_database(database_url: str | None = None) -> None:
    """設定資料庫連線字串，Streamlit Cloud 會優先從 Secrets 傳入。"""
    global DATABASE_URL
    DATABASE_URL = (database_url or os.getenv("DATABASE_URL", "")).strip()


def use_postgres() -> bool:
    return bool(DATABASE_URL)


def get_database_label() -> str:
    return "PostgreSQL" if use_postgres() else "SQLite"


def get_connection():
    # Streamlit Cloud 會用 PostgreSQL；本機沒有 DATABASE_URL 時，保留 SQLite 方便開發。
    if use_postgres():
        import psycopg2
        from psycopg2.extras import RealDictCursor

        return psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def _placeholder() -> str:
    return "%s" if use_postgres() else "?"


def _execute(conn, sql: str, params: tuple = ()) -> None:
    if use_postgres():
        with conn.cursor() as cur:
            cur.execute(sql, params)
    else:
        conn.execute(sql, params)


def _fetchall(conn, sql: str, params: tuple = ()) -> list:
    if use_postgres():
        with conn.cursor() as cur:
            cur.execute(sql, params)
            return cur.fetchall()
    return conn.execute(sql, params).fetchall()


def _get_columns(conn, table_name: str) -> set[str]:
    if use_postgres():
        rows = _fetchall(
            conn,
            """
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = %s
            """,
            (table_name,),
        )
        return {row["column_name"] for row in rows}

    rows = conn.execute(f"PRAGMA table_info({table_name})").fetchall()
    return {row["name"] for row in rows}


def _add_column_if_missing(
    conn,
    table_name: str,
    existing_columns: set[str],
    column_name: str,
    column_definition: str,
) -> None:
    if use_postgres():
        _execute(conn, f"ALTER TABLE {table_name} ADD COLUMN IF NOT EXISTS {column_name} {column_definition}")
        existing_columns.add(column_name)
    elif column_name not in existing_columns:
        conn.execute(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_definition}")
        existing_columns.add(column_name)


def _fetchone(conn, sql: str, params: tuple = ()):
    rows = _fetchall(conn, sql, params)
    return rows[0] if rows else None


def init_db() -> None:
    """建立或更新資料表，讓舊版本資料庫也能自動補上新欄位。"""
    id_column = "SERIAL PRIMARY KEY" if use_postgres() else "INTEGER PRIMARY KEY AUTOINCREMENT"

    with closing(get_connection()) as conn:
        # 啟動時自動建表，讓第一次部署或換資料庫時不用手動建立 schema。
        _execute(
            conn,
            f"""
            CREATE TABLE IF NOT EXISTS foods (
                id {id_column},
                family_code TEXT DEFAULT 'demo-home',
                name TEXT NOT NULL,
                category TEXT,
                quantity TEXT,
                price INTEGER DEFAULT 0,
                purchase_date TEXT,
                expiry_date TEXT NOT NULL,
                note TEXT,
                status TEXT DEFAULT 'active',
                added_by TEXT,
                used_by TEXT,
                used_at TEXT,
                updated_by TEXT,
                updated_at TEXT,
                created_at TEXT
            )
            """,
        )

        # v4 新增家庭主檔，邀請碼用來讓家人加入同一個家庭。
        _execute(
            conn,
            f"""
            CREATE TABLE IF NOT EXISTS families (
                id {id_column},
                family_code TEXT UNIQUE NOT NULL,
                family_name TEXT,
                invite_code TEXT NOT NULL,
                created_at TEXT
            )
            """,
        )

        # v4 新增成員表，先用成員名稱紀錄，不做正式帳號登入。
        _execute(
            conn,
            f"""
            CREATE TABLE IF NOT EXISTS family_members (
                id {id_column},
                family_code TEXT NOT NULL,
                member_name TEXT NOT NULL,
                joined_at TEXT,
                UNIQUE (family_code, member_name)
            )
            """,
        )

        existing_columns = _get_columns(conn, "foods")
        _add_column_if_missing(conn, "foods", existing_columns, "family_code", "TEXT DEFAULT 'demo-home'")
        # v10 新增採買金額；舊資料補成 0，避免資料遷移後出現空值。
        _add_column_if_missing(conn, "foods", existing_columns, "price", "INTEGER DEFAULT 0")
        _add_column_if_missing(conn, "foods", existing_columns, "added_by", "TEXT")
        _add_column_if_missing(conn, "foods", existing_columns, "used_by", "TEXT")
        _add_column_if_missing(conn, "foods", existing_columns, "used_at", "TEXT")
        _add_column_if_missing(conn, "foods", existing_columns, "updated_by", "TEXT")
        _add_column_if_missing(conn, "foods", existing_columns, "updated_at", "TEXT")

        placeholder = _placeholder()
        _execute(
            conn,
            """
            UPDATE foods
            SET family_code = {placeholder}
            WHERE family_code IS NULL OR TRIM(family_code) = ''
            """.format(placeholder=placeholder),
            (DEFAULT_FAMILY_CODE,),
        )
        _ensure_default_family(conn)
        conn.commit()


def normalize_family_code(family_code: str) -> str:
    cleaned_code = family_code.strip().lower().replace(" ", "-")
    return cleaned_code or DEFAULT_FAMILY_CODE


def normalize_invite_code(invite_code: str) -> str:
    return invite_code.strip()


def _ensure_default_family(conn) -> None:
    default_family = _fetchone(
        conn,
        "SELECT family_code FROM families WHERE family_code = {p}".format(p=_placeholder()),
        (DEFAULT_FAMILY_CODE,),
    )
    if default_family:
        return

    now = datetime.now().isoformat(timespec="seconds")
    placeholder = _placeholder()
    _execute(
        conn,
        """
        INSERT INTO families (family_code, family_name, invite_code, created_at)
        VALUES ({p}, {p}, {p}, {p})
        """.format(p=placeholder),
        (DEFAULT_FAMILY_CODE, "示範家庭", "demo123", now),
    )


def create_family(
    family_code: str,
    family_name: str,
    invite_code: str,
    member_name: str,
) -> dict:
    normalized_family_code = normalize_family_code(family_code)
    normalized_invite_code = normalize_invite_code(invite_code)
    clean_member_name = member_name.strip() or "訪客"

    if not normalized_invite_code:
        raise ValueError("請輸入邀請碼")

    now = datetime.now().isoformat(timespec="seconds")
    placeholder = _placeholder()

    with closing(get_connection()) as conn:
        existing_family = _fetchone(
            conn,
            "SELECT family_code FROM families WHERE family_code = {p}".format(p=placeholder),
            (normalized_family_code,),
        )
        if existing_family:
            raise ValueError("這個家庭代碼已經存在，請改用加入家庭")

        _execute(
            conn,
            """
            INSERT INTO families (family_code, family_name, invite_code, created_at)
            VALUES ({p}, {p}, {p}, {p})
            """.format(p=placeholder),
            (
                normalized_family_code,
                family_name.strip() or normalized_family_code,
                normalized_invite_code,
                now,
            ),
        )
        _insert_family_member(conn, normalized_family_code, clean_member_name, now)
        conn.commit()

    return get_family(normalized_family_code) or {}


def join_family(family_code: str, invite_code: str, member_name: str) -> dict:
    normalized_family_code = normalize_family_code(family_code)
    normalized_invite_code = normalize_invite_code(invite_code)
    clean_member_name = member_name.strip() or "訪客"

    with closing(get_connection()) as conn:
        family = _fetchone(
            conn,
            """
            SELECT family_code, family_name, invite_code, created_at
            FROM families
            WHERE family_code = {p}
            """.format(p=_placeholder()),
            (normalized_family_code,),
        )
        if not family:
            raise ValueError("找不到這個家庭，請先建立家庭")
        if family["invite_code"] != normalized_invite_code:
            raise ValueError("邀請碼不正確")

        now = datetime.now().isoformat(timespec="seconds")
        _insert_family_member(conn, normalized_family_code, clean_member_name, now)
        conn.commit()

    return get_family(normalized_family_code) or {}


def _insert_family_member(conn, family_code: str, member_name: str, joined_at: str) -> None:
    placeholder = _placeholder()
    if use_postgres():
        _execute(
            conn,
            """
            INSERT INTO family_members (family_code, member_name, joined_at)
            VALUES (%s, %s, %s)
            ON CONFLICT (family_code, member_name) DO NOTHING
            """,
            (family_code, member_name, joined_at),
        )
    else:
        _execute(
            conn,
            """
            INSERT OR IGNORE INTO family_members (family_code, member_name, joined_at)
            VALUES ({p}, {p}, {p})
            """.format(p=placeholder),
            (family_code, member_name, joined_at),
        )


def get_family(family_code: str) -> dict | None:
    normalized_family_code = normalize_family_code(family_code)
    with closing(get_connection()) as conn:
        family = _fetchone(
            conn,
            """
            SELECT family_code, family_name, invite_code, created_at
            FROM families
            WHERE family_code = {p}
            """.format(p=_placeholder()),
            (normalized_family_code,),
        )
    return dict(family) if family else None


def get_family_members(family_code: str) -> list[dict]:
    normalized_family_code = normalize_family_code(family_code)
    with closing(get_connection()) as conn:
        rows = _fetchall(
            conn,
            """
            SELECT member_name, joined_at
            FROM family_members
            WHERE family_code = {p}
            ORDER BY joined_at ASC, member_name ASC
            """.format(p=_placeholder()),
            (normalized_family_code,),
        )
    return [dict(row) for row in rows]


def update_food(
    food_id: int,
    family_code: str,
    name: str,
    category: str,
    quantity: str,
    price: int,
    purchase_date: str,
    expiry_date: str,
    note: str,
    updated_by: str,
) -> None:
    """更新既有食材資料，並記錄最後修改者與修改時間。"""
    updated_at = datetime.now().isoformat(timespec="seconds")
    placeholder = _placeholder()

    with closing(get_connection()) as conn:
        _execute(
            conn,
            """
            UPDATE foods
            SET
                name = {p},
                category = {p},
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
                name,
                category,
                quantity,
                max(0, int(price)),
                purchase_date,
                expiry_date,
                note,
                updated_by,
                updated_at,
                food_id,
                normalize_family_code(family_code),
            ),
        )
        conn.commit()


def add_food(
    family_code: str,
    name: str,
    category: str,
    quantity: str,
    price: int,
    purchase_date: str,
    expiry_date: str,
    note: str,
    added_by: str,
) -> None:
    created_at = datetime.now().isoformat(timespec="seconds")
    placeholder = _placeholder()
    placeholders = ", ".join([placeholder] * 11)
    with closing(get_connection()) as conn:
        _execute(
            conn,
            """
            INSERT INTO foods
                (
                    family_code, name, category, quantity, price, purchase_date,
                    expiry_date, note, status, added_by, created_at
                )
            VALUES
                ({placeholders})
            """.format(placeholders=placeholders),
            (
                normalize_family_code(family_code),
                name,
                category,
                quantity,
                max(0, int(price)),
                purchase_date,
                expiry_date,
                note,
                "active",
                added_by,
                created_at,
            ),
        )
        conn.commit()


def get_all_foods(family_code: str) -> list[dict]:
    placeholder = _placeholder()
    with closing(get_connection()) as conn:
        rows: Iterable[sqlite3.Row] = _fetchall(
            conn,
            """
            SELECT
                id, family_code, name, category, quantity, price, purchase_date,
                expiry_date, note, status, added_by, used_by, used_at,
                updated_by, updated_at, created_at
            FROM foods
            WHERE family_code = {placeholder}
            ORDER BY expiry_date ASC
            """.format(placeholder=placeholder),
            (normalize_family_code(family_code),),
        )
    return [dict(row) for row in rows]


def update_food_status(
    food_id: int,
    status: str,
    family_code: str,
    used_by: str | None = None,
) -> None:
    if status not in {"active", "used"}:
        raise ValueError("status must be 'active' or 'used'")

    normalized_family_code = normalize_family_code(family_code)
    used_at = datetime.now().isoformat(timespec="seconds") if status == "used" else None
    normalized_used_by = used_by if status == "used" else None
    placeholder = _placeholder()

    with closing(get_connection()) as conn:
        _execute(
            conn,
            """
            UPDATE foods
            SET status = {p}, used_by = {p}, used_at = {p}, updated_by = {p}, updated_at = {p}
            WHERE id = {p} AND family_code = {p}
            """.format(p=placeholder),
            (
                status,
                normalized_used_by,
                used_at,
                normalized_used_by,
                used_at,
                food_id,
                normalized_family_code,
            ),
        )
        conn.commit()


def delete_food(food_id: int, family_code: str) -> None:
    placeholder = _placeholder()
    with closing(get_connection()) as conn:
        _execute(
            conn,
            "DELETE FROM foods WHERE id = {p} AND family_code = {p}".format(p=placeholder),
            (food_id, normalize_family_code(family_code)),
        )
        conn.commit()
