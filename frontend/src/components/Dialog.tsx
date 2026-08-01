import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { dangerButtonClass, primaryButtonClass, secondaryButtonClass } from "../ui";

interface ModalProps {
  title: string;
  emoji: string;
  description?: string;
  size?: "sm" | "lg";
  onClose: () => void;
  children: ReactNode;
}

/** v11.2 共用彈出視窗，編輯食材與各種確認提示都從這裡長出來。 */
export function Modal({ title, emoji, description, size = "sm", onClose, children }: ModalProps) {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", closeOnEscape);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-[#3D3834]/40 p-4 backdrop-blur-sm"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        className={`my-auto w-full rounded-3xl border border-[#E8E4DE] bg-[#FDFCF9] p-6 shadow-[0_20px_60px_rgba(61,56,52,0.25)] ${
          size === "lg" ? "max-w-3xl" : "max-w-md"
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <span
              className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#F9F7F2] text-2xl shadow-sm"
              aria-hidden="true"
            >
              {emoji}
            </span>
            <div className="min-w-0">
              <h3 id="dialog-title" className="text-lg font-bold text-[#3D3834]">
                {title}
              </h3>
              {description && <p className="mt-1 text-sm leading-6 text-[#706B65]">{description}</p>}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="關閉視窗"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl text-[#706B65] transition-colors hover:bg-[#E8E4DE]/60 hover:text-[#3D3834]"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}

interface ConfirmDialogProps {
  title: string;
  emoji: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: "danger" | "primary";
  isBusy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  title,
  emoji,
  description,
  confirmLabel,
  cancelLabel = "取消",
  tone = "danger",
  isBusy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal title={title} emoji={emoji} description={description} onClose={onCancel}>
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button type="button" className={secondaryButtonClass} onClick={onCancel} disabled={isBusy}>
          {cancelLabel}
        </button>
        <button
          type="button"
          className={tone === "danger" ? dangerButtonClass : primaryButtonClass}
          onClick={onConfirm}
          disabled={isBusy}
          autoFocus
        >
          {isBusy ? "處理中..." : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
