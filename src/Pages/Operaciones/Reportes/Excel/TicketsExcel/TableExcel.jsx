export default function TableExcelPreview({
	title,
	generatedAt,
	filters = {},
	columns = [],
	rows = [],
}) {
	return (
		<div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
			{/* Header */}
			<div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
				<div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
					<div>
						<h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
							{title}
						</h2>
						<p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
							Vista previa tipo Excel
						</p>
					</div>

					<div className="text-sm text-slate-500 dark:text-slate-400">
						<span className="font-medium text-slate-700 dark:text-slate-200">
							Generado:
						</span>{" "}
						{generatedAt}
					</div>
				</div>
			</div>

			{/* Filtros */}
			<div className="border-b border-slate-200 bg-slate-50 px-5 py-4 dark:border-slate-800 dark:bg-slate-950/40">
				<div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
					{Object.entries(filters).map(([key, value]) => (
						<div key={key} className="text-sm">
							<div className="font-semibold capitalize text-slate-700 dark:text-slate-200">
								{key.replaceAll("_", " ")}
							</div>
							<div className="mt-1 break-words text-slate-600 dark:text-slate-400">
								{String(value || "-")}
							</div>
						</div>
					))}
				</div>
			</div>

			{/* Resumen */}
			<div className="border-b border-slate-200 px-5 py-3 dark:border-slate-800">
				<p className="text-sm text-slate-600 dark:text-slate-400">
					Total de registros:{" "}
					<span className="font-semibold text-slate-800 dark:text-slate-100">
						{rows.length}
					</span>
				</p>
			</div>

			{/* Tabla tipo hoja */}
			<div className="overflow-auto">
				<table className="min-w-[1400px] border-collapse text-sm">
					<thead className="sticky top-0 z-10 bg-slate-100 dark:bg-slate-800">
						<tr>
							<th className="w-14 border-b border-r border-slate-200 px-3 py-3 text-center font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-300">
								#
							</th>

							{columns.map((col) => (
								<th
									key={col.key}
									className="whitespace-nowrap border-b border-r border-slate-200 px-3 py-3 text-left font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200"
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
									colSpan={columns.length + 1}
									className="px-4 py-10 text-center text-slate-500 dark:text-slate-400"
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
									<td className="border-b border-r border-slate-100 px-3 py-3 text-center text-slate-500 dark:border-slate-800 dark:text-slate-400">
										{idx + 1}
									</td>

									{columns.map((col) => (
										<td
											key={col.key}
											className="border-b border-r border-slate-100 px-3 py-3 align-top text-slate-700 dark:border-slate-800 dark:text-slate-300"
										>
											<div className="max-w-[280px] break-words">
												{row[col.key] ?? "-"}
											</div>
										</td>
									))}
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>
		</div>
	);
}
