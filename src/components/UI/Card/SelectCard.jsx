export default function SelectCard({
	checked,
	onToggle,
	title,
	subtitle,
	children,
	className = "",
}) {
	return (
		<button
			type="button"
			onClick={onToggle}
			className={`text-left p-4 rounded-2xl border transition w-full
        ${
					checked
						? "border-blue-600 bg-blue-50 dark:bg-blue-600/10"
						: "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/40"
				} ${className}`}
		>
			<div className="flex items-start justify-between gap-3">
				<div className="min-w-0 w-full">
					<div className="text-sm font-semibold truncate">{title}</div>

					{subtitle ? (
						<div className="text-xs text-slate-600 dark:text-slate-400 mt-1 truncate">
							{subtitle}
						</div>
					) : null}

					{/* 👇 contenido específico de cada pantalla */}
					{children ? <div className="mt-2">{children}</div> : null}
				</div>

				{/* toggle */}
				<span
					className={`shrink-0 inline-flex items-center h-6 w-11 rounded-full p-1 transition
            ${checked ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-700"}`}
				>
					<span
						className={`h-4 w-4 rounded-full bg-white transition transform
              ${checked ? "translate-x-5" : "translate-x-0"}`}
					/>
				</span>
			</div>
		</button>
	);
}
