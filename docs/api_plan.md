# v10 API 與資料契約

## 目標

目前 Streamlit 版本直接操作資料庫。未來若要做 React / Next.js 前端展示版，會需要一層 API 讓前端可以讀取與修改資料。

v9 讓 React 前端串接 FastAPI。v10 再加入家庭清單、採買金額與數量增減 API，後續版本再將 API 連接 PostgreSQL。

## 資料物件

### Food

```json
{
  "id": 1,
  "family_code": "demo-home",
  "name": "牛奶",
  "category": "乳製品",
  "storage_location": "冰箱冷藏",
  "quantity": "1 瓶",
  "price": 95,
  "purchase_date": "2026-07-05",
  "expiry_date": "2026-07-11",
  "days_left": -6,
  "status": "active",
  "status_label": "Expired",
  "note": "未開封",
  "added_by": "Murphy",
  "used_by": null,
  "used_at": null,
  "updated_by": null,
  "updated_at": null,
  "created_at": "2026-07-05T20:30:00"
}
```

### Family

```json
{
  "family_code": "demo-home",
  "family_name": "示範家庭",
  "created_at": "2026-07-16T15:29:15"
}
```

### Member

```json
{
  "family_code": "demo-home",
  "member_name": "Murphy",
  "role": "admin",
  "joined_at": "2026-07-16T15:29:15"
}
```

## 已實作 API

| Method | Path | 說明 |
| --- | --- | --- |
| GET | `/health` | 健康檢查 |
| GET | `/families` | 取得家庭選單 |
| GET | `/families/{family_code}` | 取得家庭資料 |
| GET | `/families/{family_code}/members` | 取得家庭成員 |
| GET | `/families/{family_code}/foods` | 取得家庭食材清單 |
| POST | `/families/{family_code}/foods` | 新增食材 |
| PATCH | `/families/{family_code}/foods/{food_id}/status` | 標記已使用或恢復 active |
| PATCH | `/families/{family_code}/foods/{food_id}/quantity` | 將食材數量增加或減少一個單位 |

尚未實作但已規劃：

| Method | Path | 說明 |
| --- | --- | --- |
| POST | `/families` | 建立家庭 |
| POST | `/families/{family_code}/join` | 使用邀請碼加入家庭 |
| PATCH | `/families/{family_code}/foods/{food_id}` | 編輯食材 |
| DELETE | `/families/{family_code}/foods/{food_id}` | 刪除食材 |

## 權限雛形

v6 先規劃角色，不急著正式實作。

| 角色 | 權限 |
| --- | --- |
| admin | 可建立家庭、重設邀請碼、刪除食材、管理成員 |
| member | 可新增、編輯、標記已使用食材 |
| viewer | 僅可查看資料 |

## 後續實作方向

1. 將目前 `src/database.py` 的資料庫操作整理成可重用 service。
2. 將 FastAPI 後端接上 PostgreSQL。
3. 補上編輯與刪除食材 API。
4. 若要正式公開，需改用真正帳號登入與密碼雜湊。
