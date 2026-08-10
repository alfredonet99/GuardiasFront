import { useEffect, useState } from "react";
import { privateInstance } from "../../api/axios";
import IconShowNot from "../../components/icons/Crud/ShowNot";
import ToggleUserStatusButtonNot from "../../components/UI/Active/BtnActiveNot";
import { formatDateTime, getGreeting, getRollingWeeks } from "../../utils/date";
import { mergePendingMonitoreos, getPeriodLabels } from "../../utils/Dashboard";
import {
	IconActivity,
	IconCheck,
	IconPlus,
	IconRefresh,
	IconX,
} from "../../components/icons/DashboardOperaciones/OperacionesDashIcons";
import { KpiCard, KpiGroup } from "../../components/UI/Kpi/index";
import SectionCard from "../../components/UI/Card/SectionCard";
import StatusBadge from "../../components/UI/Badges/StatusBag";
import TableBlock from "../../components/UI/Tables/TableBlock";
import {
	INITIAL_DASHBOARD_PERIODS,
	INITIAL_MONITOREO_STATS,
	INITIAL_TICKET_STATS,
} from "../../constants/DashInitialState";
import { WeeklyBarChart, WeekFilter } from "../../components/Charts/Index";

const MONITOREO_CHART_ENDPOINT = "operaciones/graficas/monitoreos";
const TICKET_CHART_ENDPOINT = "/operaciones/graficas/tickets";

const TICKET_KPIS = [
	{
		key: "created",
		title: "Creados",
		accent: "indigo",
		Icon: IconPlus,
	},
	{
		key: "updated",
		title: "Actualizados",
		accent: "indigo",
		Icon: IconRefresh,
	},
	{
		key: "closed",
		title: "Cerrados",
		accent: "emerald",
		Icon: IconCheck,
	},
	{
		key: "annulled",
		title: "Anulados",
		accent: "rose",
		Icon: IconX,
	},
];

const MONITOREO_WEEKLY_KPIS = [
	{
		key: "pending_all",
		title: "Pendientes",
		accent: "indigo",
		Icon: IconActivity,
	},
	{
		key: "created_week_user",
		title: "Creados",
		accent: "indigo",
		Icon: IconPlus,
	},
	{
		key: "concluded_week_user",
		title: "Concluidos",
		accent: "emerald",
		Icon: IconCheck,
	},
	{
		key: "annulled_week_user",
		title: "Anulados",
		accent: "rose",
		Icon: IconX,
	},
];

const MONITOREO_MONTHLY_KPIS = [
	{
		key: "created_month_user",
		title: "Creados",
		accent: "indigo",
		Icon: IconPlus,
	},
	{
		key: "UpdateMontByUser",
		title: "Actualizados",
		accent: "indigo",
		Icon: IconActivity,
	},
	{
		key: "concluded_month_user",
		title: "Concluidos",
		accent: "emerald",
		Icon: IconCheck,
	},
	{
		key: "annulled_month_user",
		title: "Anulados",
		accent: "rose",
		Icon: IconX,
	},
];

const TICKET_MONTHLY_KPIS = [
	{
		key: "created",
		title: "Creados",
		accent: "indigo",
		Icon: IconPlus,
	},
	{
		key: "updated",
		title: "Actualizados",
		accent: "indigo",
		Icon: IconRefresh,
	},
	{
		key: "closed",
		title: "Cerrados",
		accent: "emerald",
		Icon: IconCheck,
	},
	{
		key: "annulled_mounth",
		title: "Anulados",
		accent: "rose",
		Icon: IconX,
	},
];


const TICKET_COLUMNS = ["Ticket", "Título", "Creado el", "Status", "Acciones"];

const MONITOREO_COLUMNS = [
	"Monitoreo",
	"Título",
	"Creado el",
	"Status",
	"Acciones",
];

function getStoredUser() {
	try {
		const storedUser = localStorage.getItem("user");

		return storedUser ? JSON.parse(storedUser) : null;
	} catch {
		return null;
	}
}

function getTicketStats(counts = {}) {
	return {
		created_week: Number(counts.created_week ?? 0),
		updated_week: Number(counts.updated_week ?? 0),
		closed_week: Number(counts.closed_week ?? 0),
		annulled_week: Number(counts.annulled_week ?? 0),

		created_month: Number(counts.created_month ?? counts.total_created ?? 0),
		updated_month: Number(counts.updated_month ?? 0),
		closed_month: Number(counts.closed_month ?? counts.total_concluded ?? 0),
		annulled_month: Number(counts.annulled_month ?? counts.total_annulled ?? 0),
	};
}

function getMonitoreoStats(counts = {}) {
	return {
		pending_all: Number(counts.pending_all ?? 0),
		created_week_user: Number(counts.created_week_user ?? 0),
		concluded_week_user: Number(counts.concluded_week_user ?? 0),
		annulled_week_user: Number(counts.annulled_week_user ?? 0),

		pending_month_user: Number(counts.pending_month_user ?? 0),
		created_month_user: Number(
			counts.created_month_user ?? counts.total_month_user ?? 0,
		),
		UpdateMontByUser: Number(counts.UpdateMontByUser ?? 0),
		concluded_month_user: Number(counts.concluded_month_user ?? 0),
		annulled_month_user: Number(counts.annulled_month_user ?? 0),
	};
}

function updateRecordById(records, updatedRecord) {
	if (!updatedRecord?.id) {
		return records;
	}

	const updatedId = Number(updatedRecord.id);

	return records.map((record) =>
		Number(record.id) === updatedId
			? {
				...record,
				...updatedRecord,
			}
			: record,
	);
}

async function getTicketsDashboard() {
	const { data } = await privateInstance.get("/operaciones/tickets/dashboard");

	return {
		stats: getTicketStats(data?.counts),
		periods: getPeriodLabels(data),
		tickets: data?.pending_tickets,
	};
}

async function getMonitoreosDashboard() {
	const { data } = await privateInstance.get(
		"/operaciones/monitoreos/dashboard",
	);

	return {
		stats: getMonitoreoStats(data?.counts),
		monitoreos: Array.isArray(data?.pending_monitoreos)
			? data.pending_monitoreos
			: [],
	};
}

async function getWeeklyChart({ endpoint, weekStart }) {
	if (!weekStart) {
		return [];
	}

	const { data } = await privateInstance.get(endpoint, {
		params: {
			week_start: weekStart,
		},
	});

	return Array.isArray(data?.weekly_chart) ? data.weekly_chart : [];
}

export default function OperacionesDash() {
	const [user] = useState(getStoredUser);

	/*
	 * El filtro se genera exclusivamente con Day.js.
	 *
	 * Siempre contiene:
	 * - Dos semanas anteriores.
	 * - Semana actual.
	 */
	const [availableWeeks] = useState(() => getRollingWeeks(3));

	const currentWeek = availableWeeks[availableWeeks.length - 1] ?? null;

	// ===================== TICKETS =====================

	const [stats, setStats] = useState(INITIAL_TICKET_STATS);

	const [periods, setPeriods] = useState(INITIAL_DASHBOARD_PERIODS);

	const [pendingTickets, setPendingTickets] = useState([]);

	const [loading, setLoading] = useState(true);

	const [statusLoadingId, setStatusLoadingId] = useState(null);

	// ===================== MONITOREOS =====================

	const [monStats, setMonStats] = useState(INITIAL_MONITOREO_STATS);

	const [pendingMonitoreos, setPendingMonitoreos] = useState([]);

	const [monLoading, setMonLoading] = useState(true);

	const [monStatusLoadingId, setMonStatusLoadingId] = useState(null);

	// ===================== GRÁFICA MONITOREOS =====================

	const [selectedMonitoreoWeekId, setSelectedMonitoreoWeekId] = useState(
		() => currentWeek?.id ?? "",
	);

	const selectedMonitoreoWeek =
		availableWeeks.find(
			(week) => String(week.id) === String(selectedMonitoreoWeekId),
		) ?? currentWeek;

	const selectedMonitoreoWeekStart = selectedMonitoreoWeek?.start ?? "";

	const [monitoreoWeeklyChart, setMonitoreoWeeklyChart] = useState([]);

	const [monitoreoChartLoading, setMonitoreoChartLoading] = useState(true);

	// ===================== GRÁFICA TICKETS =====================

	const [selectedTicketWeekId, setSelectedTicketWeekId] = useState(
		() => currentWeek?.id ?? "",
	);

	const selectedTicketWeek =
		availableWeeks.find(
			(week) => String(week.id) === String(selectedTicketWeekId),
		) ?? currentWeek;

	const selectedTicketWeekStart = selectedTicketWeek?.start ?? "";

	const [ticketWeeklyChart, setTicketWeeklyChart] = useState([]);

	const [ticketChartLoading, setTicketChartLoading] = useState(true);

	// ===================== CARGA DEL DASHBOARD =====================

	useEffect(() => {
		let alive = true;

		async function loadTickets() {
			setLoading(true);

			try {
				const dashboard = await getTicketsDashboard();

				if (!alive) return;

				setStats(dashboard.stats);
				setPeriods(dashboard.periods);

				setPendingTickets(
					Array.isArray(dashboard.tickets) ? dashboard.tickets : [],
				);
			} catch (error) {
				if (!alive) return;

				console.error("Error al cargar el dashboard de tickets:", error);

				setStats(INITIAL_TICKET_STATS);

				setPeriods(INITIAL_DASHBOARD_PERIODS);

				setPendingTickets([]);
			} finally {
				if (alive) {
					setLoading(false);
				}
			}
		}

		async function loadMonitoreos() {
			setMonLoading(true);

			try {
				const dashboard = await getMonitoreosDashboard();

				if (!alive) return;

				setMonStats(dashboard.stats);

				setPendingMonitoreos((previousList) =>
					mergePendingMonitoreos(dashboard.monitoreos, previousList),
				);
			} catch (error) {
				if (!alive) return;

				console.error("Error al cargar el dashboard de monitoreos:", error);

				setMonStats(INITIAL_MONITOREO_STATS);

				setPendingMonitoreos([]);
			} finally {
				if (alive) {
					setMonLoading(false);
				}
			}
		}

		Promise.allSettled([loadTickets(), loadMonitoreos()]);

		return () => {
			alive = false;
		};
	}, []);

	// ===================== CARGA GRÁFICA MONITOREOS =====================

	useEffect(() => {
		let alive = true;

		async function loadMonitoreoChart() {
			if (!selectedMonitoreoWeekStart) {
				setMonitoreoWeeklyChart([]);
				setMonitoreoChartLoading(false);
				return;
			}

			setMonitoreoChartLoading(true);

			try {
				const chart = await getWeeklyChart({
					endpoint: MONITOREO_CHART_ENDPOINT,
					weekStart: selectedMonitoreoWeekStart,
				});

				if (!alive) return;

				setMonitoreoWeeklyChart(chart);
			} catch (error) {
				if (!alive) return;

				console.error(
					"Error al cargar la gráfica semanal de monitoreos:",
					error,
				);

				setMonitoreoWeeklyChart([]);
			} finally {
				if (alive) {
					setMonitoreoChartLoading(false);
				}
			}
		}

		loadMonitoreoChart();

		return () => {
			alive = false;
		};
	}, [selectedMonitoreoWeekStart]);
	// ===================== CARGA GRÁFICA TICKETS =====================

	useEffect(() => {
		let alive = true;

		async function loadTicketChart() {
			if (!selectedTicketWeekStart) {
				setTicketWeeklyChart([]);
				setTicketChartLoading(false);
				return;
			}

			setTicketChartLoading(true);

			try {
				const chart = await getWeeklyChart({
					endpoint: TICKET_CHART_ENDPOINT,
					weekStart: selectedTicketWeekStart,
				});

				if (!alive) return;

				setTicketWeeklyChart(chart);
			} catch (error) {
				if (!alive) return;

				console.error("Error al cargar la gráfica semanal de tickets:", error);

				setTicketWeeklyChart([]);
			} finally {
				if (alive) {
					setTicketChartLoading(false);
				}
			}
		}

		loadTicketChart();

		return () => {
			alive = false;
		};
	}, [selectedTicketWeekStart]);

	// ===================== REFRESCAR DASHBOARDS =====================

	async function refreshTicketsDash() {
		const dashboard = await getTicketsDashboard();

		setStats(dashboard.stats);
		setPeriods(dashboard.periods);

		if (Array.isArray(dashboard.tickets)) {
			setPendingTickets(dashboard.tickets);
		}
	}

	async function refreshMonitoreosDash() {
		const dashboard = await getMonitoreosDashboard();

		setMonStats(dashboard.stats);

		setPendingMonitoreos((previousList) =>
			mergePendingMonitoreos(dashboard.monitoreos, previousList),
		);
	}

	async function refreshTicketChart() {
		if (!selectedTicketWeekStart) return;

		try {
			const chart = await getWeeklyChart({
				endpoint: TICKET_CHART_ENDPOINT,
				weekStart: selectedTicketWeekStart,
			});

			setTicketWeeklyChart(chart);
		} catch (error) {
			console.error("Error al refrescar la gráfica semanal de tickets:", error);
		}
	}

	async function refreshMonitoreoChart() {
		if (!selectedMonitoreoWeekStart) return;

		try {
			const chart = await getWeeklyChart({
				endpoint: MONITOREO_CHART_ENDPOINT,
				weekStart: selectedMonitoreoWeekStart,
			});

			setMonitoreoWeeklyChart(chart);
		} catch (error) {
			console.error(
				"Error al refrescar la gráfica semanal de monitoreos:",
				error,
			);
		}
	}
	// ===================== ACCIONES DE TICKETS =====================

	async function onToggleTicketStatus(id, currentStatus) {
		const nextStatus = Number(currentStatus) === 1 ? 3 : 1;

		setStatusLoadingId(id);

		try {
			const { data } = await privateInstance.patch(
				`/operaciones/tickets/${id}/status`,
				{
					status: nextStatus,
				},
			);

			if (data?.data?.id) {
				setPendingTickets((previousTickets) =>
					updateRecordById(previousTickets, data.data),
				);
			}

			await Promise.allSettled([refreshTicketsDash(), refreshTicketChart()]);
		} catch (error) {
			console.error("Error al cambiar el estado del ticket:", error);
		} finally {
			setStatusLoadingId(null);
		}
	}

	async function onCloseTicket(id) {
		setStatusLoadingId(id);

		try {
			const { data } = await privateInstance.patch(
				`/operaciones/tickets/${id}/close`,
				{
					status: 2,
				},
			);

			if (data?.data?.id) {
				setPendingTickets((previousTickets) =>
					updateRecordById(previousTickets, data.data).filter((ticket) =>
						[1, 3].includes(Number(ticket.status)),
					),
				);
			}

			await Promise.allSettled([refreshTicketsDash(), refreshTicketChart()]);
		} catch (error) {
			console.error("Error al concluir el ticket:", error);
		} finally {
			setStatusLoadingId(null);
		}
	}

	// ===================== ACCIONES DE MONITOREOS =====================

	async function onToggleMonitoreoStatus(id, currentConcluido) {
		const nextStatus = Number(currentConcluido) === 1 ? 3 : 1;

		setMonStatusLoadingId(id);

		try {
			const { data } = await privateInstance.patch(
				`/operaciones/monitoreos/${id}/status`,
				{
					concluido: nextStatus,
				},
			);

			if (data?.data?.id) {
				setPendingMonitoreos((previousMonitoreos) =>
					updateRecordById(previousMonitoreos, data.data),
				);
			}

			await Promise.allSettled([
				refreshMonitoreosDash(),
				refreshMonitoreoChart(),
			]);
		} catch (error) {
			console.error("Error al cambiar el estado del monitoreo:", error);
		} finally {
			setMonStatusLoadingId(null);
		}
	}

	const greeting = getGreeting();

	return (
		<div className="w-full h-full min-h-full p-4 sm:p-6 bg-slate-50 dark:bg-slate-950">
			<div className="w-full h-full min-h-full mx-auto">
				<div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
							{greeting}, {user?.name ?? "Usuario"}
						</h1>

						<p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
							Resumen de actividades y pendientes
						</p>
					</div>
				</div>

				{/* ===================== RESUMEN SEMANAL ===================== */}

				<SectionCard
					accent="indigo"
					title="Resumen semanal"
					subtitle={periods.week}
				>
					<KpiGroup label="Monitoreos">
						{MONITOREO_WEEKLY_KPIS.map(({ key, title, accent, Icon }) => (
							<KpiCard
								key={key}
								icon={<Icon />}
								accent={accent}
								title={title}
								value={monStats[key]}
								subtitle={periods.week}
							/>
						))}
					</KpiGroup>

					<KpiGroup label="Tickets">
						{TICKET_KPIS.map(({ key, title, accent, Icon }) => (
							<KpiCard
								key={key}
								icon={<Icon />}
								accent={accent}
								title={title}
								value={stats[`${key}_week`]}
								subtitle={periods.week}
							/>
						))}
					</KpiGroup>

					<div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
						<WeeklyBarChart
							title="Monitoreos por día"
							subtitle={
								selectedMonitoreoWeek?.subtitleLabel ?? "Sin periodo disponible"
							}
							data={monitoreoWeeklyChart}
							series={["created", "concluded", "annulled"]}
							loading={monitoreoChartLoading}
							headerAction={
								availableWeeks.length > 0 ? (
									<WeekFilter
										id="monitoreos-week-filter"
										weeks={availableWeeks}
										value={selectedMonitoreoWeekId}
										onChange={setSelectedMonitoreoWeekId}
										disabled={monitoreoChartLoading}
									/>
								) : null
							}
						/>

						<WeeklyBarChart
							title="Tickets por día"
							subtitle={selectedTicketWeek?.subtitleLabel ?? "Sin periodo disponible"}
							data={ticketWeeklyChart}
							series={["created", "updated", "concluded", "annulled"]}
							loading={ticketChartLoading}
							headerAction={
								availableWeeks.length > 0 ? (
									<WeekFilter
										id="tickets-week-filter"
										weeks={availableWeeks}
										value={selectedTicketWeekId}
										onChange={setSelectedTicketWeekId}
										disabled={ticketChartLoading}
									/>
								) : null
							}
						/>
					</div>
				</SectionCard>

				{/* ===================== RESUMEN MENSUAL ===================== */}

				<SectionCard
					accent="teal"
					title="Resumen mensual"
					subtitle={periods.month}
					className="mt-6"
				>
					<KpiGroup label="Monitoreos">
						{MONITOREO_MONTHLY_KPIS.map(({ key, title, accent, Icon }) => (
							<KpiCard
								key={key}
								icon={<Icon />}
								accent={accent}
								title={title}
								value={monStats[key]}
								subtitle={periods.month}
							/>
						))}
					</KpiGroup>

					<KpiGroup label="Tickets">
						{TICKET_KPIS.map(({ key, title, accent, Icon }) => (
							<KpiCard
								key={key}
								icon={<Icon />}
								accent={accent}
								title={title}
								value={stats[`${key}_month`]}
								subtitle={periods.month}
							/>
						))}
					</KpiGroup>
				</SectionCard>

				{/* ===================== TICKETS PENDIENTES ===================== */}

				<SectionCard
					accent="indigo"
					title="Tickets pendientes"
					subtitle="Tickets asignados pendientes de cierre"
					className="mt-6"
				>
					<TableBlock
						emptyLabel={loading ? "Cargando…" : "Sin tickets pendientes"}
						columns={TICKET_COLUMNS}
						hideOnMobile={[false, false, true, false, false]}
					>
						{pendingTickets.map((ticket) => {
							const status = Number(ticket.status);

							return (
								<tr
									key={ticket.id}
									className="text-slate-700 transition-colors hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800/40"
								>
									<td className="px-4 py-3 font-medium tabular-nums">
										{ticket.numTicket}
									</td>

									<td className="px-4 py-3">{ticket.titleTicket}</td>

									<td className="hidden px-4 py-3 text-slate-500 dark:text-slate-400 md:table-cell">
										{formatDateTime(ticket.created_at)}
									</td>

									<td className="px-4 py-3 whitespace-nowrap">
										<StatusBadge status={status} />
									</td>

									<td className="px-4 py-3">
										<div className="flex items-center justify-center gap-2">
											<IconShowNot />

											{(status === 1 || status === 3) && (
												<ToggleUserStatusButtonNot
													active={status === 1}
													label={status === 1 ? "Anular" : "Reactivar"}
													loading={statusLoadingId === ticket.id}
													onToggle={() =>
														onToggleTicketStatus(ticket.id, ticket.status)
													}
												/>
											)}

											{status === 1 && (
												<button
													type="button"
													onClick={() => onCloseTicket(ticket.id)}
													disabled={statusLoadingId === ticket.id}
													className="
															rounded-lg
															bg-blue-600
															px-3
															py-2
															text-xs
															font-medium
															text-white
															transition
															hover:bg-blue-700
															active:bg-blue-800
															disabled:cursor-not-allowed
															disabled:opacity-60
															focus-visible:outline-none
															focus-visible:ring-2
															focus-visible:ring-blue-500
															focus-visible:ring-offset-2
															dark:focus-visible:ring-offset-slate-900
														"
												>
													Concluir
												</button>
											)}
										</div>
									</td>
								</tr>
							);
						})}
					</TableBlock>
				</SectionCard>

				{/* ===================== MONITOREOS PENDIENTES ===================== */}

				<SectionCard
					accent="teal"
					title="Monitoreos pendientes"
					subtitle="Monitoreos activos pendientes de atención"
					className="mt-6"
				>
					<TableBlock
						emptyLabel={monLoading ? "Cargando…" : "Sin monitoreos pendientes"}
						columns={MONITOREO_COLUMNS}
						hideOnMobile={[false, false, false, false, false]}
					>
						{pendingMonitoreos.map((monitoreo) => {
							const status = Number(monitoreo.concluido);

							return (
								<tr
									key={monitoreo.id}
									className="text-slate-700 transition-colors hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800/40"
								>
									<td className="px-4 py-3 font-medium tabular-nums">
										{monitoreo.id}
									</td>

									<td className="px-4 py-3">
										{monitoreo.client_label ?? monitoreo.siteApp_name ?? "—"}
									</td>

									<td className="px-4 py-3 text-slate-500 dark:text-slate-400">
										{monitoreo.created_at
											? formatDateTime(monitoreo.created_at)
											: "—"}
									</td>

									<td className="px-4 py-3 whitespace-nowrap">
										<StatusBadge
											status={status}
											label={monitoreo.concluido_label}
										/>
									</td>

									<td className="px-4 py-3">
										<div className="flex items-center justify-center gap-2">
											<IconShowNot />

											{(status === 1 || status === 3) && (
												<ToggleUserStatusButtonNot
													active={status === 1}
													label={status === 1 ? "Anular" : "Reactivar"}
													loading={monStatusLoadingId === monitoreo.id}
													onToggle={() =>
														onToggleMonitoreoStatus(
															monitoreo.id,
															monitoreo.concluido,
														)
													}
												/>
											)}
										</div>
									</td>
								</tr>
							);
						})}
					</TableBlock>
				</SectionCard>
			</div>
		</div>
	);
}
