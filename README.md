# 食材期限管理工具

Repository name: `fridge-expiry-tracker`

一個使用 Python、Streamlit、SQLite、PostgreSQL、React、TypeScript 與 FastAPI 製作的食材期限管理工具。使用者可以新增冰箱裡的食材、設定到期日期，系統會自動計算剩餘天數，並標示即將過期、今天到期、已過期與已使用的食材。

v11 將 React 前端完整改寫為 TypeScript，導入 Tailwind CSS 與 Recharts，並建立「大地自然質感」設計系統。v11.1 再加入食材儲存位置與 Dashboard 分區快覽，讓家庭成員除了期限，也能快速掌握食材放在冷藏、冷凍、常溫或飲品櫃。

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
- 記錄食材購買金額，Dashboard 顯示冰箱食材總金額
- 使用常用食材下拉選單，自動帶入分類與建議單位
- 新增食材時可選擇冰箱冷藏、冷凍庫、常溫儲藏或飲品櫃
- Dashboard 顯示各儲存空間的在庫食材筆數
- 數量與單位分開選擇，減少重複輸入
- 新增食材數量限制為大於零的整數，避免不適用的小數數量
- 使用期限快速按鈕設定 3、7、14、30 或 180 天後到期
- 可從側邊欄直接切換目前家庭與操作者
- 食材卡片可直接增加或減少一個單位
- 食材卡片顯示兩行內的簡短備註
- 消費統計顯示本週、本月與全部採買金額
- 依分類顯示消費占比、排行與逐筆採買明細
- 提醒尚未填寫金額的食材，避免統計失真
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
- v8 新增 FastAPI 後端雛形，讓前端後續可以逐步接 API
- v9 React 前端開始串接 FastAPI，可讀取家庭資料、食材清單、新增食材與標記已使用
- v10 加入採買金額、快速新增選項、家庭／操作者切換、數量加減與卡片資訊優化
- v10 新增消費統計頁，可查看期間金額、分類分析與採買明細
- v10.1 使用 Lucide 圖示統一導覽、操作與狀態語言，並加入分類圖示與友善空狀態
- v10.2 改用明亮側欄、純色背景、輕陰影與彩色 emoji，提升生活感與資訊辨識度
- v11 改用 React TypeScript、Tailwind CSS 與 Recharts，建立可重用的自然暖色設計系統與響應式元件
- v11.1 新增儲存位置欄位、位置預設規則與 Dashboard 儲存空間分區快覽
- 繁體中文介面，適合作為初學者作品集專案

## Demo Screenshots

以下截圖以 v11.1 最新畫面為主，展示儲存空間分區與新版新增食材表單；其餘畫面延續 v11 React TypeScript 前端版。
舊版截圖仍保留在 `assets/screenshots/`，可回顧專案從 Streamlit 原型到 React 介面的版本演進。

### v11.1 儲存空間 Dashboard

![v11.1 Dashboard 儲存空間分區](assets/screenshots/v11.1/dashboard_storage_overview.png)

### v11.1 新增家庭食材

![v11.1 新增家庭食材與儲存位置](assets/screenshots/v11.1/add_food_storage.png)

### v11 期限分區與食材清單

![v11 Dashboard 今天與七天內到期食材](assets/screenshots/v11/dashboard_sections.png)

![v11 食材清單畫面](assets/screenshots/v11/food_list.png)

### v11 消費統計

![v11 消費統計畫面](assets/screenshots/v11/spending.png)

### v11 家庭管理

![v11 家庭管理畫面](assets/screenshots/v11/family_management.png)

## 使用技術

- Python
- Streamlit
- pandas
- SQLite `sqlite3`
- PostgreSQL
- psycopg2
- React
- TypeScript
- Vite
- Tailwind CSS
- Lucide React
- Recharts
- FastAPI
- Uvicorn

## v11 專案架構定位

目前專案分成三個層次：

- `app.py`：Streamlit 可操作資料工具版，負責驗證資料流程與 PostgreSQL 保存。
- `frontend/`：React / TypeScript / Tailwind CSS 前端版，提供快速新增、家庭切換、金額、數量操作與 Recharts 消費圖表。
- `backend/`：FastAPI 後端雛形，先用 mock data 提供家庭、食材與操作 API，後續再接 PostgreSQL。

v11 的重點不是取代 Streamlit，而是用可維護的型別、共用元件與一致設計語言，讓 React 與 FastAPI 的資料流更接近家庭日常會使用的操作方式。

## v11 前端操作版

目前這個 repo 仍保留 Streamlit 資料工具版本。React 前端呼叫 FastAPI，v11 將既有功能整理成 TypeScript 元件並完成自然暖色視覺重構。

前端串接版目前包含：

- Dashboard 統計卡片
- 冰箱冷藏、冷凍庫、常溫儲藏與飲品櫃分區快覽
- 已過期、今天到期與 7 天內到期分區提醒
- 食材卡片
- 搜尋、分類篩選與排序
- 從 FastAPI 讀取家庭、成員與食材清單
- 透過 FastAPI 新增食材
- 透過 FastAPI 標記已使用
- 透過 FastAPI 增減食材數量
- 採買金額與冰箱總金額
- 本週、本月與全部消費統計
- 類別支出占比、消費排行與採買明細
- 未填金額完整度提醒
- 常用食材、單位與期限快速選取
- 儲存位置下拉選擇與分類預設位置
- 家庭與目前操作者下拉選擇
- 食材卡片簡短備註
- 家庭管理資料顯示

相關文件：

- [前端展示版規劃](docs/frontend_plan.md)
- [API 與資料契約草案](docs/api_plan.md)

前端展示版執行方式：

```bash
cd backend
uvicorn app.main:app --reload --port 8008
```

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
| v8 | 新增 FastAPI 後端雛形與 mock API |
| v9 | React 前端串接 FastAPI，完成讀取清單、新增食材與標記已使用的前後端資料流 |
| v10 | 新增採買金額、快速新增、家庭與操作者切換、數量加減、簡短備註與消費統計 |
| v10.1 | 加入分類、期限狀態、導覽與操作圖示，優化空狀態、新增表單與整體視覺層次 |
| v10.2 | 將深色工具介面改為輕盈生活風格，加入分類、狀態、統計與成員 emoji |
| v11 | React 前端改寫為 TypeScript，導入 Tailwind CSS、Recharts 與 Natural Warm Organic 設計系統 |
| v11.1 | 新增食材儲存位置、預設位置規則、卡片位置資訊與 Dashboard 儲存空間分區快覽 |

## 專案架構

```text
fridge-expiry-tracker/
├── app.py
├── README.md
├── requirements.txt
├── .gitignore
├── .streamlit/
│   └── secrets.toml.example
├── backend/
│   ├── README.md
│   ├── requirements.txt
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── mock_data.py
│   │   └── models.py
│   └── tests/
│       └── test_api.py
├── data/
│   └── .gitkeep
├── docs/
│   ├── api_plan.md
│   └── frontend_plan.md
├── frontend/
│   ├── index.html
│   ├── package-lock.json
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── .env.example
│   ├── README.md
│   └── src/
│       ├── components/
│       │   ├── AddFoodForm.tsx
│       │   ├── Dashboard.tsx
│       │   ├── FamilyPanel.tsx
│       │   ├── FoodCard.tsx
│       │   ├── FoodList.tsx
│       │   ├── Shell.tsx
│       │   └── SpendingPanel.tsx
│       ├── App.tsx
│       ├── api.ts
│       ├── constants.ts
│       ├── index.css
│       ├── main.tsx
│       ├── types.ts
│       └── ui.ts
├── src/
│   ├── __init__.py
│   ├── database.py
│   ├── food_manager.py
│   └── utils.py
├── tests/
│   └── test_database.py
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
        ├── v7/
        │   ├── add_food.png
        │   ├── dashboard_sections.png
        │   ├── dashboard_top.png
        │   ├── family_management.png
        │   ├── food_list.png
        │   └── version_notes.txt
        ├── v8/
        │   └── version_notes.txt
        ├── v9/
        │   └── version_notes.txt
        ├── v10/
        │   └── version_notes.txt
        ├── v10.1/
        │   ├── add_food.png
        │   ├── dashboard.png
        │   ├── family_management.png
        │   ├── food_list.png
        │   ├── spending_details.png
        │   ├── spending_summary.png
        │   └── version_notes.txt
        ├── v10.2/
        │   └── version_notes.txt
        └── v11/
            ├── add_food.png
            ├── dashboard_sections.png
            ├── dashboard_top.png
            ├── family_management.png
            ├── food_list.png
            ├── spending.png
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

## 前端串接版執行方式

請先啟動 FastAPI 後端：

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8008
```

再啟動 React 前端：

```bash
cd frontend
npm install
npm run dev
```

前端預設 API 位置為：

```text
http://127.0.0.1:8008
```

如需調整，可參考 `frontend/.env.example` 設定 `VITE_API_BASE_URL`。

目前 FastAPI 後端仍使用記憶體 mock data，重新啟動 FastAPI 後會回到預設資料。後續版本會再接 PostgreSQL。

## FastAPI 後端執行方式

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

啟動後可開啟：

```text
http://127.0.0.1:8000/docs
```

若要搭配 v10 前端，建議使用：

```bash
uvicorn app.main:app --reload --port 8008
```

並開啟：

```text
http://127.0.0.1:8008/docs
```

目前 FastAPI 後端使用 mock data，重啟服務後會回到預設資料。後續版本會再接 PostgreSQL。

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
| storage_location | TEXT | React / FastAPI 使用的儲存位置，可為冰箱冷藏、冷凍庫、常溫儲藏或飲品櫃 |
| quantity | TEXT | 數量，例如 1 包、500g、2 瓶 |
| price | INTEGER | 購買金額，以新台幣整數記錄 |
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
- 記錄採買金額與計算冰箱食材總金額
- 計算本週、本月與全部期間消費
- 顯示分類占比、消費排行與採買明細
- 提醒未填金額資料
- 常用食材、數量單位與期限快速選取
- 儲存位置選擇、自動預設與 Dashboard 分區統計
- 新增食材數量正整數驗證
- 切換家庭與目前操作者
- 使用卡片按鈕增加或減少數量
- 顯示簡短備註
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

- 目前 Streamlit 版本仍使用家庭代碼與邀請碼做簡單資料隔離，尚未加入正式登入或權限管理。
- v3 已支援 PostgreSQL，但目前尚未加入正式使用者帳號與權限控管。
- 公開部署時，請不要輸入敏感或真實個資。
- 日期需要手動輸入，尚未支援 OCR 辨識包裝日期。
- 尚未加入通知功能，因此需要使用者主動開啟 App 查看。
- v11 React 前端已可串接 FastAPI，但 FastAPI 目前仍使用 mock data，尚未連接 PostgreSQL。
- 家庭與操作者切換目前是展示用選擇，尚未加入帳號驗證與權限控管。

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
- [x] FastAPI 後端雛形
- [x] React 前端串接 FastAPI
- [x] 食材採買金額與冰箱總金額
- [x] 常用食材、單位與期限快速選取
- [x] 家庭與目前操作者切換
- [x] 食材數量加減操作
- [x] 食材卡片簡短備註
- [x] 本週 / 本月 / 全部消費統計
- [x] 類別支出占比與消費排行
- [x] 逐筆採買明細與未填金額提醒
- [x] React TypeScript 型別重構
- [x] Tailwind CSS 自然暖色設計系統
- [x] Recharts 消費圖表
- [x] 桌面與手機響應式介面
- [x] 食材儲存位置與 Dashboard 分區快覽
- [ ] FastAPI 串接 PostgreSQL
- [ ] 正式登入與權限管理
- [ ] LINE Messaging API 每日提醒
- [ ] OCR 辨識食品包裝上的有效日期
- [ ] 根據即將過期食材產生料理建議
- [ ] PWA / App 版本
