import sqlite3
from datetime import datetime
from pathlib import Path
from typing import Iterable


BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
DB_PATH = DATA_DIR / "fridge.db"
DEFAULT_FAMILY_CODE = "demo-home"


def get_connection() -> sqlite3.Connection:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def _get_columns(conn: sqlite3.Connection, table_name: str) -> set[str]:
    rows = conn.execute(f"PRAGMA table_info({table_name})").fetchall()
    return {row["name"] for row in rows}


def _add_column_if_missing(
    conn: sqlite3.Connection,
    existing_columns: set[str],
    column_name: str,
    column_definition: str,
) -> None:
    if column_name not in existing_columns:
        conn.execute(f"ALTER TABLE foods ADD COLUMN {column_name} {column_definition}")
        existing_columns.add(column_name)


def init_db() -> None:
    """Create or migrate the SQLite database for the current app version."""
    with get_connection() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS foods (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
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
            """
        )

        existing_columns = _get_columns(conn, "foods")
        _add_column_if_missing(conn, existing_columns, "family_code", "TEXT DEFAULT 'demo-home'")
        _add_column_if_missing(conn, existing_columns, "added_by", "TEXT")
        _add_column_if_missing(conn, existing_columns, "used_by", "TEXT")
        _add_column_if_missing(conn, existing_columns, "used_at", "TEXT")

        conn.execute(
            """
            UPDATE foods
            SET family_code = ?
            WHERE family_code IS NULL OR TRIM(family_code) = ''
            """,
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
    with get_connection() as conn:
        conn.execute(
            """
            INSERT INTO foods
                (
                    family_code, name, category, quantity, purchase_date,
                    expiry_date, note, status, added_by, created_at
                )
            VALUES
                (?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)
            """,
            (
                normalize_family_code(family_code),
                name,
                category,
                quantity,
                purchase_date,
                expiry_date,
                note,
                added_by,
                created_at,
            ),
        )
        conn.commit()


def get_all_foods(family_code: str) -> list[dict]:
    with get_connection() as conn:
        rows: Iterable[sqlite3.Row] = conn.execute(
            """
            SELECT
                id, family_code, name, category, quantity, purchase_date,
                expiry_date, note, status, added_by, used_by, used_at, created_at
            FROM foods
            WHERE family_code = ?
            ORDER BY expiry_date ASC
            """,
            (normalize_family_code(family_code),),
        ).fetchall()
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

    with get_connection() as conn:
        conn.execute(
            """
            UPDATE foods
            SET status = ?, used_by = ?, used_at = ?
            WHERE id = ? AND family_code = ?
            """,
            (status, normalized_used_by, used_at, food_id, normalized_family_code),
        )
        conn.commit()


def delete_food(food_id: int, family_code: str) -> None:
    with get_connection() as conn:
        conn.execute(
            "DELETE FROM foods WHERE id = ? AND family_code = ?",
            (food_id, normalize_family_code(family_code)),
        )
        conn.commit()
