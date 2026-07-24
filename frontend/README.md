# 食材期限管理工具前端版

這是 React / Vite 前端版本。v7 先使用 mock data 呈現產品介面，v9 開始串接 FastAPI，讓前端可以透過 API 讀取家庭、成員與食材資料。

目前重點：

- Dashboard 統計卡片
- 分區提醒
- 食材卡片
- 搜尋、分類篩選與排序
- 透過 FastAPI 新增食材
- 透過 FastAPI 標記已使用
- 家庭管理資料顯示

## 執行方式

請先啟動後端：

```bash
cd backend
uvicorn app.main:app --reload --port 8008
```

再啟動前端：

```bash
cd frontend
npm install
npm run dev
```

前端預設會呼叫：

```text
http://127.0.0.1:8008
```

如果要改 API 位置，可以新增 `.env`：

```text
VITE_API_BASE_URL=http://127.0.0.1:8008
```

v9 後端仍使用記憶體 mock data，重啟 FastAPI 後會回到預設資料。
