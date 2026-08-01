import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { FoodCard } from "../components/FoodCard";
import type { Food } from "../types";

const food: Food = {
  id: 7,
  name: "鮮奶",
  category: "乳製品",
  storageLocation: "冰箱冷藏",
  quantity: "2 瓶",
  price: 95,
  purchaseDate: "2026-07-20",
  expiryDate: "2026-07-30",
  daysLeft: 3,
  status: "Soon",
  addedBy: "Murphy",
  updatedBy: "未記錄",
  note: "未開封",
};

function renderCard(overrides: Partial<Food> = {}) {
  const handlers = {
    onMarkUsed: vi.fn(),
    onAdjustQuantity: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
  };
  render(<FoodCard food={{ ...food, ...overrides }} {...handlers} />);
  return handlers;
}

describe("FoodCard", () => {
  it("顯示儲存位置，讓成員知道食材放在哪裡", () => {
    renderCard();
    expect(screen.getByText(/冰箱冷藏/)).toBeInTheDocument();
  });

  it("按下編輯會把整筆食材交給上層開啟編輯視窗", async () => {
    const handlers = renderCard();
    await userEvent.click(screen.getByRole("button", { name: "編輯鮮奶" }));
    expect(handlers.onEdit).toHaveBeenCalledWith(expect.objectContaining({ id: 7 }));
  });

  it("按下刪除不會直接刪除，而是交給上層跳出確認視窗", async () => {
    const handlers = renderCard();
    await userEvent.click(screen.getByRole("button", { name: "刪除鮮奶" }));
    expect(handlers.onDelete).toHaveBeenCalledWith(expect.objectContaining({ id: 7 }));
  });

  it("數量已經是 0 時不能再減少", () => {
    renderCard({ quantity: "0 瓶", status: "Used" });
    expect(screen.getByRole("button", { name: "鮮奶數量減少 1" })).toBeDisabled();
  });

  it("已使用的食材仍然可以補貨，讓數量回到 1 以上", () => {
    renderCard({ quantity: "0 瓶", status: "Used" });
    expect(screen.getByRole("button", { name: "鮮奶數量增加 1" })).toBeEnabled();
  });

  it("數量無法加減的食材不提供減少按鈕", () => {
    renderCard({ quantity: "未記錄" });
    expect(screen.getByRole("button", { name: "鮮奶數量減少 1" })).toBeDisabled();
  });
});
