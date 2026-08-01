# 食材期限管理工具前端版

這是 React / TypeScript / Vite 前端版本。v11 使用 Tailwind CSS 建立 Natural Warm Organic 設計系統，搭配 Lucide React 圖示、分類 emoji 與 Recharts 消費圖表，並持續串接既有 FastAPI。v11.2 補上儲存位置篩選、完整編輯、刪除確認與 Vitest 測試。

目前重點：

- Dashboard 統計卡片
- 分區提醒
- 食材卡片
- 搜尋、分類篩選、儲存位置篩選與排序
- 透過 FastAPI 新增食材
- 透過 FastAPI 編輯食材完整欄位，包含儲存位置
- 透過 FastAPI 刪除食材，刪除前會跳出確認視窗
- 透過 FastAPI 標記已使用
- 透過 FastAPI 增減食材數量
- 數量減到最後一份時先確認，歸零後自動標記為已使用
- 常用食材、單位與期限快速選取
- 食材數量只接受大於零的整數
- 家庭與目前操作者下拉切換
- 採買金額與冰箱食材總金額
- 食材卡片簡短備註
- 本週、本月與全部消費統計
- 類別支出占比、消費排行與逐筆採買明細
- 未填金額完整度提醒
- 家庭管理資料顯示
- TypeScript 型別保護
- Tailwind CSS 共用設計規範
- Recharts 圓餅圖與類別排行
- 桌面與手機響應式排版
- Vitest 與 Testing Library 測試

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

測試、型別與正式版建置檢查：

```bash
npm test
npm run typecheck
npm run build
```

測試使用 Vitest 與 Testing Library，檔案放在 `src/tests/`：

- `foodFilters.test.ts`：搜尋、分類、儲存位置篩選與排序
- `constants.test.ts`：表單驗證、數量字串解析與編輯表單預設值
- `FoodCard.test.tsx`：卡片上的編輯、刪除與數量按鈕狀態
- `EditFoodDialog.test.tsx`：編輯視窗的預設值、送出內容與錯誤提示
- `App.test.tsx`：儲存位置篩選、刪除確認與數量歸零確認的完整流程

前端預設會呼叫：

```text
http://127.0.0.1:8008
```

如果要改 API 位置，可以新增 `.env`：

```text
VITE_API_BASE_URL=http://127.0.0.1:8008
```

目前後端仍使用記憶體 mock data，重啟 FastAPI 後會回到預設資料。
