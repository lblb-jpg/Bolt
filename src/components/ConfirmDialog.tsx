import { useEffect, useRef } from "react";
import { AlertTriangle, LoaderCircle, Pencil, Trash2, X } from "lucide-react";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  variant: "edit" | "delete";
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog = ({
  isOpen,
  title,
  description,
  confirmLabel,
  variant,
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) => {
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    cancelButtonRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isLoading) onCancel();
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, isLoading, onCancel]);

  if (!isOpen) return null;

  const isDelete = variant === "delete";
  const Icon = isDelete ? Trash2 : Pencil;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isLoading) onCancel();
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
        className="glass-card w-full max-w-sm overflow-hidden rounded-[28px] shadow-2xl shadow-black/50"
      >
        <div className="flex items-start gap-3 p-5 sm:p-6">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
              isDelete
                ? "border-rose-500/20 bg-rose-500/10 text-rose-400"
                : "border-amber-500/20 bg-amber-500/10 text-amber-400"
            }`}
          >
            <Icon className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1">
            <h2 id="confirm-dialog-title" className="text-base font-bold text-white">
              {title}
            </h2>
            <p id="confirm-dialog-description" className="mt-1.5 text-sm leading-relaxed text-zinc-400">
              {description}
            </p>
          </div>

          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="rounded-lg p-1 text-zinc-500 transition-colors hover:bg-white/5 hover:text-white disabled:opacity-40"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {isDelete && (
          <div className="mx-5 flex items-center gap-2 rounded-xl border border-rose-500/10 bg-rose-500/5 px-3 py-2.5 text-xs text-rose-300 sm:mx-6">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            Cette action est définitive.
          </div>
        )}

        <div className="mt-5 flex gap-2 border-t border-white/5 bg-[#0F1115]/50 p-4 sm:px-6">
          <button
            ref={cancelButtonRef}
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 rounded-xl border border-white/10 px-4 py-2.5 text-xs font-bold text-zinc-300 transition-colors hover:bg-white/5 hover:text-white disabled:opacity-40"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-colors disabled:opacity-60 ${
              isDelete
                ? "bg-rose-500 text-white hover:bg-rose-400"
                : "bg-amber-500 text-[#0F1115] hover:bg-amber-400"
            }`}
            id={`confirm-${variant}-btn`}
          >
            {isLoading && <LoaderCircle className="h-4 w-4 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
