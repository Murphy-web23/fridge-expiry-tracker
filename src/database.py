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
    """Configure the database URL from Streamlit secrets or environment variables."""
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


def _add_column_if_missing(conn, existing_columns: set[str], column_name: str, column_definition: str) -> None:
    if use_postgres():
        _execute(conn, f"ALTER TABLE foods ADD COLUMN IF NOT EXISTS {column_name} {column_definition}")
        existing_columns.add(column_name)
    elif column_name not in existing_columns:
        conn.execute(f"ALTER TABLE foods ADD COLUMN {column_name} {column_definition}")
        existing_columns.add(column_name)


def init_db() -> None:
    """Create or migrate the foods table for SQLite or PostgreSQL."""
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
                purchase_date TEXT,
                expiry_date TEXT NOT NULL,
                note TEXT,
                status TEXT DEFAULT 'active',
                added_by TEXT,
                used_by TEXT,
                used_at TEXT,
                created_at TEXT
            )
            """,
        )

        existing_columns = _get_columns(conn, "foods")
        _add_column_if_missing(conn, existing_columns, "family_code", "TEXT DEFAULT 'demo-home'")
        _add_column_if_missing(conn, existing_columns, "added_by", "TEXT")
        _add_column_if_missing(conn, existing_columns, "used_by", "TEXT")
        _add_column_if_missing(conn, existing_columns, "used_at", "TEXT")

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
        conn.commit()


def normalize_family_code(family_code: str) -> str:
    cleaned_code = family_code.strip().lower().replace(" ", "-")
    return cleaned_code or DEFAULT_FAMILY_CODE


def add_food(
    family_code: str,
    name: str,
    category: str,
    quantity: str,
    purchase_date: str,
    expiry_date: str,
    note: str,
    added_by: str,
) -> None:
    created_at = datetime.now().isoformat(timespec="seconds")
    placeholder = _placeholder()
    placeholders = ", ".join([placeholder] * 10)
    with closing(get_connection()) as conn:
        _execute(
            conn,
            """
            INSERT INTO foods
                (
                    family_code, name, category, quantity, purchase_date,
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
                id, family_code, name, category, quantity, purchase_date,
                expiry_date, note, status, added_by, used_by, used_at, created_at
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
            SET status = {p}, used_by = {p}, used_at = {p}
            WHERE id = {p} AND family_code = {p}
            """.format(p=placeholder),
            (status, normalized_used_by, used_at, food_id, normalized_family_code),
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
