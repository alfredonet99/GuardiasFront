import { useEffect, useState } from "react";
import { privateInstance } from "../../api/axios";
import IconShowNot from "../../components/icons/Crud/ShowNot";
import ToggleUserStatusButtonNot from "../../components/UI/Active/BtnActiveNot";
import { formatDateTime } from "../../utils/date";

const STATUS_LABEL = {
	1: "Abierto",
	2: "Concluido",
	3: "Anulado",
};

function statusLabel(v) {
	const n = Number(v);
	return STATUS_LABEL[n] ?? String(v ?? "");
}

// ✅ NUEVO: merge para no “perder” anulados cuando el backend no los devuelve
function mergePendingMonitoreos(serverList = [], prevList = []) {
	const byId = new Map();

	// 1) lo que venga del backend (normalmente concluidos=1)
	for (const item of serverList) byId.set(Number(item.id), item);

	// 2) conservar anulados existentes (concluido=3) aunque el backend no los mande
	for (const item of prevList) {
		const id = Number(item.id);
		const st = Number(item.concluido);
		if (st === 3 && !byId.has(id)) {
			byId.set(id, item);
		}
	}

	// 3) orden: primero backend, luego anulados que estaban
	const serverIds = new Set(serverList.map((x) => Number(x.id)));
	const merged = [];

	for (const item of serverList) merged.push(item);

	for (const item of prevList) {
		const id = Number(item.id);
		const st = Number(item.concluido);
		if (st === 3 && !serverIds.has(id)) merged.push(item);
	}

	// fallback: si algo quedó fuera, lo agregamos (seguridad)
	const mergedIds = new Set(merged.map((x) => Number(x.id)));
	for (const [id, item] of byId.entries()) {
		if (!mergedIds.has(id)) merged.push(item);
	}

	return merged;
}

export default function OperacionesDash() {
	// ===================== TICKETS =====================
	const [stats, setStats] = useState({
		pending_week: "—",
		created_week: "—",
		total_created: "—",
		total_concluded: "—",
		total_annulled: "—",
	});
	const [pendingTickets, setPendingTickets] = useState([]);
	const [loading, setLoading] = useState(true);
	const [statusLoadingId, setStatusLoadingId] = useState(null);

	// ===================== MONITOREOS =====================
	const [monStats, setMonStats] = useState({
		pending_all: "—",
		done_today_user: "—",
		total_month_user: "—",
		concluded_month_user: "—",
		annulled_month_user: "—",
	});
	const [pendingMonitoreos, setPendingMonitoreos] = useState([]);
	const [monLoading, setMonLoading] = useState(true);
	const [monStatusLoadingId, setMonStatusLoadingId] = useState(null);

	useEffect(() => {
		let alive = true;

		(async () => {
			// ============ TICKETS DASH ============
			try {
				setLoading(true);
				const res = await privateInstance.get("/operaciones/tickets/dashboard");
				const c = res.data?.counts;

				if (!alive) return;

				setStats({
					pending_week: c?.pending_week ?? 0,
					created_week: c?.created_week ?? 0,
					total_created: c?.total_created ?? 0,
					total_concluded: c?.total_concluded ?? 0,
					total_annulled: c?.total_annulled ?? 0,
				});

				setPendingTickets(
					Array.isArray(res.data?.pending_tickets)
						? res.data.pending_tickets
						: [],
				);
			} catch {
				if (!alive) return;
				setStats({
					pending_week: "—",
					created_week: "—",
					total_created: "—",
					total_concluded: "—",
					total_annulled: "—",
				});
				setPendingTickets([]);
			} finally {
				if (!alive) return;
				setLoading(false);
			}

			// ============ MONITOREOS DASH ============
			try {
				setMonLoading(true);
				const resMon = await privateInstance.get(
					"/operaciones/monitoreos/dashboard",
				);
				const cM = resMon.data?.counts;

				if (!alive) return;

				setMonStats({
					pending_all: cM?.pending_all ?? 0,
					done_today_user: cM?.done_today_user ?? 0,
					total_month_user: cM?.total_month_user ?? 0,
					concluded_month_user: cM?.concluded_month_user ?? 0,
					annulled_month_user: cM?.annulled_month_user ?? 0,
				});

				const serverList = Array.isArray(resMon.data?.pending_monitoreos)
					? resMon.data.pending_monitoreos
					: [];

				// ✅ Importante: en carga inicial no hay prev, pero dejamos el merge igual por consistencia
				setPendingMonitoreos((prev) =>
					mergePendingMonitoreos(serverList, prev),
				);
			} catch {
				if (!alive) return;
				setMonStats({
					pending_all: "—",
					done_today_user: "—",
					total_month_user: "—",
					concluded_month_user: "—",
					annulled_month_user: "—",
				});
				setPendingMonitoreos([]);
			} finally {
				if (!alive) return;
				setMonLoading(false);
			}
		})();

		return () => {
			alive = false;
		};
	}, []);

	// ===================== HELPERS: REFRESH =====================
	async function refreshTicketsDash() {
		const dash = await privateInstance.get("/operaciones/tickets/dashboard");
		const c = dash.data?.counts;

		setStats({
			pending_week: c?.pending_week ?? 0,
			created_week: c?.created_week ?? 0,
			total_created: c?.total_created ?? 0,
			total_concluded: c?.total_concluded ?? 0,
			total_annulled: c?.total_annulled ?? 0,
		});

		if (Array.isArray(dash.data?.pending_tickets)) {
			setPendingTickets(dash.data.pending_tickets);
		}
	}

	async function refreshMonitoreosDash() {
		const dash = await privateInstance.get("/operaciones/monitoreos/dashboard");
		const c = dash.data?.counts;

		setMonStats({
			pending_all: c?.pending_all ?? 0,
			done_today_user: c?.done_today_user ?? 0,
			total_month_user: c?.total_month_user ?? 0,
			concluded_month_user: c?.concluded_month_user ?? 0,
			annulled_month_user: c?.annulled_month_user ?? 0,
		});

		const serverList = Array.isArray(dash.data?.pending_monitoreos)
			? dash.data.pending_monitoreos
			: [];

		// ✅ CLAVE: no pisar anulados existentes si el backend no los manda
		setPendingMonitoreos((prev) => mergePendingMonitoreos(serverList, prev));
	}

	// ===================== TICKETS ACTIONS =====================
	async function onToggleTicketStatus(id, currentStatus) {
		const curr = Number(currentStatus);
		const nextStatus = curr === 1 ? 3 : 1;

		setStatusLoadingId(id);

		try {
			const res = await privateInstance.patch(
				`/operaciones/tickets/${id}/status`,
				{
					status: nextStatus,
				},
			);

			const updated = res.data?.data;

			// (no toco tu lógica de tickets)
			if (updated?.id) {
				setPendingTickets((prev) =>
					prev.map((t) =>
						Number(t.id) === Number(updated.id) ? { ...t, ...updated } : t,
					),
				);
			}

			await refreshTicketsDash();
		} catch {
			// opcional: toast
		} finally {
			setStatusLoadingId(null);
		}
	}

	async function onCloseTicket(id) {
		setStatusLoadingId(id);

		try {
			const res = await privateInstance.patch(
				`/operaciones/tickets/${id}/close`,
				{
					status: 2,
				},
			);

			const updated = res.data?.data;

			if (updated?.id) {
				setPendingTickets((prev) =>
					prev
						.map((t) =>
							Number(t.id) === Number(updated.id) ? { ...t, ...updated } : t,
						)
						.filter((t) => {
							const st = Number(t.status);
							return st === 1 || st === 3;
						}),
				);
			}

			await refreshTicketsDash();
		} catch {
			// opcional: toast
		} finally {
			setStatusLoadingId(null);
		}
	}

	// ===================== MONITOREOS ACTIONS =====================
	async function onToggleMonitoreoStatus(id, currentConcluido) {
		const curr = Number(currentConcluido);
		const next = curr === 1 ? 3 : 1; // 1 ⇄ 3

		setMonStatusLoadingId(id);

		try {
			const res = await privateInstance.patch(
				`/operaciones/monitoreos/${id}/status`,
				{ concluido: next },
			);

			const updated = res.data?.data;

			// ✅ actualiza local inmediatamente (no desaparece)
			if (updated?.id) {
				setPendingMonitoreos((prev) =>
					prev.map((m) =>
						Number(m.id) === Number(updated.id) ? { ...m, ...updated } : m,
					),
				);
			}

			// ✅ refresca sin “perder” anulados
			await refreshMonitoreosDash();
		} catch {
			// opcional: toast
		} finally {
			setMonStatusLoadingId(null);
		}
	}

	return (
		<div className="w-full h-full min-h-full p-4 sm:p-6 bg-slate-50 dark:bg-slate-950">
			<div className="w-full h-full min-h-full">
				<div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
							Operaciones Stratosphere
						</h1>
						<p className="text-sm text-slate-600 dark:text-slate-400">
							Resumen de Actividades
						</p>
					</div>
				</div>

				{/* ===================== TICKETS ===================== */}
				<section className="w-full">
					<div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
						<div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
							<div>
								<h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
									Tickets
								</h2>
								<p className="text-sm text-slate-600 dark:text-slate-400">
									Seguimiento, pendientes y actividad reciente
								</p>
							</div>
						</div>

						<div className="p-5">
							<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
								<KpiCard
									title="Tickets Pendientes Esta Semana"
									value={stats.pending_week}
									subtitle={
										loading ? "Cargando…" : "Sin cerrar (semana actual)"
									}
								/>
								<KpiCard
									title="Tickets Creados Esta Semana"
									value={stats.created_week}
									subtitle={loading ? "Cargando…" : "Creados (semana actual)"}
								/>
								<KpiCard
									title="Total de Tickets Creados"
									value={stats.total_created}
									subtitle={loading ? "Cargando…" : "Histórico"}
								/>
								<KpiCard
									title="Total de Tickets Concluidos"
									value={stats.total_concluded}
									subtitle={loading ? "Cargando…" : "Mes actual"}
								/>
								<KpiCard
									title="Total de Tickets Anulados"
									value={stats.total_annulled}
									subtitle={loading ? "Cargando…" : "Histórico"}
								/>
							</div>

							<div className="mt-6">
								<h3 className="text-sm font-semibold tracking-wide text-slate-900 dark:text-slate-100">
									TICKETS PENDIENTES DE CIERRE
								</h3>

								<div className="mt-3 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
									<div className="overflow-x-auto">
										<table className="w-full text-sm">
											<thead className="bg-slate-50 dark:bg-slate-800/40">
												<tr className="text-left text-xs font-semibold text-slate-600 dark:text-slate-300">
													<th className="px-4 py-3">Ticket</th>
													<th className="px-4 py-3">Titulo</th>
													<th className="px-4 py-3">Creado El</th>
													<th className="px-4 py-3">Status</th>
													<th className="px-4 py-3 text-center">Acciones</th>
												</tr>
											</thead>

											<tbody className="divide-y divide-slate-200 dark:divide-slate-800">
												{pendingTickets.length === 0 ? (
													<tr>
														<td
															colSpan={5}
															className="px-4 py-6 text-center text-slate-500 dark:text-slate-400"
														>
															{loading ? "Cargando…" : "Sin tickets pendientes"}
														</td>
													</tr>
												) : (
													pendingTickets.map((t) => {
														const st = Number(t.status);

														return (
															<tr
																key={t.id}
																className="text-slate-700 dark:text-slate-200"
															>
																<td className="px-4 py-3">{t.numTicket}</td>
																<td className="px-4 py-3">{t.titleTicket}</td>
																<td className="px-4 py-3">
																	{formatDateTime(t.created_at)}
																</td>

																<td className="px-4 py-3 whitespace-nowrap">
																	<span
																		className={`px-3 py-1 rounded-full text-xs font-medium border ${
																			st === 1
																				? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800"
																				: st === 2
																					? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
																					: "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700"
																		}`}
																	>
																		{statusLabel(st)}
																	</span>
																</td>

																<td className="px-4 py-3">
																	<div className="flex items-center justify-center gap-2">
																		<IconShowNot />

																		{(st === 1 || st === 3) && (
																			<ToggleUserStatusButtonNot
																				active={st === 1}
																				label={
																					st === 1 ? "Anular" : "Reactivar"
																				}
																				loading={statusLoadingId === t.id}
																				onToggle={() =>
																					onToggleTicketStatus(t.id, t.status)
																				}
																			/>
																		)}

																		{st === 1 && (
																			<button
																				type="button"
																				onClick={() => onCloseTicket(t.id)}
																				disabled={statusLoadingId === t.id}
																				className={`
																					text-xs font-medium px-3 py-2 rounded-lg
																					bg-blue-500 text-white
																					hover:bg-blue-800
																					disabled:opacity-60 disabled:cursor-not-allowed
																					focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2
																					dark:focus-visible:ring-offset-slate-900
																					active:bg-blue-500
																					transition
																				`}
																			>
																				Concluir
																			</button>
																		)}
																	</div>
																</td>
															</tr>
														);
													})
												)}
											</tbody>
										</table>
									</div>
								</div>
							</div>
						</div>
					</div>
				</section>

				{/* ===================== MONITOREOS ===================== */}
				<section className="w-full mt-6">
					<div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
						<div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
							<div>
								<h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
									Monitoreos
								</h2>
								<p className="text-sm text-slate-600 dark:text-slate-400">
									Estado y seguimiento de monitoreos
								</p>
							</div>
						</div>

						<div className="p-5">
							<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
								<KpiCard
									title="Monitoreos Activos"
									value={monStats.pending_all}
									subtitle={monLoading ? "Cargando…" : "Pendientes (global)"}
								/>
								<KpiCard
									title="Monitoreos del Día"
									value={monStats.done_today_user}
									subtitle={
										monLoading ? "Cargando…" : "Concluidos por ti (hoy)"
									}
								/>
								<KpiCard
									title="Total de Monitoreos"
									value={monStats.total_month_user}
									subtitle={
										monLoading ? "Cargando…" : "Creados por ti (mes actual)"
									}
								/>
								<KpiCard
									title="Monitoreos Concluidos"
									value={monStats.concluded_month_user}
									subtitle={
										monLoading ? "Cargando…" : "Concluidos por ti (mes actual)"
									}
								/>
								<KpiCard
									title="Monitoreos Anulados"
									value={monStats.annulled_month_user}
									subtitle={
										monLoading ? "Cargando…" : "Anulados por ti (mes actual)"
									}
								/>
							</div>

							<div className="mt-6">
								<h3 className="text-sm font-semibold tracking-wide text-slate-900 dark:text-slate-100">
									MONITOREOS PENDIENTES
								</h3>

								<div className="mt-3 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
									<div className="overflow-x-auto">
										<table className="w-full text-sm">
											<thead className="bg-slate-50 dark:bg-slate-800/40">
												<tr className="text-left text-xs font-semibold text-slate-600 dark:text-slate-300">
													<th className="px-4 py-3">Monitoreo</th>
													<th className="px-4 py-3">Titulo</th>
													<th className="px-4 py-3">Creado El</th>
													<th className="px-4 py-3">Status</th>
													<th className="px-4 py-3 text-center">Acciones</th>
												</tr>
											</thead>

											<tbody className="divide-y divide-slate-200 dark:divide-slate-800">
												{pendingMonitoreos.length === 0 ? (
													<tr>
														<td
															colSpan={5}
															className="px-4 py-6 text-center text-slate-500 dark:text-slate-400"
														>
															{monLoading
																? "Cargando…"
																: "Sin monitoreos pendientes"}
														</td>
													</tr>
												) : (
													pendingMonitoreos.map((m) => {
														const st = Number(m.concluido);

														return (
															<tr
																key={m.id}
																className="text-slate-700 dark:text-slate-200"
															>
																<td className="px-4 py-3">{m.id}</td>

																<td className="px-4 py-3">
																	{m.client_label ?? m.siteApp_name ?? "—"}
																</td>

																<td className="px-4 py-3">
																	{m.created_at
																		? formatDateTime(m.created_at)
																		: "—"}
																</td>

																<td className="px-4 py-3 whitespace-nowrap">
																	<span
																		className={`px-3 py-1 rounded-full text-xs font-medium border ${
																			st === 1
																				? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800"
																				: st === 2
																					? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
																					: "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700"
																		}`}
																	>
																		{m.concluido_label ?? statusLabel(st)}
																	</span>
																</td>

																<td className="px-4 py-3">
																	<div className="flex items-center justify-center gap-2">
																		<IconShowNot />

																		{/* ✅ Igual que tickets: anulado se queda y ofrece reactivar */}
																		{(st === 1 || st === 3) && (
																			<ToggleUserStatusButtonNot
																				active={st === 1}
																				label={
																					st === 1 ? "Anular" : "Reactivar"
																				}
																				loading={monStatusLoadingId === m.id}
																				onToggle={() =>
																					onToggleMonitoreoStatus(
																						m.id,
																						m.concluido,
																					)
																				}
																			/>
																		)}
																	</div>
																</td>
															</tr>
														);
													})
												)}
											</tbody>
										</table>
									</div>
								</div>
							</div>
						</div>
					</div>
				</section>
			</div>
		</div>
	);
}

function KpiCard({ title, value, subtitle }) {
	return (
		<div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
			<div className="text-xs text-slate-500 dark:text-slate-400">{title}</div>
			<div className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">
				{value}
			</div>
			<div className="mt-1 text-xs text-slate-600 dark:text-slate-400">
				{subtitle}
			</div>
		</div>
	);
}
