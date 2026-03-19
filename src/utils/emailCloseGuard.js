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

	const groups = groupByVeeamName(okItemsVeeam);

	const groupsHtml = groups.length
		? groups
				.slice(0, 6)
				.map(
					(g) => `
          <td class="stack stack-pad mt8 top w33 pad-x">
            <span class="pill">
              <strong>${esc(g.name)}</strong> — ${esc(g.count)} OK
            </span>
          </td>
        `,
				)
				.join("")
		: `
      <td class="stack stack-pad top w100">
        <span class="pill">
          Sin clientes OK por sección VEEAM
        </span>
      </td>
    `;

	const pendingRowsHtml = pendingVeeamRows.length
		? pendingVeeamRows
				.map((r) => {
					const cliente = clientDisplay(r);
					const site = r?.veeam_name || r?.site || "—";
					const backup = r?.backup ?? "—";
					const fRest = formatDateOnly(r?.last_restore_date);
					const est = veeamLabel(r?.estatus_veeam ?? r?.estatus);
					const obs = r?.observacion ?? "—";

					return `
            <tr>
              <td class="td">${esc(cliente)}</td>
              <td class="td">${esc(site)}</td>
              <td class="td">${esc(backup)}</td>
              <td class="td">${esc(fRest)}</td>
              <td class="td">${esc(est)}</td>
              <td class="td td-last">${esc(obs)}</td>
            </tr>
          `;
				})
				.join("")
		: `
      <tr>
        <td colspan="6" class="td-empty">
          Sin pendientes para mostrar.
        </td>
      </tr>
    `;

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

					return `
            <tr>
              <td class="td">${esc(num)}</td>
              <td class="td td-last">${esc(title)}</td>
            </tr>
          `;
				})
				.join("")
		: `
      <tr>
        <td colspan="2" class="td-empty">
          Sin tickets pendientes.
        </td>
      </tr>
    `;

	return `
<div class="mail-root">
  <style>
    .mail-root {
      font-family: system-ui, sans-serif, Arial;
      font-size: 16px;
      color: #111;
    }

    .title-wrap {
      margin: 0 0 14px 0;
      text-align: center;
    }

    .title-badge {
      display: inline-block;
      background-color: #ecf0f1;
      color: #169179;
      padding: 10px 12px;
      border-radius: 10px;
    }

    .top-table,
    .inner-table,
    .groups-table {
      width: 100%;
      border-collapse: collapse;
      margin: 0;
    }

    .summary-card {
      display: block;
      background: #f6f7f9;
      padding: 10px 12px;
      border-radius: 10px;
      font-size: 14px;
    }

    .section {
      margin-top: 18px;
    }

    .section-title-wrap {
      margin: 0 0 10px 0;
      text-align: left;
    }

    .section-title {
      display: inline-block;
      font-weight: 800;
      font-size: 16px;
      letter-spacing: .2px;
    }

    .box {
      margin: 0;
      padding: 14px;
      background: #ffffff;
      border-radius: 12px;
      border: 1px solid #eef0f3;
    }

    .table-scroll {
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }

    .tbl {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      font-size: 13px;
    }

    .tbl-veeam {
      min-width: 980px;
    }

    .tbl-tickets {
      min-width: 820px;
    }

    .th {
      background: #f6f7f9;
      padding: 10px;
      border: 1px solid #eef0f3;
      border-right: none;
      text-align: left;
    }

    .th-left {
      border-top-left-radius: 10px;
    }

    .th-right {
      border-top-right-radius: 10px;
      border-right: 1px solid #eef0f3;
    }

    .td {
      padding: 10px;
      border: 1px solid #eef0f3;
      border-top: none;
      border-right: none;
      background: #ffffff;
    }

    .td-last {
      border-right: 1px solid #eef0f3;
    }

    .td-empty {
      padding: 12px;
      border: 1px solid #eef0f3;
      border-top: none;
      background: #ffffff;
    }

    .spacer {
      height: 12px;
      line-height: 12px;
      font-size: 12px;
    }

    .top {
      vertical-align: top;
    }

    .w33 {
      width: 33.33%;
    }

    .w40 {
      width: 40%;
    }

    .w60 {
      width: 60%;
    }

    .w100 {
      width: 100%;
    }

    .pad-r {
      padding: 0 8px 0 0;
    }

    .pad-x {
      padding: 0 8px;
    }

    .pad-l {
      padding: 0 0 0 8px;
    }

    .pill {
      display: block;
      background: #f6f7f9;
      padding: 10px 12px;
      border-radius: 10px;
      font-size: 14px;
    }

    @media only screen and (max-width: 600px) {
      .stack { display: block !important; width: 100% !important; }
      .stack-pad { padding-left: 0 !important; padding-right: 0 !important; }
      .mt8 { margin-top: 8px !important; }
      .center-mobile { text-align: left !important; }
    }
  </style>

  <p class="title-wrap">
    <span class="title-badge">
      <strong>EL CIERRE DE GUARDIA CON ID ${esc(guardiaId)} SE HA PRODUCIDO EXITOSAMENTE</strong>
    </span>
  </p>

  <table role="presentation" class="top-table" cellspacing="0" cellpadding="0">
    <tr>
      <td class="stack stack-pad top w33 pad-r">
        <span class="summary-card">
          <strong>Usuario:</strong> ${esc(userName)}
        </span>
      </td>
      <td class="stack stack-pad mt8 top w33 pad-x">
        <span class="summary-card">
          <strong>Entrada:</strong> ${esc(entrada)}
        </span>
      </td>
      <td class="stack stack-pad mt8 top w33 pad-l">
        <span class="summary-card">
          <strong>Salida:</strong> ${esc(salida)}
        </span>
      </td>
    </tr>
  </table>

  <div class="section">
    <div class="section-title-wrap">
      <span class="section-title">MONITOREOS VEEAM EXITOSOS</span>
    </div>

    <div class="box">
      <table role="presentation" class="inner-table" cellspacing="0" cellpadding="0">
        <tr>
          <td class="stack stack-pad top w40 pad-r">
            <span class="summary-card">
              <strong>Fecha:</strong> ${esc(salida)}
            </span>
          </td>
          <td class="stack stack-pad mt8 top w60 pad-l">
            <span class="summary-card">
              <strong>Estatus Veeam:</strong> Completado Exitoso - Backup finalizado sin errores
            </span>
          </td>
        </tr>
      </table>

      <div class="spacer">&nbsp;</div>

      <table role="presentation" class="groups-table" cellspacing="0" cellpadding="0">
        <tr>
          ${groupsHtml}
        </tr>
      </table>
    </div>
  </div>

  <div class="section">
    <div class="section-title-wrap">
      <span class="section-title">MONITOREOS VEEAM PENDIENTES</span>
    </div>

    <div class="box">
      <div class="table-scroll">
        <table role="presentation" class="tbl tbl-veeam" cellspacing="0" cellpadding="0">
          <thead>
            <tr>
              <th class="th th-left">CLIENTE</th>
              <th class="th">SITE</th>
              <th class="th">BACKUP</th>
              <th class="th">FECHA DE RESTAURACIÓN</th>
              <th class="th">ESTATUS VEEAM</th>
              <th class="th th-right">OBSERVACIÓN</th>
            </tr>
          </thead>
          <tbody>
            ${pendingRowsHtml}
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title-wrap">
      <span class="section-title">TICKETS PENDIENTES</span>
    </div>

    <div class="box">
      <div class="table-scroll">
        <table role="presentation" class="tbl tbl-tickets" cellspacing="0" cellpadding="0">
          <thead>
            <tr>
              <th class="th th-left"># TICKET</th>
              <th class="th th-right">TÍTULO</th>
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
