from datetime import date, datetime

import pandas as pd
import streamlit as st

from src.database import (
    add_food,
    configure_database,
    create_family,
    delete_food,
    get_database_label,
    get_all_foods,
    get_family,
    get_family_members,
    init_db,
    join_family,
    normalize_family_code,
    update_food,
    update_food_status,
)
from src.food_manager import (
    CATEGORIES,
    apply_food_filter,
    enrich_food_records,
    get_dashboard_stats,
    sort_foods,
)
from src.utils import parse_date


EMPTY_TEXT = "未記錄"


st.set_page_config(
    page_title="食材期限管理工具",
    page_icon="🥬",
    layout="wide",
)


def load_foods(family_code: str) -> pd.DataFrame:
    """讀取指定家庭的食材，並補上剩餘天數與狀態標籤。"""
    records = get_all_foods(family_code)
    return enrich_food_records(records)


def get_database_url_from_secrets() -> str | None:
    # Streamlit Cloud 的 DATABASE_URL 會放在 Secrets；本機沒有設定時回傳 None。
    try:
        return st.secrets.get("DATABASE_URL")
    except Exception:
        return None


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


def display_text(value: object, fallback: str = EMPTY_TEXT) -> str:
    if pd.isna(value):
        return fallback
    text = str(value).strip()
    if not text or text.lower() in {"none", "nan", "nat"}:
        return fallback
    return text


def display_timestamp(value: object, fallback: str = EMPTY_TEXT) -> str:
    # 資料庫存 ISO 格式，畫面顯示時轉成比較好讀的時間。
    text = display_text(value, "")
    if not text:
        return fallback
    try:
        return datetime.fromisoformat(text).strftime("%Y-%m-%d %H:%M")
    except ValueError:
        return text.replace("T", " ")


def prepare_display_dataframe(
    df: pd.DataFrame,
    columns: list[str],
    rename_map: dict[str, str],
) -> pd.DataFrame:
    # Streamlit dataframe 會直接顯示 None，先整理成使用者看得懂的文字。
    display_df = df[columns].rename(columns=rename_map).copy()
    for column in display_df.columns:
        if column == "剩餘天數":
            continue
        if "時間" in column or column in {"最後更新"}:
            display_df[column] = display_df[column].apply(display_timestamp)
        else:
            display_df[column] = display_df[column].apply(display_text)
    return display_df


def get_date_input_value(value: object) -> date:
    # date_input 需要 date 物件；舊資料若日期為空，就用今天當預設值。
    if pd.isna(value) or not str(value).strip():
        return date.today()
    return parse_date(str(value))


def render_food_table(df: pd.DataFrame) -> None:
    display_df = prepare_display_dataframe(
        df,
        [
            "name",
            "category",
            "quantity",
            "price",
            "expiry_date",
            "days_left",
            "status_label",
            "added_by",
            "updated_by",
            "note",
        ],
        {
            "name": "名稱",
            "category": "分類",
            "quantity": "數量",
            "price": "金額（NT$）",
            "expiry_date": "到期日期",
            "days_left": "剩餘天數",
            "status_label": "狀態",
            "added_by": "新增者",
            "updated_by": "最後更新者",
            "note": "備註",
        },
    )
    st.dataframe(display_df, use_container_width=True, hide_index=True)


def render_dashboard_section(title: str, df: pd.DataFrame, empty_message: str) -> None:
    st.markdown(f"#### {title}")
    if df.empty:
        st.caption(empty_message)
        return
    render_food_table(sort_foods(df, "到期日由近到遠"))


def render_family_sidebar() -> tuple[str, str]:
    # 家庭設定存在 session_state，切換頁面時會保留目前家庭與成員。
    if "family_code" not in st.session_state:
        st.session_state.family_code = "demo-home"
    if "family_name" not in st.session_state:
        st.session_state.family_name = "示範家庭"
    if "invite_code" not in st.session_state:
        st.session_state.invite_code = "demo123"
    if "member_name" not in st.session_state:
        st.session_state.member_name = "訪客"

    with st.sidebar.form("family_profile_form"):
        st.subheader("家庭設定")
        action = st.radio("操作", ["加入家庭", "建立家庭"], horizontal=True)
        family_code_input = st.text_input(
            "家庭代碼",
            value=st.session_state.family_code,
            help="同一個家庭代碼會共用同一份冰箱資料。",
        )
        family_name_input = st.text_input(
            "家庭名稱",
            value=st.session_state.family_name,
            help="建立家庭時會儲存這個顯示名稱。",
        )
        invite_code_input = st.text_input(
            "邀請碼",
            value=st.session_state.invite_code,
            type="password",
            help="家人需要輸入正確邀請碼才能加入同一個家庭。",
        )
        member_name_input = st.text_input(
            "成員名稱",
            value=st.session_state.member_name,
            help="用來記錄誰新增或處理食材。",
        )
        submitted = st.form_submit_button("套用")

    if submitted:
        normalized_family_code = normalize_family_code(family_code_input)
        member_name = member_name_input.strip() or "訪客"

        try:
            if action == "建立家庭":
                family = create_family(
                    family_code=normalized_family_code,
                    family_name=family_name_input,
                    invite_code=invite_code_input,
                    member_name=member_name,
                )
                st.sidebar.success(f"已建立家庭：{family.get('family_name', normalized_family_code)}")
            else:
                family = join_family(
                    family_code=normalized_family_code,
                    invite_code=invite_code_input,
                    member_name=member_name,
                )
                st.sidebar.success(f"已加入家庭：{family.get('family_name', normalized_family_code)}")

            st.session_state.family_code = normalized_family_code
            st.session_state.family_name = family.get("family_name", family_name_input)
            st.session_state.invite_code = invite_code_input.strip()
            st.session_state.member_name = member_name
        except ValueError as error:
            st.sidebar.error(str(error))

    family_code = normalize_family_code(st.session_state.family_code)
    member_name = st.session_state.member_name.strip() or "訪客"
    family = get_family(family_code)
    members = get_family_members(family_code) if family else []

    st.sidebar.caption(f"資料庫：{get_database_label()}")
    if family:
        st.sidebar.caption(f"目前家庭名稱：{family.get('family_name') or family_code}")
    st.sidebar.caption(f"目前家庭：`{family_code}`")
    st.sidebar.caption(f"目前成員：{member_name}")
    if members:
        st.sidebar.caption("家庭成員：")
        for member in members:
            joined_at = display_text(member.get("joined_at"), "")
            joined_text = f"（{display_timestamp(joined_at)} 加入）" if joined_at else ""
            st.sidebar.caption(f"- {member['member_name']}{joined_text}")

    return family_code, member_name


def render_dashboard(df: pd.DataFrame, family_code: str) -> None:
    st.title("食材期限總覽")
    st.caption("快速掌握冰箱裡最需要優先處理的食材。")
    st.info(f"目前顯示家庭代碼 `{family_code}` 的共用冰箱資料。")

    stats = get_dashboard_stats(df)
    col1, col2, col3, col4, col5 = st.columns(5)
    col1.metric("總食材數", stats["total"])
    col2.metric("7 天內到期數", stats["due_within_7_days"])
    col3.metric("今天到期數", stats["due_today"])
    col4.metric("已過期數", stats["expired"])
    col5.metric("冰箱食材金額", f"NT$ {stats['total_value']:,}")

    st.divider()
    urgent_df = df[df["status"] == "active"] if not df.empty else df
    if urgent_df.empty:
        st.success("目前沒有需要優先處理的食材。")
        return

    expired_df = urgent_df[urgent_df["days_left"] < 0]
    today_df = urgent_df[urgent_df["days_left"] == 0]
    soon_df = urgent_df[urgent_df["days_left"].between(1, 7)]

    st.subheader("分區提醒")
    render_dashboard_section("已過期", expired_df, "目前沒有已過期食材。")
    render_dashboard_section("今天到期", today_df, "目前沒有今天到期食材。")
    render_dashboard_section("7 天內到期", soon_df, "目前沒有 7 天內到期食材。")

    st.subheader("最急需處理的食材")
    render_food_table(sort_foods(urgent_df, "到期日由近到遠").head(8))


def render_add_food_form(family_code: str, member_name: str) -> None:
    st.title("新增食材")
    st.caption("記錄冰箱食材與到期日期，讓期限管理更直覺。")
    st.info(f"新增到 `{family_code}` 的共用冰箱，新增者：{member_name}")

    with st.form("add_food_form", clear_on_submit=True):
        name = st.text_input("食材名稱", placeholder="例如：雞胸肉、牛奶、青江菜")
        category = st.selectbox("分類", CATEGORIES, index=0)
        quantity = st.text_input("數量", placeholder="例如：1 包、500g、2 瓶")
        price = st.number_input("購買金額（NT$）", min_value=0, step=1, help="記錄這筆食材的實際購買金額。")

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
                family_code=family_code,
                name=name.strip(),
                category=category,
                quantity=quantity.strip(),
                price=int(price),
                purchase_date=purchase_date.isoformat(),
                expiry_date=expiry_date.isoformat(),
                note=note.strip(),
                added_by=member_name,
            )
            st.success(f"已新增「{name.strip()}」。")
            st.rerun()


def render_food_list(df: pd.DataFrame, family_code: str, member_name: str) -> None:
    st.title("食材清單")
    st.caption("篩選、排序並管理每一筆食材。")
    st.info(f"目前管理 `{family_code}` 的共用冰箱，操作者：{member_name}")

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
                st.write(f"分類：{display_text(row['category'], '未分類')}")
                st.write(f"數量：{display_text(row['quantity'], '未填寫')}")
                st.write(f"金額：NT$ {int(row['price'] or 0):,}")
                st.write(f"新增者：{display_text(row['added_by'])}")
                updated_by = display_text(row["updated_by"], "")
                if updated_by:
                    st.write(f"最後更新者：{updated_by}")
                used_by = display_text(row["used_by"], "")
                if used_by:
                    st.write(f"處理者：{used_by}")
                note = display_text(row["note"], "")
                if note:
                    st.write(f"備註：{note}")

            with col_dates:
                st.write(f"購買日期：{display_text(row['purchase_date'], '未填寫')}")
                st.write(f"到期日期：{display_text(row['expiry_date'])}")
                st.write(f"剩餘天數：{row['days_left']}")
                if display_text(row["updated_at"], ""):
                    st.write(f"最後更新：{display_timestamp(row['updated_at'])}")
                st.markdown(render_status_badge(row["status_label"]), unsafe_allow_html=True)

            with col_actions:
                if row["status"] != "used":
                    if st.button("標記已使用", key=f"use_{row['id']}"):
                        update_food_status(
                            int(row["id"]),
                            "used",
                            family_code=family_code,
                            used_by=member_name,
                        )
                        st.success(f"已將「{row['name']}」標記為已使用。")
                        st.rerun()
                else:
                    st.caption("已使用")

                if st.button("刪除", key=f"delete_{row['id']}"):
                    delete_food(int(row["id"]), family_code=family_code)
                    st.warning(f"已刪除「{row['name']}」。")
                    st.rerun()

            with st.expander("編輯食材"):
                category_index = CATEGORIES.index(row["category"]) if row["category"] in CATEGORIES else 0
                with st.form(f"edit_food_form_{row['id']}"):
                    edit_name = st.text_input(
                        "食材名稱",
                        value=display_text(row["name"], ""),
                        key=f"edit_name_{row['id']}",
                    )
                    edit_category = st.selectbox(
                        "分類",
                        CATEGORIES,
                        index=category_index,
                        key=f"edit_category_{row['id']}",
                    )
                    edit_quantity = st.text_input(
                        "數量",
                        value=display_text(row["quantity"], ""),
                        key=f"edit_quantity_{row['id']}",
                    )
                    edit_price = st.number_input(
                        "購買金額（NT$）",
                        min_value=0,
                        step=1,
                        value=int(row["price"] or 0),
                        key=f"edit_price_{row['id']}",
                    )
                    edit_col1, edit_col2 = st.columns(2)
                    edit_purchase_date = edit_col1.date_input(
                        "購買日期",
                        value=get_date_input_value(row["purchase_date"]),
                        key=f"edit_purchase_{row['id']}",
                    )
                    edit_expiry_date = edit_col2.date_input(
                        "到期日期",
                        value=get_date_input_value(row["expiry_date"]),
                        key=f"edit_expiry_{row['id']}",
                    )
                    edit_note = st.text_area(
                        "備註",
                        value=display_text(row["note"], ""),
                        key=f"edit_note_{row['id']}",
                    )
                    edit_submitted = st.form_submit_button("儲存修改")

                if edit_submitted:
                    if not edit_name.strip():
                        st.error("請輸入食材名稱。")
                    elif edit_expiry_date < edit_purchase_date:
                        st.error("到期日期不能早於購買日期。")
                    else:
                        update_food(
                            food_id=int(row["id"]),
                            family_code=family_code,
                            name=edit_name.strip(),
                            category=edit_category,
                            quantity=edit_quantity.strip(),
                            price=int(edit_price),
                            purchase_date=edit_purchase_date.isoformat(),
                            expiry_date=edit_expiry_date.isoformat(),
                            note=edit_note.strip(),
                            updated_by=member_name,
                        )
                        st.success(f"已更新「{edit_name.strip()}」。")
                        st.rerun()

    st.divider()
    table_df = prepare_display_dataframe(
        filtered_df,
        [
            "name",
            "category",
            "quantity",
            "price",
            "purchase_date",
            "expiry_date",
            "days_left",
            "status_label",
            "added_by",
            "used_by",
            "updated_by",
            "updated_at",
            "note",
        ],
        {
            "name": "名稱",
            "category": "分類",
            "quantity": "數量",
            "price": "金額（NT$）",
            "purchase_date": "購買日期",
            "expiry_date": "到期日期",
            "days_left": "剩餘天數",
            "status_label": "狀態標籤",
            "added_by": "新增者",
            "used_by": "處理者",
            "updated_by": "最後更新者",
            "updated_at": "最後更新時間",
            "note": "備註",
        },
    )
    st.subheader("表格檢視")
    st.dataframe(table_df, use_container_width=True, hide_index=True)


def render_about() -> None:
    st.title("關於專案")
    st.write(
        "這是一個使用 Python、Streamlit、SQLite 與 PostgreSQL 製作的食材期限管理工具。"
        "Streamlit 資料工具版持續保留，並同步支援 v10 的採買金額欄位。"
    )
    st.write(f"目前資料庫模式：{get_database_label()}")

    st.subheader("目前功能")
    st.write("- Streamlit Secrets 設定 `DATABASE_URL` 後可使用 PostgreSQL")
    st.write("- 未設定 `DATABASE_URL` 時會使用本機 SQLite")
    st.write("- 建立家庭、加入家庭與邀請碼檢查")
    st.write("- 家庭成員列表顯示")
    st.write("- 家庭代碼共用冰箱資料")
    st.write("- 成員名稱記錄新增者與處理者")
    st.write("- 新增食材與到期日期")
    st.write("- 記錄採買金額與計算冰箱食材總金額")
    st.write("- 編輯既有食材資料")
    st.write("- 記錄最後更新者與最後更新時間")
    st.write("- 自動計算剩餘天數與狀態標籤")
    st.write("- 期限總覽統計、分區提醒與最急需處理清單")
    st.write("- 食材篩選、排序、標記已使用與刪除")
    st.write("- 空值顯示為「未記錄」，避免畫面出現工程用字")

    st.subheader("未加入的功能")
    st.write("正式登入、LINE 通知、OCR、AI 食譜推薦與 App 版本會先放在 Roadmap。")


def main() -> None:
    configure_database(get_database_url_from_secrets())
    init_db()

    st.sidebar.title("食材期限管理工具")
    family_code, member_name = render_family_sidebar()
    foods_df = load_foods(family_code)

    page = st.sidebar.radio(
        "選單",
        ["期限總覽", "新增食材", "食材清單", "關於專案"],
    )
    st.sidebar.caption("v10 資料工具版：支援家庭共用、期限管理與採買金額。")

    if page == "期限總覽":
        render_dashboard(foods_df, family_code)
    elif page == "新增食材":
        render_add_food_form(family_code, member_name)
    elif page == "食材清單":
        render_food_list(foods_df, family_code, member_name)
    else:
        render_about()


if __name__ == "__main__":
    main()
