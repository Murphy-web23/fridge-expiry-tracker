import sqlite3
from datetime import datetime
from pathlib import Path
from typing import Iterable


BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
DB_PATH = DATA_DIR / "fridge.db"


def get_connection() -> sqlite3.Connection:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    """Create the SQLite database and foods table when they do not exist."""
    with get_connection() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS foods (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                category TEXT,
                quantity TEXT,
                purchase_date TEXT,
                expiry_date TEXT NOT NULL,
                note TEXT,
                status TEXT DEFAULT 'active',
                created_at TEXT
            )
            """
        )
        conn.commit()


def add_food(
    name: str,
    category: str,
    quantity: str,
    purchase_date: str,
    expiry_date: str,
    note: str,
) -> None:
    created_at = datetime.now().isoformat(timespec="seconds")
    with get_connection() as conn:
        conn.execute(
            """
            INSERT INTO foods
                (name, category, quantity, purchase_date, expiry_date, note, status, created_at)
            VALUES
                (?, ?, ?, ?, ?, ?, 'active', ?)
            """,
            (name, category, quantity, purchase_date, expiry_date, note, created_at),
        )
        conn.commit()


def get_all_foods() -> list[dict]:
    with get_connection() as conn:
        rows: Iterable[sqlite3.Row] = conn.execute(
            """
            SELECT id, name, category, quantity, purchase_date, expiry_date, note, status, created_at
            FROM foods
            ORDER BY expiry_date ASC
            """
        ).fetchall()
    return [dict(row) for row in rows]


def update_food_status(food_id: int, status: str) -> None:
    if status not in {"active", "used"}:
        raise ValueError("status must be 'active' or 'used'")

    with get_connection() as conn:
        conn.execute("UPDATE foods SET status = ? WHERE id = ?", (status, food_id))
        conn.commit()


def delete_food(food_id: int) -> None:
    with get_connection() as conn:
        conn.execute("DELETE FROM foods WHERE id = ?", (food_id,))
        conn.commit()
