# FastAPI 後端

v9 開始提供 React 前端串接，v10 補上採買金額、家庭清單與數量增減 API，v11.2 補上完整編輯與刪除 API，
v12 把資料從記憶體 mock data 換成真正的資料庫，重啟服務後資料仍然存在。

目前重點：

- 資料保存在 SQLite 或 PostgreSQL，重啟後不會回到預設值
- 啟動時自動建表、補欄位，並在資料表全空時寫入一次示範資料
- 與 Streamlit 版共用同一組資料表，本機預設讀寫同一個 `data/fridge.db`
- 提供健康檢查 API，一併回報目前使用的資料庫與食材筆數
- 提供家庭資料 API
- 提供家庭成員 API
- 提供食材清單 API
- 支援新增食材
- 支援完整編輯食材，包含儲存位置
- 支援刪除食材
- 支援標記已使用
- 支援採買金額欄位
- 支援食材數量增加或減少
- 數量歸零時自動標記為已使用，補貨後自動回到可使用狀態
- 驗證日期格式與到期日期不早於購買日期
- 提供家庭清單，讓前端可以切換家庭
- 允許本機 Vite 前端呼叫 API

## 程式結構

| 檔案 | 負責的事 |
| --- | --- |
| `app/main.py` | FastAPI 路由與啟動流程 |
| `app/models.py` | Pydantic 請求與回應模型、欄位驗證 |
| `app/db.py` | 資料庫連線、建表與欄位遷移，SQLite 與 PostgreSQL 共用 |
| `app/repository.py` | 家庭與食材的 SQL 讀寫 |
| `app/food_rules.py` | 剩餘天數、狀態標籤與數量增減規則，純函式不碰資料庫 |
| `app/seed_data.py` | 第一次啟動時寫入的示範家庭、成員與食材 |

## 執行方式

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8008
```

啟動後可開啟：

```text
http://127.0.0.1:8008/docs
```

## 資料庫設定

| 環境變數 | 用途 |
| --- | --- |
| `DATABASE_URL` | 設定後改用 PostgreSQL，例如 `postgresql://user:password@host:5432/db?sslmode=require` |
| `FRIDGE_DB_PATH` | 沒有 `DATABASE_URL` 時，指定 SQLite 檔案位置，預設是專案根目錄的 `data/fridge.db` |

兩個都沒設定就是本機開發模式，資料寫進 `data/fridge.db`，這個檔案已被 `.gitignore` 擋掉。

## 測試

```bash
cd backend
python -m unittest discover -s tests -t .
```

測試會把 `FRIDGE_DB_PATH` 指到暫存資料庫，不會動到開發用的 `data/fridge.db`。
