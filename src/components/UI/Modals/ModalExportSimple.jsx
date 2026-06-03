import { useEffect } from "react";
import { RiFileExcel2Line } from "react-icons/ri";
import { TbCsv } from "react-icons/tb";

export default function ModalExport({
	open,
	title = "Exportar información",
	onClose,
	onExport,
	loading = false,
}) {
	useEffect(() => {
		if (!open) return;

		const onKey = (e) => {
			if (e.key === "Escape") onClose?.();
		};

		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [open, onClose]);

	if (!open) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			<button
				type="button"
				onClick={onClose}
				className="absolute inset-0 bg-black/50"
				aria-label="Cerrar modal"
			/>

			<div className="relative w-[92vw] max-w-md rounded-xl bg-white dark:bg-slate-900 shadow-lg border border-slate-200 dark:border-slate-800">
				<div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800">
					<h3 className="font-semibold text-slate-800 dark:text-slate-100">
						{title}
					</h3>

					<button
						type="button"
						onClick={onClose}
						className="px-2 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
						aria-label="Cerrar"
					>
						✕
					</button>
				</div>

				<div className="p-4 text-slate-800 dark:text-slate-200 space-y-4">
					<p className="text-sm text-slate-600 dark:text-slate-400">
						Selecciona el formato en el que deseas exportar la información.
					</p>

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
						<button
							type="button"
							disabled={loading}
							onClick={() => onExport?.("xlsx")}
							className="flex flex-col items-center justify-center gap-2 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-5 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition disabled:opacity-50 disabled:cursor-not-allowed"
						>
							<RiFileExcel2Line className="text-3xl text-emerald-600 dark:text-emerald-300" />
							<span className="font-semibold">Excel</span>
							<span className="text-xs text-slate-500">.xlsx</span>
						</button>

						<button
							type="button"
							disabled={loading}
							onClick={() => onExport?.("csv")}
							className="flex flex-col items-center justify-center gap-2 rounded-xl border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-900/20 px-4 py-5 hover:bg-sky-100 dark:hover:bg-sky-900/40 transition disabled:opacity-50 disabled:cursor-not-allowed"
						>
							<TbCsv className="text-3xl text-sky-600 dark:text-sky-300" />
							<span className="font-semibold">CSV</span>
							<span className="text-xs text-slate-500">.csv</span>
						</button>
					</div>

					<div className="flex justify-end pt-2">
						<button
							type="button"
							onClick={onClose}
							disabled={loading}
							className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
						>
							Cancelar
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
