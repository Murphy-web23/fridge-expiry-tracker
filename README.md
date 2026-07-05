# fridge-expiry-tracker

食材期限管理工具是一個使用 Python、Streamlit 與 SQLite 製作的生活小工具。使用者可以記錄冰箱裡的食材、設定到期日期，系統會自動計算剩餘天數，並標示即將過期、今天到期、已過期與已使用的食材。

這個專案是 v1 版本，重點放在穩定、清楚、可展示的核心功能，不加入 LINE 通知、OCR 或大型 AI 功能。

## 專案動機

冰箱裡的食材常常因為忘記保存期限而浪費。這個工具希望用簡單的資料記錄與 Dashboard，幫助使用者快速掌握哪些食材需要優先處理，也作為初學者練習資料庫、資料處理與 Web App UI 的作品集專案。

## 功能特色

- 新增食材名稱、分類、數量、購買日期、到期日期與備註
- 使用 SQLite 儲存本機資料
- 自動計算剩餘天數 `days_left`
- 顯示總食材數、7 天內到期數、今天到期數、已過期數
- 顯示最急需處理的食材清單
- 支援期限狀態篩選、分類篩選與排序
- 支援標記已使用與刪除食材
- 使用繁體中文 Streamlit 介面，適合作品集展示

## Demo Screenshots

> 目前先保留截圖位置，完成部署或實際操作後可補上圖片。

![Dashboard placeholder](assets/screenshots/dashboard-placeholder.png)
![Food list placeholder](assets/screenshots/food-list-placeholder.png)

## 使用技術

- Python
- Streamlit
- pandas
- SQLite `sqlite3`

## 專案架構

```text
fridge-expiry-tracker/
├── app.py
├── README.md
├── requirements.txt
├── .gitignore
├── data/
│   └── .gitkeep
├── src/
│   ├── __init__.py
│   ├── database.py
│   ├── food_manager.py
│   └── utils.py
├── sample_data/
│   └── sample_foods.csv
└── assets/
    └── screenshots/
        └── .gitkeep
```

## 安裝方式

建議先建立並啟用虛擬環境，再安裝套件。

```bash
pip install -r requirements.txt
```

## 執行方式

在專案資料夾中執行：

```bash
streamlit run app.py
```

程式啟動時會自動建立資料庫：

```text
data/fridge.db
```

實際資料庫檔案已加入 `.gitignore`，不會提交到 GitHub。

## 資料欄位說明

資料表名稱：`foods`

| 欄位 | 型態 | 說明 |
| --- | --- | --- |
| id | INTEGER | 食材流水號 |
| name | TEXT | 食材名稱，必填 |
| category | TEXT | 食材分類 |
| quantity | TEXT | 數量，例如 1 包、500g |
| purchase_date | TEXT | 購買日期，格式為 YYYY-MM-DD |
| expiry_date | TEXT | 到期日期，格式為 YYYY-MM-DD，必填 |
| note | TEXT | 備註 |
| status | TEXT | 食材狀態，包含 active、used |
| created_at | TEXT | 建立時間 |

## 狀態標籤說明

| 標籤 | 規則 |
| --- | --- |
| Used | 食材已標記為已使用 |
| Expired | `days_left < 0` |
| Today | `days_left == 0` |
| Soon | `0 < days_left <= 7` |
| Safe | `days_left > 7` |

`days_left` 的計算方式為：

```text
expiry_date - today
```

## 使用方式

1. 開啟 Streamlit App。
2. 到「新增食材」頁面輸入食材資料。
3. 到「Dashboard」查看期限統計與最急需處理清單。
4. 到「食材清單」使用篩選與排序功能管理資料。
5. 食材用完後可標記為已使用，不需要保留時可刪除。

## 專案限制

- v1 僅支援本機 SQLite，不包含多人同步或雲端資料庫。
- 沒有登入系統，適合個人本機使用。
- 日期需要手動輸入，尚未支援 OCR 辨識包裝日期。
- 尚未加入通知功能，因此需要使用者主動開啟 App 查看。

## Roadmap

- [x] 食材新增與期限管理
- [x] Dashboard 統計
- [x] 食材篩選與排序
- [x] 標記已使用 / 刪除食材
- [ ] LINE Messaging API 每日提醒
- [ ] OCR 辨識食品包裝上的有效日期
- [ ] 根據即將過期食材產生料理建議
- [ ] PWA / App 版本

## 面試時可以說明的重點

- 將 UI、資料庫操作、期限計算與共用工具拆分到不同檔案，避免所有邏輯集中在 `app.py`。
- 使用 SQLite 建立本機持久化資料，並在程式啟動時自動建立資料表。
- 使用 `days_left` 衍生欄位建立 Dashboard 統計、狀態標籤、篩選與排序。
- v1 明確控制功能範圍，先完成穩定可展示的核心版本，再將通知、OCR、料理建議放入 Roadmap。
