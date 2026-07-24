# FastAPI 後端雛形

這是 FastAPI 後端雛形。v8 先建立 API 路由，v9 開始提供 React 前端串接使用。

目前重點：

- 提供健康檢查 API
- 提供家庭資料 API
- 提供家庭成員 API
- 提供食材清單 API
- 支援新增食材
- 支援標記已使用
- 允許本機 Vite 前端呼叫 API

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

目前版本尚未連接 PostgreSQL，資料會暫存在記憶體中，重啟服務後會回到預設 mock data。
