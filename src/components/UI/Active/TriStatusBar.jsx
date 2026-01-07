export default function TriStatusBar({ ui }) {
	if (!ui) return null;

	return (
		<div className="mb-6 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
			<div className="px-4 py-3 bg-slate-50 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
				<div className="flex items-center gap-2">
					<span className="text-sm font-semibold">{ui.title}</span>

					<span
						className={[
							"inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border",
							ui.badgeClass,
						].join(" ")}
					>
						{ui.label}
					</span>
				</div>

				<div className="text-xs text-slate-500 dark:text-slate-400">
					{ui.helpText}
				</div>
			</div>

			<div className="p-4">
				{ui.canRenderSwitch ? (
					<div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
						<div className="flex w-full sm:w-auto gap-2">
							{ui.switchOptions.map((opt) => {
								const isActive = Number(ui.s) === Number(opt);

								return (
									<button
										key={opt}
										type="button"
										onClick={() => ui.select(opt)}
										className={[
											"flex-1 sm:flex-none px-4 py-2 rounded-xl border text-sm font-semibold transition",
											isActive
												? "border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
												: "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800",
										].join(" ")}
									>
										{ui.labels?.[opt] ?? String(opt)}
									</button>
								);
							})}
						</div>

						<div className="flex justify-end">
							{ui.canDoSecondary ? (
								<button
									type="button"
									onClick={ui.secondary}
									className={[
										"px-4 py-2 rounded-xl border text-sm font-semibold transition",
										"border-blue-200 dark:border-blue-800",
										"bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-200",
										"hover:bg-blue-100 dark:hover:bg-blue-900/30",
									].join(" ")}
								>
									{ui.secondaryActionLabel}
								</button>
							) : null}
						</div>
					</div>
				) : (
					<div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 p-4 text-sm text-slate-600 dark:text-slate-300">
						Este registro está <span className="font-semibold">{ui.label}</span>
						. No se puede modificar el estatus desde esta pantalla.
					</div>
				)}
			</div>
		</div>
	);
}
