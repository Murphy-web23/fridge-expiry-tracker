import type { LucideIcon } from "lucide-react";
import { CalendarClock, CircleDollarSign, Clock3, ShoppingBasket, TriangleAlert } from "lucide-react";
import { formatPrice, storageLocations, storageMeta } from "../constants";
import { countByStorage } from "../foodFilters";
import type { DashboardStats, Food } from "../types";
import { EmptyState } from "./Shell";
import { FoodCard } from "./FoodCard";

interface StatCardProps {
  label: string;
  value: string | number;
  emoji: string;
  icon: LucideIcon;
  surface: string;
}

function StatCard({ label, value, emoji, icon: Icon, surface }: StatCardProps) {
  return (
    <article className={`rounded-3xl border border-[#E8E4DE] p-5 shadow-sm ${surface}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="font-semibold text-[#706B65]">{label}</p>
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white text-xl shadow-sm" aria-hidden="true">
          {emoji}
        </span>
      </div>
      <div className="mt-4 flex items-end justify-between gap-3">
        <strong className="text-3xl font-bold text-[#3D3834]">{value}</strong>
        <Icon className="h-5 w-5 text-[#8BA888]" aria-hidden="true" />
      </div>
    </article>
  );
}

interface FoodActions {
  onMarkUsed: (id: number) => void | Promise<void>;
  onAdjustQuantity: (id: number, delta: -1 | 1) => void | Promise<void>;
  onEdit: (food: Food) => void;
  onDelete: (food: Food) => void;
}

interface FoodSectionProps extends FoodActions {
  title: string;
  emoji: string;
  foods: Food[];
  emptyText: string;
}

function FoodSection({ title, emoji, foods, emptyText, ...actions }: FoodSectionProps) {
  return (
    <section className="border-t border-[#E8E4DE] pt-7">
      <div className="mb-5 flex items-center justify-between gap-4">
        <h3 className="flex items-center gap-2 text-xl font-bold text-[#3D3834]">
          <span aria-hidden="true">{emoji}</span>
          {title}
        </h3>
        <span className="rounded-full bg-[#F9F7F2] px-3 py-1.5 text-sm font-semibold text-[#706B65]">
          {foods.length} 筆
        </span>
      </div>
      {foods.length === 0 ? (
        <EmptyState text={emptyText} />
      ) : (
        <div className="grid gap-5 xl:grid-cols-2 2xl:grid-cols-3">
          {foods.map((food) => (
            <FoodCard key={food.id} food={food} {...actions} />
          ))}
        </div>
      )}
    </section>
  );
}

interface DashboardProps extends FoodActions {
  stats: DashboardStats;
  foods: Food[];
}

export function Dashboard({ stats, foods, ...actions }: DashboardProps) {
  const activeFoods = foods.filter((food) => food.status !== "Used");
  const expired = activeFoods.filter((food) => food.daysLeft < 0);
  const today = activeFoods.filter((food) => food.daysLeft === 0);
  const soon = activeFoods.filter((food) => food.daysLeft > 0 && food.daysLeft <= 7);
  const storageCounts = countByStorage(activeFoods);

  return (
    <div className="grid gap-8">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="總食材數" value={stats.total} emoji="🧺" icon={ShoppingBasket} surface="bg-white" />
        <StatCard label="已過期" value={stats.expired} emoji="🥀" icon={TriangleAlert} surface="bg-[#FFF5F1]" />
        <StatCard label="今天到期" value={stats.today} emoji="⏰" icon={Clock3} surface="bg-[#FFF9EC]" />
        <StatCard label="7 天內到期" value={stats.soon} emoji="📅" icon={CalendarClock} surface="bg-[#F3F6FA]" />
        <StatCard
          label="冰箱食材金額"
          value={formatPrice(stats.totalValue)}
          emoji="💰"
          icon={CircleDollarSign}
          surface="bg-[#F1F6EF]"
        />
      </section>

      <section aria-labelledby="storage-overview-title">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[#8BA888]">家庭食材放在哪裡</p>
            <h3 id="storage-overview-title" className="mt-1 text-xl font-bold text-[#3D3834]">
              儲存空間分區快覽
            </h3>
          </div>
          <p className="text-sm font-semibold text-[#706B65]">在庫食材共計 {activeFoods.length} 項</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {storageLocations.map((location) => (
            <article
              key={location}
              className="flex min-h-28 items-center justify-between gap-4 rounded-3xl border border-[#E8E4DE] bg-white/80 px-5 py-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#F9F7F2] text-2xl"
                  aria-hidden="true"
                >
                  {storageMeta[location].emoji}
                </span>
                <div className="min-w-0">
                  <h4 className="font-bold text-[#3D3834]">{location}</h4>
                  <p className="mt-1 line-clamp-1 text-xs text-[#706B65]">{storageMeta[location].description}</p>
                </div>
              </div>
              <strong className="whitespace-nowrap text-lg font-bold text-[#8BA888]">
                {storageCounts[location]} 項
              </strong>
            </article>
          ))}
        </div>
      </section>

      <section className="flex flex-col justify-between gap-5 rounded-3xl border border-[#E8E4DE] bg-[#F9F7F2] p-6 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white text-2xl shadow-sm">🌼</span>
          <div>
            <p className="text-xs font-semibold uppercase text-[#8BA888]">需要優先處理</p>
            <h3 className="mt-1 text-lg font-bold text-[#3D3834]">今天也輕鬆把冰箱照顧好</h3>
          </div>
        </div>
        <p className="max-w-xl text-sm leading-6 text-[#706B65]">
          期限、採買金額與簡短備註集中顯示，打開頁面就能掌握冰箱現況。
        </p>
      </section>

      <FoodSection title="已過期" emoji="⚠️" foods={expired} emptyText="目前沒有已過期食材。" {...actions} />
      <FoodSection title="今天到期" emoji="⏰" foods={today} emptyText="目前沒有今天到期食材。" {...actions} />
      <FoodSection title="7 天內到期" emoji="✨" foods={soon} emptyText="目前沒有 7 天內到期食材。" {...actions} />
    </div>
  );
}
