# FastAPI 後端雛形

這是 v8 新增的 FastAPI 後端雛形，先使用 mock data 驗證 API 路由與資料格式。

目前重點：

- 提供健康檢查 API
- 提供家庭資料 API
- 提供家庭成員 API
- 提供食材清單 API
- 支援新增食材
- 支援標記已使用

## 執行方式

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

啟動後可開啟：

```text
http://127.0.0.1:8000/docs
```

目前版本尚未連接 PostgreSQL，資料會暫存在記憶體中，重啟服務後會回到預設 mock data。
