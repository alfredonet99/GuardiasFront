import { DASHBOARD_ACCENTS } from "../../../constants/dashboardAccents";

export default function KpiCard({
	icon,
	title,
	value,
	subtitle,
	accent = "slate",
	className = "",
}) {
	const accentClasses = DASHBOARD_ACCENTS[accent] ?? DASHBOARD_ACCENTS.slate;

	return (
		<div
			className={`
				rounded-xl
				border-l-4
				${accentClasses.border}
				border-y
				border-r
				border-slate-200
				bg-white
				shadow-sm
				dark:border-slate-800
				dark:bg-slate-900
				dark:shadow-none
				p-4
				flex
				items-start
				gap-3
				transition-colors
				duration-200
				${className}
			`}
			style={{
				borderTopLeftRadius: 0,
				borderBottomLeftRadius: 0,
			}}
		>
			<span
				className={`
					shrink-0
					rounded-lg
					p-2
					${accentClasses.icon}
				`}
			>
				{icon}
			</span>

			<div className="min-w-0">
				<div className="text-xs text-slate-500 dark:text-slate-400 truncate">
					{title}
				</div>

				<div className="mt-0.5 text-2xl font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
					{value}
				</div>

				{subtitle && (
					<div
						className="mt-0.5 text-xs text-slate-500 dark:text-slate-400"
						title={subtitle}
					>
						{subtitle}
					</div>
				)}
			</div>
		</div>
	);
}
