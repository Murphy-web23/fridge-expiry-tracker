import { AlertCircle, CalendarDays, CircleDollarSign, MapPin, NotebookText, Save } from "lucide-react";
import { useState, type FormEvent } from "react";
import {
  addDays,
  categories,
  categoryMeta,
  createEditFoodForm,
  quantityUnits,
  storageLocations,
  storageMeta,
  validateFoodForm,
} from "../constants";
import type { Food, FoodEditFormState, FoodUpdatePayload } from "../types";
import { inputClass, labelClass, primaryButtonClass, secondaryButtonClass } from "../ui";
import { Modal } from "./Dialog";

interface EditFoodDialogProps {
  food: Food;
  currentMember: string;
  onSave: (foodId: number, payload: FoodUpdatePayload) => Promise<void>;
  onClose: () => void;
}

export function EditFoodDialog({ food, currentMember, onSave, onClose }: EditFoodDialogProps) {
  const [form, setForm] = useState<FoodEditFormState>(() => createEditFoodForm(food));
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const updateForm = <K extends keyof FoodEditFormState>(field: K, value: FoodEditFormState[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = validateFoodForm(form);
    if (message) {
      setFormError(message);
      return;
    }

    try {
      setIsSaving(true);
      setFormError("");
      await onSave(food.id, {
        name: form.name.trim(),
        category: form.category,
        storage_location: form.storageLocation,
        quantity: `${Number(form.quantityAmount)} ${form.quantityUnit}`,
        price: Number(form.price) || 0,
        purchase_date: form.purchaseDate,
        expiry_date: form.expiryDate,
        note: form.note.trim() || "未記錄",
      });
    } catch {
      setFormError("儲存失敗，請確認 FastAPI 是否正在執行。");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Modal
      title="編輯食材"
      emoji="✏️"
      description={`目前操作者：${currentMember}，儲存後會記錄成最後更新者。`}
      size="lg"
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="grid gap-5 sm:grid-cols-2">
        <label className={labelClass}>
          食材名稱
          <input
            className={inputClass}
            value={form.name}
            onChange={(event) => updateForm("name", event.target.value)}
            placeholder="例如：嫩豆腐"
            required
            autoFocus
          />
        </label>

        <label className={labelClass}>
          分類
          <select
            className={inputClass}
            value={form.category}
            onChange={(event) => updateForm("category", event.target.value)}
          >
            {categories.slice(1).map((category) => (
              <option key={category} value={category}>
                {categoryMeta[category].emoji} {category}
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
            value={form.storageLocation}
            onChange={(event) => updateForm("storageLocation", event.target.value as FoodEditFormState["storageLocation"])}
          >
            {storageLocations.map((location) => (
              <option key={location} value={location}>
                {storageMeta[location].emoji} {location}
              </option>
            ))}
          </select>
        </label>

        <label className={labelClass}>
          數量與單位
          <span className="grid grid-cols-[minmax(80px,0.8fr)_minmax(100px,1.2fr)] gap-2">
            <input
              className={inputClass}
              type="number"
              min="1"
              step="1"
              inputMode="numeric"
              value={form.quantityAmount}
              onChange={(event) => {
                const nextValue = event.target.value;
                if (nextValue === "" || /^\d+$/.test(nextValue)) {
                  updateForm("quantityAmount", nextValue);
                }
              }}
              aria-label="數量"
              required
            />
            <select
              className={inputClass}
              value={form.quantityUnit}
              onChange={(event) => updateForm("quantityUnit", event.target.value)}
              aria-label="單位"
            >
              {quantityUnits.map((unit) => (
                <option key={unit}>{unit}</option>
              ))}
            </select>
          </span>
        </label>

        <label className={labelClass}>
          <span className="flex items-center gap-2">
            <CircleDollarSign className="h-5 w-5 text-[#8BA888]" aria-hidden="true" />
            購買金額（NT$）
          </span>
          <input
            className={inputClass}
            type="number"
            min="0"
            step="1"
            inputMode="numeric"
            value={form.price}
            onChange={(event) => updateForm("price", event.target.value)}
            placeholder="例如：120"
          />
        </label>

        <label className={labelClass}>
          <span className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-[#8BA888]" aria-hidden="true" />
            購買日期
          </span>
          <input
            className={inputClass}
            type="date"
            value={form.purchaseDate}
            onChange={(event) => updateForm("purchaseDate", event.target.value)}
          />
        </label>

        <label className={labelClass}>
          到期日期
          <input
            className={inputClass}
            type="date"
            value={form.expiryDate}
            onChange={(event) => updateForm("expiryDate", event.target.value)}
          />
        </label>

        <div className="grid gap-3 border-y border-[#E8E4DE] py-4 sm:col-span-2">
          <span className="text-sm font-semibold text-[#3D3834]">期限快速設定</span>
          <div className="flex flex-wrap gap-2">
            {[
              [3, "+3 天"],
              [7, "+7 天"],
              [14, "+14 天"],
              [30, "+1 個月"],
              [180, "+6 個月"],
            ].map(([days, label]) => (
              <button
                key={days}
                type="button"
                className={secondaryButtonClass}
                onClick={() => updateForm("expiryDate", addDays(form.purchaseDate, Number(days)))}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <label className={`${labelClass} sm:col-span-2`}>
          <span className="flex items-center gap-2">
            <NotebookText className="h-5 w-5 text-[#8BA888]" aria-hidden="true" />
            簡短備註
          </span>
          <textarea
            className={`${inputClass} min-h-24 resize-y`}
            maxLength={120}
            value={form.note}
            onChange={(event) => updateForm("note", event.target.value)}
            placeholder="例如：已開封、週末先煮、放在上層"
          />
          <span className="justify-self-end text-xs text-[#706B65]">{form.note.length}/120</span>
        </label>

        {formError && (
          <p
            role="alert"
            className="flex items-center gap-2 rounded-2xl border border-[#D98E73]/40 bg-[#D98E73]/10 px-4 py-3 text-sm font-medium text-[#A95338] sm:col-span-2"
          >
            <AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
            {formError}
          </p>
        )}

        <div className="flex flex-col-reverse gap-3 sm:col-span-2 sm:flex-row sm:justify-end">
          <button type="button" className={secondaryButtonClass} onClick={onClose} disabled={isSaving}>
            取消
          </button>
          <button type="submit" className={primaryButtonClass} disabled={isSaving}>
            <Save className="h-5 w-5" aria-hidden="true" />
            {isSaving ? "儲存中..." : "儲存變更"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
