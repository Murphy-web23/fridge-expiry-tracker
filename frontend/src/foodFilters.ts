import type { Food, StorageFilter } from "./types";

export interface FoodQuery {
  search: string;
  category: string;
  storage: StorageFilter;
  sortMode: string;
}

/**
 * 食材清單的搜尋、分類、儲存位置篩選與排序。
 * 抽成純函式，方便 Vitest 直接驗證，也讓 App 只負責保存畫面狀態。
 */
export function filterAndSortFoods(foods: Food[], query: FoodQuery): Food[] {
  const keyword = query.search.trim().toLocaleLowerCase("zh-Hant");

  const result = foods.filter((food) => {
    const matchesCategory = query.category === "全部" || food.category === query.category;
    const matchesStorage = query.storage === "全部" || food.storageLocation === query.storage;
    const matchesSearch = food.name.toLocaleLowerCase("zh-Hant").includes(keyword);
    return matchesCategory && matchesStorage && matchesSearch;
  });

  return result.sort((a, b) => {
    if (query.sortMode === "category") return a.category.localeCompare(b.category, "zh-Hant");
    if (query.sortMode === "storage") return a.storageLocation.localeCompare(b.storageLocation, "zh-Hant");
    if (query.sortMode === "safe") return b.daysLeft - a.daysLeft;
    return a.daysLeft - b.daysLeft;
  });
}

/** 計算各儲存位置的在庫食材筆數，Dashboard 分區快覽與清單篩選提示共用。 */
export function countByStorage(foods: Food[]): Record<StorageFilter, number> {
  const counts: Record<StorageFilter, number> = {
    全部: 0,
    冰箱冷藏: 0,
    冷凍庫: 0,
    常溫儲藏: 0,
    飲品櫃: 0,
  };

  for (const food of foods) {
    counts[food.storageLocation] += 1;
    counts.全部 += 1;
  }

  return counts;
}
