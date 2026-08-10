// src/utils/emailTemplates/guardiaCloseEmail.js

function esc(v) {
	return String(v ?? "")
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#039;");
}

function formatDateTimeEmail(value) {
	if (!value) return "—";

	try {
		const d = value instanceof Date ? value : new Date(value);

		if (Number.isNaN(d.getTime())) return String(value);

		return new Intl.DateTimeFormat("es-MX", {
			weekday: "short",
			day: "2-digit",
			month: "2-digit",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		}).format(d);
	} catch {
		return String(value);
	}
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

const STATUS_VEEAM = {
	1: "Completado Exitoso - Backup finalizado sin errores",
	2: "Completado con Advertencias - Backup terminado pero con observaciones menores",
	3: "Fallido - Backup no se completó correctamente",
	4: "En Progreso - Backup actualmente en ejecución",
	5: "Pausado - Backup detenido temporalmente",
	6: "Pendiente - Programado pero no iniciado",
};

const COLORS = {
	bg: "#242424",
	card: "#5a5b5d",
	white: "#ffffff",
	muted: "#cbd5e1",
	subtle: "#b6c2d2",
	greenBg: "#123f33",
	greenText: "#7ee7c0",
	amberBg: "#4a3510",
	amberText: "#fbbf24",
};

function veeamLabel(v) {
	const k = String(v ?? "").trim();
	return STATUS_VEEAM[k] ?? (k || "—");
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

function groupByVeeamName(okItems = []) {
	const map = new Map();

	for (const it of okItems) {
		const rawName = it?.veeam_name ?? it?.siteApp_name ?? "";
		const name = String(rawName).trim() || "VEEAM (sin nombre)";
		map.set(name, (map.get(name) ?? 0) + 1);
	}

	return Array.from(map.entries())
		.map(([name, count]) => ({ name, count }))
		.sort((a, b) => b.count - a.count);
}

function splitVeeamRowsByGuardCategory(rows = []) {
	const closedInGuard = [];
	const pendingUpdatedInGuard = [];
	const unchangedOrNewInGuard = [];

	for (const r of rows) {
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

function ticketDescription(t) {
	return String(t?.descriptionTicket ?? t?.description ?? "").trim() || "—";
}

function getPadStyle(index, total) {
	if (total === 1) return "padding:0;";
	if (index === 0) return "padding:0 5px 0 0;";
	if (index === total - 1) return "padding:0 0 0 5px;";
	return "padding:0 5px;";
}

function buildInfoCard(label, value) {
	return `
		<table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="${COLORS.card}" style="width:100%; background-color:${COLORS.card}; border:0; border-radius:8px;">
			<tr>
				<td bgcolor="${COLORS.card}" style="background-color:${COLORS.card}; color:${COLORS.white}; padding:10px 12px; border-radius:8px;">
					<strong>${esc(label)}:</strong> ${esc(value)}
				</td>
			</tr>
		</table>
	`;
}

function buildCounterCard(label, value, tone = "slate") {
	const bg =
		tone === "emerald"
			? COLORS.greenBg
			: tone === "amber"
				? COLORS.amberBg
				: COLORS.card;

	const color =
		tone === "emerald"
			? COLORS.greenText
			: tone === "amber"
				? COLORS.amberText
				: COLORS.white;

	const labelColor = tone === "slate" ? COLORS.muted : color;

	return `
		<table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="${bg}" style="width:100%; background-color:${bg}; border:0; border-radius:10px;">
			<tr>
				<td bgcolor="${bg}" style="background-color:${bg}; color:${color}; padding:12px; border-radius:10px;">
					<div style="font-size:12px; color:${labelColor}; font-weight:600;">
						${esc(label)}
					</div>
					<div style="font-size:20px; color:${color}; font-weight:800; margin-top:4px;">
						${esc(value)}
					</div>
				</td>
			</tr>
		</table>
	`;
}

function buildGroupsHtml(groups = []) {
	if (!groups.length) {
		return `
			<tr>
				<td class="stack stack-pad" width="100%" style="width:100%; padding:0; vertical-align:top;">
					${buildInfoCard("VEEAM", "Sin clientes OK por sección VEEAM")}
				</td>
			</tr>
		`;
	}

	const limitedGroups = groups.slice(0, 9);
	const rows = [];

	for (let i = 0; i < limitedGroups.length; i += 3) {
		const chunk = limitedGroups.slice(i, i + 3);

		rows.push(`
			<tr>
				${chunk
					.map((g, idx) => {
						const pad = getPadStyle(idx, chunk.length);

						return `
							<td class="stack stack-pad ${idx > 0 ? "mt8" : ""}" width="${100 / chunk.length}%" style="width:${100 / chunk.length}%; ${pad} vertical-align:top;">
								<table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="${COLORS.card}" style="width:100%; background-color:${COLORS.card}; border:0; border-radius:8px;">
									<tr>
										<td bgcolor="${COLORS.card}" style="background-color:${COLORS.card}; color:${COLORS.white}; padding:10px 12px; border-radius:8px;">
											<strong>${esc(g.name)}</strong> — ${esc(g.count)} OK
										</td>
									</tr>
								</table>
							</td>
						`;
					})
					.join("")}
			</tr>
		`);
	}

	return rows.join(`
		<tr>
			<td colspan="3" style="height:10px; line-height:10px; font-size:10px;">&nbsp;</td>
		</tr>
	`);
}

function buildVeeamRowsHtml(
	rows = [],
	emptyMessage = "Sin datos para mostrar.",
) {
	if (!rows.length) {
		return `
			<tr>
				<td colspan="6" bgcolor="${COLORS.bg}" style="background-color:${COLORS.bg}; color:${COLORS.subtle}; padding:12px; border:0;">
					${esc(emptyMessage)}
				</td>
			</tr>
		`;
	}

	return rows
		.map((r) => {
			const cliente = clientDisplay(r);
			const site = r?.veeam_name || r?.site || "—";
			const backup = r?.backup ?? "—";
			const fRest = formatDateOnly(r?.last_restore_date);
			const est = veeamLabel(r?.estatus_veeam ?? r?.estatus);
			const obs = r?.observacion ?? "—";

			return `
				<tr>
					<td bgcolor="${COLORS.bg}" style="background-color:${COLORS.bg}; color:${COLORS.white}; padding:10px; border:0; vertical-align:top;">${esc(cliente)}</td>
					<td bgcolor="${COLORS.bg}" style="background-color:${COLORS.bg}; color:${COLORS.white}; padding:10px; border:0; vertical-align:top;">${esc(site)}</td>
					<td bgcolor="${COLORS.bg}" style="background-color:${COLORS.bg}; color:${COLORS.white}; padding:10px; border:0; vertical-align:top;">${esc(backup)}</td>
					<td bgcolor="${COLORS.bg}" style="background-color:${COLORS.bg}; color:${COLORS.white}; padding:10px; border:0; vertical-align:top;">${esc(fRest)}</td>
					<td bgcolor="${COLORS.bg}" style="background-color:${COLORS.bg}; color:${COLORS.white}; padding:10px; border:0; vertical-align:top;">${esc(est)}</td>
					<td bgcolor="${COLORS.bg}" style="background-color:${COLORS.bg}; color:${COLORS.white}; padding:10px; border:0; vertical-align:top;">${esc(obs)}</td>
				</tr>
			`;
		})
		.join("");
}

function buildVeeamTableSection({
	title,
	subtitle,
	rows,
	emptyMessage,
	tone = "slate",
}) {
	const titleColor =
		tone === "emerald"
			? COLORS.greenText
			: tone === "amber"
				? COLORS.amberText
				: COLORS.white;

	return `
		<div style="height:22px; line-height:22px; font-size:22px;">&nbsp;</div>

		<div style="font-size:15px; color:${titleColor}; margin-bottom:6px; font-weight:700;">
			${esc(title)}
		</div>

		${
			subtitle
				? `<div style="font-size:13px; color:${COLORS.subtle}; margin-bottom:10px;">${esc(subtitle)}</div>`
				: ""
		}

		<table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="${COLORS.bg}" style="width:100%; background-color:${COLORS.bg}; border:0; border-radius:10px;">
			<tr>
				<td bgcolor="${COLORS.bg}" style="background-color:${COLORS.bg}; padding:12px; border-radius:10px;">
					<div style="overflow-x:auto; -webkit-overflow-scrolling:touch;">
						<table role="presentation" width="980" cellspacing="0" cellpadding="0" style="width:980px; border-collapse:collapse; font-size:13px; color:${COLORS.white};">
							<thead>
								<tr>
									<th align="left" width="150" bgcolor="${COLORS.card}" style="width:150px; background-color:${COLORS.card}; color:${COLORS.white}; padding:10px; border:0;">CLIENTE</th>
									<th align="left" width="95" bgcolor="${COLORS.card}" style="width:95px; background-color:${COLORS.card}; color:${COLORS.muted}; padding:10px; border:0;">SITE</th>
									<th align="left" width="85" bgcolor="${COLORS.card}" style="width:85px; background-color:${COLORS.card}; color:${COLORS.muted}; padding:10px; border:0;">BACKUP</th>
									<th align="left" width="130" bgcolor="${COLORS.card}" style="width:130px; background-color:${COLORS.card}; color:${COLORS.muted}; padding:10px; border:0;">FECHA DE RESTAURACIÓN</th>
									<th align="left" width="220" bgcolor="${COLORS.card}" style="width:220px; background-color:${COLORS.card}; color:${COLORS.muted}; padding:10px; border:0;">ESTATUS VEEAM</th>
									<th align="left" width="300" bgcolor="${COLORS.card}" style="width:300px; background-color:${COLORS.card}; color:${COLORS.muted}; padding:10px; border:0;">OBSERVACIÓN</th>
								</tr>
							</thead>

							<tbody>
								${buildVeeamRowsHtml(rows, emptyMessage)}
							</tbody>
						</table>
					</div>
				</td>
			</tr>
		</table>
	`;
}

function buildTicketsPendingRowsHtml(tickets = []) {
	if (!tickets.length) {
		return `
			<tr>
				<td colspan="3" bgcolor="${COLORS.bg}" style="background-color:${COLORS.bg}; color:${COLORS.subtle}; padding:12px; border:0;">
					Sin tickets pendientes.
				</td>
			</tr>
		`;
	}

	return tickets
		.map((t) => {
			const num = ticketNum(t);
			const title = ticketTitle(t);
			const desc = ticketDescription(t);

			return `
				<tr>
					<td bgcolor="${COLORS.bg}" style="background-color:${COLORS.bg}; color:${COLORS.white}; padding:10px; border:0; vertical-align:top;">${esc(num)}</td>
					<td bgcolor="${COLORS.bg}" style="background-color:${COLORS.bg}; color:${COLORS.white}; padding:10px; border:0; vertical-align:top;">${esc(title)}</td>
					<td bgcolor="${COLORS.bg}" style="background-color:${COLORS.bg}; color:${COLORS.white}; padding:10px; border:0; vertical-align:top;">${esc(desc)}</td>
				</tr>
			`;
		})
		.join("");
}

function buildTicketsConcludedRowsHtml(concludedByUser = {}) {
	const users = Object.keys(
		concludedByUser && typeof concludedByUser === "object"
			? concludedByUser
			: {},
	).sort((a, b) => String(a).localeCompare(String(b)));

	if (!users.length) {
		return `
			<tr>
				<td colspan="4" bgcolor="${COLORS.bg}" style="background-color:${COLORS.bg}; color:${COLORS.subtle}; padding:12px; border:0;">
					Sin tickets concluidos.
				</td>
			</tr>
		`;
	}

	const rows = [];

	for (const user of users) {
		const arr = Array.isArray(concludedByUser[user])
			? concludedByUser[user]
			: [];

		if (!arr.length) continue;

		for (const t of arr) {
			const num = ticketNum(t);
			const title = ticketTitle(t);
			const desc = ticketDescription(t);

			rows.push(`
				<tr>
					<td bgcolor="${COLORS.bg}" style="background-color:${COLORS.bg}; color:${COLORS.white}; padding:10px; border:0; vertical-align:top;">${esc(num)}</td>
					<td bgcolor="${COLORS.bg}" style="background-color:${COLORS.bg}; color:${COLORS.white}; padding:10px; border:0; vertical-align:top;">${esc(title)}</td>
					<td bgcolor="${COLORS.bg}" style="background-color:${COLORS.bg}; color:${COLORS.white}; padding:10px; border:0; vertical-align:top;">${esc(desc)}</td>
					<td bgcolor="${COLORS.bg}" style="background-color:${COLORS.bg}; color:${COLORS.white}; padding:10px; border:0; vertical-align:top;">Concluido</td>
				</tr>
			`);
		}
	}

	if (!rows.length) {
		return `
			<tr>
				<td colspan="4" bgcolor="${COLORS.bg}" style="background-color:${COLORS.bg}; color:${COLORS.subtle}; padding:12px; border:0;">
					Sin tickets concluidos.
				</td>
			</tr>
		`;
	}

	return rows.join("");
}

function buildTicketTableSection({ title, rowsHtml, columns }) {
	const tableWidth = columns.reduce(
		(sum, col) => sum + Number(col.width || 0),
		0,
	);

	return `
		<div style="height:22px; line-height:22px; font-size:22px;">&nbsp;</div>

		<div style="font-size:15px; color:${COLORS.white}; margin-bottom:8px; font-weight:700;">
			${esc(title)}
		</div>

		<table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="${COLORS.bg}" style="width:100%; background-color:${COLORS.bg}; border:0; border-radius:10px;">
			<tr>
				<td bgcolor="${COLORS.bg}" style="background-color:${COLORS.bg}; padding:12px; border-radius:10px;">
					<div style="overflow-x:auto; -webkit-overflow-scrolling:touch;">
						<table role="presentation" width="${tableWidth}" cellspacing="0" cellpadding="0" style="width:${tableWidth}px; border-collapse:collapse; font-size:13px; color:${COLORS.white};">
							<thead>
								<tr>
									${columns
										.map(
											(col) => `
												<th align="left" width="${col.width}" bgcolor="${COLORS.card}" style="width:${col.width}px; background-color:${COLORS.card}; color:${COLORS.muted}; padding:10px; border:0;">
													${esc(col.label)}
												</th>
											`,
										)
										.join("")}
								</tr>
							</thead>

							<tbody>
								${rowsHtml}
							</tbody>
						</table>
					</div>
				</td>
			</tr>
		</table>
	`;
}

/**
 * buildGuardiaCloseEmailHtml
 * @param {Object} args
 * @returns {string} HTML listo para EmailJS
 */
export function buildGuardiaCloseEmailHtml({
	guardia,
	now = new Date(),

	okItemsVeeam = [],
	pendingVeeamRows = [],

	ticketsResume = {
		pending: [],
		concludedByUser: {},
		counters: { total: 0, pending: 0, concluded: 0, newTickets: 0 },
	},
} = {}) {
	const guardiaId = guardia?.id ?? "—";
	const userName = guardia?.user?.name || guardia?.user_name || "—";
	const entrada = formatDateTimeEmail(guardia?.dateInit);
	const salida = formatDateTimeEmail(now);

	const okItems = Array.isArray(okItemsVeeam) ? okItemsVeeam : [];
	const pendingRows = Array.isArray(pendingVeeamRows) ? pendingVeeamRows : [];

	const groups = groupByVeeamName(okItems);
	const monitoreoGroups = splitVeeamRowsByGuardCategory(pendingRows);

	const counters = {
		totalOk: okItems.length,
		cerrados: monitoreoGroups.closedInGuard.length,
		actualizadosPendientes: monitoreoGroups.pendingUpdatedInGuard.length,
		sinCambiosONuevos: monitoreoGroups.unchangedOrNewInGuard.length,
	};

	const tPending = Array.isArray(ticketsResume?.pending)
		? ticketsResume.pending
		: [];

	const tConcludedByUser =
		ticketsResume?.concludedByUser &&
		typeof ticketsResume.concludedByUser === "object"
			? ticketsResume.concludedByUser
			: {};

	const tCounters =
		ticketsResume?.counters && typeof ticketsResume.counters === "object"
			? ticketsResume.counters
			: { total: 0, pending: tPending.length, concluded: 0, newTickets: 0 };

	return `
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="${COLORS.bg}" style="width:100%; background-color:${COLORS.bg}; margin:0; padding:0; border-collapse:collapse;">
	<tr>
		<td align="center" bgcolor="${COLORS.bg}" style="background-color:${COLORS.bg}; padding:0; margin:0;">

			<table role="presentation" width="1180" cellspacing="0" cellpadding="0" bgcolor="${COLORS.bg}" style="width:1180px; max-width:1180px; background-color:${COLORS.bg}; color:${COLORS.white}; border-collapse:collapse; font-family:Arial, Helvetica, sans-serif; font-size:14px;">
				<tr>
					<td bgcolor="${COLORS.bg}" style="background-color:${COLORS.bg}; padding:18px 12px; color:${COLORS.white};">

						<style>
							@media only screen and (max-width:600px) {
								.stack {
									display:block !important;
									width:100% !important;
								}

								.stack-pad {
									padding-left:0 !important;
									padding-right:0 !important;
								}

								.mt8 {
									margin-top:8px !important;
								}
							}
						</style>

						<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
							<tr>
								<td align="center" style="padding:0 0 14px 0;">
									<span style="display:inline-block; background-color:${COLORS.greenBg}; color:${COLORS.greenText}; padding:12px 16px; border-radius:10px; border:0; font-weight:700;">
										EL CIERRE DE GUARDIA CON ID ${esc(guardiaId)} SE HA PRODUCIDO EXITOSAMENTE
									</span>
								</td>
							</tr>
						</table>

						<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
							<tr>
								<td class="stack stack-pad" width="33.33%" style="width:33.33%; padding:0 4px 0 0; vertical-align:top;">
									${buildInfoCard("Usuario", userName)}
								</td>

								<td class="stack stack-pad mt8" width="33.33%" style="width:33.33%; padding:0 4px; vertical-align:top;">
									${buildInfoCard("Entrada", entrada)}
								</td>

								<td class="stack stack-pad mt8" width="33.33%" style="width:33.33%; padding:0 0 0 4px; vertical-align:top;">
									${buildInfoCard("Salida", salida)}
								</td>
							</tr>
						</table>

						<div style="height:18px; line-height:18px; font-size:18px;">&nbsp;</div>

						<div style="font-size:16px; font-weight:800; letter-spacing:.5px; color:${COLORS.white}; margin-bottom:8px;">
							MONITOREOS VEEAM
						</div>

						<table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="${COLORS.bg}" style="width:100%; background-color:${COLORS.bg}; border:0; border-radius:10px;">
							<tr>
								<td bgcolor="${COLORS.bg}" style="background-color:${COLORS.bg}; padding:12px; border-radius:10px;">
									<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%; border-collapse:collapse;">
										<tr>
											<td class="stack stack-pad" width="25%" style="width:25%; padding:0 5px 0 0; vertical-align:top;">
												${buildCounterCard("Clientes Sin Incidencias", counters.totalOk)}
											</td>

											<td class="stack stack-pad mt8" width="25%" style="width:25%; padding:0 5px; vertical-align:top;">
												${buildCounterCard("Monitoreos Cerrados en Guardia", counters.cerrados, "emerald")}
											</td>

											<td class="stack stack-pad mt8" width="25%" style="width:25%; padding:0 5px; vertical-align:top;">
												${buildCounterCard("Pendientes Actualizados", counters.actualizadosPendientes, "amber")}
											</td>

											<td class="stack stack-pad mt8" width="25%" style="width:25%; padding:0 0 0 5px; vertical-align:top;">
												${buildCounterCard("Sin Cambios / Nuevos", counters.sinCambiosONuevos)}
											</td>
										</tr>
									</table>
								</td>
							</tr>
						</table>

						<div style="height:20px; line-height:20px; font-size:20px;">&nbsp;</div>

						<div style="font-size:16px; font-weight:800; letter-spacing:.5px; color:${COLORS.white}; margin-bottom:8px;">
							MONITOREOS VEEAM EXITOSOS
						</div>

						<table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="${COLORS.bg}" style="width:100%; background-color:${COLORS.bg}; border:0; border-radius:10px;">
							<tr>
								<td bgcolor="${COLORS.bg}" style="background-color:${COLORS.bg}; padding:12px; border-radius:10px;">
									<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%; border-collapse:collapse;">
										<tr>
											<td class="stack stack-pad" width="40%" style="width:40%; padding:0 4px 0 0; vertical-align:top;">
												${buildInfoCard("Fecha", salida)}
											</td>

											<td class="stack stack-pad mt8" width="60%" style="width:60%; padding:0 0 0 4px; vertical-align:top;">
												${buildInfoCard(
													"Estatus Veeam",
													"Completado Exitoso - Backup finalizado sin errores",
												)}
											</td>
										</tr>
									</table>

									<div style="height:10px; line-height:10px; font-size:10px;">&nbsp;</div>

									<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%; border-collapse:collapse;">
										${buildGroupsHtml(groups)}
									</table>
								</td>
							</tr>
						</table>

						${buildVeeamTableSection({
							title: "MONITOREOS CERRADOS EN ESTA GUARDIA",
							subtitle:
								"Monitoreos que fueron concluidos durante la guardia actual.",
							rows: monitoreoGroups.closedInGuard,
							emptyMessage: "No se cerraron monitoreos en esta guardia.",
							tone: "emerald",
						})}

						${buildVeeamTableSection({
							title: "MONITOREOS PENDIENTES ACTUALIZADOS EN ESTA GUARDIA",
							subtitle:
								"Monitoreos que siguen pendientes, pero tuvieron cambio de estatus, observación o fecha de restauración.",
							rows: monitoreoGroups.pendingUpdatedInGuard,
							emptyMessage:
								"No hay monitoreos pendientes actualizados en esta guardia.",
							tone: "amber",
						})}

						${buildVeeamTableSection({
							title: "MONITOREOS SIN MODIFICACIÓN / AGREGADOS EN ESTA GUARDIA",
							subtitle:
								"Monitoreos que no sufrieron cambios respecto a BD o que se agregaron en la guardia actual.",
							rows: monitoreoGroups.unchangedOrNewInGuard,
							emptyMessage:
								"No hay monitoreos sin modificación ni agregados en esta guardia.",
						})}

						<div style="height:22px; line-height:22px; font-size:22px;">&nbsp;</div>

						<div style="font-size:16px; font-weight:800; letter-spacing:.5px; color:${COLORS.white}; margin-bottom:8px;">
							TICKETS
						</div>

						<table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="${COLORS.bg}" style="width:100%; background-color:${COLORS.bg}; border:0; border-radius:10px;">
							<tr>
								<td bgcolor="${COLORS.bg}" style="background-color:${COLORS.bg}; padding:12px; border-radius:10px;">
									<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%; border-collapse:collapse;">
										<tr>
											<td class="stack stack-pad" width="25%" style="width:25%; padding:0 5px 0 0; vertical-align:top;">
												${buildCounterCard("Total", tCounters.total ?? 0)}
											</td>

											<td class="stack stack-pad mt8" width="25%" style="width:25%; padding:0 5px; vertical-align:top;">
												${buildCounterCard("Pendientes", tCounters.pending ?? 0, "amber")}
											</td>

											<td class="stack stack-pad mt8" width="25%" style="width:25%; padding:0 5px; vertical-align:top;">
												${buildCounterCard("Concluidos", tCounters.concluded ?? 0, "emerald")}
											</td>

											<td class="stack stack-pad mt8" width="25%" style="width:25%; padding:0 0 0 5px; vertical-align:top;">
												${buildCounterCard("Nuevos", tCounters.newTickets ?? 0)}
											</td>
										</tr>
									</table>
								</td>
							</tr>
						</table>

						${buildTicketTableSection({
							title: "TICKETS PENDIENTES",
							columns: [
								{ label: "# TICKET", width: 140 },
								{ label: "TÍTULO", width: 320 },
								{ label: "OBSERVACIONES", width: 360 },
							],
							rowsHtml: buildTicketsPendingRowsHtml(tPending),
						})}

						${buildTicketTableSection({
							title: "TICKETS CONCLUIDOS",
							columns: [
								{ label: "# TICKET", width: 140 },
								{ label: "TÍTULO", width: 300 },
								{ label: "OBSERVACIONES", width: 300 },
								{ label: "ESTATUS", width: 80 },
							],
							rowsHtml: buildTicketsConcludedRowsHtml(tConcludedByUser),
						})}

					</td>
				</tr>
			</table>

		</td>
	</tr>
</table>
	`.trim();
}
