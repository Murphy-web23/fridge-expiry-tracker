import { CalendarDays, CircleDollarSign, PieChart as PieChartIcon, ReceiptText, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { categoryMeta, formatPrice } from "../constants";
import type { CategoryTotal, Food } from "../types";

type Period = "month" | "week" | "all";

interface SpendingPanelProps {
  foods: Food[];
  familyName: string;
}

function foodDate(food: Food): Date {
  return new Date(`${food.purchaseDate}T00:00:00`);
}

function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
  featured = false,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: string;
  detail: string;
  featured?: boolean;
}) {
  return (
    <article
      className={`rounded-3xl border p-6 shadow-sm ${
        featured
          ? "border-[#8BA888] bg-[#8BA888] text-white"
          : "border-[#E8E4DE] bg-white/80 text-[#3D3834]"
      }`}
    >
      <Icon className={`h-6 w-6 ${featured ? "text-white" : "text-[#8BA888]"}`} aria-hidden="true" />
      <p className={`mt-5 text-sm font-semibold ${featured ? "text-white/80" : "text-[#706B65]"}`}>{label}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
      <p className={`mt-2 text-sm ${featured ? "text-white/80" : "text-[#706B65]"}`}>{detail}</p>
    </article>
  );
}

export function SpendingPanel({ foods, familyName }: SpendingPanelProps) {
  const [period, setPeriod] = useState<Period>("month");

  const spending = useMemo(() => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    const weekFoods = foods.filter((food) => {
      const value = foodDate(food);
      return value >= weekStart && value < weekEnd;
    });
    const monthFoods = foods.filter((food) => {
      const value = foodDate(food);
      return value.getFullYear() === now.getFullYear() && value.getMonth() === now.getMonth();
    });
    const visibleFoods = period === "week" ? weekFoods : period === "month" ? monthFoods : foods;
    const visibleTotal = visibleFoods.reduce((sum, food) => sum + food.price, 0);

    const categoryTotals: CategoryTotal[] = Object.entries(
      visibleFoods.reduce<Record<string, number>>((totals, food) => {
        if (food.price > 0) totals[food.category] = (totals[food.category] || 0) + food.price;
        return totals;
      }, {}),
    )
      .map(([category, total]) => ({
        category,
        total,
        percent: visibleTotal > 0 ? Math.round((total / visibleTotal) * 100) : 0,
        color: categoryMeta[category]?.color || "#8D8983",
      }))
      .sort((a, b) => b.total - a.total);

    return {
      weekTotal: weekFoods.reduce((sum, food) => sum + food.price, 0),
      monthTotal: monthFoods.reduce((sum, food) => sum + food.price, 0),
      missingPriceCount: foods.filter((food) => food.price <= 0).length,
      visibleFoods,
      visibleTotal,
      categoryTotals,
      monthLabel: `${now.getFullYear()} 年 ${now.getMonth() + 1} 月`,
    };
  }, [foods, period]);

  return (
    <div className="grid gap-6">
      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard
          icon={CalendarDays}
          label="本週採買"
          value={formatPrice(spending.weekTotal)}
          detail="週一至週日"
        />
        <MetricCard
          icon={CircleDollarSign}
          label="本月採買"
          value={formatPrice(spending.monthTotal)}
          detail={spending.monthLabel}
          featured
        />
        <MetricCard
          icon={ShieldCheck}
          label="資料完整度"
          value={spending.missingPriceCount === 0 ? "完整" : `${spending.missingPriceCount} 筆待補`}
          detail={spending.missingPriceCount === 0 ? "所有食材都有金額" : "補上金額後統計會更準確"}
        />
      </section>

      <section className="flex flex-col gap-4 border-y border-[#E8E4DE] py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-[#8BA888]">{familyName}</p>
          <h3 className="mt-1 text-xl font-bold text-[#3D3834]">食材消費類別分析</h3>
        </div>
        <div className="inline-flex w-fit rounded-2xl border border-[#E8E4DE] bg-white p-1">
          {([
            ["month", "本月"],
            ["week", "本週"],
            ["all", "全部"],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setPeriod(value)}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                period === value ? "bg-[#8BA888] text-white" : "text-[#706B65] hover:bg-[#F9F7F2]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <article className="rounded-3xl border border-[#E8E4DE] bg-white/80 p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h3 className="flex items-center gap-2 text-lg font-bold text-[#3D3834]">
              <PieChartIcon className="h-5 w-5 text-[#8BA888]" aria-hidden="true" />
              類別支出占比
            </h3>
            <span className="rounded-full bg-[#F9F7F2] px-3 py-1 text-sm font-semibold text-[#706B65]">
              {formatPrice(spending.visibleTotal)}
            </span>
          </div>
          {spending.categoryTotals.length > 0 ? (
            <div className="mt-4 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={spending.categoryTotals}
                    dataKey="total"
                    nameKey="category"
                    innerRadius={62}
                    outerRadius={98}
                    paddingAngle={3}
                    stroke="#FDFCF9"
                    strokeWidth={3}
                  >
                    {spending.categoryTotals.map((item) => (
                      <Cell key={item.category} fill={item.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => formatPrice(Number(value))}
                    contentStyle={{
                      border: "1px solid #E8E4DE",
                      borderRadius: "16px",
                      boxShadow: "0 4px 20px rgba(61,56,52,0.05)",
                      color: "#3D3834",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="grid h-72 place-items-center text-sm text-[#706B65]">這段期間還沒有金額紀錄。</div>
          )}
        </article>

        <article className="rounded-3xl border border-[#E8E4DE] bg-white/80 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-[#3D3834]">各類別消費排行</h3>
          <div className="mt-6 grid gap-5">
            {spending.categoryTotals.length > 0 ? (
              spending.categoryTotals.map((item) => (
                <div key={item.category}>
                  <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                    <span className="font-semibold text-[#3D3834]">
                      {categoryMeta[item.category]?.emoji || "📦"} {item.category}
                    </span>
                    <span className="text-[#706B65]">
                      {formatPrice(item.total)} ({item.percent}%)
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[#E8E4DE]/70">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${item.percent}%`, backgroundColor: item.color }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-[#706B65]">新增採買金額後，這裡會顯示類別排行。</p>
            )}
          </div>
        </article>
      </section>

      <section className="overflow-hidden rounded-3xl border border-[#E8E4DE] bg-white/80 shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-[#E8E4DE] px-6 py-5">
          <h3 className="flex items-center gap-2 text-lg font-bold text-[#3D3834]">
            <ReceiptText className="h-5 w-5 text-[#8BA888]" aria-hidden="true" />
            單筆食材採買明細
          </h3>
          <span className="rounded-full bg-[#F9F7F2] px-3 py-1 text-sm font-semibold text-[#706B65]">
            {spending.visibleFoods.length} 筆
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-[#F9F7F2] text-[#706B65]">
              <tr>
                {["食材名稱", "分類", "採買數量", "金額", "購買日期", "登錄成員"].map((heading) => (
                  <th key={heading} className="px-6 py-4 font-semibold">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E4DE] text-[#3D3834]">
              {spending.visibleFoods.map((food) => (
                <tr key={food.id} className="hover:bg-[#F9F7F2]/70">
                  <td className="px-6 py-4 font-semibold">{food.name}</td>
                  <td className="px-6 py-4">
                    {categoryMeta[food.category]?.emoji || "📦"} {food.category}
                  </td>
                  <td className="px-6 py-4">{food.quantity}</td>
                  <td className="px-6 py-4 font-semibold text-[#5D775A]">
                    {food.price > 0 ? formatPrice(food.price) : "未填"}
                  </td>
                  <td className="px-6 py-4">{food.purchaseDate}</td>
                  <td className="px-6 py-4">{food.addedBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
