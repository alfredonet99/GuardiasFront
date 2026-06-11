import { FiAlertTriangle, FiX } from "react-icons/fi";

export default function ConfirmBulkActionModal({
    isOpen,
    title = "Confirmar eliminación",
    message,
    count = 0,
    itemLabel = "registro",
    itemLabelPlural,
    cancelLabel = "Cancelar",
    confirmLabel = "Eliminar",
    loading = false,
    loadingLabel = "Eliminando...",
    onCancel,
    onConfirm,
}) {
    if (!isOpen) return null;

    const label =
        count === 1 ? itemLabel : itemLabelPlural || `${itemLabel}s`;

    const defaultMessage = `Estás a punto de eliminar ${count} ${label}.\nEsta acción no se puede deshacer.`;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

            <div className="relative z-50 w-full max-w-md">
                <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xl shadow-slate-900/10 dark:border-slate-700 dark:bg-slate-900">
                    <div className="flex items-start justify-between px-5 pt-4">
                        <div className="flex items-center gap-2">
                            <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                                <FiAlertTriangle className="text-lg" />
                            </div>

                            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                                {title}
                            </h2>
                        </div>

                        <button
                            type="button"
                            onClick={onCancel}
                            disabled={loading}
                            className="inline-flex items-center justify-center rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-60 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                        >
                            <FiX className="text-lg" />
                        </button>
                    </div>

                    <div className="px-5 pb-4 pt-2">
                        <p className="whitespace-pre-line text-base leading-relaxed text-slate-600 dark:text-slate-300">
                            {message || defaultMessage}
                        </p>
                    </div>

                    <div className="flex items-center justify-end gap-3 px-5 pb-4 pt-1">
                        <button
                            type="button"
                            onClick={onCancel}
                            disabled={loading}
                            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                            {cancelLabel}
                        </button>

                        <button
                            type="button"
                            onClick={onConfirm}
                            disabled={loading || count <= 0}
                            className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-rose-600/40 transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {loading ? loadingLabel : confirmLabel}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}