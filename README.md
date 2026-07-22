# 食材期限管理工具

Repository name: `fridge-expiry-tracker`

一個使用 Python、Streamlit、SQLite 與 PostgreSQL 製作的食材期限管理工具。使用者可以新增冰箱裡的食材、設定到期日期，系統會自動計算剩餘天數，並標示即將過期、今天到期、已過期與已使用的食材。

v7 新增 React / Vite 前端展示版。Streamlit 版本仍保留作為可操作的資料工具，前端展示版先使用 mock data 呈現更接近正式產品的介面。

## 專案動機

冰箱裡的食材常常因為忘記保存期限而浪費。這個專案希望用簡單的資料記錄、期限計算與總覽頁，幫助家庭成員一起掌握哪些食材需要優先處理。

對作品集來說，這個專案也可以展示：

- 使用 Streamlit 建立可互動的資料管理介面
- 使用 SQLite 做本機資料保存
- 使用 PostgreSQL 做雲端資料保存
- 將 UI、資料庫操作與期限計算拆分成不同模組
- 使用家庭代碼建立簡單的多人共享資料模型
- 使用邀請碼建立基礎加入流程，先不做正式登入
- 使用編輯功能與操作紀錄補強 CRUD 流程
- 將 Streamlit 原型整理成未來前後端分離專案的基礎規劃

## 功能特色

- 使用家庭代碼區分不同家庭的冰箱資料
- 可建立家庭並設定邀請碼
- 成員輸入正確邀請碼後可加入家庭
- 側邊欄顯示目前家庭名稱與成員列表
- 使用成員名稱記錄誰新增食材、誰標記已使用
- 新增食材名稱、分類、數量、購買日期、到期日期與備註
- 編輯既有食材資料，包含名稱、分類、數量、日期與備註
- 記錄最後更新者與最後更新時間
- 部署環境可使用 PostgreSQL 儲存資料
- 本機環境可使用 SQLite 儲存資料，資料庫位於 `data/fridge.db`
- 程式啟動時自動建立或更新 `foods` 資料表
- 自動計算剩餘天數 `days_left`
- 依規則顯示 `Used`、`Expired`、`Today`、`Soon`、`Safe` 狀態標籤
- 期限總覽顯示總食材數、7 天內到期數、今天到期數、已過期數
- Dashboard 分區顯示已過期、今天到期與 7 天內到期食材
- 顯示最急需處理的食材清單
- 支援期限狀態篩選、分類篩選與排序
- 支援標記已使用與刪除食材
- 空值統一顯示為「未記錄」，避免畫面出現 `None`
- 時間欄位轉成較好閱讀的格式
- v6 補上前端展示版與 API 資料契約規劃
- v7 新增 React / Vite 前端展示版，先以 mock data 展示產品介面
- 繁體中文介面，適合作為初學者作品集專案

## Demo Screenshots

以下截圖對應目前 v5.1 版本。v5.1 在 v5 的家庭共用、食材編輯與操作紀錄基礎上，整理空值顯示與時間格式。
v1 到 v5 截圖仍保留在 `assets/screenshots/`，各版本資料夾也有 `version_notes.txt` 記錄版本演進。

### v5.1 Dashboard 分區提醒

![v5.1 Dashboard 分區提醒畫面](assets/screenshots/v5_1/dashboard_polished.png)

### v5 新增食材

![v5 新增食材畫面](assets/screenshots/v5/add_food.png)

### v5 食材清單與編輯入口

![v5 食材清單與編輯入口畫面](assets/screenshots/v5/food_list_edit.png)

### v5 表格檢視與操作紀錄

![v5 表格檢視與操作紀錄畫面](assets/screenshots/v5/table_view.png)

## 使用技術

- Python
- Streamlit
- pandas
- SQLite `sqlite3`
- PostgreSQL
- psycopg2
- React
- Vite
- CSS

## v7 前端展示版

目前這個 repo 仍以 Streamlit 作為可執行的資料工具版本。v7 新增 `frontend/`，先用 React / Vite 與 mock data 做出更漂亮的前端展示版。

前端展示版目前包含：

- Dashboard 統計卡片
- 已過期、今天到期與 7 天內到期分區提醒
- 食材卡片
- 搜尋、分類篩選與排序
- 新增食材展示流程
- 家庭管理展示頁

相關文件：

- [前端展示版規劃](docs/frontend_plan.md)
- [API 與資料契約草案](docs/api_plan.md)

前端展示版執行方式：

```bash
cd frontend
npm install
npm run dev
```

## 版本演進

| 版本 | 更新重點 |
| --- | --- |
| v1 | 建立食材期限管理核心功能，包含新增、期限計算、Dashboard、篩選排序、標記已使用與刪除 |
| v2 | 加入家庭代碼與成員名稱，讓不同家庭可以共用各自的冰箱資料 |
| v3 | 支援 PostgreSQL，讓 Streamlit Cloud 部署後資料可以持久保存 |
| v4 | 加入建立家庭、加入家庭、邀請碼與家庭成員清單 |
| v5 | 加入食材編輯、最後更新者、最後更新時間與 Dashboard 分區提醒 |
| v5.1 | 優化空值顯示、時間格式與 README 版本演進整理 |
| v6 | 補上前端展示版規劃與 API 資料契約草案 |
| v7 | 新增 React / Vite 前端展示版與 mock data 互動 |

## 專案架構

```text
fridge-expiry-tracker/
├── app.py
├── README.md
├── requirements.txt
├── .gitignore
├── .streamlit/
│   └── secrets.toml.example
├── data/
│   └── .gitkeep
├── docs/
│   ├── api_plan.md
│   └── frontend_plan.md
├── frontend/
│   ├── index.html
│   ├── package-lock.json
│   ├── package.json
│   ├── README.md
│   └── src/
│       ├── main.jsx
│       └── styles.css
├── src/
│   ├── __init__.py
│   ├── database.py
│   ├── food_manager.py
│   └── utils.py
├── sample_data/
│   ├── sample_families.csv
│   ├── sample_family_members.csv
│   └── sample_foods.csv
└── assets/
    └── screenshots/
        ├── .gitkeep
        ├── v1/
        │   ├── add-food.png
        │   ├── food-list.png
        │   ├── overview.png
        │   └── version_notes.txt
        ├── v2/
        │   ├── add_food.png
        │   ├── food_list.png
        │   ├── overview.png
        │   └── version_notes.txt
        ├── v3/
        │   ├── postgres_overview.png
        │   └── version_notes.txt
        ├── v4/
        │   ├── add_food.png
        │   ├── food_list.png
        │   ├── overview.png
        │   └── version_notes.txt
        ├── v5/
        │   ├── add_food.png
        │   ├── dashboard_sections.png
        │   ├── food_list_edit.png
        │   ├── table_view.png
        │   └── version_notes.txt
        ├── v5_1/
        │   ├── dashboard_polished.png
        │   └── version_notes.txt
        ├── v6/
        │   └── version_notes.txt
        └── v7/
            └── version_notes.txt
```

## 安裝方式

建議在專案資料夾中建立虛擬環境後再安裝套件。

```bash
pip install -r requirements.txt
```

## Streamlit 執行方式

在專案資料夾中執行：

```bash
streamlit run app.py
```

啟動後，Streamlit 會在瀏覽器開啟本機服務。本機沒有設定 `DATABASE_URL` 時，程式會自動使用 SQLite，第一次執行時會建立：

```text
data/fridge.db
```

`data/fridge.db` 是本機開發資料，已加入 `.gitignore`，不會提交到 GitHub。

## 前端展示版執行方式

```bash
cd frontend
npm install
npm run dev
```

v7 前端展示版目前使用 mock data，重新整理後會回到預設資料。後續版本會再接 FastAPI 與 PostgreSQL。

## Streamlit Cloud 資料庫設定

如果要讓公開部署後的資料不因重新整理、休眠或重新部署而消失，請使用雲端 PostgreSQL，例如 Neon 或 Supabase。

在 Streamlit Community Cloud 的 App 設定中加入 Secrets：

```toml
DATABASE_URL = "postgresql://username:password@host:5432/database?sslmode=require"
```

設定後重新部署 App，程式會自動改用 PostgreSQL。若沒有設定 `DATABASE_URL`，則會使用本機 SQLite。

專案內提供範例檔：

```text
.streamlit/secrets.toml.example
```

請不要把真正的資料庫密碼提交到 GitHub。

## 家庭邀請碼使用方式

1. 在側邊欄選擇「建立家庭」。
2. 輸入家庭代碼、家庭名稱、邀請碼與成員名稱。
3. 家人之後可選擇「加入家庭」，輸入同一組家庭代碼與正確邀請碼。
4. 同一個家庭的成員會共用同一份食材清單。
5. 不同家庭代碼會看到不同資料。
6. 新增食材會記錄新增者。
7. 標記已使用會記錄處理者。
8. 編輯食材會記錄最後更新者與最後更新時間。

這個版本沒有正式登入系統，邀請碼主要用於家人測試與作品集展示，不適合拿來存放敏感資料。

## 資料欄位說明

主要資料表：`foods`

| 欄位 | 型態 | 說明 |
| --- | --- | --- |
| id | INTEGER | 食材流水號 |
| family_code | TEXT | 家庭代碼，用來區分不同家庭 |
| name | TEXT | 食材名稱，必填 |
| category | TEXT | 食材分類 |
| quantity | TEXT | 數量，例如 1 包、500g、2 瓶 |
| purchase_date | TEXT | 購買日期，格式為 YYYY-MM-DD |
| expiry_date | TEXT | 到期日期，格式為 YYYY-MM-DD，必填 |
| note | TEXT | 備註 |
| status | TEXT | 食材狀態，可為 `active` 或 `used` |
| added_by | TEXT | 新增者名稱 |
| used_by | TEXT | 標記已使用的成員名稱 |
| used_at | TEXT | 標記已使用時間 |
| updated_by | TEXT | 最後更新者名稱 |
| updated_at | TEXT | 最後更新時間 |
| created_at | TEXT | 建立時間 |

家庭資料表：`families`

| 欄位 | 型態 | 說明 |
| --- | --- | --- |
| id | INTEGER / SERIAL | 家庭流水號 |
| family_code | TEXT | 家庭代碼，唯一 |
| family_name | TEXT | 家庭顯示名稱 |
| invite_code | TEXT | 加入家庭需要的邀請碼 |
| created_at | TEXT | 建立時間 |

家庭成員資料表：`family_members`

| 欄位 | 型態 | 說明 |
| --- | --- | --- |
| id | INTEGER / SERIAL | 成員流水號 |
| family_code | TEXT | 所屬家庭代碼 |
| member_name | TEXT | 成員名稱 |
| joined_at | TEXT | 加入時間 |

## 狀態標籤說明

`days_left` 的計算方式：

```text
expiry_date - today
```

| 標籤 | 規則 |
| --- | --- |
| Used | 食材已標記為已使用 |
| Expired | `days_left < 0` |
| Today | `days_left == 0` |
| Soon | `0 < days_left <= 7` |
| Safe | `days_left > 7` |

## 使用方式

1. 開啟 Streamlit App。
2. 在側邊欄設定家庭代碼與成員名稱。
3. 到「新增食材」頁面輸入食材資料。
4. 到「期限總覽」查看期限統計、分區提醒與最急需處理清單。
5. 到「食材清單」使用篩選、排序與編輯功能管理資料。
6. 食材用完後可標記為已使用。
7. 不需要保留的資料可以刪除。

## 已測試項目

- 建立家庭
- 使用邀請碼加入家庭
- 家庭成員列表顯示
- 家庭代碼篩選資料
- 成員名稱記錄新增者
- 標記已使用時記錄處理者
- 新增食材資料
- 顯示期限總覽統計
- Dashboard 分區顯示已過期、今天到期與 7 天內到期食材
- 顯示食材清單
- 顯示剩餘天數與狀態標籤
- 編輯食材資料
- 記錄最後更新者與最後更新時間
- 期限狀態篩選
- 分類篩選
- 到期日排序
- 標記已使用
- 刪除食材
- SQLite 資料表自動建立與欄位遷移

## 專案限制

- v7 的 Streamlit 版本仍使用家庭代碼與邀請碼做簡單資料隔離，尚未加入正式登入或權限管理。
- v3 已支援 PostgreSQL，但目前尚未加入正式使用者帳號與權限控管。
- 公開部署時，請不要輸入敏感或真實個資。
- 日期需要手動輸入，尚未支援 OCR 辨識包裝日期。
- 尚未加入通知功能，因此需要使用者主動開啟 App 查看。
- v7 前端展示版目前使用 mock data，尚未連接 API 或資料庫。

## Roadmap

- [x] 食材新增與期限管理
- [x] 期限總覽統計
- [x] 食材篩選與排序
- [x] 標記已使用 / 刪除食材
- [x] 家庭代碼共用冰箱
- [x] 新增者 / 處理者記錄
- [x] 雲端 PostgreSQL 資料庫
- [x] 家庭邀請碼與基礎成員管理
- [x] 編輯既有食材資料
- [x] 記錄最後更新者與最後更新時間
- [x] Dashboard 分區顯示過期與即期食材
- [x] 家庭成員資訊優化
- [x] 空值與時間格式顯示優化
- [x] README 版本演進整理
- [x] 前端展示版規劃
- [x] API 與資料契約草案
- [x] React / Vite 前端展示版
- [ ] FastAPI 前後端分離
- [ ] 正式登入與權限管理
- [ ] LINE Messaging API 每日提醒
- [ ] OCR 辨識食品包裝上的有效日期
- [ ] 根據即將過期食材產生料理建議
- [ ] PWA / App 版本
