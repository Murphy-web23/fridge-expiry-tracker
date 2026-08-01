# v12 API 與資料契約

## 目標

Streamlit 版本直接操作資料庫，React 前端則透過這一層 API 讀取與修改同一份資料。

v9 讓 React 前端串接 FastAPI。v10 再加入家庭清單、採買金額與數量增減 API。
v12 把後端從記憶體 mock data 換成真正的資料庫：本機用 SQLite，設定 `DATABASE_URL` 後改用 PostgreSQL，
資料表與 Streamlit 版共用，因此兩個版本看到同一個冰箱。

## 資料保存

| 環境 | 條件 | 實際位置 |
| --- | --- | --- |
| 本機開發 | 沒有設定 `DATABASE_URL` | `data/fridge.db`（可用 `FRIDGE_DB_PATH` 換成別的檔案） |
| 雲端部署 | 有設定 `DATABASE_URL` | PostgreSQL |

後端啟動時會自動建表並補上缺少的欄位（例如舊資料庫沒有的 `storage_location`），
資料表全空時才寫入一次示範資料。

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
| GET | `/health` | 健康檢查，v12 起一併回報資料庫種類、位置與食材筆數 |
| GET | `/families` | 取得家庭選單 |
| GET | `/families/{family_code}` | 取得家庭資料 |
| GET | `/families/{family_code}/members` | 取得家庭成員 |
| GET | `/families/{family_code}/foods` | 取得家庭食材清單 |
| POST | `/families/{family_code}/foods` | 新增食材 |
| PUT | `/families/{family_code}/foods/{food_id}` | v11.2 完整編輯食材，含儲存位置 |
| DELETE | `/families/{family_code}/foods/{food_id}` | v11.2 刪除食材，成功回傳 204 |
| PATCH | `/families/{family_code}/foods/{food_id}/status` | 標記已使用或恢復 active |
| PATCH | `/families/{family_code}/foods/{food_id}/quantity` | 將食材數量增加或減少一個單位 |

v11.2 數量規則：數量減到 0 代表食材已經用完，後端會一併把狀態改成 `used` 並記錄使用者；
之後補貨讓數量回到 1 以上時，狀態會自動回到 `active`。

錯誤回應：

| 狀態碼 | 情境 |
| --- | --- |
| 404 | 找不到家庭或找不到食材 |
| 422 | 日期格式錯誤，或到期日期早於購買日期 |
| 400 | 這筆食材的數量沒有數字，無法用加減按鈕調整 |

尚未實作但已規劃：

| Method | Path | 說明 |
| --- | --- | --- |
| POST | `/families` | 建立家庭 |
| POST | `/families/{family_code}/join` | 使用邀請碼加入家庭 |

## 權限雛形

v6 先規劃角色，不急著正式實作。

| 角色 | 權限 |
| --- | --- |
| admin | 可建立家庭、重設邀請碼、刪除食材、管理成員 |
| member | 可新增、編輯、標記已使用食材 |
| viewer | 僅可查看資料 |

### Health

```json
{
  "status": "ok",
  "version": "v12",
  "database": "SQLite",
  "database_location": "C:/.../data/fridge.db",
  "food_count": 4
}
```

`database_location` 在 PostgreSQL 只回主機名稱，不會把連線字串裡的帳號密碼送到前端。

## 後續實作方向

1. 補上建立家庭與邀請碼加入家庭的 API，讓 React 版也能自己開新家庭。
2. 若要正式公開，需改用真正帳號登入與密碼雜湊（v13 重點）。
3. 食材筆數變多後，`foods` 可以再加上 `family_code` 與 `expiry_date` 的索引。
