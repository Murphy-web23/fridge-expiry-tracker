import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  apiConfig,
  createFood,
  getFamily,
  getFoods,
  getMembers,
  markFoodUsed,
} from "./api";
import "./styles.css";

const categories = ["全部", "蔬菜", "水果", "肉類", "海鮮", "乳製品", "冷凍食品", "飲料", "調味料", "其他"];

const statusText = {
  Expired: "已過期",
  Today: "今天到期",
  Soon: "即將到期",
  Safe: "安全",
  Used: "已使用",
};

function todayText() {
  return new Date().toISOString().slice(0, 10);
}

function normalizeFood(food) {
  return {
    id: food.id,
    name: food.name,
    category: food.category,
    quantity: food.quantity,
    purchaseDate: food.purchase_date,
    expiryDate: food.expiry_date,
    daysLeft: food.days_left,
    status: food.status_label,
    addedBy: food.added_by,
    updatedBy: food.updated_by || "未記錄",
    note: food.note || "未記錄",
  };
}

function App() {
  const [activePage, setActivePage] = useState("dashboard");
  const [foods, setFoods] = useState([]);
  const [family, setFamily] = useState(null);
  const [members, setMembers] = useState([]);
  const [filter, setFilter] = useState("全部");
  const [sortMode, setSortMode] = useState("urgent");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [form, setForm] = useState({
    name: "",
    category: "蔬菜",
    quantity: "",
    purchaseDate: todayText(),
    expiryDate: todayText(),
    note: "",
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  async function loadInitialData() {
    try {
      setIsLoading(true);
      setErrorMessage("");
      const [familyData, memberData, foodData] = await Promise.all([getFamily(), getMembers(), getFoods()]);
      setFamily(familyData);
      setMembers(memberData);
      setFoods(foodData.map(normalizeFood));
    } catch (error) {
      setErrorMessage("目前無法連線到 FastAPI，請先啟動後端服務。");
    } finally {
      setIsLoading(false);
    }
  }

  const stats = useMemo(() => {
    const activeFoods = foods.filter((food) => food.status !== "Used");
    return {
      total: activeFoods.length,
      expired: activeFoods.filter((food) => food.daysLeft < 0).length,
      today: activeFoods.filter((food) => food.daysLeft === 0).length,
      soon: activeFoods.filter((food) => food.daysLeft > 0 && food.daysLeft <= 7).length,
    };
  }, [foods]);

  const filteredFoods = useMemo(() => {
    const filtered = foods.filter((food) => {
      const matchCategory = filter === "全部" || food.category === filter;
      const matchSearch = food.name.toLowerCase().includes(search.trim().toLowerCase());
      return matchCategory && matchSearch;
    });

    return [...filtered].sort((a, b) => {
      if (sortMode === "category") return a.category.localeCompare(b.category, "zh-Hant");
      if (sortMode === "safe") return b.daysLeft - a.daysLeft;
      return a.daysLeft - b.daysLeft;
    });
  }, [foods, filter, search, sortMode]);

  async function addFood(event) {
    event.preventDefault();
    if (!form.name.trim()) return;

    try {
      setIsSaving(true);
      setErrorMessage("");
      const createdFood = await createFood({
        name: form.name.trim(),
        category: form.category,
        quantity: form.quantity || "未記錄",
        purchase_date: form.purchaseDate,
        expiry_date: form.expiryDate,
        note: form.note || "未記錄",
      });

      setFoods((current) => [normalizeFood(createdFood), ...current]);
      setForm({
        name: "",
        category: "蔬菜",
        quantity: "",
        purchaseDate: todayText(),
        expiryDate: todayText(),
        note: "",
      });
      setActivePage("foods");
    } catch (error) {
      setErrorMessage("新增失敗，請確認 FastAPI 後端是否正在執行。");
    } finally {
      setIsSaving(false);
    }
  }

  async function markUsed(id) {
    try {
      setErrorMessage("");
      const updatedFood = await markFoodUsed(id);
      setFoods((current) => current.map((food) => (food.id === id ? normalizeFood(updatedFood) : food)));
    } catch (error) {
      setErrorMessage("標記已使用失敗，請稍後再試。");
    }
  }

  const familyName = family?.family_name || "示範家庭";
  const memberNames = members.map((member) => member.member_name).join("、") || "尚未載入";

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <span className="brand-mark">冷</span>
          <div>
            <p className="eyebrow">Fridge Tracker</p>
            <h1>食材期限管理</h1>
          </div>
        </div>

        <nav className="nav-list" aria-label="主要選單">
          <button className={activePage === "dashboard" ? "active" : ""} onClick={() => setActivePage("dashboard")}>
            期限總覽
          </button>
          <button className={activePage === "foods" ? "active" : ""} onClick={() => setActivePage("foods")}>
            食材清單
          </button>
          <button className={activePage === "add" ? "active" : ""} onClick={() => setActivePage("add")}>
            新增食材
          </button>
          <button className={activePage === "family" ? "active" : ""} onClick={() => setActivePage("family")}>
            家庭管理
          </button>
        </nav>

        <section className="family-card">
          <p className="eyebrow">目前家庭</p>
          <h2>{familyName}</h2>
          <p>成員：{memberNames}</p>
          <span>資料來源：FastAPI</span>
        </section>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="eyebrow">v9 前後端串接版</p>
            <h2>{activePage === "dashboard" ? "家庭冰箱 Dashboard" : pageTitle(activePage)}</h2>
          </div>
          <button className="primary-action" onClick={() => setActivePage("add")}>
            新增食材
          </button>
        </header>

        <ApiNotice isLoading={isLoading} errorMessage={errorMessage} onRetry={loadInitialData} />

        {activePage === "dashboard" && <Dashboard stats={stats} foods={foods} onMarkUsed={markUsed} />}
        {activePage === "foods" && (
          <FoodList
            foods={filteredFoods}
            filter={filter}
            setFilter={setFilter}
            sortMode={sortMode}
            setSortMode={setSortMode}
            search={search}
            setSearch={setSearch}
            onMarkUsed={markUsed}
          />
        )}
        {activePage === "add" && (
          <AddFoodForm form={form} setForm={setForm} onSubmit={addFood} isSaving={isSaving} familyName={familyName} />
        )}
        {activePage === "family" && <FamilyPanel family={family} members={members} />}
      </main>
    </div>
  );
}

function pageTitle(page) {
  if (page === "foods") return "食材清單";
  if (page === "add") return "新增食材";
  return "家庭管理";
}

function ApiNotice({ isLoading, errorMessage, onRetry }) {
  if (isLoading) {
    return <div className="api-notice">正在從 FastAPI 載入家庭冰箱資料...</div>;
  }

  if (errorMessage) {
    return (
      <div className="api-notice error">
        <span>{errorMessage}</span>
        <button onClick={onRetry}>重新載入</button>
      </div>
    );
  }

  return <div className="api-notice success">已連線：{apiConfig.apiBaseUrl}</div>;
}

function Dashboard({ stats, foods, onMarkUsed }) {
  const activeFoods = foods.filter((food) => food.status !== "Used");
  const expired = activeFoods.filter((food) => food.daysLeft < 0);
  const today = activeFoods.filter((food) => food.daysLeft === 0);
  const soon = activeFoods.filter((food) => food.daysLeft > 0 && food.daysLeft <= 7);

  return (
    <div className="page-grid">
      <section className="stats-grid">
        <StatCard label="總食材數" value={stats.total} tone="neutral" />
        <StatCard label="已過期" value={stats.expired} tone="danger" />
        <StatCard label="今天到期" value={stats.today} tone="warning" />
        <StatCard label="7 天內到期" value={stats.soon} tone="info" />
      </section>

      <section className="dashboard-band">
        <div>
          <p className="eyebrow">需要優先處理</p>
          <h3>把最緊急的食材排在前面</h3>
        </div>
        <p>v9 會從 FastAPI 讀取資料，新增與標記已使用也會透過 API 更新後端狀態。</p>
      </section>

      <FoodSection title="已過期" foods={expired} emptyText="目前沒有已過期食材。" onMarkUsed={onMarkUsed} />
      <FoodSection title="今天到期" foods={today} emptyText="目前沒有今天到期食材。" onMarkUsed={onMarkUsed} />
      <FoodSection title="7 天內到期" foods={soon} emptyText="目前沒有 7 天內到期食材。" onMarkUsed={onMarkUsed} />
    </div>
  );
}

function StatCard({ label, value, tone }) {
  return (
    <article className={`stat-card ${tone}`}>
      <p>{label}</p>
      <strong>{value}</strong>
    </article>
  );
}

function FoodList({ foods, filter, setFilter, sortMode, setSortMode, search, setSearch, onMarkUsed }) {
  return (
    <section className="panel">
      <div className="toolbar">
        <label>
          搜尋
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="輸入食材名稱" />
        </label>
        <label>
          分類
          <select value={filter} onChange={(event) => setFilter(event.target.value)}>
            {categories.map((category) => (
              <option key={category}>{category}</option>
            ))}
          </select>
        </label>
        <label>
          排序
          <select value={sortMode} onChange={(event) => setSortMode(event.target.value)}>
            <option value="urgent">期限由近到遠</option>
            <option value="safe">期限由遠到近</option>
            <option value="category">依分類</option>
          </select>
        </label>
      </div>

      <div className="food-grid">
        {foods.map((food) => (
          <FoodCard key={food.id} food={food} onMarkUsed={onMarkUsed} />
        ))}
      </div>
    </section>
  );
}

function FoodSection({ title, foods, emptyText, onMarkUsed }) {
  return (
    <section className="panel">
      <div className="section-heading">
        <h3>{title}</h3>
        <span>{foods.length} 筆</span>
      </div>
      {foods.length === 0 ? (
        <p className="empty-text">{emptyText}</p>
      ) : (
        <div className="food-grid">
          {foods.map((food) => (
            <FoodCard key={food.id} food={food} onMarkUsed={onMarkUsed} />
          ))}
        </div>
      )}
    </section>
  );
}

function FoodCard({ food, onMarkUsed }) {
  return (
    <article className={`food-card ${food.status.toLowerCase()}`}>
      <div className="food-card-header">
        <div>
          <h4>{food.name}</h4>
          <p>
            {food.category} ・ {food.quantity}
          </p>
        </div>
        <span className={`status-badge ${food.status.toLowerCase()}`}>{statusText[food.status]}</span>
      </div>
      <dl>
        <div>
          <dt>到期日</dt>
          <dd>{food.expiryDate}</dd>
        </div>
        <div>
          <dt>剩餘天數</dt>
          <dd>{food.daysLeft} 天</dd>
        </div>
        <div>
          <dt>新增者</dt>
          <dd>{food.addedBy}</dd>
        </div>
        <div>
          <dt>備註</dt>
          <dd>{food.note}</dd>
        </div>
      </dl>
      {food.status === "Used" ? (
        <button className="ghost-action" disabled>
          已標記使用
        </button>
      ) : (
        <button className="ghost-action" onClick={() => onMarkUsed(food.id)}>
          標記已使用
        </button>
      )}
    </article>
  );
}

function AddFoodForm({ form, setForm, onSubmit, isSaving, familyName }) {
  const updateForm = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  return (
    <section className="form-panel">
      <div>
        <p className="eyebrow">新增到 {familyName}</p>
        <h3>新增食材</h3>
        <p>v9 表單會呼叫 FastAPI POST API，新增成功後回到食材清單。</p>
      </div>
      <form onSubmit={onSubmit} className="food-form">
        <label>
          食材名稱
          <input value={form.name} onChange={(event) => updateForm("name", event.target.value)} placeholder="例如：豆腐" />
        </label>
        <label>
          分類
          <select value={form.category} onChange={(event) => updateForm("category", event.target.value)}>
            {categories.slice(1).map((category) => (
              <option key={category}>{category}</option>
            ))}
          </select>
        </label>
        <label>
          數量
          <input value={form.quantity} onChange={(event) => updateForm("quantity", event.target.value)} placeholder="例如：2 盒" />
        </label>
        <label>
          購買日期
          <input type="date" value={form.purchaseDate} onChange={(event) => updateForm("purchaseDate", event.target.value)} />
        </label>
        <label>
          到期日期
          <input type="date" value={form.expiryDate} onChange={(event) => updateForm("expiryDate", event.target.value)} />
        </label>
        <label className="full">
          備註
          <textarea value={form.note} onChange={(event) => updateForm("note", event.target.value)} placeholder="例如：已開封、冷藏未開封" />
        </label>
        <button className="primary-action full" type="submit" disabled={isSaving}>
          {isSaving ? "新增中..." : "加入冰箱"}
        </button>
      </form>
    </section>
  );
}

function FamilyPanel({ family, members }) {
  return (
    <section className="panel family-page">
      <div>
        <p className="eyebrow">家庭管理</p>
        <h3>{family?.family_name || "示範家庭"}</h3>
        <p>v9 會從 FastAPI 讀取家庭與成員資料，後續可再補上正式登入、角色權限與邀請流程。</p>
      </div>
      <div className="member-grid">
        {members.map((member) => (
          <article key={member.member_name} className="member-card">
            <strong>
              {member.member_name} ・ {member.role}
            </strong>
            <span>已加入家庭冰箱</span>
          </article>
        ))}
      </div>
    </section>
  );
}

createRoot(document.getElementById("root")).render(<App />);
