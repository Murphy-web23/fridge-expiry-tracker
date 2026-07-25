import type { FoodFormState, FoodStatusLabel, PageKey, StorageLocation } from "./types";

export const categories = ["全部", "蔬菜", "水果", "肉類", "海鮮", "乳製品", "冷凍食品", "飲料", "調味料", "其他"];

export const quantityUnits = ["個", "盒", "包", "瓶", "袋", "罐", "條", "份", "箱", "顆", "把", "根", "隻", "片", "kg", "g", "L", "ml", "塊"];

export const storageLocations: StorageLocation[] = ["冰箱冷藏", "冷凍庫", "常溫儲藏", "飲品櫃"];

export const storageMeta: Record<StorageLocation, { emoji: string; description: string }> = {
  冰箱冷藏: { emoji: "❄️", description: "蔬果、乳製品與冷藏食材" },
  冷凍庫: { emoji: "🧊", description: "冷凍食品與長期保存食材" },
  常溫儲藏: { emoji: "🏠", description: "乾貨、調味料與常溫食品" },
  飲品櫃: { emoji: "🧃", description: "飲料、酒水與沖泡飲品" },
};

export function defaultStorageLocation(category: string): StorageLocation {
  if (category === "冷凍食品") return "冷凍庫";
  if (category === "飲料") return "飲品櫃";
  if (category === "調味料") return "常溫儲藏";
  return "冰箱冷藏";
}

export const foodPresets = [
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
] as const;

export const categoryMeta: Record<string, { emoji: string; color: string; surface: string }> = {
  蔬菜: { emoji: "🥦", color: "#8BA888", surface: "bg-[#EEF3EB]" },
  水果: { emoji: "🍎", color: "#D98E73", surface: "bg-[#FBEDE8]" },
  肉類: { emoji: "🥩", color: "#C77B5F", surface: "bg-[#F8EDE7]" },
  海鮮: { emoji: "🐟", color: "#7B9CAC", surface: "bg-[#EAF2F5]" },
  乳製品: { emoji: "🥛", color: "#C9A55C", surface: "bg-[#FAF3DD]" },
  冷凍食品: { emoji: "🧊", color: "#8D91B7", surface: "bg-[#EEEFF7]" },
  飲料: { emoji: "🧃", color: "#77A5A0", surface: "bg-[#E9F4F2]" },
  調味料: { emoji: "🧂", color: "#9A8068", surface: "bg-[#F3EEE9]" },
  其他: { emoji: "📦", color: "#8D8983", surface: "bg-[#F0EFED]" },
};

export const statusMeta: Record<FoodStatusLabel, { label: string; emoji: string; badge: string; accent: string }> = {
  Expired: {
    label: "已過期",
    emoji: "⚠️",
    badge: "bg-[#FBE9E2] text-[#A95338]",
    accent: "border-l-[#D98E73]",
  },
  Today: {
    label: "今天到期",
    emoji: "⏰",
    badge: "bg-[#FAF0D5] text-[#8B6A22]",
    accent: "border-l-[#D8B15D]",
  },
  Soon: {
    label: "即將到期",
    emoji: "✨",
    badge: "bg-[#EAF0F7] text-[#5C728A]",
    accent: "border-l-[#8CA2BA]",
  },
  Safe: {
    label: "安全",
    emoji: "🌿",
    badge: "bg-[#EAF3E8] text-[#557657]",
    accent: "border-l-[#8BA888]",
  },
  Used: {
    label: "已使用",
    emoji: "✅",
    badge: "bg-[#F0EFED] text-[#706B65]",
    accent: "border-l-[#B5B0A9]",
  },
};

export const pageMeta: Record<PageKey, { title: string; emoji: string }> = {
  dashboard: { title: "家庭冰箱總覽", emoji: "🏡" },
  foods: { title: "食材清單", emoji: "🧺" },
  spending: { title: "消費統計", emoji: "💰" },
  add: { title: "新增食材", emoji: "🛒" },
  family: { title: "家庭管理", emoji: "👨‍👩‍👧‍👦" },
};

export function todayText(): string {
  return new Date().toISOString().slice(0, 10);
}

export function createInitialFoodForm(): FoodFormState {
  const today = todayText();
  return {
    preset: "",
    name: "",
    category: "蔬菜",
    storageLocation: "冰箱冷藏",
    quantityAmount: "1",
    quantityUnit: "盒",
    price: "",
    purchaseDate: today,
    expiryDate: today,
    note: "",
  };
}

export function formatPrice(price: number): string {
  return `NT$ ${new Intl.NumberFormat("zh-TW", { maximumFractionDigits: 0 }).format(price || 0)}`;
}

export function shortNote(note: string, maxLength = 42): string {
  const cleanNote = note.trim();
  if (!cleanNote || cleanNote === "未記錄") return "沒有備註";
  return cleanNote.length > maxLength ? `${cleanNote.slice(0, maxLength)}…` : cleanNote;
}

export function addDays(dateText: string, days: number): string {
  const value = new Date(`${dateText}T00:00:00`);
  value.setDate(value.getDate() + days);
  return value.toISOString().slice(0, 10);
}

export function memberEmoji(memberName: string, role: string): string {
  if (role === "admin") return "🧑‍🍳";
  if (memberName === "訪客") return "🙂";
  return "🙋";
}
