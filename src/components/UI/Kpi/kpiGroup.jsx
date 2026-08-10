export default function KpiGroup({
	label,
	hint,
	children,
	className = "",
	columns = "lg:grid-cols-4",
}) {
	return (
		<div className={`mt-5 first:mt-0 ${className}`}>
			<div className="mb-2.5 flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-2">
				<h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
					{label}
				</h4>

				{hint && (
					<span className="text-xs text-slate-400 dark:text-slate-500">
						· {hint}
					</span>
				)}
			</div>

			<div className={`grid grid-cols-1 gap-3 sm:grid-cols-2 ${columns}`}>
				{children}
			</div>
		</div>
	);
}
