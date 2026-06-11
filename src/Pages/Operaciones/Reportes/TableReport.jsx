import { forwardRef } from "react";

const TableReportPrint = forwardRef(function TableReportPrint(
	{ title, subtitle, generatedAt, filters = {}, columns = [], rows = [] },
	ref,
) {
	return (
		<div
			ref={ref}
			className="print-container bg-white text-slate-800 dark:bg-slate-900 dark:text-slate-200"
		>
			<div className="mx-auto w-full bg-white p-4 dark:bg-slate-900">
				<div className="mb-6 border-b border-slate-200 pb-4 dark:border-slate-800">
					<div className="flex items-start justify-between gap-4">
						<div>
							<h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
								{title}
							</h1>
							{subtitle ? (
								<p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
									{subtitle}
								</p>
							) : null}
						</div>

						<div className="text-right text-xs text-slate-500 dark:text-slate-400">
							<p className="font-medium text-slate-700 dark:text-slate-200">
								Generado
							</p>
							<p>{generatedAt}</p>
						</div>
					</div>
				</div>

				{/* Filtros */}
				<div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
					<div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
						{Object.entries(filters).map(([key, value]) => (
							<div key={key} className="flex gap-2">
								<span className="font-semibold capitalize text-slate-700 dark:text-slate-200">
									{key.replaceAll("_", " ")}:
								</span>
								<span className="break-words text-slate-600 dark:text-slate-300">
									{String(value || "-")}
								</span>
							</div>
						))}
					</div>
				</div>

				{/* Resumen */}
				<div className="mb-4 flex items-center justify-between">
					<div className="text-sm text-slate-600 dark:text-slate-400">
						Total de registros:{" "}
						<span className="font-semibold text-slate-800 dark:text-slate-100">
							{rows.length}
						</span>
					</div>
				</div>

				{/* Tabla */}
				<div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
					<table className="print-table w-full border-collapse text-[12px]">
						<thead className="bg-slate-100 dark:bg-slate-800">
							<tr>
								{columns.map((col) => (
									<th
										key={col.key}
										className="border-b border-slate-200 px-3 py-3 text-left align-top font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200"
									>
										{col.label}
									</th>
								))}
							</tr>
						</thead>

						<tbody>
							{rows.length === 0 ? (
								<tr>
									<td
										colSpan={columns.length}
										className="px-3 py-8 text-center text-slate-500 dark:text-slate-400"
									>
										No hay registros para mostrar.
									</td>
								</tr>
							) : (
								rows.map((row, idx) => (
									<tr
										key={idx}
										className="odd:bg-white even:bg-slate-50/50 dark:odd:bg-slate-900 dark:even:bg-slate-900/60"
									>
										{columns.map((col) => (
											<td
												key={col.key}
												className="border-b border-slate-100 px-3 py-3 align-top break-words text-slate-700 dark:border-slate-800 dark:text-slate-300"
											>
												{row[col.key] ?? "-"}
											</td>
										))}
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
});

export default TableReportPrint;
