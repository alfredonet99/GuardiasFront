export default function WeekFilter({
	id = "weekly-chart-filter",
	weeks = [],
	value,
	onChange,
	disabled = false,
}) {
	return (
		<div className="w-full sm:w-[250px]">
			<label htmlFor={id} className="sr-only">
				Semana evaluada
			</label>

			<select
				id={id}
				value={value}
				disabled={disabled}
				onChange={(event) => onChange(event.target.value)}
				className="
					w-full
					rounded-lg
					border
					border-slate-300
					bg-white
					px-3
					py-2
					text-xs
					text-slate-700
					outline-none
					transition
					focus:border-indigo-500
					focus:ring-2
					focus:ring-indigo-500/20
					disabled:cursor-not-allowed
					disabled:opacity-60
					dark:border-slate-700
					dark:bg-slate-900
					dark:text-slate-200
				"
			>
				{weeks.map((week) => (
					<option key={week.id} value={week.id}>
						{week.label}
					</option>
				))}
			</select>
		</div>
	);
}
