export default function TableBlock({
	heading,
	columns,
	hideOnMobile = [],
	emptyLabel,
	children,
	className = "",
}) {
	const hasRows = Array.isArray(children)
		? children.length > 0
		: Boolean(children);

	return (
		<div className={`mt-6 ${className}`}>
			{heading && (
				<h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
					{heading}
				</h3>
			)}

			<div className="mt-3 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
				<div className="overflow-x-auto">
					<table className="w-full text-sm">
						<thead className="bg-slate-50 dark:bg-slate-800/40">
							<tr className="text-left text-xs font-semibold text-slate-600 dark:text-slate-300">
								{columns.map((column, index) => (
									<th
										key={column}
										className={`
											px-4 py-3
											${hideOnMobile[index] ? "hidden md:table-cell" : ""}
											${index === columns.length - 1 ? "text-center" : ""}
										`}
									>
										{column}
									</th>
								))}
							</tr>
						</thead>

						<tbody className="divide-y divide-slate-200 dark:divide-slate-800">
							{hasRows ? (
								children
							) : (
								<tr>
									<td
										colSpan={columns.length}
										className="px-4 py-8 text-center text-slate-500 dark:text-slate-400"
									>
										{emptyLabel}
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
}
