import { CalendarDays, CircleDollarSign, MapPin, NotebookText, PackagePlus, ShoppingBasket } from "lucide-react";
import type { Dispatch, FormEvent, SetStateAction } from "react";
import {
  addDays,
  categories,
  categoryMeta,
  defaultStorageLocation,
  foodPresets,
  quantityUnits,
  storageLocations,
  storageMeta,
} from "../constants";
import type { FoodFormState } from "../types";
import { inputClass, labelClass, primaryButtonClass, secondaryButtonClass } from "../ui";

interface AddFoodFormProps {
  form: FoodFormState;
  setForm: Dispatch<SetStateAction<FoodFormState>>;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
  isSaving: boolean;
  familyName: string;
  currentMember: string;
}

export function AddFoodForm({
  form,
  setForm,
  onSubmit,
  isSaving,
  familyName,
  currentMember,
}: AddFoodFormProps) {
  const updateForm = <K extends keyof FoodFormState>(field: K, value: FoodFormState[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const selectPreset = (presetName: string) => {
    if (presetName === "__custom__") {
      setForm((current) => ({ ...current, preset: presetName, name: "" }));
      return;
    }

    const preset = foodPresets.find((food) => food.name === presetName);
    if (!preset) {
      setForm((current) => ({ ...current, preset: "", name: "" }));
      return;
    }

    setForm((current) => ({
      ...current,
      preset: preset.name,
      name: preset.name,
      category: preset.category,
      storageLocation: defaultStorageLocation(preset.category),
      quantityUnit: preset.unit,
    }));
  };

  return (
    <section className="grid gap-8 rounded-3xl border border-[#E8E4DE] bg-white/80 p-6 shadow-[0_4px_20px_rgba(61,56,52,0.05)] lg:grid-cols-[minmax(220px,0.7fr)_minmax(0,1.3fr)] lg:p-8">
      <div className="self-start">
        <span className="grid h-24 w-24 place-items-center rounded-3xl bg-[#F9F7F2] text-4xl shadow-sm" aria-hidden="true">
          🧺
        </span>
        <p className="mt-7 text-xs font-semibold uppercase text-[#8BA888]">新增到 {familyName}</p>
        <h3 className="mt-2 text-2xl font-bold text-[#3D3834]">新增家庭食材</h3>
        <p className="mt-4 text-sm leading-6 text-[#706B65]">
          目前操作者：<strong className="text-[#3D3834]">{currentMember}</strong>
        </p>
        <p className="mt-2 text-sm leading-6 text-[#706B65]">
          常用食材、單位與期限都能直接點選，只在需要自訂時輸入文字。
        </p>
      </div>

      <form onSubmit={onSubmit} className="grid gap-5 sm:grid-cols-2">
        <label className={labelClass}>
          <span className="flex items-center gap-2">
            <ShoppingBasket className="h-5 w-5 text-[#8BA888]" aria-hidden="true" />
            常用食材
          </span>
          <select className={inputClass} value={form.preset} onChange={(event) => selectPreset(event.target.value)} required>
            <option value="">請選擇食材</option>
            {categories.slice(1).map((category) => (
              <optgroup key={category} label={`${categoryMeta[category].emoji} ${category}`}>
                {foodPresets
                  .filter((food) => food.category === category)
                  .map((food) => (
                    <option key={food.name} value={food.name}>
                      {categoryMeta[food.category].emoji} {food.name}
                    </option>
                  ))}
              </optgroup>
            ))}
            <option value="__custom__">✍️ 其他食材（自行輸入）</option>
          </select>
        </label>

        {form.preset === "__custom__" && (
          <label className={labelClass}>
            自訂食材名稱
            <input
              className={inputClass}
              value={form.name}
              onChange={(event) => updateForm("name", event.target.value)}
              placeholder="例如：嫩豆腐"
              required
            />
          </label>
        )}

        <label className={labelClass}>
          分類
          <select
            className={inputClass}
            value={form.category}
            onChange={(event) => {
              const category = event.target.value;
              setForm((current) => ({
                ...current,
                category,
                storageLocation: defaultStorageLocation(category),
              }));
            }}
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
            onChange={(event) => updateForm("storageLocation", event.target.value as FoodFormState["storageLocation"])}
          >
            {storageLocations.map((location) => (
              <option key={location} value={location}>
                {storageMeta[location].emoji} {location}
              </option>
            ))}
          </select>
        </label>

        <label className={labelClass}>
          <span className="flex items-center gap-2">
            <PackagePlus className="h-5 w-5 text-[#8BA888]" aria-hidden="true" />
            數量與單位
          </span>
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
            className={`${inputClass} min-h-28 resize-y`}
            maxLength={120}
            value={form.note}
            onChange={(event) => updateForm("note", event.target.value)}
            placeholder="例如：已開封、週末先煮、放在上層"
          />
          <span className="justify-self-end text-xs text-[#706B65]">{form.note.length}/120</span>
        </label>

        <button className={`${primaryButtonClass} sm:col-span-2`} type="submit" disabled={isSaving}>
          <PackagePlus className="h-5 w-5" aria-hidden="true" />
          {isSaving ? "新增中..." : "新增食材"}
        </button>
      </form>
    </section>
  );
}
