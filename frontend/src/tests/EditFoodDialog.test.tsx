import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { EditFoodDialog } from "../components/EditFoodDialog";
import type { Food } from "../types";

const food: Food = {
  id: 3,
  name: "雞胸肉",
  category: "肉類",
  storageLocation: "冰箱冷藏",
  quantity: "3 包",
  price: 249,
  purchaseDate: "2026-07-16",
  expiryDate: "2026-07-22",
  daysLeft: 4,
  status: "Soon",
  addedBy: "NICK",
  updatedBy: "未記錄",
  note: "冷藏未開封",
};

function renderDialog() {
  const onSave = vi.fn().mockResolvedValue(undefined);
  const onClose = vi.fn();
  render(<EditFoodDialog food={food} currentMember="Murphy" onSave={onSave} onClose={onClose} />);
  return { onSave, onClose };
}

describe("EditFoodDialog", () => {
  it("開啟時就帶入目前的食材資料", () => {
    renderDialog();
    expect(screen.getByLabelText(/食材名稱/)).toHaveValue("雞胸肉");
    expect(screen.getByLabelText("數量")).toHaveValue(3);
    expect(screen.getByLabelText("單位")).toHaveValue("包");
    expect(screen.getByLabelText(/儲存位置/)).toHaveValue("冰箱冷藏");
    expect(screen.getByLabelText(/購買金額/)).toHaveValue(249);
  });

  it("可以改儲存位置，儲存時一起送出", async () => {
    const { onSave } = renderDialog();

    await userEvent.selectOptions(screen.getByLabelText(/儲存位置/), "冷凍庫");
    await userEvent.click(screen.getByRole("button", { name: /儲存變更/ }));

    expect(onSave).toHaveBeenCalledWith(
      3,
      expect.objectContaining({ storage_location: "冷凍庫", name: "雞胸肉", quantity: "3 包" }),
    );
  });

  it("送出完整編輯內容，包含名稱、分類、金額與備註", async () => {
    const { onSave } = renderDialog();

    await userEvent.clear(screen.getByLabelText(/食材名稱/));
    await userEvent.type(screen.getByLabelText(/食材名稱/), "雞腿肉");
    await userEvent.selectOptions(screen.getByLabelText(/分類/), "海鮮");
    await userEvent.clear(screen.getByLabelText(/購買金額/));
    await userEvent.type(screen.getByLabelText(/購買金額/), "180");
    await userEvent.click(screen.getByRole("button", { name: /儲存變更/ }));

    expect(onSave).toHaveBeenCalledWith(
      3,
      expect.objectContaining({
        name: "雞腿肉",
        category: "海鮮",
        price: 180,
        note: "冷藏未開封",
      }),
    );
  });

  it("到期日早於購買日時顯示錯誤並且不送出", async () => {
    const { onSave } = renderDialog();

    await userEvent.clear(screen.getByLabelText(/到期日期/));
    await userEvent.type(screen.getByLabelText(/到期日期/), "2026-07-01");
    await userEvent.click(screen.getByRole("button", { name: /儲存變更/ }));

    expect(await screen.findByRole("alert")).toHaveTextContent("到期日期不能早於購買日期");
    expect(onSave).not.toHaveBeenCalled();
  });

  it("按取消只關閉視窗，不會儲存", async () => {
    const { onSave, onClose } = renderDialog();

    await userEvent.click(screen.getByRole("button", { name: "取消" }));

    expect(onClose).toHaveBeenCalled();
    expect(onSave).not.toHaveBeenCalled();
  });

  it("按 Escape 也可以關閉視窗", async () => {
    const { onClose } = renderDialog();
    await userEvent.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalled();
  });
});
