"""v12 資料庫連線層。

本機沒有設定 `DATABASE_URL` 時使用 SQLite，檔案預設就是 Streamlit 版在用的
`data/fridge.db`，兩個版本因此看到同一份家庭資料；部署環境設定 `DATABASE_URL`
之後會自動改用 PostgreSQL。

環境變數只在呼叫時讀取，不在 import 時固定下來，測試才能先指到暫存資料庫再載入 App。
"""

import os
import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Any, Iterator


BACKEND_DIR = Path(__file__).resolve().parent.parent
PROJECT_ROOT = BACKEND_DIR.parent
DEFAULT_SQLITE_PATH = PROJECT_ROOT / "data" / "fridge.db"

DEFAULT_FAMILY_CODE = "demo-home"
DEFAULT_STORAGE_LOCATION = "冰箱冷藏"


def database_url() -> str:
    return os.getenv("DATABASE_URL", "").strip()


def use_postgres() -> bool:
    return bool(database_url())


def sqlite_path() -> Path:
    """測試與多環境部署可以用 FRIDGE_DB_PATH 指定其他 SQLite 檔案。"""
    custom_path = os.getenv("FRIDGE_DB_PATH", "").strip()
    return Path(custom_path) if custom_path else DEFAULT_SQLITE_PATH


def database_label() -> str:
    return "PostgreSQL" if use_postgres() else "SQLite"


def database_location() -> str:
    """給 /health 顯示，PostgreSQL 只回主機名稱，不會把帳密送到前端。"""
    if use_postgres():
        host = database_url().split("@")[-1].split("/")[0]
        return host or "PostgreSQL"
    return str(sqlite_path())


def placeholder() -> str:
    return "%s" if use_postgres() else "?"


def _connect():
    if use_postgres():
        import psycopg2
        from psycopg2.extras import RealDictCursor

        return psycopg2.connect(database_url(), cursor_factory=RealDictCursor)

    path = sqlite_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row
    return conn


@contextmanager
def connection() -> Iterator[Any]:
    """一次請求一條連線，離開時成功就 commit、出錯就 rollback。"""
    conn = _connect()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def execute(conn, sql: str, params: tuple = ()) -> None:
    if use_postgres():
        with conn.cursor() as cur:
            cur.execute(sql, params)
        return
    conn.execute(sql, params)


def fetch_all(conn, sql: str, params: tuple = ()) -> list[dict]:
    if use_postgres():
        with conn.cursor() as cur:
            cur.execute(sql, params)
            return [dict(row) for row in cur.fetchall()]
    return [dict(row) for row in conn.execute(sql, params).fetchall()]


def fetch_one(conn, sql: str, params: tuple = ()) -> dict | None:
    rows = fetch_all(conn, sql, params)
    return rows[0] if rows else None


def insert_returning_id(conn, sql: str, params: tuple = ()) -> int:
    """新增一筆資料並取回主鍵，兩種資料庫拿 id 的方式不同。"""
    if use_postgres():
        with conn.cursor() as cur:
            cur.execute(f"{sql} RETURNING id", params)
            return int(cur.fetchone()["id"])
    return int(conn.execute(sql, params).lastrowid)


def _table_columns(conn, table_name: str) -> set[str]:
    if use_postgres():
        rows = fetch_all(
            conn,
            """
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = %s
            """,
            (table_name,),
        )
        return {row["column_name"] for row in rows}

    return {row["name"] for row in fetch_all(conn, f"PRAGMA table_info({table_name})")}


def _add_column_if_missing(
    conn,
    table_name: str,
    existing_columns: set[str],
    column_name: str,
    column_definition: str,
) -> None:
    if column_name in existing_columns:
        return

    execute(conn, f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_definition}")
    existing_columns.add(column_name)


def init_db() -> None:
    """建表並補齊欄位。

    `foods`、`families`、`family_members` 的欄位刻意與 Streamlit 版 `src/database.py`
    一致，只多了 React 版才用到的 `storage_location` 與成員 `role`，
    所以舊的 `data/fridge.db` 可以直接沿用，不需要重建資料庫。
    """
    id_column = "SERIAL PRIMARY KEY" if use_postgres() else "INTEGER PRIMARY KEY AUTOINCREMENT"

    with connection() as conn:
        execute(
            conn,
            f"""
            CREATE TABLE IF NOT EXISTS foods (
                id {id_column},
                family_code TEXT DEFAULT 'demo-home',
                name TEXT NOT NULL,
                category TEXT,
                storage_location TEXT DEFAULT '{DEFAULT_STORAGE_LOCATION}',
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
        execute(
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
        execute(
            conn,
            f"""
            CREATE TABLE IF NOT EXISTS family_members (
                id {id_column},
                family_code TEXT NOT NULL,
                member_name TEXT NOT NULL,
                role TEXT DEFAULT 'member',
                joined_at TEXT,
                UNIQUE (family_code, member_name)
            )
            """,
        )

        # 既有資料庫可能是 Streamlit 版或更早的 v11 建的，缺的欄位在這裡補。
        food_columns = _table_columns(conn, "foods")
        _add_column_if_missing(
            conn,
            "foods",
            food_columns,
            "storage_location",
            f"TEXT DEFAULT '{DEFAULT_STORAGE_LOCATION}'",
        )
        _add_column_if_missing(conn, "foods", food_columns, "price", "INTEGER DEFAULT 0")

        member_columns = _table_columns(conn, "family_members")
        _add_column_if_missing(conn, "family_members", member_columns, "role", "TEXT DEFAULT 'member'")

        # ALTER TABLE 補上的欄位在舊資料列是 NULL，一起補成預設值，前端就不會拿到空的儲存位置。
        execute(
            conn,
            """
            UPDATE foods
            SET storage_location = {p}
            WHERE storage_location IS NULL OR TRIM(storage_location) = ''
            """.format(p=placeholder()),
            (DEFAULT_STORAGE_LOCATION,),
        )
        execute(
            conn,
            """
            UPDATE family_members
            SET role = 'member'
            WHERE role IS NULL OR TRIM(role) = ''
            """,
        )
