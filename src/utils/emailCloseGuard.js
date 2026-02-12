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

// labels (igual que los tuyos)
const STATUS_VEEAM = {
	1: "Completado Exitoso - Backup finalizado sin errores",
	2: "Completado con Advertencias - Backup terminado pero con observaciones menores",
	3: "Fallido - Backup no se completó correctamente",
	4: "En Progreso - Backup actualmente en ejecución",
	5: "Pausado - Backup detenido temporalmente",
	6: "Pendiente - Programado pero no iniciado",
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
		const name =
			String(it?.veeam_name ?? it?.siteApp_name ?? "").trim() ||
			"VEEAM (sin nombre)";
		map.set(name, (map.get(name) ?? 0) + 1);
	}
	return Array.from(map.entries())
		.map(([name, count]) => ({ name, count }))
		.sort((a, b) => b.count - a.count);
}

/**
 * buildGuardiaCloseEmailHtml
 * @param {Object} args
 * @returns {string} HTML listo para EmailJS
 */
export function buildGuardiaCloseEmailHtml({
	guardia,
	now = new Date(),

	okItemsVeeam = [], // selectedOkItemsVeeam
	pendingVeeamRows = [], // rowsForResume

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

	const groups = groupByVeeamName(okItemsVeeam);

	// chips (3 columnas)
	const groupsHtml = groups.length
		? groups
				.slice(0, 6)
				.map(
					(g) => `
          <td class="stack stack-pad mt8" style="width:33.33%; padding:0 8px; vertical-align:top;">
            <span style="display:block; background:#f6f7f9; padding:10px 12px; border-radius:10px; font-size:14px;">
              <strong>${esc(g.name)}</strong> — ${esc(g.count)} OK
            </span>
          </td>
        `,
				)
				.join("")
		: `
      <td class="stack stack-pad" style="width:100%; padding:0; vertical-align:top;">
        <span style="display:block; background:#f6f7f9; padding:10px 12px; border-radius:10px; font-size:14px;">
          Sin clientes OK por sección VEEAM
        </span>
      </td>
    `;

	// tabla pendientes (si no hay, muestra mensaje)
	const pendingRowsHtml = pendingVeeamRows.length
		? pendingVeeamRows
				.map((r, idx) => {
					const idGuardia = r?.id_guardia ?? guardiaId ?? "—";
					const cliente = clientDisplay(r);
					const site = r?.veeam_name || r?.site || "—";
					const backup = r?.backup ?? "—";
					const fRest = formatDateOnly(r?.last_restore_date);
					const est = veeamLabel(r?.estatus_veeam ?? r?.estatus);
					const obs = r?.observacion ?? "—";

					return `
            <tr>
              <td style="padding:10px; border:1px solid #eef0f3; border-top:none; border-right:none; background:#ffffff;">${esc(idGuardia)}</td>
              <td style="padding:10px; border:1px solid #eef0f3; border-top:none; border-right:none; background:#ffffff;">${esc(cliente)}</td>
              <td style="padding:10px; border:1px solid #eef0f3; border-top:none; border-right:none; background:#ffffff;">${esc(site)}</td>
              <td style="padding:10px; border:1px solid #eef0f3; border-top:none; border-right:none; background:#ffffff;">${esc(backup)}</td>
              <td style="padding:10px; border:1px solid #eef0f3; border-top:none; border-right:none; background:#ffffff;">${esc(fRest)}</td>
              <td style="padding:10px; border:1px solid #eef0f3; border-top:none; border-right:none; background:#ffffff;">${esc(est)}</td>
              <td style="padding:10px; border:1px solid #eef0f3; border-top:none; background:#ffffff;">${esc(obs)}</td>
            </tr>
          `;
				})
				.join("")
		: `
      <tr>
        <td colspan="7" style="padding:12px; border:1px solid #eef0f3; border-top:none; background:#ffffff;">
          Sin pendientes para mostrar.
        </td>
      </tr>
    `;

	// tickets (pendientes) tabla
	const tPending = Array.isArray(ticketsResume?.pending)
		? ticketsResume.pending
		: [];
	const ticketsPendingRows = tPending.length
		? tPending
				.map((t) => {
					const numA = String(t?.numTicket ?? "").trim();
					const numB = String(t?.numTicketNoct ?? "").trim();
					const num = numA && numB ? `${numA} / ${numB}` : numA || numB || "—";
					const title = String(t?.titleTicket ?? t?.title ?? "").trim() || "—";
					const assigned =
						String(
							t?.assigned_user_name ?? t?.assigned_name ?? t?.user_name ?? "",
						).trim() || "—";
					const status =
						Number(t?.status ?? 1) === 2 ? "Concluido" : "Pendiente";

					return `
            <tr>
              <td style="padding:10px; border:1px solid #eef0f3; border-top:none; border-right:none; background:#ffffff;">${esc(num)}</td>
              <td style="padding:10px; border:1px solid #eef0f3; border-top:none; border-right:none; background:#ffffff;">${esc(title)}</td>
              <td style="padding:10px; border:1px solid #eef0f3; border-top:none; border-right:none; background:#ffffff;">${esc(assigned)}</td>
              <td style="padding:10px; border:1px solid #eef0f3; border-top:none; background:#ffffff;">${esc(status)}</td>
            </tr>
          `;
				})
				.join("")
		: `
      <tr>
        <td colspan="5" style="padding:12px; border:1px solid #eef0f3; border-top:none; background:#ffffff;">
          Sin tickets pendientes.
        </td>
      </tr>
    `;

	// el HTML final (tu diseño base + secciones)
	return `
<div style="font-family: system-ui, sans-serif, Arial; font-size: 16px; color:#111;">
  <style>
    @media only screen and (max-width: 600px) {
      .stack { display:block !important; width:100% !important; }
      .stack-pad { padding-left:0 !important; padding-right:0 !important; }
      .mt8 { margin-top:8px !important; }
      .center-mobile { text-align:left !important; }
    }
  </style>

  <p style="margin: 0 0 14px 0; text-align: center;">
    <span style="display:inline-block; background-color:#ecf0f1; color:#169179; padding:10px 12px; border-radius:10px;">
      <strong>EL CIERRE DE GUARDIA CON ID ${esc(guardiaId)} SE HA PRODUCIDO EXITOSAMENTE</strong>
    </span>
  </p>

  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse; margin:0;">
    <tr>
      <td class="stack stack-pad" style="width:33.33%; padding:0 8px 0 0; vertical-align:top;">
        <span style="display:block; background:#f6f7f9; padding:10px 12px; border-radius:10px; font-size:14px;">
          <strong>Usuario:</strong> ${esc(userName)}
        </span>
      </td>
      <td class="stack stack-pad mt8" style="width:33.33%; padding:0 8px; vertical-align:top;">
        <span style="display:block; background:#f6f7f9; padding:10px 12px; border-radius:10px; font-size:14px;">
          <strong>Entrada:</strong> ${esc(entrada)}
        </span>
      </td>
      <td class="stack stack-pad mt8" style="width:33.33%; padding:0 0 0 8px; vertical-align:top;">
        <span style="display:block; background:#f6f7f9; padding:10px 12px; border-radius:10px; font-size:14px;">
          <strong>Salida:</strong> ${esc(salida)}
        </span>
      </td>
    </tr>
  </table>

  <!-- MONITOREOS VEEAM EXITOSOS -->
  <div style="margin-top:18px;">
    <div style="margin:0 0 10px 0; text-align:left;">
      <span style="display:inline-block; font-weight:800; font-size:16px; letter-spacing:.2px;">MONITOREOS VEEAM EXITOSOS</span>
    </div>

    <div style="margin:0; padding:14px; background:#ffffff; border-radius:12px; border:1px solid #eef0f3;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse; margin:0;">
        <tr>
          <td class="stack stack-pad" style="width:40%; padding:0 8px 0 0; vertical-align:top;">
            <span style="display:block; background:#f6f7f9; padding:10px 12px; border-radius:10px; font-size:14px;">
              <strong>Fecha:</strong> ${esc(salida)}
            </span>
          </td>
          <td class="stack stack-pad mt8" style="width:60%; padding:0 0 0 8px; vertical-align:top;">
            <span style="display:block; background:#f6f7f9; padding:10px 12px; border-radius:10px; font-size:14px;">
              <strong>Estatus Veeam:</strong> Completado Exitoso - Backup finalizado sin errores
            </span>
          </td>
        </tr>
      </table>

      <div style="height:12px; line-height:12px; font-size:12px;">&nbsp;</div>

      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse; margin:0;">
        <tr>
          ${groupsHtml}
        </tr>
      </table>
    </div>
  </div>

  <!-- MONITOREOS VEEAM PENDIENTES -->
  <div style="margin-top:18px;">
    <div style="margin:0 0 10px 0; text-align:left;">
      <span style="display:inline-block; font-weight:800; font-size:16px; letter-spacing:.2px;">MONITOREOS VEEAM PENDIENTES</span>
    </div>

    <div style="margin:0; padding:14px; background:#ffffff; border-radius:12px; border:1px solid #eef0f3;">
      <div style="overflow-x:auto; -webkit-overflow-scrolling:touch;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0"
          style="border-collapse:separate; border-spacing:0; min-width:980px; font-size:13px;">
          <thead>
            <tr>
              <th align="left" style="background:#f6f7f9; padding:10px; border-top-left-radius:10px; border:1px solid #eef0f3; border-right:none;">ID GUARDIA</th>
              <th align="left" style="background:#f6f7f9; padding:10px; border:1px solid #eef0f3; border-right:none;">CLIENTE</th>
              <th align="left" style="background:#f6f7f9; padding:10px; border:1px solid #eef0f3; border-right:none;">SITE</th>
              <th align="left" style="background:#f6f7f9; padding:10px; border:1px solid #eef0f3; border-right:none;">BACKUP</th>
              <th align="left" style="background:#f6f7f9; padding:10px; border:1px solid #eef0f3; border-right:none;">FECHA DE RESTAURACIÓN</th>
              <th align="left" style="background:#f6f7f9; padding:10px; border:1px solid #eef0f3; border-right:none;">ESTATUS VEEAM</th>
              <th align="left" style="background:#f6f7f9; padding:10px; border-top-right-radius:10px; border:1px solid #eef0f3;">OBSERVACIÓN</th>
            </tr>
          </thead>
          <tbody>
            ${pendingRowsHtml}
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <!-- TICKETS PENDIENTES -->
  <div style="margin-top:18px;">
    <div style="margin:0 0 10px 0; text-align:left;">
      <span style="display:inline-block; font-weight:800; font-size:16px; letter-spacing:.2px;">TICKETS PENDIENTES</span>
    </div>

    <div style="margin:0; padding:14px; background:#ffffff; border-radius:12px; border:1px solid #eef0f3;">
      <div style="overflow-x:auto; -webkit-overflow-scrolling:touch;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0"
          style="border-collapse:separate; border-spacing:0; min-width:820px; font-size:13px;">
          <thead>
            <tr>
              <th align="left" style="background:#f6f7f9; padding:10px; border:1px solid #eef0f3; border-right:none;"># TICKET</th>
              <th align="left" style="background:#f6f7f9; padding:10px; border:1px solid #eef0f3; border-right:none;">TÍTULO</th>
              <th align="left" style="background:#f6f7f9; padding:10px; border:1px solid #eef0f3; border-right:none;">ASIGNADO</th>
              <th align="left" style="background:#f6f7f9; padding:10px; border-top-right-radius:10px; border:1px solid #eef0f3;">ESTATUS</th>
            </tr>
          </thead>
          <tbody>
            ${ticketsPendingRows}
          </tbody>
        </table>
      </div>
    </div>
  </div>
</div>
  `.trim();
}
