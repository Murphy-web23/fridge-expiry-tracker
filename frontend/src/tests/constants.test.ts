import { describe, expect, it } from "vitest";
import {
  createEditFoodForm,
  defaultStorageLocation,
  parseQuantity,
  todayText,
  validateFoodForm,
} from "../constants";
import type { Food, FoodEditFormState } from "../types";

const validForm: FoodEditFormState = {
  name: "牛奶",
  category: "乳製品",
  storageLocation: "冰箱冷藏",
  quantityAmount: "2",
  quantityUnit: "瓶",
  price: "95",
  purchaseDate: "2026-07-20",
  expiryDate: "2026-07-30",
  note: "未開封",
};

describe("validateFoodForm", () => {
  it("欄位正確時不回傳錯誤訊息", () => {
    expect(validateFoodForm(validForm)).toBe("");
  });

  it("沒有食材名稱時提醒使用者選擇或輸入", () => {
    expect(validateFoodForm({ ...validForm, name: "   " })).toContain("食材");
  });

  it("數量不是正整數時擋下來", () => {
    expect(validateFoodForm({ ...validForm, quantityAmount: "0" })).toContain("整數");
    expect(validateFoodForm({ ...validForm, quantityAmount: "1.5" })).toContain("整數");
    expect(validateFoodForm({ ...validForm, quantityAmount: "" })).toContain("整數");
  });

  it("到期日早於購買日時擋下來", () => {
    expect(validateFoodForm({ ...validForm, expiryDate: "2026-07-19" })).toContain("到期日期");
  });

  it("到期日與購買日同一天是允許的", () => {
    expect(validateFoodForm({ ...validForm, expiryDate: "2026-07-20" })).toBe("");
  });
});

describe("parseQuantity", () => {
  it("把後端的數量字串拆成數量與單位", () => {
    expect(parseQuantity("2 盒")).toEqual({ amount: "2", unit: "盒" });
    expect(parseQuantity("10瓶")).toEqual({ amount: "10", unit: "瓶" });
  });

  it("沒有數字或單位不在清單時退回預設值", () => {
    expect(parseQuantity("未記錄")).toEqual({ amount: "1", unit: "個" });
    expect(parseQuantity("3 打")).toEqual({ amount: "3", unit: "個" });
  });
});

describe("createEditFoodForm", () => {
  const food: Food = {
    id: 1,
    name: "牛奶",
    category: "乳製品",
    storageLocation: "冰箱冷藏",
    quantity: "3 瓶",
    price: 95,
    purchaseDate: "2026-07-05",
    expiryDate: "2026-07-11",
    daysLeft: 2,
    status: "Soon",
    addedBy: "Murphy",
    updatedBy: "未記錄",
    note: "未開封",
  };

  it("用現有食材填好編輯表單", () => {
    expect(createEditFoodForm(food)).toEqual({
      name: "牛奶",
      category: "乳製品",
      storageLocation: "冰箱冷藏",
      quantityAmount: "3",
      quantityUnit: "瓶",
      price: "95",
      purchaseDate: "2026-07-05",
      expiryDate: "2026-07-11",
      note: "未開封",
    });
  });

  it("「未記錄」的備註在編輯時顯示成空白，避免使用者要先刪字", () => {
    expect(createEditFoodForm({ ...food, note: "未記錄" }).note).toBe("");
  });

  it("沒有購買日期時預設帶今天", () => {
    expect(createEditFoodForm({ ...food, purchaseDate: "" }).purchaseDate).toBe(todayText());
  });
});

describe("defaultStorageLocation", () => {
  it("依分類建議儲存位置", () => {
    expect(defaultStorageLocation("冷凍食品")).toBe("冷凍庫");
    expect(defaultStorageLocation("飲料")).toBe("飲品櫃");
    expect(defaultStorageLocation("調味料")).toBe("常溫儲藏");
    expect(defaultStorageLocation("蔬菜")).toBe("冰箱冷藏");
  });
});
