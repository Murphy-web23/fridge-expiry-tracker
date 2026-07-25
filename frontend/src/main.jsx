import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  adjustFoodQuantity,
  apiConfig,
  createFood,
  getFamily,
  getFamilies,
  getFoods,
  getMembers,
  markFoodUsed,
} from "./api";
import "./styles.css";

const categories = ["全部", "蔬菜", "水果", "肉類", "海鮮", "乳製品", "冷凍食品", "飲料", "調味料", "其他"];
const quantityUnits = ["個", "盒", "包", "瓶", "袋", "罐", "條", "份", "箱", "顆", "把", "根", "隻", "片", "kg", "g", "L", "ml", "塊"];
const foodPresets = [
  { name: "青江菜", category: "蔬菜", unit: "把" },
  { name: "高麗菜", category: "蔬菜", unit: "顆" },
  { name: "菠菜", category: "蔬菜", unit: "把" },
  { name: "番茄", category: "蔬菜", unit: "顆" },
  { name: "洋蔥", category: "蔬菜", unit: "顆" },
  { name: "蘋果", category: "水果", unit: "顆" },
  { name: "香蕉", category: "水果", unit: "根" },
  { name: "橘子", category: "水果", unit: "顆" },
  { name: "葡萄", category: "水果", unit: "盒" },
  { name: "雞胸肉", category: "肉類", unit: "包" },
  { name: "豬肉片", category: "肉類", unit: "盒" },
  { name: "牛肉片", category: "肉類", unit: "盒" },
  { name: "鮭魚", category: "海鮮", unit: "片" },
  { name: "蝦仁", category: "海鮮", unit: "包" },
  { name: "鮮奶", category: "乳製品", unit: "瓶" },
  { name: "雞蛋", category: "乳製品", unit: "盒" },
  { name: "優格", category: "乳製品", unit: "盒" },
  { name: "起司", category: "乳製品", unit: "包" },
  { name: "冷凍水餃", category: "冷凍食品", unit: "包" },
  { name: "冷凍蔬菜", category: "冷凍食品", unit: "包" },
  { name: "果汁", category: "飲料", unit: "瓶" },
  { name: "豆漿", category: "飲料", unit: "瓶" },
  { name: "醬油", category: "調味料", unit: "瓶" },
  { name: "味噌", category: "調味料", unit: "盒" },
  { name: "豆腐", category: "其他", unit: "盒" },
];

const statusText = {
  Expired: "已過期",
  Today: "今天到期",
  Soon: "即將到期",
  Safe: "安全",
  Used: "已使用",
};
const categoryColors = {
  蔬菜: "#3b8f63",
  水果: "#d35f52",
  肉類: "#c27a42",
  海鮮: "#4f7fc4",
  乳製品: "#c7a93f",
  冷凍食品: "#6b6fb5",
  飲料: "#4c9399",
  調味料: "#8c7853",
  其他: "#7a8790",
};

function todayText() {
  return new Date().toISOString().slice(0, 10);
}

function initialFoodForm() {
  return {
    preset: "",
    name: "",
    category: "蔬菜",
    quantityAmount: "1",
    quantityUnit: "盒",
    price: "",
    purchaseDate: todayText(),
    expiryDate: todayText(),
    note: "",
  };
}

function addDays(dateText, days) {
  const value = new Date(`${dateText}T00:00:00`);
  value.setDate(value.getDate() + days);
  return value.toISOString().slice(0, 10);
}

function formatPrice(price) {
  return `NT$ ${new Intl.NumberFormat("zh-TW", { maximumFractionDigits: 0 }).format(Number(price) || 0)}`;
}

function shortNote(note, maxLength = 42) {
  const cleanNote = (note || "").trim();
  if (!cleanNote || cleanNote === "未記錄") return "沒有備註";
  return cleanNote.length > maxLength ? `${cleanNote.slice(0, maxLength)}…` : cleanNote;
}

function normalizeFood(food) {
  return {
    id: food.id,
    name: food.name,
    category: food.category,
    quantity: food.quantity,
    price: Number(food.price) || 0,
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
  const [families, setFamilies] = useState([]);
  const [members, setMembers] = useState([]);
  const [familyCode, setFamilyCode] = useState(apiConfig.familyCode);
  const [currentMember, setCurrentMember] = useState(apiConfig.memberName);
  const [filter, setFilter] = useState("全部");
  const [sortMode, setSortMode] = useState("urgent");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [form, setForm] = useState(initialFoodForm);

  useEffect(() => {
    loadFamilyOptions();
  }, []);

  useEffect(() => {
    loadFamilyData();
  }, [familyCode]);

  async function loadFamilyOptions() {
    try {
      const familyOptions = await getFamilies();
      setFamilies(familyOptions);
      if (familyOptions.length > 0 && !familyOptions.some((item) => item.family_code === familyCode)) {
        setFamilyCode(familyOptions[0].family_code);
      }
    } catch (error) {
      setErrorMessage("目前無法取得家庭清單，請確認 FastAPI 後端是否正在執行。");
    }
  }

  async function loadFamilyData() {
    try {
      setIsLoading(true);
      setErrorMessage("");
      const [familyData, memberData, foodData] = await Promise.all([
        getFamily(familyCode),
        getMembers(familyCode),
        getFoods(familyCode),
      ]);
      setFamily(familyData);
      setMembers(memberData);
      setCurrentMember((current) => {
        const stillExists = memberData.some((member) => member.member_name === current);
        return stillExists ? current : memberData[0]?.member_name || apiConfig.memberName;
      });
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
      totalValue: activeFoods.reduce((sum, food) => sum + food.price, 0),
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
    if (form.expiryDate < form.purchaseDate) {
      setErrorMessage("到期日期不能早於購買日期。");
      return;
    }

    try {
      setIsSaving(true);
      setErrorMessage("");
      const createdFood = await createFood({
        name: form.name.trim(),
        category: form.category,
        quantity: `${form.quantityAmount || 1} ${form.quantityUnit}`,
        price: Number(form.price) || 0,
        purchase_date: form.purchaseDate,
        expiry_date: form.expiryDate,
        note: form.note || "未記錄",
      }, familyCode, currentMember);

      setFoods((current) => [normalizeFood(createdFood), ...current]);
      setForm(initialFoodForm());
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
      const updatedFood = await markFoodUsed(id, familyCode, currentMember);
      setFoods((current) => current.map((food) => (food.id === id ? normalizeFood(updatedFood) : food)));
    } catch (error) {
      setErrorMessage("標記已使用失敗，請稍後再試。");
    }
  }

  async function adjustQuantity(id, delta) {
    try {
      setErrorMessage("");
      const updatedFood = await adjustFoodQuantity(id, delta, familyCode, currentMember);
      setFoods((current) => current.map((food) => (food.id === id ? normalizeFood(updatedFood) : food)));
    } catch (error) {
      setErrorMessage("數量更新失敗，請確認這筆食材的數量格式。");
    }
  }

  const familyName = family?.family_name || familyCode;
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
          <button className={activePage === "spending" ? "active" : ""} onClick={() => setActivePage("spending")}>
            消費統計
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
          <label className="sidebar-select">
            家庭
            <select value={familyCode} onChange={(event) => setFamilyCode(event.target.value)}>
              {families.map((familyOption) => (
                <option key={familyOption.family_code} value={familyOption.family_code}>
                  {familyOption.family_name}
                </option>
              ))}
            </select>
          </label>
          <label className="sidebar-select">
            目前操作者
            <select value={currentMember} onChange={(event) => setCurrentMember(event.target.value)}>
              {members.map((member) => (
                <option key={member.member_name} value={member.member_name}>
                  {member.member_name}
                </option>
              ))}
            </select>
          </label>
          <p className="family-members">家庭成員：{memberNames}</p>
          <span>資料來源：FastAPI</span>
        </section>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="eyebrow">v10 金額與資訊優化版</p>
            <h2>{activePage === "dashboard" ? "家庭冰箱 Dashboard" : pageTitle(activePage)}</h2>
          </div>
          <button className="primary-action" onClick={() => setActivePage("add")}>
            新增食材
          </button>
        </header>

        <ApiNotice isLoading={isLoading} errorMessage={errorMessage} onRetry={loadFamilyData} />

        {activePage === "dashboard" && (
          <Dashboard stats={stats} foods={foods} onMarkUsed={markUsed} onAdjustQuantity={adjustQuantity} />
        )}
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
            onAdjustQuantity={adjustQuantity}
          />
        )}
        {activePage === "spending" && <SpendingPanel foods={foods} familyName={familyName} />}
        {activePage === "add" && (
          <AddFoodForm
            form={form}
            setForm={setForm}
            onSubmit={addFood}
            isSaving={isSaving}
            familyName={familyName}
            currentMember={currentMember}
          />
        )}
        {activePage === "family" && <FamilyPanel family={family} members={members} currentMember={currentMember} />}
      </main>
    </div>
  );
}

function pageTitle(page) {
  if (page === "foods") return "食材清單";
  if (page === "spending") return "消費統計";
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

function Dashboard({ stats, foods, onMarkUsed, onAdjustQuantity }) {
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
        <StatCard label="冰箱食材金額" value={formatPrice(stats.totalValue)} tone="money" compact />
      </section>

      <section className="dashboard-band">
        <div>
          <p className="eyebrow">需要優先處理</p>
          <h3>把最緊急的食材排在前面</h3>
        </div>
        <p>期限、採買金額與簡短備註集中顯示，打開頁面就能掌握冰箱現況。</p>
      </section>

      <FoodSection
        title="已過期"
        foods={expired}
        emptyText="目前沒有已過期食材。"
        onMarkUsed={onMarkUsed}
        onAdjustQuantity={onAdjustQuantity}
      />
      <FoodSection
        title="今天到期"
        foods={today}
        emptyText="目前沒有今天到期食材。"
        onMarkUsed={onMarkUsed}
        onAdjustQuantity={onAdjustQuantity}
      />
      <FoodSection
        title="7 天內到期"
        foods={soon}
        emptyText="目前沒有 7 天內到期食材。"
        onMarkUsed={onMarkUsed}
        onAdjustQuantity={onAdjustQuantity}
      />
    </div>
  );
}

function StatCard({ label, value, tone, compact = false }) {
  return (
    <article className={`stat-card ${tone}`}>
      <p>{label}</p>
      <strong className={compact ? "compact-value" : ""}>{value}</strong>
    </article>
  );
}

function FoodList({
  foods,
  filter,
  setFilter,
  sortMode,
  setSortMode,
  search,
  setSearch,
  onMarkUsed,
  onAdjustQuantity,
}) {
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
          <FoodCard
            key={food.id}
            food={food}
            onMarkUsed={onMarkUsed}
            onAdjustQuantity={onAdjustQuantity}
          />
        ))}
      </div>
    </section>
  );
}

function FoodSection({ title, foods, emptyText, onMarkUsed, onAdjustQuantity }) {
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
            <FoodCard
              key={food.id}
              food={food}
              onMarkUsed={onMarkUsed}
              onAdjustQuantity={onAdjustQuantity}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function FoodCard({ food, onMarkUsed, onAdjustQuantity }) {
  const notePreview = shortNote(food.note);
  const quantityAmount = Number.parseFloat(food.quantity);
  const canDecrease = Number.isFinite(quantityAmount) && quantityAmount > 0 && food.status !== "Used";

  return (
    <article className={`food-card ${food.status.toLowerCase()}`}>
      <div className="food-card-header">
        <div>
          <h4>{food.name}</h4>
          <p>
            {food.category} ・ {food.quantity}
          </p>
        </div>
        <div className="food-card-badges">
          <span className="price-badge">{formatPrice(food.price)}</span>
          <span className={`status-badge ${food.status.toLowerCase()}`}>{statusText[food.status]}</span>
        </div>
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
          <dt>購買日</dt>
          <dd>{food.purchaseDate || "未記錄"}</dd>
        </div>
      </dl>
      <div className="note-preview" title={food.note || ""}>
        <span>備註</span>
        <p>{notePreview}</p>
      </div>
      <div className="food-card-actions">
        <div className="quantity-stepper" aria-label="調整食材數量">
          <button
            type="button"
            title="數量減少 1"
            aria-label={`${food.name}數量減少 1`}
            disabled={!canDecrease}
            onClick={() => onAdjustQuantity(food.id, -1)}
          >
            −
          </button>
          <button
            type="button"
            title="數量增加 1"
            aria-label={`${food.name}數量增加 1`}
            disabled={food.status === "Used"}
            onClick={() => onAdjustQuantity(food.id, 1)}
          >
            +
          </button>
        </div>
        {food.status === "Used" ? (
          <button className="ghost-action" disabled>
            已標記使用
          </button>
        ) : (
          <button className="ghost-action" onClick={() => onMarkUsed(food.id)}>
            標記已使用
          </button>
        )}
      </div>
    </article>
  );
}

function SpendingPanel({ foods, familyName }) {
  const [period, setPeriod] = useState("month");
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  const foodDate = (food) => new Date(`${food.purchaseDate}T00:00:00`);
  const isThisMonth = (food) => {
    const value = foodDate(food);
    return value.getFullYear() === now.getFullYear() && value.getMonth() === now.getMonth();
  };
  const isThisWeek = (food) => {
    const value = foodDate(food);
    return value >= weekStart && value < weekEnd;
  };
  const weekFoods = foods.filter(isThisWeek);
  const monthFoods = foods.filter(isThisMonth);
  const visibleFoods = period === "week" ? weekFoods : period === "month" ? monthFoods : foods;
  const weekTotal = weekFoods.reduce((sum, food) => sum + food.price, 0);
  const monthTotal = monthFoods.reduce((sum, food) => sum + food.price, 0);
  const missingPriceCount = foods.filter((food) => food.price <= 0).length;
  const visibleTotal = visibleFoods.reduce((sum, food) => sum + food.price, 0);

  const categoryTotals = Object.entries(
    visibleFoods.reduce((totals, food) => {
      if (food.price <= 0) return totals;
      totals[food.category] = (totals[food.category] || 0) + food.price;
      return totals;
    }, {}),
  )
    .map(([category, total]) => ({
      category,
      total,
      percent: visibleTotal > 0 ? Math.round((total / visibleTotal) * 100) : 0,
      color: categoryColors[category] || categoryColors.其他,
    }))
    .sort((a, b) => b.total - a.total);

  let chartCursor = 0;
  const chartSegments = categoryTotals.map((item) => {
    const start = chartCursor;
    chartCursor += visibleTotal > 0 ? (item.total / visibleTotal) * 100 : 0;
    return `${item.color} ${start}% ${chartCursor}%`;
  });
  const chartBackground = chartSegments.length > 0 ? `conic-gradient(${chartSegments.join(", ")})` : "#e5ece7";

  return (
    <div className="spending-page">
      <section className="spending-summary">
        <article className="spending-metric">
          <p>本週採買</p>
          <strong>{formatPrice(weekTotal)}</strong>
          <span>週一至週日</span>
        </article>
        <article className="spending-metric featured">
          <p>本月採買</p>
          <strong>{formatPrice(monthTotal)}</strong>
          <span>{now.getFullYear()} 年 {now.getMonth() + 1} 月</span>
        </article>
        <article className={`spending-metric ${missingPriceCount > 0 ? "attention" : ""}`}>
          <p>資料完整度</p>
          <strong>{missingPriceCount > 0 ? `${missingPriceCount} 筆未填` : "完整"}</strong>
          <span>{missingPriceCount > 0 ? "補上金額後統計會更準確" : "所有食材都有金額"}</span>
        </article>
      </section>

      <section className="spending-toolbar">
        <div>
          <p className="eyebrow">{familyName}</p>
          <h3>食材消費類別分析</h3>
        </div>
        <div className="period-tabs" aria-label="統計期間">
          {[
            ["month", "本月"],
            ["week", "本週"],
            ["all", "全部"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={period === value ? "active" : ""}
              onClick={() => setPeriod(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      <div className="spending-analysis">
        <section className="panel spending-chart-panel">
          <div className="section-heading">
            <h3>類別支出占比</h3>
            <span>{formatPrice(visibleTotal)}</span>
          </div>
          <div className="donut-layout">
            <div className="donut-chart" style={{ background: chartBackground }}>
              <div>
                <span>總金額</span>
                <strong>{formatPrice(visibleTotal)}</strong>
              </div>
            </div>
            <div className="chart-legend">
              {categoryTotals.map((item) => (
                <span key={item.category}>
                  <i style={{ background: item.color }} />
                  {item.category} {item.percent}%
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="panel spending-ranking">
          <div className="section-heading">
            <h3>各類別消費排行</h3>
            <span>{categoryTotals.length} 類</span>
          </div>
          {categoryTotals.length === 0 ? (
            <p className="empty-text">這個期間還沒有可統計的金額。</p>
          ) : (
            categoryTotals.map((item) => (
              <div className="ranking-row" key={item.category}>
                <div>
                  <strong>{item.category}</strong>
                  <span>{formatPrice(item.total)}（{item.percent}%）</span>
                </div>
                <div className="ranking-track">
                  <span style={{ width: `${item.percent}%`, background: item.color }} />
                </div>
              </div>
            ))
          )}
        </section>
      </div>

      <section className="panel spending-table-panel">
        <div className="section-heading">
          <h3>單筆食材採買明細</h3>
          <span>{visibleFoods.length} 筆</span>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>食材名稱</th>
                <th>分類</th>
                <th>採買數量</th>
                <th>金額</th>
                <th>購買日期</th>
                <th>登錄成員</th>
              </tr>
            </thead>
            <tbody>
              {visibleFoods.map((food) => (
                <tr key={food.id}>
                  <td><strong>{food.name}</strong></td>
                  <td>{food.category}</td>
                  <td>{food.quantity}</td>
                  <td className={food.price > 0 ? "price-cell" : "missing-price"}>
                    {food.price > 0 ? formatPrice(food.price) : "未填"}
                  </td>
                  <td>{food.purchaseDate || "未記錄"}</td>
                  <td>{food.addedBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function AddFoodForm({ form, setForm, onSubmit, isSaving, familyName, currentMember }) {
  const updateForm = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const selectPreset = (presetName) => {
    if (presetName === "__custom__") {
      setForm((current) => ({ ...current, preset: presetName, name: "" }));
      return;
    }

    const preset = foodPresets.find((food) => food.name === presetName);
    if (!preset) {
      setForm((current) => ({ ...current, preset: "", name: "" }));
      return;
    }

    setForm((current) => ({
      ...current,
      preset: preset.name,
      name: preset.name,
      category: preset.category,
      quantityUnit: preset.unit,
    }));
  };

  return (
    <section className="form-panel">
      <div>
        <p className="eyebrow">新增到 {familyName}</p>
        <h3>新增食材</h3>
        <p>目前操作者：<strong>{currentMember}</strong></p>
        <p>常用食材、單位與期限都能直接點選，只在需要自訂時輸入文字。</p>
      </div>
      <form onSubmit={onSubmit} className="food-form">
        <label>
          常用食材
          <select value={form.preset} onChange={(event) => selectPreset(event.target.value)} required>
            <option value="">請選擇食材</option>
            {categories.slice(1).map((category) => (
              <optgroup key={category} label={category}>
                {foodPresets
                  .filter((food) => food.category === category)
                  .map((food) => (
                    <option key={food.name} value={food.name}>
                      {food.name}
                    </option>
                  ))}
              </optgroup>
            ))}
            <option value="__custom__">其他食材（自行輸入）</option>
          </select>
        </label>
        {form.preset === "__custom__" && (
          <label>
            自訂食材名稱
            <input
              value={form.name}
              onChange={(event) => updateForm("name", event.target.value)}
              placeholder="例如：嫩豆腐"
              required
            />
          </label>
        )}
        <label>
          分類
          <select value={form.category} onChange={(event) => updateForm("category", event.target.value)}>
            {categories.slice(1).map((category) => (
              <option key={category}>{category}</option>
            ))}
          </select>
        </label>
        <label>
          數量與單位
          <span className="quantity-controls">
            <input
              type="number"
              min="0.1"
              step="0.1"
              inputMode="decimal"
              value={form.quantityAmount}
              onChange={(event) => updateForm("quantityAmount", event.target.value)}
              aria-label="數量"
              required
            />
            <select
              value={form.quantityUnit}
              onChange={(event) => updateForm("quantityUnit", event.target.value)}
              aria-label="單位"
            >
              {quantityUnits.map((unit) => (
                <option key={unit}>{unit}</option>
              ))}
            </select>
          </span>
        </label>
        <label>
          購買金額（NT$）
          <input
            type="number"
            min="0"
            step="1"
            inputMode="numeric"
            value={form.price}
            onChange={(event) => updateForm("price", event.target.value)}
            placeholder="例如：120"
          />
        </label>
        <label>
          購買日期
          <input type="date" value={form.purchaseDate} onChange={(event) => updateForm("purchaseDate", event.target.value)} />
        </label>
        <label>
          到期日期
          <input type="date" value={form.expiryDate} onChange={(event) => updateForm("expiryDate", event.target.value)} />
        </label>
        <div className="quick-expiry full">
          <span>期限快速設定</span>
          <div>
            {[
              [3, "+3 天"],
              [7, "+7 天"],
              [14, "+14 天"],
              [30, "+1 個月"],
              [180, "+6 個月"],
            ].map(([days, label]) => (
              <button
                key={days}
                type="button"
                onClick={() => updateForm("expiryDate", addDays(form.purchaseDate, days))}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <label className="full">
          簡短備註
          <textarea
            maxLength="120"
            value={form.note}
            onChange={(event) => updateForm("note", event.target.value)}
            placeholder="例如：已開封、週末先煮、放在上層"
          />
          <span className="field-hint">{form.note.length}/120</span>
        </label>
        <button className="primary-action full" type="submit" disabled={isSaving}>
          {isSaving ? "新增中..." : "加入冰箱"}
        </button>
      </form>
    </section>
  );
}

function FamilyPanel({ family, members, currentMember }) {
  return (
    <section className="panel family-page">
      <div>
        <p className="eyebrow">家庭管理</p>
        <h3>{family?.family_name || "示範家庭"}</h3>
        <p>目前操作者為「{currentMember}」，新增食材與標記使用都會以這個成員留下紀錄。</p>
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
