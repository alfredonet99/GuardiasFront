// components/UI/GuardiasClose/Resumen/ResumeGuard.jsx
import { useEffect, useMemo, useState } from "react";
import { formatDateTime } from "../../../utils/date";

// ✅ helpers VEEAM
function normalizeGroupName(it) {
	const rawName = it?.veeam_name ?? it?.siteApp_name ?? "";
	const name = String(rawName).trim();

	if (name) return name;

	const id = it?.veeam_id ?? it?.siteApp ?? null;

	if (id != null && String(id).trim() !== "") {
		return `VEEAM #${String(id).trim()}`;
	}

	return "VEEAM (sin nombre)";
}

function groupByVeeamName(items = []) {
	const map = new Map();

	for (const it of items) {
		const name = normalizeGroupName(it);
		map.set(name, (map.get(name) ?? 0) + 1);
	}

	return Array.from(map.entries())
		.map(([name, count]) => ({ name, count }))
		.sort((a, b) => b.count - a.count);
}

function formatDateOnly(value) {
	if (!value) return "—";

	try {
		const d = value instanceof Date ? value : new Date(value);
		if (Number.isNaN(d.getTime())) return String(value);

		return new Intl.DateTimeFormat("es-MX", {
			day: "2-digit",
			month: "2-digit",
			year: "numeric",
		}).format(d);
	} catch {
		return String(value);
	}
}

/**
 * ✅ labels locales
 */
const STATUS_VEEAM = {
	1: "Completado Exitoso - Backup finalizado sin errores",
	2: "Completado con Advertencias - Backup terminado pero con observaciones menores",
	3: "Fallido - Backup no se completó correctamente",
	4: "En Progreso - Backup actualmente en ejecución",
	5: "Pausado - Backup detenido temporalmente",
	6: "Pendiente - Programado pero no iniciado",
};

const STATUS_MONIT = {
	1: "Abierto",
	2: "Concluido",
	3: "Anulado",
};

function veeamLabel(v) {
	const k = String(v ?? "").trim();
	return STATUS_VEEAM[k] ?? (k || "—");
}

function monitLabel(v) {
	const k = String(v ?? "").trim();
	return STATUS_MONIT[k] ?? (k || "—");
}

function clientDisplay(r) {
	const num = String(r?.numCV ?? "").trim();
	const name = String(r?.nameCV ?? "").trim();
	const label = String(r?.client_label ?? "").trim();

	if (num && name) return `${num} - ${name}`;
	if (label) return label;
	if (num) return num;
	if (name) return name;

	return "—";
}

// ✅ Ticket helpers
function ticketId(t) {
	return t?.id ?? t?.local_id ?? "—";
}

function ticketNum(t) {
	const a = String(t?.numTicket ?? "").trim();
	const b = String(t?.numTicketNoct ?? "").trim();

	if (a && b) return `${a} / ${b}`;
	if (a) return a;
	if (b) return b;

	return "—";
}

function ticketTitle(t) {
	return String(t?.titleTicket ?? t?.title ?? "").trim() || "—";
}

function ticketStatusLabel(t) {
	const s = Number(t?.status ?? 1);
	return s === 2 ? "Concluido" : "Pendiente";
}

// ✅ pequeño chip reutilizable
function Chip({ label, value, tone = "slate" }) {
	const toneClass =
		tone === "emerald"
			? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-900"
			: tone === "amber"
				? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-900"
				: "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:border-slate-800";

	return (
		<span
			className={[
				"inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border",
				toneClass,
			].join(" ")}
		>
			<span className="opacity-80">{label}:</span>
			<span className="font-bold">{value}</span>
		</span>
	);
}

function VeeamRowsTable({
	rows = [],
	emptyMessage = "Sin datos para mostrar.",
}) {
	return (
		<div className="mt-2 overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
			<table className="min-w-full text-left">
				<thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase text-sm">
					<tr>
						<th className="px-4 py-2 whitespace-nowrap">CLIENTE</th>
						<th className="px-4 py-2 whitespace-nowrap">SITE</th>
						<th className="px-4 py-2 whitespace-nowrap">BACKUP</th>
						<th className="px-4 py-2 whitespace-nowrap">
							FECHA DE RESTAURACIÓN
						</th>
						<th className="px-4 py-2 whitespace-nowrap">ESTATUS VEEAM</th>
						<th className="px-4 py-2 whitespace-nowrap">OBSERVACIÓN</th>
					</tr>
				</thead>

				<tbody className="divide-y divide-slate-200 dark:divide-slate-800">
					{rows.length === 0 ? (
						<tr>
							<td
								colSpan={8}
								className="px-4 py-4 text-sm text-slate-600 dark:text-slate-400"
							>
								{emptyMessage}
							</td>
						</tr>
					) : (
						rows.map((r, idx) => (
							<tr key={String(r?.numCV || r?.client_label || idx)}>
								<td className="px-4 py-2 text-sm whitespace-nowrap">
									{clientDisplay(r)}
								</td>

								<td className="px-4 py-2 text-sm whitespace-nowrap">
									{r?.veeam_name || r?.site || "—"}
								</td>

								<td className="px-4 py-2 text-sm whitespace-nowrap">
									{r?.backup ?? "—"}
								</td>

								<td className="px-4 py-2 text-sm whitespace-nowrap">
									{formatDateOnly(r?.last_restore_date)}
								</td>

								<td className="px-4 py-2 text-sm whitespace-nowrap">
									{veeamLabel(r?.estatus_veeam ?? r?.estatus)}
								</td>

								<td className="px-4 py-2 text-sm">{r?.observacion ?? "—"}</td>
							</tr>
						))
					)}
				</tbody>
			</table>
		</div>
	);
}

export default function ResumeGuard({
	guardia,

	// ✅ Monitoreos
	selectedOkItemsVeeam = [],
	pendingVeeamRows = [],

	// ✅ Tickets
	ticketsPending = [],
	ticketsConcludedByUser = {},
	ticketsCounters = null,

	submitting = false,
	isBusy = false,

	onBack = null,
	onClose = null,
}) {
	const okItems = Array.isArray(selectedOkItemsVeeam)
		? selectedOkItemsVeeam
		: [];

	const pendingRows = Array.isArray(pendingVeeamRows) ? pendingVeeamRows : [];

	const totalOk = okItems.length;

	const groups = useMemo(() => groupByVeeamName(okItems), [okItems]);

	// ✅ reloj en vivo
	const [now, setNow] = useState(new Date());

	useEffect(() => {
		const id = setInterval(() => setNow(new Date()), 60000);
		return () => clearInterval(id);
	}, []);

	// ✅ separación de monitoreos VEEAM para resumen
	const monitoreoGroups = useMemo(() => {
		const closedInGuard = [];
		const pendingUpdatedInGuard = [];
		const unchangedOrNewInGuard = [];

		for (const r of pendingRows) {
			const category = String(r?.guard_category ?? "").trim();

			if (category === "closed_in_guard") {
				closedInGuard.push(r);
				continue;
			}

			if (category === "pending_updated_in_guard") {
				pendingUpdatedInGuard.push(r);
				continue;
			}

			unchangedOrNewInGuard.push(r);
		}

		return {
			closedInGuard,
			pendingUpdatedInGuard,
			unchangedOrNewInGuard,
		};
	}, [pendingRows]);

	const pendingCounters = useMemo(() => {
		return {
			total: pendingRows.length,
			cerrados: monitoreoGroups.closedInGuard.length,
			actualizadosPendientes: monitoreoGroups.pendingUpdatedInGuard.length,
			sinCambiosONuevos: monitoreoGroups.unchangedOrNewInGuard.length,
		};
	}, [pendingRows, monitoreoGroups]);

	// ✅ normaliza tickets props
	const tPending = Array.isArray(ticketsPending) ? ticketsPending : [];

	const tConcludedByUser =
		ticketsConcludedByUser && typeof ticketsConcludedByUser === "object"
			? ticketsConcludedByUser
			: {};

	const tCounters = useMemo(() => {
		if (ticketsCounters && typeof ticketsCounters === "object") {
			return ticketsCounters;
		}

		let concluded = 0;
		const pending = tPending.length;

		for (const arr of Object.values(tConcludedByUser)) {
			concluded += Array.isArray(arr) ? arr.length : 0;
		}

		return {
			total: pending + concluded,
			pending,
			concluded,
			newTickets: tPending.filter((t) => !t?.id && !!t?.local_id).length,
		};
	}, [ticketsCounters, tPending, tConcludedByUser]);

	const usersWithConcluded = useMemo(() => {
		return Object.keys(tConcludedByUser).sort((a, b) =>
			String(a).localeCompare(String(b)),
		);
	}, [tConcludedByUser]);

	return (
		<section className="bg-white dark:bg-slate-900 rounded-xl shadow border border-slate-200 dark:border-slate-800 p-6">
			<header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
				<div>
					<h2 className="text-2xl font-bold">RESUMEN DE GUARDIA</h2>
					<p className="text-sm text-slate-600 dark:text-slate-400">
						Se muestran totales y agrupación por VEEAM y Tickets.
					</p>
				</div>

				<div className="flex items-center gap-2">
					{typeof onBack === "function" ? (
						<button
							type="button"
							onClick={onBack}
							className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-medium transition disabled:opacity-50"
						>
							Volver a Tickets
						</button>
					) : null}
				</div>
			</header>

			{/* CARDS: guardia + tiempo */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
				<div className="rounded-xl border p-4">
					<div className="text-xs text-slate-500">Guardia</div>

					<div className="mt-1 flex flex-col gap-1">
						<div className="text-sm">
							<span className="font-semibold">ID Guardia:</span>{" "}
							<span className="font-bold">{guardia?.id ?? "—"}</span>
						</div>

						<div className="text-sm">
							<span className="font-semibold">Usuario Saliente:</span>{" "}
							<span className="font-bold">
								{guardia?.user?.name || guardia?.user_name || "—"}
							</span>
						</div>
					</div>
				</div>

				<div className="rounded-xl border p-4">
					<div className="text-xs text-slate-500">Tiempo de guardia</div>

					<div className="mt-1 flex flex-col gap-1">
						<div className="text-sm">
							<span className="font-semibold">Inicio:</span>{" "}
							<span className="font-bold">
								{formatDateTime(guardia?.dateInit) || "—"}
							</span>
						</div>

						<div className="text-sm">
							<span className="font-semibold">Salida (hora real):</span>{" "}
							<span className="font-bold">{formatDateTime(now)}</span>
						</div>
					</div>
				</div>
			</div>

			{/* ===================== MONITOREOS VEEAM ===================== */}
			<div className="mb-4">
				<h1 className="text-xl font-bold tracking-wide text-slate-900 dark:text-slate-100">
					MONITOREOS VEEAM
				</h1>
				<p className="text-sm text-slate-600 dark:text-slate-400">
					Resumen Veeam antes de cerrar la guardia.
				</p>
			</div>

			{/* 3 CARDS */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4">
					<div className="text-xs text-slate-500 dark:text-slate-400">
						Total Clientes OK
					</div>
					<div className="mt-1 text-lg font-bold">{totalOk} clientes</div>
				</div>

				<div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4">
					<div className="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-200">
						Completado Exitoso - Backup finalizado sin errores
					</div>
					<div className="mt-1 text-lg font-bold">{totalOk} clientes</div>
				</div>

				<div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4">
					{groups.length === 0 ? (
						<div className="text-xs text-slate-500 dark:text-slate-400">
							Sin Clientes OK por sección Veeam
						</div>
					) : (
						<div className="mt-1 text-sm font-bold">
							<div className="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-200">
								División Clientes Veeam
							</div>

							<div className="mt-2 space-y-1 max-h-40 overflow-auto pr-1">
								{groups.map((g) => (
									<div key={g.name} className="text-sm">
										<span className="font-semibold">{g.name}</span>{" "}
										<span className="text-slate-600 dark:text-slate-400">
											— {g.count} OK
										</span>
									</div>
								))}
							</div>
						</div>
					)}
				</div>
			</div>

			{/* TABLAS MONITOREOS VEEAM */}
			<div className="mt-4">
				<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
					<h1 className="text-lg font-bold tracking-wide text-slate-900 dark:text-slate-100">
						RESUMEN DE MONITOREOS VEEAM
					</h1>

					<div className="flex flex-wrap items-center gap-2">
						<Chip label="Total" value={pendingCounters.total} tone="slate" />
						<Chip
							label="Cerrados en guardia"
							value={pendingCounters.cerrados}
							tone="emerald"
						/>
						<Chip
							label="Pendientes actualizados"
							value={pendingCounters.actualizadosPendientes}
							tone="amber"
						/>
						<Chip
							label="Sin cambios / nuevos"
							value={pendingCounters.sinCambiosONuevos}
							tone="slate"
						/>
					</div>
				</div>

				<div className="mt-5">
					<h2 className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
						MONITOREOS CERRADOS EN ESTA GUARDIA
					</h2>

					<VeeamRowsTable
						rows={monitoreoGroups.closedInGuard}
						emptyMessage="No se cerraron monitoreos en esta guardia."
					/>
				</div>

				<div className="mt-6">
					<h2 className="text-lg font-bold text-amber-700 dark:text-amber-300">
						MONITOREOS PENDIENTES ACTUALIZADOS EN ESTA GUARDIA
					</h2>

					<VeeamRowsTable
						rows={monitoreoGroups.pendingUpdatedInGuard}
						emptyMessage="No hay monitoreos pendientes actualizados en esta guardia."
					/>
				</div>

				<div className="mt-6">
					<h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
						MONITOREOS SIN MODIFICACIÓN / AGREGADOS EN ESTA GUARDIA
					</h2>

					<VeeamRowsTable
						rows={monitoreoGroups.unchangedOrNewInGuard}
						emptyMessage="No hay monitoreos sin modificación ni agregados en esta guardia."
					/>
				</div>
			</div>

			{/* ===================== TICKETS ===================== */}
			<div className="mt-8">
				<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
					<h1 className="text-xl font-bold tracking-wide text-slate-900 dark:text-slate-100">
						TICKETS
					</h1>

					<div className="flex flex-wrap items-center gap-2">
						<Chip label="Total" value={tCounters.total} tone="slate" />
						<Chip label="Pendientes" value={tCounters.pending} tone="amber" />
						<Chip
							label="Concluidos"
							value={tCounters.concluded}
							tone="emerald"
						/>
						<Chip label="Nuevos" value={tCounters.newTickets} tone="slate" />
					</div>
				</div>

				<div className="mt-3">
					<h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
						TICKETS PENDIENTES
					</h2>

					<div className="mt-2 overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
						<table className="min-w-full text-left">
							<thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase text-sm">
								<tr>
									<th className="px-4 py-2 whitespace-nowrap"># TICKET</th>
									<th className="px-4 py-2 whitespace-nowrap">TÍTULO</th>
									<th className="px-4 py-2 whitespace-nowrap">ESTATUS</th>
								</tr>
							</thead>

							<tbody className="divide-y divide-slate-200 dark:divide-slate-800">
								{tPending.length === 0 ? (
									<tr>
										<td
											colSpan={3}
											className="px-4 py-4 text-sm text-slate-600 dark:text-slate-400"
										>
											Sin tickets pendientes.
										</td>
									</tr>
								) : (
									tPending.map((t, idx) => (
										<tr key={String(ticketId(t) ?? idx)}>
											<td className="px-4 py-2 text-sm whitespace-nowrap">
												{ticketNum(t)}
											</td>

											<td className="px-4 py-2 text-sm">
												<div className="font-semibold">{ticketTitle(t)}</div>

												{t?.descriptionTicket || t?.description ? (
													<div className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[520px]">
														{String(
															t.descriptionTicket ?? t.description ?? "",
														).trim()}
													</div>
												) : null}
											</td>

											<td className="px-4 py-2 text-sm whitespace-nowrap">
												{ticketStatusLabel(t)}
											</td>
										</tr>
									))
								)}
							</tbody>
						</table>
					</div>
				</div>

				<div className="mt-6">
					<h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
						TICKETS CONCLUIDOS
					</h2>

					{usersWithConcluded.length === 0 ? (
						<div className="mt-2 text-sm text-slate-600 dark:text-slate-400">
							Sin tickets concluidos.
						</div>
					) : (
						<div className="mt-3 space-y-6">
							{usersWithConcluded.map((user) => {
								const arr = Array.isArray(tConcludedByUser[user])
									? tConcludedByUser[user]
									: [];

								return (
									<div key={user}>
										<div className="mt-3 overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
											<table className="min-w-full text-left">
												<thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase text-sm">
													<tr>
														<th className="px-2 py-2 whitespace-nowrap">
															# TICKET
														</th>
														<th className="px-2 py-2 whitespace-nowrap">
															TÍTULO
														</th>
														<th className="px-2 py-2 whitespace-nowrap">
															OBSERVACIONES
														</th>
														<th className="px-2 py-2 whitespace-nowrap">
															ESTATUS
														</th>
													</tr>
												</thead>

												<tbody className="divide-y divide-slate-200 dark:divide-slate-800">
													{arr.length === 0 ? (
														<tr>
															<td
																colSpan={4}
																className="px-4 py-4 text-sm text-slate-600 dark:text-slate-400"
															>
																Sin tickets concluidos para este usuario.
															</td>
														</tr>
													) : (
														arr.map((t, idx) => (
															<tr key={String(ticketId(t) ?? idx)}>
																<td className="px-2 py-2 text-sm whitespace-nowrap">
																	{ticketNum(t)}
																</td>

																<td className="px-2 py-2 text-sm">
																	{ticketTitle(t)}
																</td>

																<td className="px-2 py-2 text-sm whitespace-nowrap">
																	{t?.descriptionTicket || t?.description ? (
																		<div className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[520px]">
																			{String(
																				t.descriptionTicket ??
																					t.description ??
																					"",
																			).trim()}
																		</div>
																	) : (
																		"—"
																	)}
																</td>

																<td className="px-2 py-2 text-sm whitespace-nowrap">
																	Concluido
																</td>
															</tr>
														))
													)}
												</tbody>
											</table>
										</div>
									</div>
								);
							})}
						</div>
					)}
				</div>
			</div>

			<div className="mt-8 flex items-center justify-end gap-2">
				<button
					type="button"
					onClick={onClose}
					disabled={isBusy}
					className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition disabled:opacity-50"
				>
					{submitting ? "Cerrando..." : "CERRAR GUARDIA"}
				</button>
			</div>
		</section>
	);
}
