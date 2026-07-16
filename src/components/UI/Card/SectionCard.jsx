import { DASHBOARD_ACCENTS } from "../../../constants/dashboardAccents";

export default function SectionCard({
	accent = "slate",
	title,
	subtitle,
	className = "",
	children,
}) {
	const accentClasses = DASHBOARD_ACCENTS[accent] ?? DASHBOARD_ACCENTS.slate;

	return (
		<section className={`w-full ${className}`}>
			<div
				className="
					overflow-hidden
					rounded-2xl
					border
					border-slate-200
					bg-white
					shadow-sm
					transition-colors
					duration-200
					dark:border-slate-800
					dark:bg-slate-900
					dark:shadow-none
				"
			>
				<div
					className="
						flex
						flex-col
						gap-3
						border-b
						border-slate-200
						px-5
						py-4
						dark:border-slate-800
						sm:flex-row
						sm:items-center
						sm:justify-between
					"
				>
					<div className="flex items-center gap-2.5">
						<span
							className={`
								relative
								flex
								h-2.5
								w-2.5
								shrink-0
								rounded-full
								${accentClasses.dot}
							`}
							title="Datos en vivo"
						>
							<span
								className={`
									absolute
									inline-flex
									h-full
									w-full
									animate-ping
									rounded-full
									opacity-60
									motion-reduce:animate-none
									${accentClasses.dot}
								`}
							/>
						</span>

						<div>
							<h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
								{title}
							</h2>

							{subtitle && (
								<p className="text-sm text-slate-500 dark:text-slate-400">
									{subtitle}
								</p>
							)}
						</div>
					</div>
				</div>

				<div className="p-5">{children}</div>
			</div>
		</section>
	);
}
