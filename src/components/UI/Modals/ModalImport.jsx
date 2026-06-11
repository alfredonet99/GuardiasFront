// components/UI/Modals/ModalImport.jsx
import { useEffect } from "react";

export default function ModalImport({ open, title, onClose, children }) {
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
			{/* overlay */}
			<button
				type="button"
				onClick={onClose}
				className="absolute inset-0 bg-black/50"
				aria-label="Cerrar modal"
			/>

			{/* panel */}
			<div className="relative w-[92vw] max-w-lg rounded-xl bg-white dark:bg-slate-900 shadow-lg border border-slate-200 dark:border-slate-800">
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

				<div className="p-4 text-slate-800 dark:text-slate-200">{children}</div>
			</div>
		</div>
	);
}
