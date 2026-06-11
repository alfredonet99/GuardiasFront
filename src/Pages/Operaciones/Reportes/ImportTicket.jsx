import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useReactToPrint } from "react-to-print";
import { privateInstance } from "../../../api/axios";
import TableReportPrint from "./TableReport";

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

function formatFilters(filters = {}) {
	const dateMode = filters?.date_mode;

	let periodo = "-";
	if (dateMode === "range") {
		periodo = `${filters?.start_date || "-"} al ${filters?.end_date || "-"}`;
	} else if (dateMode === "month") {
		periodo = filters?.month || "-";
	}

	return {
		periodo,
		modo_fecha: dateMode === "month" ? "Por mes" : "Por rango",
	};
}

export default function ImportTicket() {
	const location = useLocation();
	const navigate = useNavigate();
	const printRef = useRef(null);

	const [reportData, setReportData] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	const handlePrint = useReactToPrint({
		contentRef: printRef,
		documentTitle: "reporte-tickets",
	});

	useEffect(() => {
		let cancelled = false;

		const fetchReport = async () => {
			try {
				setLoading(true);
				setError("");

				const params = new URLSearchParams(location.search);

				const dateMode = params.get("date_mode") || "range";
				const startDate = params.get("start_date");
				const endDate = params.get("end_date");
				const month = params.get("month");
				const search = params.get("search") || "";

				const statusesFromArray = params.getAll("statuses[]");
				const statusesSingle = params.get("statuses");

				let statuses = "all";
				if (statusesFromArray.length > 0) {
					statuses = statusesFromArray;
				} else if (statusesSingle && statusesSingle !== "all") {
					statuses = [statusesSingle];
				}

				const payload = {
					date_mode: dateMode,
					start_date: dateMode === "range" ? startDate || null : null,
					end_date: dateMode === "range" ? endDate || null : null,
					month: dateMode === "month" ? month || null : null,
					statuses,
					search,
				};

				const res = await privateInstance.post(
					"/operaciones/reportes/pdf/tickets",
					payload,
				);

				if (!cancelled) {
					setReportData(res.data);
				}
			} catch (e) {
				if (!cancelled) {
					console.error("Error al cargar reporte:", e);
					setError(
						e?.response?.data?.message ||
							"No se pudo cargar el reporte de tickets.",
					);
				}
			} finally {
				if (!cancelled) {
					setLoading(false);
				}
			}
		};

		fetchReport();

		return () => {
			cancelled = true;
		};
	}, [location.search]);

	const parsed = useMemo(() => {
		if (!reportData) return null;

		const filters = formatFilters(reportData.filters || {});

		return {
			title: "Reporte de Tickets",
			generatedAt: formatNow(),
			filters,
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
			rows: Array.isArray(reportData.rows) ? reportData.rows : [],
		};
	}, [reportData]);

	if (loading) {
		return (
			<div className="min-h-screen bg-slate-100 px-6 py-6 text-slate-800 dark:bg-slate-950 dark:text-slate-200">
				<div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
					<h1 className="text-xl font-bold">Reporte de Tickets</h1>
					<p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
						Cargando reporte...
					</p>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="min-h-screen bg-slate-100 px-6 py-6 text-slate-800 dark:bg-slate-950 dark:text-slate-200">
				<div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
					<h1 className="text-xl font-bold">Reporte de Tickets</h1>
					<p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>

					<div className="mt-6 flex gap-3">
						<button
							type="button"
							onClick={() => navigate("/operaciones/tickets")}
							className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
						>
							Volver a tickets
						</button>
					</div>
				</div>
			</div>
		);
	}

	if (!parsed) {
		return (
			<div className="min-h-screen bg-slate-100 px-6 py-6 text-slate-800 dark:bg-slate-950 dark:text-slate-200">
				<div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
					<h1 className="text-xl font-bold">Reporte de Tickets</h1>
					<p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
						No hay datos de reporte para mostrar.
					</p>

					<div className="mt-6 flex gap-3">
						<button
							type="button"
							onClick={() => navigate("/operaciones/tickets")}
							className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
						>
							Volver a tickets
						</button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-slate-100 px-6 py-6 text-slate-800 dark:bg-slate-950 dark:text-slate-200">
			<div className="mx-auto max-w-[1600px]">
				<div className="no-print mb-4 flex flex-wrap items-center justify-between gap-3">
					<div>
						<h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
							Vista previa del reporte
						</h1>
						<p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
							Revisa la información antes de imprimir o guardar en PDF.
						</p>
					</div>

					<div className="flex flex-wrap gap-2">
						<button
							type="button"
							onClick={handlePrint}
							className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
						>
							Imprimir / Guardar PDF
						</button>
					</div>
				</div>

				<div className="overflow-auto rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
					<TableReportPrint
						ref={printRef}
						title={parsed.title}
						generatedAt={parsed.generatedAt}
						filters={parsed.filters}
						columns={parsed.columns}
						rows={parsed.rows}
					/>
				</div>
			</div>
		</div>
	);
}
