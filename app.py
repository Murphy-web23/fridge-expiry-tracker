from datetime import date

import pandas as pd
import streamlit as st

from src.database import (
    add_food,
    delete_food,
    get_all_foods,
    init_db,
    update_food_status,
)
from src.food_manager import (
    CATEGORIES,
    apply_food_filter,
    enrich_food_records,
    get_dashboard_stats,
    sort_foods,
)


st.set_page_config(
    page_title="食材期限管理工具",
    page_icon="🥬",
    layout="wide",
)


def load_foods() -> pd.DataFrame:
    """Read foods from SQLite and append calculated fields for the UI."""
    records = get_all_foods()
    return enrich_food_records(records)


def render_status_badge(status_label: str) -> str:
    color_map = {
        "Used": "#64748b",
        "Expired": "#dc2626",
        "Today": "#d97706",
        "Soon": "#ca8a04",
        "Safe": "#16a34a",
    }
    color = color_map.get(status_label, "#334155")
    return (
        f"<span style='background:{color};color:white;padding:0.2rem 0.55rem;"
        f"border-radius:999px;font-size:0.82rem;'>{status_label}</span>"
    )


def render_dashboard(df: pd.DataFrame) -> None:
    st.title("食材期限管理 Dashboard")
    st.caption("快速掌握冰箱裡最需要優先處理的食材。")

    stats = get_dashboard_stats(df)
    col1, col2, col3, col4 = st.columns(4)
    col1.metric("總食材數", stats["total"])
    col2.metric("7 天內到期數", stats["due_within_7_days"])
    col3.metric("今天到期數", stats["due_today"])
    col4.metric("已過期數", stats["expired"])

    st.divider()
    st.subheader("最急需處理的食材")
    urgent_df = df[df["status"] == "active"] if not df.empty else df
    urgent_df = sort_foods(urgent_df, "到期日由近到遠").head(8)

    if urgent_df.empty:
        st.success("目前沒有需要處理的 active 食材。")
        return

    display_df = urgent_df[
        ["name", "category", "quantity", "expiry_date", "days_left", "status_label", "note"]
    ].rename(
        columns={
            "name": "名稱",
            "category": "分類",
            "quantity": "數量",
            "expiry_date": "到期日期",
            "days_left": "剩餘天數",
            "status_label": "狀態",
            "note": "備註",
        }
    )
    st.dataframe(display_df, use_container_width=True, hide_index=True)


def render_add_food_form() -> None:
    st.title("新增食材")
    st.caption("記錄冰箱食材與到期日期，讓期限管理更直覺。")

    with st.form("add_food_form", clear_on_submit=True):
        name = st.text_input("食材名稱", placeholder="例如：雞胸肉、牛奶、青江菜")
        category = st.selectbox("分類", CATEGORIES, index=0)
        quantity = st.text_input("數量", placeholder="例如：1 包、500g、2 瓶")

        col1, col2 = st.columns(2)
        purchase_date = col1.date_input("購買日期", value=date.today())
        expiry_date = col2.date_input("到期日期", value=date.today())

        note = st.text_area("備註", placeholder="例如：已開封、冷凍保存、家人要吃")
        submitted = st.form_submit_button("新增食材", type="primary")

    if submitted:
        if not name.strip():
            st.error("請輸入食材名稱。")
        elif expiry_date < purchase_date:
            st.error("到期日期不能早於購買日期。")
        else:
            add_food(
                name=name.strip(),
                category=category,
                quantity=quantity.strip(),
                purchase_date=purchase_date.isoformat(),
                expiry_date=expiry_date.isoformat(),
                note=note.strip(),
            )
            st.success(f"已新增「{name.strip()}」。")
            st.rerun()


def render_food_list(df: pd.DataFrame) -> None:
    st.title("食材清單")
    st.caption("篩選、排序並管理每一筆食材。")

    col1, col2, col3 = st.columns([1.1, 1.1, 1.2])
    filter_option = col1.selectbox(
        "期限狀態篩選",
        ["全部", "7 天內到期", "今天到期", "已過期", "已使用"],
    )
    category_option = col2.selectbox("分類篩選", ["全部"] + CATEGORIES)
    sort_option = col3.selectbox(
        "排序",
        ["到期日由近到遠", "到期日由遠到近", "建立時間由新到舊", "分類"],
    )

    filtered_df = apply_food_filter(df, filter_option, category_option)
    filtered_df = sort_foods(filtered_df, sort_option)

    if filtered_df.empty:
        st.info("目前沒有符合條件的食材。")
        return

    for _, row in filtered_df.iterrows():
        with st.container(border=True):
            col_info, col_dates, col_actions = st.columns([2.2, 1.6, 1])
            with col_info:
                st.subheader(row["name"])
                st.write(f"分類：{row['category'] or '未分類'}")
                st.write(f"數量：{row['quantity'] or '未填寫'}")
                if row["note"]:
                    st.write(f"備註：{row['note']}")

            with col_dates:
                st.write(f"購買日期：{row['purchase_date'] or '未填寫'}")
                st.write(f"到期日期：{row['expiry_date']}")
                st.write(f"剩餘天數：{row['days_left']}")
                st.markdown(render_status_badge(row["status_label"]), unsafe_allow_html=True)

            with col_actions:
                if row["status"] != "used":
                    if st.button("標記已使用", key=f"use_{row['id']}"):
                        update_food_status(int(row["id"]), "used")
                        st.success(f"已將「{row['name']}」標記為已使用。")
                        st.rerun()
                else:
                    st.caption("已使用")

                if st.button("刪除", key=f"delete_{row['id']}"):
                    delete_food(int(row["id"]))
                    st.warning(f"已刪除「{row['name']}」。")
                    st.rerun()

    st.divider()
    table_df = filtered_df[
        [
            "name",
            "category",
            "quantity",
            "purchase_date",
            "expiry_date",
            "days_left",
            "status_label",
            "note",
        ]
    ].rename(
        columns={
            "name": "名稱",
            "category": "分類",
            "quantity": "數量",
            "purchase_date": "購買日期",
            "expiry_date": "到期日期",
            "days_left": "剩餘天數",
            "status_label": "狀態標籤",
            "note": "備註",
        }
    )
    st.subheader("表格檢視")
    st.dataframe(table_df, use_container_width=True, hide_index=True)


def render_about() -> None:
    st.title("關於專案")
    st.write(
        "這是一個使用 Python、Streamlit 與 SQLite 製作的食材期限管理工具。"
        "v1 專注在穩定記錄、期限計算、Dashboard 統計、篩選排序與基本操作。"
    )
    st.write("資料會儲存在本機的 `data/fridge.db`，不會上傳到雲端。")

    st.subheader("v1 功能")
    st.write("- 新增食材與到期日期")
    st.write("- 自動計算剩餘天數與狀態標籤")
    st.write("- Dashboard 統計與最急需處理清單")
    st.write("- 食材篩選、排序、標記已使用與刪除")

    st.subheader("未加入的功能")
    st.write("LINE 通知、OCR、AI 食譜推薦與 App 版本會先放在 Roadmap，不放進 v1。")


def main() -> None:
    init_db()
    foods_df = load_foods()

    st.sidebar.title("食材期限管理工具")
    page = st.sidebar.radio(
        "選單",
        ["Dashboard", "新增食材", "食材清單", "關於專案"],
    )
    st.sidebar.caption("v1 版本：專注在穩定可展示的核心功能。")

    if page == "Dashboard":
        render_dashboard(foods_df)
    elif page == "新增食材":
        render_add_food_form()
    elif page == "食材清單":
        render_food_list(foods_df)
    else:
        render_about()


if __name__ == "__main__":
    main()
