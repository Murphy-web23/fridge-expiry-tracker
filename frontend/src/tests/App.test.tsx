import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "../App";
import type { ApiFood } from "../types";

vi.mock("../api", async () => {
  const actual = await vi.importActual<typeof import("../api")>("../api");
  return {
    ...actual,
    getHealth: vi.fn(),
    getFamilies: vi.fn(),
    getFamily: vi.fn(),
    getMembers: vi.fn(),
    getFoods: vi.fn(),
    createFood: vi.fn(),
    updateFood: vi.fn(),
    deleteFood: vi.fn(),
    markFoodUsed: vi.fn(),
    adjustFoodQuantity: vi.fn(),
  };
});

const api = await import("../api");

function makeApiFood(overrides: Partial<ApiFood> & Pick<ApiFood, "id" | "name">): ApiFood {
  return {
    family_code: "demo-home",
    category: "乳製品",
    storage_location: "冰箱冷藏",
    quantity: "2 瓶",
    price: 95,
    purchase_date: "2026-07-20",
    expiry_date: "2026-07-30",
    days_left: 5,
    status: "active",
    status_label: "Soon",
    note: "未開封",
    added_by: "Murphy",
    used_by: null,
    used_at: null,
    updated_by: null,
    updated_at: null,
    created_at: "2026-07-20T10:00:00",
    ...overrides,
  };
}

const milk = makeApiFood({ id: 1, name: "鮮奶" });
const dumplings = makeApiFood({
  id: 2,
  name: "冷凍水餃",
  category: "冷凍食品",
  storage_location: "冷凍庫",
  quantity: "1 包",
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(api.getHealth).mockResolvedValue({
    status: "ok",
    version: "v12",
    database: "SQLite",
    database_location: "C:/fridge/data/fridge.db",
    food_count: 2,
  });
  vi.mocked(api.getFamilies).mockResolvedValue([
    { family_code: "demo-home", family_name: "示範家庭", created_at: "2026-07-16T15:29:15" },
  ]);
  vi.mocked(api.getFamily).mockResolvedValue({
    family_code: "demo-home",
    family_name: "示範家庭",
    created_at: "2026-07-16T15:29:15",
  });
  vi.mocked(api.getMembers).mockResolvedValue([
    { family_code: "demo-home", member_name: "Murphy", role: "admin", joined_at: "2026-07-16T15:29:15" },
  ]);
  vi.mocked(api.getFoods).mockResolvedValue([milk, dumplings]);
});

async function openFoodList() {
  render(<App />);
  await screen.findByText("家庭冰箱已同步");
  // 桌面側欄與手機導覽都有同一顆按鈕，測試點第一顆即可。
  const [foodListTab] = screen.getAllByRole("button", { name: "食材清單" });
  await userEvent.click(foodListTab);
}

describe("v12 資料保存狀態", () => {
  it("側欄顯示後端目前使用的資料庫", async () => {
    render(<App />);

    expect(await screen.findByText("SQLite 已保存")).toBeInTheDocument();
  });

  it("家庭管理頁說明資料存在哪裡與筆數", async () => {
    render(<App />);
    await screen.findByText("家庭冰箱已同步");

    const [familyTab] = screen.getAllByRole("button", { name: "家庭管理" });
    await userEvent.click(familyTab);

    expect(screen.getByText("資料保存方式")).toBeInTheDocument();
    expect(screen.getByText(/目前共有 2 筆紀錄/)).toBeInTheDocument();
    expect(screen.getByText(/fridge\.db/)).toBeInTheDocument();
  });

  it("健康檢查失敗時不影響食材資料載入", async () => {
    vi.mocked(api.getHealth).mockRejectedValue(new Error("offline"));
    render(<App />);

    await screen.findByText("家庭冰箱已同步");
    expect(screen.queryByText("SQLite 已保存")).not.toBeInTheDocument();
  });
});

describe("v11.2 食材清單操作", () => {
  it("可以依儲存位置篩選食材", async () => {
    await openFoodList();
    expect(screen.getAllByRole("article")).toHaveLength(2);

    await userEvent.selectOptions(screen.getByLabelText(/儲存位置/), "冷凍庫");

    const cards = screen.getAllByRole("article");
    expect(cards).toHaveLength(1);
    expect(within(cards[0]).getByRole("heading")).toHaveTextContent("冷凍水餃");
  });

  it("刪除前先跳出確認視窗，確認後才呼叫 API", async () => {
    vi.mocked(api.deleteFood).mockResolvedValue(undefined);
    await openFoodList();

    await userEvent.click(screen.getByRole("button", { name: "刪除鮮奶" }));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText(/無法復原/)).toBeInTheDocument();
    expect(api.deleteFood).not.toHaveBeenCalled();

    await userEvent.click(within(dialog).getByRole("button", { name: "刪除食材" }));

    await waitFor(() => expect(api.deleteFood).toHaveBeenCalledWith(1, "demo-home"));
    await waitFor(() => expect(screen.queryByRole("heading", { name: "鮮奶" })).not.toBeInTheDocument());
  });

  it("在確認視窗按取消不會刪除食材", async () => {
    await openFoodList();

    await userEvent.click(screen.getByRole("button", { name: "刪除鮮奶" }));
    await userEvent.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "取消" }));

    expect(api.deleteFood).not.toHaveBeenCalled();
    expect(screen.getByRole("heading", { name: "鮮奶" })).toBeInTheDocument();
  });

  it("數量還有剩時，減一直接送出不打擾使用者", async () => {
    vi.mocked(api.adjustFoodQuantity).mockResolvedValue(makeApiFood({ id: 1, name: "鮮奶", quantity: "1 瓶" }));
    await openFoodList();

    await userEvent.click(screen.getByRole("button", { name: "鮮奶數量減少 1" }));

    await waitFor(() => expect(api.adjustFoodQuantity).toHaveBeenCalledWith(1, -1, "demo-home", "Murphy"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("最後一份減到 0 時先確認，確認後標記為已使用", async () => {
    vi.mocked(api.adjustFoodQuantity).mockResolvedValue(
      makeApiFood({
        id: 2,
        name: "冷凍水餃",
        category: "冷凍食品",
        storage_location: "冷凍庫",
        quantity: "0 包",
        status: "used",
        status_label: "Used",
        used_by: "Murphy",
      }),
    );
    await openFoodList();

    await userEvent.click(screen.getByRole("button", { name: "冷凍水餃數量減少 1" }));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText(/自動標記為已使用/)).toBeInTheDocument();
    expect(api.adjustFoodQuantity).not.toHaveBeenCalled();

    await userEvent.click(within(dialog).getByRole("button", { name: /用完了/ }));

    await waitFor(() => expect(api.adjustFoodQuantity).toHaveBeenCalledWith(2, -1, "demo-home", "Murphy"));
    expect(await screen.findByText("已標記使用")).toBeInTheDocument();
  });

  it("在歸零確認視窗選擇先保留，數量不會變動", async () => {
    await openFoodList();

    await userEvent.click(screen.getByRole("button", { name: "冷凍水餃數量減少 1" }));
    await userEvent.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "先保留" }));

    expect(api.adjustFoodQuantity).not.toHaveBeenCalled();
  });

  it("編輯食材會把修改後的欄位送到 FastAPI", async () => {
    vi.mocked(api.updateFood).mockResolvedValue(
      makeApiFood({ id: 1, name: "鮮奶", storage_location: "冷凍庫", quantity: "2 瓶" }),
    );
    await openFoodList();

    await userEvent.click(screen.getByRole("button", { name: "編輯鮮奶" }));
    const dialog = await screen.findByRole("dialog");
    await userEvent.selectOptions(within(dialog).getByLabelText(/儲存位置/), "冷凍庫");
    await userEvent.click(within(dialog).getByRole("button", { name: /儲存變更/ }));

    await waitFor(() =>
      expect(api.updateFood).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ storage_location: "冷凍庫" }),
        "demo-home",
        "Murphy",
      ),
    );
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });
});
