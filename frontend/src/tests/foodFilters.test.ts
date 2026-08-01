import { describe, expect, it } from "vitest";
import { countByStorage, filterAndSortFoods } from "../foodFilters";
import type { Food } from "../types";

function makeFood(overrides: Partial<Food> & Pick<Food, "id" | "name">): Food {
  return {
    category: "蔬菜",
    storageLocation: "冰箱冷藏",
    quantity: "1 盒",
    price: 100,
    purchaseDate: "2026-07-20",
    expiryDate: "2026-07-30",
    daysLeft: 5,
    status: "Safe",
    addedBy: "Murphy",
    updatedBy: "未記錄",
    note: "未記錄",
    ...overrides,
  };
}

const foods: Food[] = [
  makeFood({ id: 1, name: "牛奶", category: "乳製品", storageLocation: "冰箱冷藏", daysLeft: 2 }),
  makeFood({ id: 2, name: "冷凍水餃", category: "冷凍食品", storageLocation: "冷凍庫", daysLeft: 30 }),
  makeFood({ id: 3, name: "醬油", category: "調味料", storageLocation: "常溫儲藏", daysLeft: 90 }),
  makeFood({ id: 4, name: "豆漿", category: "飲料", storageLocation: "飲品櫃", daysLeft: -1 }),
  makeFood({ id: 5, name: "優格", category: "乳製品", storageLocation: "冰箱冷藏", daysLeft: 7 }),
];

const baseQuery = { search: "", category: "全部", storage: "全部" as const, sortMode: "urgent" };

describe("filterAndSortFoods", () => {
  it("預設回傳全部食材，並依到期日由近到遠排序", () => {
    const result = filterAndSortFoods(foods, baseQuery);
    expect(result.map((food) => food.id)).toEqual([4, 1, 5, 2, 3]);
  });

  it("依儲存位置篩選只留下該位置的食材", () => {
    const result = filterAndSortFoods(foods, { ...baseQuery, storage: "冰箱冷藏" });
    expect(result.map((food) => food.name)).toEqual(["牛奶", "優格"]);
  });

  it("儲存位置與分類篩選可以同時生效", () => {
    const result = filterAndSortFoods(foods, { ...baseQuery, storage: "冷凍庫", category: "乳製品" });
    expect(result).toHaveLength(0);
  });

  it("儲存位置篩選會與搜尋關鍵字一起套用", () => {
    const result = filterAndSortFoods(foods, { ...baseQuery, storage: "冰箱冷藏", search: "優" });
    expect(result.map((food) => food.name)).toEqual(["優格"]);
  });

  it("可以改成期限由遠到近排序", () => {
    const result = filterAndSortFoods(foods, { ...baseQuery, sortMode: "safe" });
    expect(result.map((food) => food.id)).toEqual([3, 2, 5, 1, 4]);
  });

  it("依儲存位置排序時同一個位置的食材會排在一起", () => {
    const locations = filterAndSortFoods(foods, { ...baseQuery, sortMode: "storage" }).map(
      (food) => food.storageLocation,
    );
    expect(new Set(locations).size).toBe(4);
    expect(locations.slice(0, 2)).toEqual([locations[0], locations[0]]);
  });

  it("不會改動傳入的食材陣列順序", () => {
    const original = [...foods];
    filterAndSortFoods(foods, baseQuery);
    expect(foods).toEqual(original);
  });
});

describe("countByStorage", () => {
  it("統計每個儲存位置的食材筆數", () => {
    expect(countByStorage(foods)).toEqual({
      全部: 5,
      冰箱冷藏: 2,
      冷凍庫: 1,
      常溫儲藏: 1,
      飲品櫃: 1,
    });
  });

  it("沒有食材時每個位置都是 0", () => {
    expect(countByStorage([])).toEqual({
      全部: 0,
      冰箱冷藏: 0,
      冷凍庫: 0,
      常溫儲藏: 0,
      飲品櫃: 0,
    });
  });
});
