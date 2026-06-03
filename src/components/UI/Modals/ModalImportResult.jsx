import { useEffect } from "react";

export default function ModalProcessResult({
	open,
	title = "Resultado del proceso",
	summary,
	counters = [],
	rows = [],
	columns = [],
	rowsTitle = "Registros no procesados",
	emptyMessage = "Todos los registros fueron procesados correctamente.",
	onClose,
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

	const success = summary?.success ?? 0;
	const total = summary?.total ?? 0;
	const label = summary?.label ?? "registros correctos";
	const message = summary?.message ?? "Proceso finalizado.";

	const hasRows = Array.isArray(rows) && rows.length > 0;

	const getValue = (row, column) => {
		if (typeof column.accessor === "function") {
			return column.accessor(row);
		}

		return row?.[column.accessor] ?? "-";
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			<button
				type="button"
				onClick={onClose}
				className="absolute inset-0 bg-black/50"
				aria-label="Cerrar modal"
			/>

			<div className="relative w-[94vw] max-w-4xl rounded-xl bg-white dark:bg-slate-900 shadow-lg border border-slate-200 dark:border-slate-800">
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

				<div className="p-4 space-y-4 text-slate-800 dark:text-slate-200">
					<div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 p-4">
						<p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
							{success} de {total} {label}
						</p>

						<p className="text-sm mt-1 text-slate-600 dark:text-slate-300">
							{message}
						</p>
					</div>

					{counters.length > 0 && (
						<div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
							{counters.map((item, index) => (
								<div
									key={`${item.label}-${index}`}
									className="rounded-lg bg-slate-100 dark:bg-slate-800 p-3"
								>
									<div className="text-xs text-slate-500 dark:text-slate-400">
										{item.label}
									</div>
									<div className="font-bold">{item.value ?? 0}</div>
								</div>
							))}
						</div>
					)}

					{hasRows ? (
						<div>
							<h4 className="font-semibold mb-2 text-red-600 dark:text-red-300">
								{rowsTitle}
							</h4>

							<div className="max-h-80 overflow-auto rounded-lg border border-slate-200 dark:border-slate-800">
								<table className="min-w-full text-sm">
									<thead className="bg-slate-100 dark:bg-slate-800 text-xs uppercase text-slate-600 dark:text-slate-300">
										<tr>
											{columns.map((column, index) => (
												<th
													key={`${column.header}-${index}`}
													className="px-3 py-2 text-left"
												>
													{column.header}
												</th>
											))}
										</tr>
									</thead>

									<tbody className="divide-y divide-slate-200 dark:divide-slate-800">
										{rows.map((row, rowIndex) => (
											<tr key={row.id ?? row.row ?? rowIndex}>
												{columns.map((column, colIndex) => (
													<td
														key={`${rowIndex}-${colIndex}`}
														className={`px-3 py-2 ${
															column.danger
																? "text-red-600 dark:text-red-300"
																: ""
														}`}
													>
														{getValue(row, column)}
													</td>
												))}
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</div>
					) : (
						<div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-3 text-sm text-emerald-700 dark:text-emerald-300">
							{emptyMessage}
						</div>
					)}

					<div className="flex justify-end pt-2">
						<button
							type="button"
							onClick={onClose}
							className="px-4 py-2 rounded-lg bg-slate-800 text-white hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600"
						>
							Cerrar
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
