import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  adjustFoodQuantity,
  apiConfig,
  createFood,
  deleteFood,
  getFamilies,
  getFamily,
  getFoods,
  getMembers,
  markFoodUsed,
  updateFood,
} from "./api";
import {
  createInitialFoodForm,
  defaultStorageLocation,
  storageLocations,
  validateFoodForm,
} from "./constants";
import { countByStorage, filterAndSortFoods } from "./foodFilters";
import { AddFoodForm } from "./components/AddFoodForm";
import { Dashboard } from "./components/Dashboard";
import { ConfirmDialog } from "./components/Dialog";
import { EditFoodDialog } from "./components/EditFoodDialog";
import { FamilyPanel } from "./components/FamilyPanel";
import { FoodList } from "./components/FoodList";
import {
  ApiNotice,
  Header,
  MobileFamilySwitcher,
  Sidebar,
} from "./components/Shell";
import { SpendingPanel } from "./components/SpendingPanel";
import type {
  ApiFood,
  DashboardStats,
  Family,
  Food,
  FoodFormState,
  FoodUpdatePayload,
  Member,
  PageKey,
  StorageFilter,
} from "./types";

function normalizeFood(food: ApiFood): Food {
  return {
    id: food.id,
    name: food.name,
    category: food.category,
    storageLocation: storageLocations.includes(food.storage_location)
      ? food.storage_location
      : defaultStorageLocation(food.category),
    quantity: food.quantity,
    price: Number(food.price) || 0,
    purchaseDate: food.purchase_date || "",
    expiryDate: food.expiry_date,
    daysLeft: food.days_left,
    status: food.status_label,
    addedBy: food.added_by,
    updatedBy: food.updated_by || "未記錄",
    note: food.note || "未記錄",
  };
}

export default function App() {
  const [activePage, setActivePage] = useState<PageKey>("dashboard");
  const [foods, setFoods] = useState<Food[]>([]);
  const [family, setFamily] = useState<Family | null>(null);
  const [families, setFamilies] = useState<Family[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [familyCode, setFamilyCode] = useState(apiConfig.familyCode);
  const [currentMember, setCurrentMember] = useState(apiConfig.memberName);
  const [filter, setFilter] = useState("全部");
  const [storageFilter, setStorageFilter] = useState<StorageFilter>("全部");
  const [sortMode, setSortMode] = useState("urgent");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [form, setForm] = useState<FoodFormState>(createInitialFoodForm);
  const [editingFood, setEditingFood] = useState<Food | null>(null);
  const [deletingFood, setDeletingFood] = useState<Food | null>(null);
  const [emptyingFood, setEmptyingFood] = useState<Food | null>(null);

  useEffect(() => {
    async function loadFamilyOptions() {
      try {
        const options = await getFamilies();
        setFamilies(options);
        if (options.length > 0 && !options.some((item) => item.family_code === familyCode)) {
          setFamilyCode(options[0].family_code);
        }
      } catch {
        setErrorMessage("目前無法取得家庭清單，請確認 FastAPI 後端是否正在執行。");
      }
    }

    void loadFamilyOptions();
  }, [familyCode]);

  const loadFamilyData = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");
      const [familyData, memberData, foodData] = await Promise.all([
        getFamily(familyCode),
        getMembers(familyCode),
        getFoods(familyCode),
      ]);
      setFamily(familyData);
      setMembers(memberData);
      setCurrentMember((current) => {
        const stillExists = memberData.some((member) => member.member_name === current);
        return stillExists ? current : memberData[0]?.member_name || apiConfig.memberName;
      });
      setFoods(foodData.map(normalizeFood));
    } catch {
      setErrorMessage("目前無法連線到 FastAPI，請先啟動後端服務。");
    } finally {
      setIsLoading(false);
    }
  }, [familyCode]);

  useEffect(() => {
    void loadFamilyData();
  }, [loadFamilyData]);

  const stats = useMemo<DashboardStats>(() => {
    const activeFoods = foods.filter((food) => food.status !== "Used");
    return {
      total: activeFoods.length,
      expired: activeFoods.filter((food) => food.daysLeft < 0).length,
      today: activeFoods.filter((food) => food.daysLeft === 0).length,
      soon: activeFoods.filter((food) => food.daysLeft > 0 && food.daysLeft <= 7).length,
      totalValue: activeFoods.reduce((sum, food) => sum + food.price, 0),
    };
  }, [foods]);

  const filteredFoods = useMemo(
    () => filterAndSortFoods(foods, { search, category: filter, storage: storageFilter, sortMode }),
    [filter, foods, search, sortMode, storageFilter],
  );

  const storageCounts = useMemo(() => countByStorage(foods), [foods]);

  function replaceFood(updatedFood: ApiFood) {
    const nextFood = normalizeFood(updatedFood);
    setFoods((current) => current.map((food) => (food.id === nextFood.id ? nextFood : food)));
  }

  async function handleAddFood(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationMessage = validateFoodForm(form);
    if (validationMessage) {
      setErrorMessage(validationMessage);
      return;
    }

    try {
      setIsSaving(true);
      setErrorMessage("");
      const createdFood = await createFood(
        {
          name: form.name.trim(),
          category: form.category,
          storage_location: form.storageLocation,
          quantity: `${Number(form.quantityAmount)} ${form.quantityUnit}`,
          price: Number(form.price) || 0,
          purchase_date: form.purchaseDate,
          expiry_date: form.expiryDate,
          note: form.note.trim() || "未記錄",
        },
        familyCode,
        currentMember,
      );
      setFoods((current) => [normalizeFood(createdFood), ...current]);
      setForm(createInitialFoodForm());
      setActivePage("foods");
    } catch {
      setErrorMessage("新增食材失敗，請確認 FastAPI 與資料庫連線狀態。");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSaveEdit(foodId: number, payload: FoodUpdatePayload) {
    setErrorMessage("");
    const updatedFood = await updateFood(foodId, payload, familyCode, currentMember);
    replaceFood(updatedFood);
    setEditingFood(null);
  }

  async function handleConfirmDelete() {
    if (!deletingFood) return;

    try {
      setIsConfirming(true);
      setErrorMessage("");
      await deleteFood(deletingFood.id, familyCode);
      setFoods((current) => current.filter((food) => food.id !== deletingFood.id));
      setDeletingFood(null);
    } catch {
      setErrorMessage("刪除食材失敗，請稍後再試。");
    } finally {
      setIsConfirming(false);
    }
  }

  async function handleMarkUsed(id: number) {
    try {
      setErrorMessage("");
      replaceFood(await markFoodUsed(id, familyCode, currentMember));
    } catch {
      setErrorMessage("標記已使用失敗，請稍後再試。");
    }
  }

  async function adjustQuantity(id: number, delta: -1 | 1) {
    try {
      setErrorMessage("");
      replaceFood(await adjustFoodQuantity(id, delta, familyCode, currentMember));
    } catch {
      setErrorMessage("更新數量失敗，這筆食材的數量格式可能不支援加減。");
    }
  }

  /** 減到最後一份時先問過使用者，避免不小心把食材直接標記成已使用。 */
  function handleAdjustQuantity(id: number, delta: -1 | 1) {
    const food = foods.find((item) => item.id === id);
    if (delta === -1 && food && Number.parseFloat(food.quantity) === 1) {
      setEmptyingFood(food);
      return;
    }

    void adjustQuantity(id, delta);
  }

  async function handleConfirmEmpty() {
    if (!emptyingFood) return;

    try {
      setIsConfirming(true);
      await adjustQuantity(emptyingFood.id, -1);
      setEmptyingFood(null);
    } finally {
      setIsConfirming(false);
    }
  }

  const familyName = family?.family_name || familyCode;
  const memberNames = members.map((member) => member.member_name).join("、") || "尚未加入成員";
  const selectorProps = {
    families,
    members,
    familyCode,
    currentMember,
    setFamilyCode,
    setCurrentMember,
  };
  const foodActions = {
    onMarkUsed: handleMarkUsed,
    onAdjustQuantity: handleAdjustQuantity,
    onEdit: setEditingFood,
    onDelete: setDeletingFood,
  };

  return (
    <div className="min-h-screen bg-[#FDFCF9] text-[#3D3834] lg:grid lg:grid-cols-[280px_minmax(0,1fr)]">
      <Sidebar
        {...selectorProps}
        activePage={activePage}
        onPageChange={setActivePage}
        memberNames={memberNames}
      />

      <div className="min-w-0">
        <Header activePage={activePage} onPageChange={setActivePage} onAdd={() => setActivePage("add")} />
        <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <MobileFamilySwitcher {...selectorProps} />
          <ApiNotice isLoading={isLoading} errorMessage={errorMessage} onRetry={() => void loadFamilyData()} />

          {activePage === "dashboard" && <Dashboard stats={stats} foods={foods} {...foodActions} />}
          {activePage === "foods" && (
            <FoodList
              foods={filteredFoods}
              filter={filter}
              setFilter={setFilter}
              storageFilter={storageFilter}
              setStorageFilter={setStorageFilter}
              storageCounts={storageCounts}
              sortMode={sortMode}
              setSortMode={setSortMode}
              search={search}
              setSearch={setSearch}
              {...foodActions}
            />
          )}
          {activePage === "spending" && <SpendingPanel foods={foods} familyName={familyName} />}
          {activePage === "add" && (
            <AddFoodForm
              form={form}
              setForm={setForm}
              onSubmit={handleAddFood}
              isSaving={isSaving}
              familyName={familyName}
              currentMember={currentMember}
            />
          )}
          {activePage === "family" && (
            <FamilyPanel family={family} members={members} currentMember={currentMember} />
          )}
        </main>
      </div>

      {editingFood && (
        <EditFoodDialog
          food={editingFood}
          currentMember={currentMember}
          onSave={handleSaveEdit}
          onClose={() => setEditingFood(null)}
        />
      )}

      {deletingFood && (
        <ConfirmDialog
          title="確定要刪除這筆食材嗎？"
          emoji="🗑️"
          description={`刪除「${deletingFood.name}」後就無法復原，家庭成員也會看不到這筆紀錄。`}
          confirmLabel="刪除食材"
          isBusy={isConfirming}
          onConfirm={() => void handleConfirmDelete()}
          onCancel={() => setDeletingFood(null)}
        />
      )}

      {emptyingFood && (
        <ConfirmDialog
          title="這是最後一份了"
          emoji="🍽️"
          description={`「${emptyingFood.name}」目前只剩 ${emptyingFood.quantity}，數量歸零後會自動標記為已使用。之後補貨再按增加，就會回到可使用狀態。`}
          confirmLabel="用完了，標記已使用"
          cancelLabel="先保留"
          tone="primary"
          isBusy={isConfirming}
          onConfirm={() => void handleConfirmEmpty()}
          onCancel={() => setEmptyingFood(null)}
        />
      )}
    </div>
  );
}
