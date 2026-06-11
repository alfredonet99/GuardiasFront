import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import TableExcelPreview from "./TableExcel";

function formatNow() {
	const now = new Date();
	return now.toLocaleString("es-MX", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
	});
}

export default function ImportTicketExcel() {
	const navigate = useNavigate();

	const previewData = useMemo(() => {
		return {
			title: "Reporte Excel de Tickets",
			generatedAt: formatNow(),
			filters: {
				periodo: "2026-02-01 al 2026-03-17",
				modo_fecha: "Por rango",
			},
			columns: [
				{ key: "numTicket", label: "Num.Tickt" },
				{ key: "numTicketNoct", label: "Num. Ticket Nocturno" },
				{ key: "creado_por", label: "Creado Por" },
				{ key: "titulo", label: "Título" },
				{ key: "descripcion", label: "Descripción" },
				{ key: "creado", label: "Creado" },
				{ key: "actualizado", label: "Actualizado" },
				{ key: "status_label", label: "Status" },
				{ key: "actualizo", label: "Actualizó" },
			],
			rows: [
				{
					numTicket: "1254",
					numTicketNoct: "N-215",
					creado_por: "Juan Pérez",
					titulo: "Falla en acceso remoto",
					descripcion: "El usuario no puede conectarse a la VPN corporativa.",
					creado: "2026-02-03 08:15",
					actualizado: "2026-02-03 09:20",
					status_label: "Abierto",
					actualizo: "Luis García",
				},
				{
					numTicket: "1255",
					numTicketNoct: "N-216",
					creado_por: "María López",
					titulo: "Error en impresora",
					descripcion:
						"La impresora de red no responde desde el equipo de contabilidad.",
					creado: "2026-02-04 10:10",
					actualizado: "2026-02-04 10:45",
					status_label: "En proceso",
					actualizo: "Ana Torres",
				},
				{
					numTicket: "1256",
					numTicketNoct: "N-217",
					creado_por: "Carlos Rivera",
					titulo: "Sin acceso a carpeta",
					descripcion:
						"No se puede abrir la carpeta compartida de facturación.",
					creado: "2026-02-05 11:25",
					actualizado: "2026-02-05 12:10",
					status_label: "Anulado",
					actualizo: "Luis García",
				},
				{
					numTicket: "1257",
					numTicketNoct: "N-218",
					creado_por: "Patricia Soto",
					titulo: "Outlook no sincroniza",
					descripcion:
						"El correo dejó de recibir mensajes nuevos desde la mañana.",
					creado: "2026-02-06 07:50",
					actualizado: "2026-02-06 08:40",
					status_label: "Abierto",
					actualizo: "Ana Torres",
				},
				{
					numTicket: "1258",
					numTicketNoct: "N-219",
					creado_por: "Ricardo León",
					titulo: "Equipo lento",
					descripcion:
						"La laptop presenta lentitud extrema al abrir aplicaciones de Office.",
					creado: "2026-02-08 09:00",
					actualizado: "2026-02-08 11:05",
					status_label: "En proceso",
					actualizo: "Mario Campos",
				},
				{
					numTicket: "1259",
					numTicketNoct: "N-220",
					creado_por: "Laura Méndez",
					titulo: "No abre sistema administrativo",
					descripcion:
						"El sistema se queda cargando y no permite avanzar al menú principal.",
					creado: "2026-02-10 13:15",
					actualizado: "2026-02-10 14:00",
					status_label: "Abierto",
					actualizo: "Luis García",
				},
				{
					numTicket: "1260",
					numTicketNoct: "N-221",
					creado_por: "José Medina",
					titulo: "Problema con monitor",
					descripcion:
						"La pantalla parpadea de forma intermitente durante la jornada.",
					creado: "2026-02-11 15:30",
					actualizado: "2026-02-11 16:10",
					status_label: "En proceso",
					actualizo: "Ana Torres",
				},
				{
					numTicket: "1261",
					numTicketNoct: "N-222",
					creado_por: "Diana Flores",
					titulo: "Restablecimiento de contraseña",
					descripcion:
						"Se solicita cambio de contraseña por bloqueo de cuenta.",
					creado: "2026-02-12 08:05",
					actualizado: "2026-02-12 08:20",
					status_label: "Anulado",
					actualizo: "Mario Campos",
				},
			],
		};
	}, []);

	return (
		<div className="min-h-screen bg-slate-100 px-6 py-6 text-slate-800 dark:bg-slate-950 dark:text-slate-200">
			<div className="mx-auto max-w-[1700px]">
				<div className="mb-4 flex flex-wrap items-center justify-between gap-3">
					<div>
						<h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
							Vista previa Excel
						</h1>
						<p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
							Simulación de visor web antes de conectar backend.
						</p>
					</div>

					<div className="flex flex-wrap gap-2">
						<button
							type="button"
							onClick={() => navigate("/operaciones/tickets")}
							className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
						>
							Volver
						</button>

						<button
							type="button"
							onClick={() => alert("Aquí irá la descarga real del Excel")}
							className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
						>
							Descargar Excel
						</button>
					</div>
				</div>

				<TableExcelPreview
					title={previewData.title}
					generatedAt={previewData.generatedAt}
					filters={previewData.filters}
					columns={previewData.columns}
					rows={previewData.rows}
				/>
			</div>
		</div>
	);
}
