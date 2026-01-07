import { FiAlertTriangle, FiX } from "react-icons/fi";

export default function ActiveGuardiaModal({ isOpen, onClose }) {
	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50">
			<button
				type="button"
				className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm cursor-default"
				onClick={onClose}
				aria-label="Cerrar modal"
			/>

			<div className="absolute inset-0 flex items-center justify-center p-4">
				<div
					role="dialog"
					aria-modal="true"
					aria-labelledby="active-guardia-title"
					className="w-full max-w-md rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden"
				>
					<div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-slate-200/70 dark:border-slate-800">
						<div className="flex items-center gap-3">
							<div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200 flex items-center justify-center">
								<FiAlertTriangle className="text-xl" />
							</div>

							<div className="leading-tight">
								<h2
									id="active-guardia-title"
									className="text-lg font-semibold text-slate-900 dark:text-slate-100"
								>
									Tienes una guardia activa
								</h2>
								<p className="text-sm text-slate-500 dark:text-slate-400">
									No olvides cerrarla cuando finalices.
								</p>
							</div>
						</div>

						<button
							type="button"
							onClick={onClose}
							className="inline-flex items-center justify-center h-10 w-10 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
							aria-label="Cerrar"
							title="Cerrar"
						>
							<FiX className="text-lg text-slate-600 dark:text-slate-300" />
						</button>
					</div>

					<div className="px-6 py-5">
						<p className="text-sm text-slate-700 dark:text-slate-200">
							Detectamos una guardia en curso. Recuerda finalizarla para
							mantener el registro correcto.
						</p>
					</div>

					<div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-200/70 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60">
						<button
							type="button"
							onClick={onClose}
							className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition"
						>
							Entendido
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
