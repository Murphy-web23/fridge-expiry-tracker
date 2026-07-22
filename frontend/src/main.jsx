import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const categories = ["全部", "蔬菜", "水果", "肉類", "海鮮", "乳製品", "冷凍食品", "飲料", "調味料", "其他"];

const initialFoods = [
  {
    id: 1,
    name: "牛奶",
    category: "乳製品",
    quantity: "一瓶",
    expiryDate: "2026-07-11",
    daysLeft: -6,
    status: "Expired",
    addedBy: "Murphy",
    updatedBy: "未記錄",
    note: "未開封",
  },
  {
    id: 2,
    name: "雞蛋",
    category: "其他",
    quantity: "一盒",
    expiryDate: "2026-07-17",
    daysLeft: 0,
    status: "Today",
    addedBy: "Murphy",
    updatedBy: "未記錄",
    note: "已開封",
  },
  {
    id: 3,
    name: "雞胸肉",
    category: "肉類",
    quantity: "3包",
    expiryDate: "2026-07-22",
    daysLeft: 5,
    status: "Soon",
    addedBy: "NICK",
    updatedBy: "未記錄",
    note: "冷藏未開封",
  },
  {
    id: 4,
    name: "青江菜",
    category: "蔬菜",
    quantity: "2把",
    expiryDate: "2026-07-28",
    daysLeft: 11,
    status: "Safe",
    addedBy: "家人",
    updatedBy: "未記錄",
    note: "放蔬果盒",
  },
];

const statusText = {
  Expired: "已過期",
  Today: "今天到期",
  Soon: "即將到期",
  Safe: "安全",
};

function getStatus(daysLeft) {
  if (daysLeft < 0) return "Expired";
  if (daysLeft === 0) return "Today";
  if (daysLeft <= 7) return "Soon";
  return "Safe";
}

function App() {
  const [activePage, setActivePage] = useState("dashboard");
  const [foods, setFoods] = useState(initialFoods);
  const [filter, setFilter] = useState("全部");
  const [sortMode, setSortMode] = useState("urgent");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    name: "",
    category: "蔬菜",
    quantity: "",
    expiryDate: "2026-07-24",
    note: "",
  });

  const stats = useMemo(() => {
    return {
      total: foods.length,
      expired: foods.filter((food) => food.daysLeft < 0).length,
      today: foods.filter((food) => food.daysLeft === 0).length,
      soon: foods.filter((food) => food.daysLeft > 0 && food.daysLeft <= 7).length,
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

  const addFood = (event) => {
    event.preventDefault();
    if (!form.name.trim()) return;

    const daysLeft = Math.max(-3, Math.ceil((new Date(form.expiryDate) - new Date("2026-07-17")) / 86400000));
    const nextFood = {
      id: Date.now(),
      name: form.name.trim(),
      category: form.category,
      quantity: form.quantity || "未記錄",
      expiryDate: form.expiryDate,
      daysLeft,
      status: getStatus(daysLeft),
      addedBy: "訪客",
      updatedBy: "未記錄",
      note: form.note || "未記錄",
    };

    setFoods((current) => [nextFood, ...current]);
    setForm({ name: "", category: "蔬菜", quantity: "", expiryDate: "2026-07-24", note: "" });
    setActivePage("foods");
  };

  const markUsed = (id) => {
    setFoods((current) => current.filter((food) => food.id !== id));
  };

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

        <nav className="nav-list" aria-label="主要功能">
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
          <h2>示範家庭</h2>
          <p>成員：Murphy、NICK、訪客</p>
          <span>資料來源：Mock Data</span>
        </section>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="eyebrow">v7 前端展示版</p>
            <h2>{activePage === "dashboard" ? "家庭冰箱 Dashboard" : pageTitle(activePage)}</h2>
          </div>
          <button className="primary-action" onClick={() => setActivePage("add")}>新增食材</button>
        </header>

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
        {activePage === "add" && <AddFoodForm form={form} setForm={setForm} onSubmit={addFood} />}
        {activePage === "family" && <FamilyPanel />}
      </main>
    </div>
  );
}

function pageTitle(page) {
  if (page === "foods") return "食材清單";
  if (page === "add") return "新增食材";
  return "家庭管理";
}

function Dashboard({ stats, foods, onMarkUsed }) {
  const expired = foods.filter((food) => food.daysLeft < 0);
  const today = foods.filter((food) => food.daysLeft === 0);
  const soon = foods.filter((food) => food.daysLeft > 0 && food.daysLeft <= 7);

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
        <p>這裡使用 mock data 展示未來前端版的資訊密度與卡片排版。</p>
      </section>

      <FoodSection title="已過期" foods={expired} emptyText="目前沒有已過期食材。" onMarkUsed={onMarkUsed} />
      <FoodSection title="今天到期" foods={today} emptyText="今天沒有到期食材。" onMarkUsed={onMarkUsed} />
      <FoodSection title="7 天內到期" foods={soon} emptyText="7 天內沒有到期食材。" onMarkUsed={onMarkUsed} />
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
          <p>{food.category} · {food.quantity}</p>
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
      <button className="ghost-action" onClick={() => onMarkUsed(food.id)}>標記已使用</button>
    </article>
  );
}

function AddFoodForm({ form, setForm, onSubmit }) {
  const updateForm = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  return (
    <section className="form-panel">
      <div>
        <p className="eyebrow">新增到示範家庭</p>
        <h3>新增食材</h3>
        <p>這個前端展示版先使用 mock data，未來會接上 API 與 PostgreSQL。</p>
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
          <input value={form.quantity} onChange={(event) => updateForm("quantity", event.target.value)} placeholder="例如：2盒" />
        </label>
        <label>
          到期日期
          <input type="date" value={form.expiryDate} onChange={(event) => updateForm("expiryDate", event.target.value)} />
        </label>
        <label className="full">
          備註
          <textarea value={form.note} onChange={(event) => updateForm("note", event.target.value)} placeholder="例如：已開封、冷藏未開封" />
        </label>
        <button className="primary-action full" type="submit">加入展示清單</button>
      </form>
    </section>
  );
}

function FamilyPanel() {
  return (
    <section className="panel family-page">
      <div>
        <p className="eyebrow">家庭管理</p>
        <h3>示範家庭</h3>
        <p>v7 先展示未來家庭管理介面，正式登入與權限會在後續版本規劃。</p>
      </div>
      <div className="member-grid">
        {["Murphy · 管理員", "NICK · 成員", "訪客 · 成員"].map((member) => (
          <article key={member} className="member-card">
            <strong>{member}</strong>
            <span>已加入家庭冰箱</span>
          </article>
        ))}
      </div>
    </section>
  );
}

createRoot(document.getElementById("root")).render(<App />);
