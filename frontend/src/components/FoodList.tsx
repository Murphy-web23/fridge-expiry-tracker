import { ArrowUpDown, Leaf, MapPin, Search } from "lucide-react";
import { categories, categoryMeta, storageFilters, storageMeta } from "../constants";
import type { Food, StorageFilter } from "../types";
import { inputClass, labelClass } from "../ui";
import { FoodCard } from "./FoodCard";
import { EmptyState } from "./Shell";

interface FoodListProps {
  foods: Food[];
  filter: string;
  setFilter: (value: string) => void;
  storageFilter: StorageFilter;
  setStorageFilter: (value: StorageFilter) => void;
  storageCounts: Record<StorageFilter, number>;
  sortMode: string;
  setSortMode: (value: string) => void;
  search: string;
  setSearch: (value: string) => void;
  onMarkUsed: (id: number) => void | Promise<void>;
  onAdjustQuantity: (id: number, delta: -1 | 1) => void | Promise<void>;
  onEdit: (food: Food) => void;
  onDelete: (food: Food) => void;
}

export function FoodList({
  foods,
  filter,
  setFilter,
  storageFilter,
  setStorageFilter,
  storageCounts,
  sortMode,
  setSortMode,
  search,
  setSearch,
  onMarkUsed,
  onAdjustQuantity,
  onEdit,
  onDelete,
}: FoodListProps) {
  return (
    <div className="grid gap-6">
      <section className="grid gap-4 rounded-3xl border border-[#E8E4DE] bg-white/80 p-6 shadow-sm md:grid-cols-2 xl:grid-cols-4">
        <label className={labelClass}>
          <span className="flex items-center gap-2">
            <Search className="h-5 w-5 text-[#8BA888]" aria-hidden="true" />
            搜尋
          </span>
          <input
            className={inputClass}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="輸入食材名稱"
          />
        </label>
        <label className={labelClass}>
          <span className="flex items-center gap-2">
            <Leaf className="h-5 w-5 text-[#8BA888]" aria-hidden="true" />
            分類
          </span>
          <select className={inputClass} value={filter} onChange={(event) => setFilter(event.target.value)}>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category === "全部" ? "🌈 全部分類" : `${categoryMeta[category].emoji} ${category}`}
              </option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          <span className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-[#8BA888]" aria-hidden="true" />
            儲存位置
          </span>
          <select
            className={inputClass}
            value={storageFilter}
            onChange={(event) => setStorageFilter(event.target.value as StorageFilter)}
          >
            {storageFilters.map((location) => (
              <option key={location} value={location}>
                {location === "全部" ? "🏡 全部位置" : `${storageMeta[location].emoji} ${location}`}（
                {storageCounts[location]}）
              </option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          <span className="flex items-center gap-2">
            <ArrowUpDown className="h-5 w-5 text-[#8BA888]" aria-hidden="true" />
            排序
          </span>
          <select className={inputClass} value={sortMode} onChange={(event) => setSortMode(event.target.value)}>
            <option value="urgent">期限由近到遠</option>
            <option value="safe">期限由遠到近</option>
            <option value="category">依分類</option>
            <option value="storage">依儲存位置</option>
          </select>
        </label>
      </section>

      {foods.length === 0 ? (
        <EmptyState text="找不到符合條件的食材，換個關鍵字或儲存位置看看。" />
      ) : (
        <section className="grid gap-5 xl:grid-cols-2 2xl:grid-cols-3">
          {foods.map((food) => (
            <FoodCard
              key={food.id}
              food={food}
              onMarkUsed={onMarkUsed}
              onAdjustQuantity={onAdjustQuantity}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </section>
      )}
    </div>
  );
}
