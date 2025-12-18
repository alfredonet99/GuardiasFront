
import { FiX, FiAlertTriangle } from "react-icons/fi";

export default function ConfirmModal({title, message, confirmText, cancelText, onConfirm, onCancel,}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel}/>
      <div className="relative z-50 w-full max-w-md mx-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xl shadow-slate-900/10 dark:bg-slate-900 dark:border-slate-700">
          <div className="flex items-start justify-between px-5 pt-4">
            <div className="flex items-center gap-2">
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                <FiAlertTriangle className="text-lg" />
              </div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100"> {title} </h2>
            </div>

            <button type="button" onClick={onCancel} className="inline-flex items-center justify-center rounded-full p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100
                dark:text-slate-500 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition"
            > <FiX className="text-lg" /> </button>
          </div>

          <div className="px-5 pt-2 pb-4">
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed"> {message} </p>
          </div>

          <div className="flex items-center justify-end gap-3 px-5 pb-4 pt-1">
            <button type="button" onClick={onCancel} className="px-4 py-2 text-sm rounded-lg border border-slate-300 text-slate-700 bg-whitehover:bg-slate-100dark:border-slate-600 dark:text-slate-200 dark:bg-slate-900dark:hover:bg-slate-800 transition">
              {cancelText}
            </button>

            <button type="button" onClick={onConfirm} className="px-4 py-2 text-sm rounded-lg bg-rose-600 text-white hover:bg-rose-700 shadow-sm shadow-rose-600/40transition">
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
