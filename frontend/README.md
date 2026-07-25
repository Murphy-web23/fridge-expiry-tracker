# 食材期限管理工具前端版

這是 React / Vite 前端版本。v9 開始串接 FastAPI，v10 新增採買金額與更方便的家庭冰箱操作，v10.1 使用 Lucide React 補上操作圖示，v10.2 改為更明亮的生活風格並加入彩色 emoji。

目前重點：

- Dashboard 統計卡片
- 分區提醒
- 食材卡片
- 搜尋、分類篩選與排序
- 透過 FastAPI 新增食材
- 透過 FastAPI 標記已使用
- 透過 FastAPI 增減食材數量
- 常用食材、單位與期限快速選取
- 家庭與目前操作者下拉切換
- 採買金額與冰箱食材總金額
- 食材卡片簡短備註
- 本週、本月與全部消費統計
- 類別支出占比、消費排行與逐筆採買明細
- 未填金額完整度提醒
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

v10 後端仍使用記憶體 mock data，重啟 FastAPI 後會回到預設資料。
