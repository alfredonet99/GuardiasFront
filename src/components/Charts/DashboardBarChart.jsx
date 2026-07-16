import {
	Bar,
	BarChart,
	CartesianGrid,
	Legend,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

import { DASHBOARD_CHART_SERIES } from "../../constants/DashboardChartSeries";

export default function WeeklyBarChart({
	title,
	subtitle = "Actividad diaria de lunes a domingo",
	data = [],
	series = [],
	loading = false,
	headerAction = null,
	className = "",
}) {
	const enabledSeries = series
		.map((key) => DASHBOARD_CHART_SERIES[key])
		.filter(Boolean);

	const hasData =
		Array.isArray(data) && data.length > 0 && enabledSeries.length > 0;

	return (
		<div
			className={`
				rounded-xl
				border
				border-slate-200
				bg-white
				p-4
				dark:border-slate-800
				dark:bg-slate-900
				${className}
			`}
		>
			<div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
				<div className="min-w-0">
					<h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
						{title}
					</h3>

					{subtitle && (
						<p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
							{subtitle}
						</p>
					)}
				</div>

				{headerAction && (
					<div className="w-full shrink-0 sm:w-auto">{headerAction}</div>
				)}
			</div>

			<div className="h-[320px] w-full">
				{loading ? (
					<div className="flex h-full items-center justify-center text-sm text-slate-500 dark:text-slate-400">
						Cargando gráfica…
					</div>
				) : !hasData ? (
					<div className="flex h-full items-center justify-center text-sm text-slate-500 dark:text-slate-400">
						Sin información para esta semana
					</div>
				) : (
					<ResponsiveContainer width="100%" height="100%">
						<BarChart
							data={data}
							margin={{
								top: 10,
								right: 10,
								left: -15,
								bottom: 5,
							}}
							barCategoryGap="20%"
							barGap={2}
						>
							<CartesianGrid
								vertical={false}
								strokeDasharray="3 3"
								className="stroke-slate-200 dark:stroke-slate-700"
							/>

							<XAxis
								dataKey="day"
								axisLine={false}
								tickLine={false}
								tick={{
									fontSize: 12,
									fill: "#64748b",
								}}
							/>

							<YAxis
								allowDecimals={false}
								axisLine={false}
								tickLine={false}
								tick={{
									fontSize: 12,
									fill: "#64748b",
								}}
							/>

							<Tooltip
								cursor={{
									fill: "rgba(148, 163, 184, 0.12)",
								}}
								contentStyle={{
									borderRadius: "10px",
									borderColor: "#cbd5e1",
									fontSize: "12px",
								}}
								formatter={(value, name) => [Number(value), name]}
							/>

							<Legend
								iconType="circle"
								wrapperStyle={{
									fontSize: "12px",
									paddingTop: "12px",
								}}
							/>

							{enabledSeries.map((item) => (
								<Bar
									key={item.key}
									dataKey={item.key}
									name={item.label}
									fill={item.color}
									maxBarSize={20}
									radius={[4, 4, 0, 0]}
								/>
							))}
						</BarChart>
					</ResponsiveContainer>
				)}
			</div>
		</div>
	);
}
