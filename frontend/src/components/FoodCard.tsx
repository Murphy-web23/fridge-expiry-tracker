import { Check, Minus, NotebookText, Pencil, Plus, Trash2 } from "lucide-react";
import { categoryMeta, formatPrice, shortNote, statusMeta, storageMeta } from "../constants";
import type { Food } from "../types";
import { iconButtonClass } from "../ui";

interface FoodCardProps {
  food: Food;
  onMarkUsed: (id: number) => void | Promise<void>;
  onAdjustQuantity: (id: number, delta: -1 | 1) => void | Promise<void>;
  onEdit: (food: Food) => void;
  onDelete: (food: Food) => void;
}

export function FoodCard({ food, onMarkUsed, onAdjustQuantity, onEdit, onDelete }: FoodCardProps) {
  const category = categoryMeta[food.category] || categoryMeta.其他;
  const status = statusMeta[food.status];
  const quantityAmount = Number.parseFloat(food.quantity);
  const canDecrease = Number.isFinite(quantityAmount) && quantityAmount > 0;

  return (
    <article
      className={`flex min-h-[360px] flex-col rounded-3xl border border-l-4 border-[#E8E4DE] bg-white/80 p-6 shadow-[0_4px_20px_rgba(61,56,52,0.05)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${status.accent}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-2xl ${category.surface}`}
            aria-hidden="true"
          >
            {category.emoji}
          </span>
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-[#3D3834]">{food.name}</h3>
            <p className="mt-1 text-sm text-[#706B65]">
              {food.category} ・ {food.quantity}
            </p>
            <p className="mt-1 text-xs font-medium text-[#706B65]">
              {storageMeta[food.storageLocation].emoji} {food.storageLocation}
            </p>
          </div>
        </div>
        <div className="flex max-w-[48%] flex-wrap justify-end gap-2">
          <span className="whitespace-nowrap rounded-full bg-[#F9F7F2] px-3 py-1.5 text-xs font-semibold text-[#5D775A]">
            {formatPrice(food.price)}
          </span>
          <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ${status.badge}`}>
            <span aria-hidden="true">{status.emoji}</span>
            {status.label}
          </span>
        </div>
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-x-5 gap-y-4">
        <div>
          <dt className="text-xs font-semibold text-[#706B65]">到期日</dt>
          <dd className="mt-1 font-semibold text-[#3D3834]">{food.expiryDate}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold text-[#706B65]">剩餘天數</dt>
          <dd className="mt-1 font-semibold text-[#3D3834]">{food.daysLeft} 天</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold text-[#706B65]">新增者</dt>
          <dd className="mt-1 font-semibold text-[#3D3834]">{food.addedBy}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold text-[#706B65]">購買日</dt>
          <dd className="mt-1 font-semibold text-[#3D3834]">{food.purchaseDate || "未記錄"}</dd>
        </div>
      </dl>

      <div className="mt-5 rounded-2xl bg-[#F9F7F2] px-4 py-3" title={food.note}>
        <span className="flex items-center gap-1.5 text-xs font-semibold text-[#706B65]">
          <NotebookText className="h-4 w-4 text-[#8BA888]" aria-hidden="true" />
          小提醒
        </span>
        <p className="mt-1.5 line-clamp-2 min-h-10 text-sm font-medium leading-5 text-[#3D3834]">
          {shortNote(food.note)}
        </p>
      </div>

      <div className="mt-auto grid gap-2 pt-5">
        <div className="flex items-center gap-2">
          <button
            type="button"
            title="數量減少 1"
            aria-label={`${food.name}數量減少 1`}
            disabled={!canDecrease}
            onClick={() => onAdjustQuantity(food.id, -1)}
            className={iconButtonClass}
          >
            <Minus className="h-5 w-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            title="數量增加 1"
            aria-label={`${food.name}數量增加 1`}
            onClick={() => onAdjustQuantity(food.id, 1)}
            className={iconButtonClass}
          >
            <Plus className="h-5 w-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            disabled={food.status === "Used"}
            onClick={() => onMarkUsed(food.id)}
            className="inline-flex min-h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#8BA888]/15 px-4 py-2.5 font-medium text-[#5D775A] transition-colors hover:bg-[#8BA888]/25 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Check className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span className="truncate">{food.status === "Used" ? "已標記使用" : "標記已使用"}</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label={`編輯${food.name}`}
            onClick={() => onEdit(food)}
            className="inline-flex min-h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#E8E4DE]/60 px-4 py-2.5 font-medium text-[#3D3834] transition-colors hover:bg-[#E8E4DE]"
          >
            <Pencil className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="truncate">編輯</span>
          </button>
          <button
            type="button"
            aria-label={`刪除${food.name}`}
            onClick={() => onDelete(food)}
            className="inline-flex min-h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#D98E73]/12 px-4 py-2.5 font-medium text-[#A95338] transition-colors hover:bg-[#D98E73]/22"
          >
            <Trash2 className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="truncate">刪除</span>
          </button>
        </div>
      </div>
    </article>
  );
}
