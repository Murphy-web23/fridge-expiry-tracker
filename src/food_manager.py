from datetime import date

import pandas as pd

from src.utils import parse_date


CATEGORIES = [
    "蔬菜",
    "水果",
    "肉類",
    "海鮮",
    "乳製品",
    "冷凍食品",
    "飲料",
    "調味料",
    "其他",
]


def calculate_days_left(expiry_date: str, today: date | None = None) -> int:
    today = today or date.today()
    parsed_expiry_date = parse_date(expiry_date)
    return (parsed_expiry_date - today).days


def get_status_label(status: str, days_left: int) -> str:
    if status == "used":
        return "Used"
    if days_left < 0:
        return "Expired"
    if days_left == 0:
        return "Today"
    if 0 < days_left <= 7:
        return "Soon"
    return "Safe"


def enrich_food_records(records: list[dict]) -> pd.DataFrame:
    columns = [
        "id",
        "family_code",
        "name",
        "category",
        "quantity",
        "purchase_date",
        "expiry_date",
        "note",
        "status",
        "added_by",
        "used_by",
        "used_at",
        "created_at",
    ]
    df = pd.DataFrame(records, columns=columns)
    if df.empty:
        return df.assign(days_left=pd.Series(dtype="int"), status_label=pd.Series(dtype="str"))

    df["days_left"] = df["expiry_date"].apply(calculate_days_left)
    df["status_label"] = df.apply(
        lambda row: get_status_label(row["status"], int(row["days_left"])),
        axis=1,
    )
    return df


def get_dashboard_stats(df: pd.DataFrame) -> dict[str, int]:
    active_df = df[df["status"] == "active"] if not df.empty else df
    if active_df.empty:
        return {
            "total": 0,
            "due_within_7_days": 0,
            "due_today": 0,
            "expired": 0,
        }

    return {
        "total": int(len(active_df)),
        "due_within_7_days": int(active_df["days_left"].between(0, 7).sum()),
        "due_today": int((active_df["days_left"] == 0).sum()),
        "expired": int((active_df["days_left"] < 0).sum()),
    }


def apply_food_filter(
    df: pd.DataFrame,
    filter_option: str,
    category_option: str,
) -> pd.DataFrame:
    if df.empty:
        return df

    filtered_df = df.copy()

    if filter_option == "7 天內到期":
        filtered_df = filtered_df[
            (filtered_df["status"] == "active") & (filtered_df["days_left"].between(0, 7))
        ]
    elif filter_option == "今天到期":
        filtered_df = filtered_df[
            (filtered_df["status"] == "active") & (filtered_df["days_left"] == 0)
        ]
    elif filter_option == "已過期":
        filtered_df = filtered_df[
            (filtered_df["status"] == "active") & (filtered_df["days_left"] < 0)
        ]
    elif filter_option == "已使用":
        filtered_df = filtered_df[filtered_df["status"] == "used"]

    if category_option != "全部":
        filtered_df = filtered_df[filtered_df["category"] == category_option]

    return filtered_df


def sort_foods(df: pd.DataFrame, sort_option: str) -> pd.DataFrame:
    if df.empty:
        return df

    if sort_option == "到期日由遠到近":
        return df.sort_values(by="expiry_date", ascending=False)
    if sort_option == "建立時間由新到舊":
        return df.sort_values(by="created_at", ascending=False)
    if sort_option == "分類":
        return df.sort_values(by=["category", "expiry_date"], ascending=[True, True])
    return df.sort_values(by="expiry_date", ascending=True)
