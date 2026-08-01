export type PageKey = "dashboard" | "foods" | "spending" | "add" | "family";

export type FoodStatusLabel = "Expired" | "Today" | "Soon" | "Safe" | "Used";

export type StorageLocation = "冰箱冷藏" | "冷凍庫" | "常溫儲藏" | "飲品櫃";

export interface ApiFood {
  id: number;
  family_code: string;
  name: string;
  category: string;
  storage_location: StorageLocation;
  quantity: string;
  price: number;
  purchase_date: string | null;
  expiry_date: string;
  days_left: number;
  status: string;
  status_label: FoodStatusLabel;
  note: string;
  added_by: string;
  used_by: string | null;
  used_at: string | null;
  updated_by: string | null;
  updated_at: string | null;
  created_at: string;
}

export interface Food {
  id: number;
  name: string;
  category: string;
  storageLocation: StorageLocation;
  quantity: string;
  price: number;
  purchaseDate: string;
  expiryDate: string;
  daysLeft: number;
  status: FoodStatusLabel;
  addedBy: string;
  updatedBy: string;
  note: string;
}

export interface FoodCreatePayload {
  name: string;
  category: string;
  storage_location: StorageLocation;
  quantity: string;
  price: number;
  purchase_date: string;
  expiry_date: string;
  note: string;
}

export type FoodUpdatePayload = FoodCreatePayload;

/** v12 後端健康檢查，順便告訴前端資料實際存在哪一種資料庫。 */
export interface HealthInfo {
  status: string;
  version: string;
  database: string;
  database_location: string;
  food_count: number;
}

export interface Family {
  family_code: string;
  family_name: string;
  created_at: string;
}

export interface Member {
  family_code: string;
  member_name: string;
  role: string;
  joined_at: string;
}

export interface FoodFormState {
  preset: string;
  name: string;
  category: string;
  storageLocation: StorageLocation;
  quantityAmount: string;
  quantityUnit: string;
  price: string;
  purchaseDate: string;
  expiryDate: string;
  note: string;
}

/** 編輯食材時沿用新增表單的欄位，但不需要「常用食材」快速選單。 */
export type FoodEditFormState = Omit<FoodFormState, "preset">;

export type StorageFilter = "全部" | StorageLocation;

export interface DashboardStats {
  total: number;
  expired: number;
  today: number;
  soon: number;
  totalValue: number;
}

export interface CategoryTotal {
  category: string;
  total: number;
  percent: number;
  color: string;
}
