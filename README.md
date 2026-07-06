# 食材期限管理工具

Repository name: `fridge-expiry-tracker`

一個使用 Python、Streamlit 與 SQLite 製作的食材期限管理工具。使用者可以新增冰箱裡的食材、設定到期日期，系統會自動計算剩餘天數，並標示即將過期、今天到期、已過期與已使用的食材。

v2 加入「家庭代碼」概念：同一個家庭代碼的成員會共用同一份冰箱資料，不同家庭代碼之間的食材清單會分開。這個版本適合作為家人測試與作品集展示，尚未加入正式登入系統。

## 專案動機

冰箱裡的食材常常因為忘記保存期限而浪費。這個專案希望用簡單的資料記錄、期限計算與總覽頁，幫助家庭成員一起掌握哪些食材需要優先處理。

對作品集來說，這個專案也可以展示：

- 使用 Streamlit 建立可互動的資料管理介面
- 使用 SQLite 做本機資料保存
- 將 UI、資料庫操作與期限計算拆分成不同模組
- 使用家庭代碼建立簡單的多人共享資料模型
- 控制功能範圍，先完成可展示版本，再規劃登入與雲端資料庫

## 功能特色

- 使用家庭代碼區分不同家庭的冰箱資料
- 使用成員名稱記錄誰新增食材、誰標記已使用
- 新增食材名稱、分類、數量、購買日期、到期日期與備註
- 使用 SQLite 儲存資料，資料庫位於 `data/fridge.db`
- 程式啟動時自動建立或更新 `foods` 資料表
- 自動計算剩餘天數 `days_left`
- 依規則顯示 `Used`、`Expired`、`Today`、`Soon`、`Safe` 狀態標籤
- 期限總覽顯示總食材數、7 天內到期數、今天到期數、已過期數
- 顯示最急需處理的食材清單
- 支援期限狀態篩選、分類篩選與排序
- 支援標記已使用與刪除食材
- 繁體中文介面，適合作為初學者作品集專案

## Demo Screenshots

以下截圖對應目前 v2 家庭代碼共用冰箱版本。
v1 截圖仍保留在 `assets/screenshots/v1/`，方便回看專案演進。

### 期限總覽

![期限總覽畫面](assets/screenshots/v2/overview.png)

### 新增食材

![新增食材畫面](assets/screenshots/v2/add_food.png)

### 食材清單

![食材清單畫面](assets/screenshots/v2/food_list.png)

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
        ├── .gitkeep
        ├── v1/
        │   ├── add-food.png
        │   ├── food-list.png
        │   └── overview.png
        └── v2/
            ├── add_food.png
            ├── food_list.png
            └── overview.png
```

## 安裝方式

建議在專案資料夾中建立虛擬環境後再安裝套件。

```bash
pip install -r requirements.txt
```

## 執行方式

在專案資料夾中執行：

```bash
streamlit run app.py
```

啟動後，Streamlit 會在瀏覽器開啟本機服務。程式第一次執行時會自動建立：

```text
data/fridge.db
```

`data/fridge.db` 是使用者本機資料，已加入 `.gitignore`，不會提交到 GitHub。

## 家庭代碼使用方式

1. 在側邊欄輸入家庭代碼，例如 `murphy-home`。
2. 輸入成員名稱，例如 `媽媽`、`爸爸`、`我`。
3. 同一個家庭代碼會共用同一份食材清單。
4. 不同家庭代碼會看到不同資料。
5. 新增食材會記錄新增者。
6. 標記已使用會記錄處理者。

這個版本沒有正式登入系統，家庭代碼主要用於家人測試與作品集展示，不適合拿來存放敏感資料。

## 資料欄位說明

資料表名稱：`foods`

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
| created_at | TEXT | 建立時間 |

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
4. 到「期限總覽」查看期限統計與最急需處理清單。
5. 到「食材清單」使用篩選與排序功能管理資料。
6. 食材用完後可標記為已使用。
7. 不需要保留的資料可以刪除。

## 已測試項目

- 家庭代碼篩選資料
- 成員名稱記錄新增者
- 標記已使用時記錄處理者
- 新增食材資料
- 顯示期限總覽統計
- 顯示食材清單
- 顯示剩餘天數與狀態標籤
- 期限狀態篩選
- 分類篩選
- 到期日排序
- 標記已使用
- 刪除食材
- SQLite 資料表自動建立與欄位遷移

## 專案限制

- v2 使用家庭代碼做簡單資料隔離，尚未加入正式登入或權限管理。
- 目前仍使用 SQLite，適合本機與作品集展示，不適合作為正式多人雲端資料庫。
- 公開部署時，請不要輸入敏感或真實個資。
- 日期需要手動輸入，尚未支援 OCR 辨識包裝日期。
- 尚未加入通知功能，因此需要使用者主動開啟 App 查看。

## Roadmap

- [x] 食材新增與期限管理
- [x] 期限總覽統計
- [x] 食材篩選與排序
- [x] 標記已使用 / 刪除食材
- [x] 家庭代碼共用冰箱
- [x] 新增者 / 處理者記錄
- [ ] 雲端 PostgreSQL 資料庫
- [ ] 家庭邀請碼與正式成員管理
- [ ] LINE Messaging API 每日提醒
- [ ] OCR 辨識食品包裝上的有效日期
- [ ] 根據即將過期食材產生料理建議
- [ ] PWA / App 版本

## 面試時可以說明的重點

- v1 從單機食材期限管理開始，v2 擴充成家庭共享資料模型。
- 透過 `family_code` 讓不同家庭資料分開，同一家人可以共用同一份冰箱清單。
- 使用 `added_by` 與 `used_by` 讓食材操作有基本追蹤性。
- 資料表啟動時會自動遷移欄位，讓舊資料庫也能升級到 v2。
- 將 Streamlit UI、資料庫操作、期限計算與共用工具拆分到不同檔案，讓程式比較容易維護。
- 使用 `days_left` 衍生欄位串起總覽統計、狀態標籤、篩選與排序。
- 下一步可以升級到 PostgreSQL 與正式登入，變成更完整的多人共用工具。
