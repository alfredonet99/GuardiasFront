// pages/Operaciones/Tickets/ListTickets.jsx
import { useEffect, useState } from "react";
import { privateInstance } from "../../../api/axios";

import {
	IconCreate,
	IconDelete,
	IconEdit,
	IconShow,
	IconExport,
} from "../../../components/icons/Crud/exportCrud";
import ExportModal from "../../../components/UI/Modals/ModalExport";

import ToggleUserStatusButton from "../../../components/UI/Active/BtnActive";
import StatusListForHeader from "../../../components/UI/Active/StatusForHeader";
import DeleteConfirm from "../../../components/UI/ConfirmBtn/DeleteConfirm";
import TableLoadingMessage from "../../../components/UI/Loaders/TableLoader";
import TableStateMessage from "../../../components/UI/Loaders/TableStateMessage";
import Paginator from "../../../components/UI/Paginacion/PaginationUI";
import SearchInputLong from "../../../components/UI/Search/SearchLong";
import useGlobalDelete from "../../../hooks/Confirm/DeleteG";
import useDelayedRequestLoading from "../../../hooks/DelayRequestLoad";
import { formatDateTime } from "../../../utils/date";

export default function ListTickets() {
	const [query, setQuery] = useState("");
	const [search, setSearch] = useState("");

	const [tickets, setTickets] = useState([]);
	const [statusTicket, setStatusTicket] = useState({});
	const [errorLocal, setErrorLocal] = useState(null);

	const [hasLoaded, setHasLoaded] = useState(false);

	const [page, setPage] = useState(1);
	const [meta, setMeta] = useState({ last_page: 1, total: 0, per_page: 50 });
	const [statusFilter, setStatusFilter] = useState("");

	const { loading, error, run } = useDelayedRequestLoading(2000);

	const [statusLoadingId, setStatusLoadingId] = useState(null);

	const [exportModalOpen, setExportModalOpen] = useState(false);
	const [exportLoading, setExportLoading] = useState({
		pdf: false,
		excel: false,
		csv: false,
	});

	// filtros del modal de exportación
	const [filterMode, setFilterMode] = useState("range");
	const [startDate, setStartDate] = useState("");
	const [endDate, setEndDate] = useState("");
	const [month, setMonth] = useState("");
	const [selectedStatuses, setSelectedStatuses] = useState([]);

	const { modal, openModal, closeModal, confirm } = useGlobalDelete();

	useEffect(() => {
		setErrorLocal(null);

		run(
			(signal) =>
				privateInstance.get("/operaciones/tickets", {
					params: { search, page, status: statusFilter },
					signal,
				}),
			{
				mapData: (res) => res.data,
				keepPreviousData: true,
			},
		).then((payload) => {
			if (!payload) return;

			const pag = payload?.tickets;
			const rows = pag?.data || [];

			setTickets(Array.isArray(rows) ? rows : []);
			setStatusTicket(payload?.statusTicket || {});
			setMeta({
				last_page: pag?.last_page ?? 1,
				total: pag?.total ?? (Array.isArray(rows) ? rows.length : 0),
				per_page: pag?.per_page ?? 50,
			});

			setHasLoaded(true);
		});
	}, [search, page, statusFilter, run]);

	const renderStatus = (s) => statusTicket?.[s] ?? s ?? "—";

	const makeEditSlug = (t) => {
		const num = t?.numTicket ?? "0";
		const id = t?.id ?? "";
		return `${num}+${id}`;
	};

	const onToggleTicketStatus = async (ticketId, currentStatus) => {
		setStatusLoadingId(ticketId);

		try {
			const cur = Number(currentStatus);
			if (cur === 2) return;

			const nextStatus = cur === 1 ? 3 : 1;

			const res = await privateInstance.patch(
				`/operaciones/tickets/${ticketId}/status`,
				{ status: nextStatus },
			);

			const payload = res.data || {};
			const updated = payload.data || payload.ticket || null;

			if (payload.success === false) {
				throw new Error(payload.message || "No se pudo actualizar el estatus.");
			}

			setTickets((prev) =>
				prev.map((t) =>
					t.id === ticketId
						? {
								...t,
								...(updated || {}),
								status: updated?.status ?? nextStatus,
							}
						: t,
				),
			);
		} catch (e) {
			console.error("[ListTickets] update status error:", e);
			setErrorLocal(
				e?.response?.data?.message ||
					e?.message ||
					"No se pudo actualizar el estatus.",
			);
		} finally {
			setStatusLoadingId(null);
		}
	};

	const showLoading = loading || !hasLoaded;
	const mergedError = error || errorLocal;

	const handleDeleteTicket = async (t) => {
		try {
			await privateInstance.delete(`/operaciones/tickets/${t.id}/delete`);
			setTickets((prev) => prev.filter((x) => x.id !== t.id));
		} catch (err) {
			if (err.response?.status === 403) {
				alert(
					err.response.data?.message ||
						"No tienes permiso para eliminar tickets.",
				);
				return;
			}

			if (err.response?.status === 404) {
				alert(
					err.response.data?.message ||
						"El ticket no existe o ya fue eliminado.",
				);
				return;
			}

			console.error("Error al eliminar el ticket:", err);
			alert("No se pudo eliminar el ticket. Intenta de nuevo.");
		}
	};

	const openExportModal = () => setExportModalOpen(true);
	const closeExportModal = () => setExportModalOpen(false);

	const handleFilterModeChange = (mode) => {
		setFilterMode(mode);

		if (mode === "month") {
			setStartDate("");
			setEndDate("");
		} else {
			setMonth("");
		}
	};

	const exportFilters = {
		search,
		page,
		list_status_filter: statusFilter || null,
		date_mode: filterMode,
		start_date: filterMode === "range" ? startDate || null : null,
		end_date: filterMode === "range" ? endDate || null : null,
		month: filterMode === "month" ? month || null : null,
		statuses: selectedStatuses.length === 0 ? "all" : selectedStatuses,
	};

	const handleExportExcel = async () => {
		try {
			setExportLoading((prev) => ({ ...prev, excel: true }));

			console.log("Exportar Excel", {
				filters: exportFilters,
				tickets,
			});

			closeExportModal();
		} catch (e) {
			console.error("Error al exportar Excel:", e);
			alert("No se pudo generar el Excel.");
		} finally {
			setExportLoading((prev) => ({ ...prev, excel: false }));
		}
	};

	const handleExportCsv = async () => {
		try {
			setExportLoading((prev) => ({ ...prev, csv: true }));

			console.log("Exportar CSV", {
				filters: exportFilters,
				tickets,
			});

			closeExportModal();
		} catch (e) {
			console.error("Error al exportar CSV:", e);
			alert("No se pudo generar el CSV.");
		} finally {
			setExportLoading((prev) => ({ ...prev, csv: false }));
		}
	};

	const handleExportPdf = async () => {
		try {
			setExportLoading((prev) => ({ ...prev, pdf: true }));

			const params = new URLSearchParams();

			params.set("date_mode", filterMode);

			if (filterMode === "range") {
				if (startDate) params.set("start_date", startDate);
				if (endDate) params.set("end_date", endDate);
			}

			if (filterMode === "month" && month) {
				params.set("month", month);
			}

			if (search) {
				params.set("search", search);
			}

			if (selectedStatuses.length > 0) {
				selectedStatuses.forEach((status) => {
					params.append("statuses[]", String(status));
				});
			} else {
				params.set("statuses", "all");
			}

			window.open(
				`/operaciones/tickets/reportes?${params.toString()}`,
				"_blank",
				"noopener,noreferrer",
			);

			closeExportModal();
		} catch (e) {
			console.error("Error al abrir reporte PDF:", e);
			alert("No se pudo abrir la vista del reporte PDF.");
		} finally {
			setExportLoading((prev) => ({ ...prev, pdf: false }));
		}
	};
	return (
		<div className="min-h-screen w-full bg-slate-100 px-6 py-6 text-slate-800 dark:bg-slate-950 dark:text-slate-200">
			<header className="mb-6 flex items-center justify-between">
				<h1 className="px-2 text-2xl font-bold text-slate-800 dark:text-slate-100">
					Lista Tickets
				</h1>

				<div className="flex items-center justify-end gap-2">
					<IconExport onClick={openExportModal} />
					<StatusListForHeader
						value={statusFilter}
						onChange={(val) => {
							setStatusFilter(val);
							setPage(1);
						}}
					/>
				</div>
			</header>

			<section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
				<div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
					<div className="relative w-full md:max-w-lg">
						<SearchInputLong
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							onDebouncedChange={(val) => {
								const next = (val ?? "").trim();
								const prev = (search ?? "").trim();
								if (next === prev) return;
								setSearch(next);
								setPage(1);
							}}
							placeholder="Buscar por ticket, usuario creador, fecha o estatus..."
						/>
					</div>

					<div className="flex items-center gap-3">
						<span className="text-xs text-slate-500 dark:text-slate-400">
							{meta.total} ticket(s)
						</span>

						<IconCreate label="Ticket" to="/operaciones/tickets/crear-ticket" />
					</div>
				</div>

				<div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800">
					{showLoading ? (
						<TableLoadingMessage
							title="Cargando tickets"
							subtitle="Optimizando búsqueda y aplicando filtros…"
						/>
					) : mergedError ? (
						<TableStateMessage
							variant="error"
							message={
								mergedError?.response?.data?.message ||
								mergedError?.message ||
								"Error al cargar la lista de tickets"
							}
						/>
					) : tickets.length === 0 ? (
						<TableStateMessage variant="empty" message="No hay registros" />
					) : (
						<div className="ticket-table-zoom overflow-x-auto">
							<table className="w-full text-sm">
								<thead className="bg-slate-100 text-xs uppercase text-slate-600 dark:bg-slate-800 dark:text-slate-300">
									<tr>
										<th className="whitespace-nowrap px-4 py-3 text-left">
											Ticket
										</th>

										<th className="hidden whitespace-nowrap px-4 py-3 text-left lg:table-cell">
											Creado por
										</th>

										<th className="hidden whitespace-nowrap px-4 py-3 text-left lg:table-cell">
											Actualizó
										</th>

										<th className="px-4 py-3 text-left">Título</th>

										<th className="hidden whitespace-nowrap px-4 py-3 text-left md:table-cell">
											Fechas
										</th>

										<th className="whitespace-nowrap px-4 py-3 text-left">
											Estatus
										</th>

										<th className="whitespace-nowrap px-4 py-3 text-right">
											Acciones
										</th>
									</tr>
								</thead>

								<tbody className="divide-y divide-slate-200 dark:divide-slate-800">
									{tickets.map((t, idx) => (
										<tr
											key={t.id}
											className={`transition ${
												idx % 2 === 0
													? "bg-white dark:bg-slate-900"
													: "bg-slate-50 dark:bg-slate-900/60"
											} hover:bg-slate-100 dark:hover:bg-slate-800/70`}
										>
											<td className="whitespace-nowrap px-4 py-3">
												<div className="font-semibold text-slate-800 dark:text-slate-100">
													#{t.numTicket ?? "—"}
												</div>
												<div className="text-xs text-slate-500 dark:text-slate-400">
													Noct: {t.numTicketNoct ?? "—"}
												</div>
											</td>

											<td className="hidden whitespace-nowrap px-4 py-3 lg:table-cell">
												{t.creator?.name ?? "—"}
											</td>

											<td className="hidden whitespace-nowrap px-4 py-3 lg:table-cell">
												{t.assigned_user?.name ?? t.assignedUser?.name ?? "—"}
											</td>

											<td className="px-4 py-3 whitespace-nowrap">
												{t.titleTicket ?? "—"}
											</td>

											<td className="hidden whitespace-nowrap px-4 py-3 md:table-cell">
												<div className="text-xs text-slate-500 dark:text-slate-400">
													Creado:{" "}
													{t.created_at ? formatDateTime(t.created_at) : "—"}
												</div>
												<div className="text-xs text-slate-500 dark:text-slate-400">
													Actualizado:{" "}
													{t.updated_at ? formatDateTime(t.updated_at) : "—"}
												</div>
											</td>

											<td className="whitespace-nowrap px-4 py-3">
												<span
													className={`rounded-full border px-3 py-1 text-xs font-medium ${
														t.status === 1
															? "border-green-200 bg-green-100 text-green-700 dark:border-green-800 dark:bg-green-900/40 dark:text-green-300"
															: t.status === 2
																? "border-blue-200 bg-blue-100 text-blue-700 dark:border-blue-800 dark:bg-blue-900/40 dark:text-blue-300"
																: "border-slate-300 bg-slate-200 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
													}`}
												>
													{renderStatus(t.status)}
												</span>
											</td>

											<td className="whitespace-nowrap px-4 py-3 text-right">
												<div className="inline-flex items-center justify-end gap-2">
													<IconShow
														to={`/operaciones/tickets/${makeEditSlug(t)}/ver-ticket`}
													/>

													{(Number(t.status) === 1 ||
														Number(t.status) === 3) && (
														<ToggleUserStatusButton
															active={Number(t.status) === 1}
															label={
																Number(t.status) === 1 ? "Anular" : "Reactivar"
															}
															loading={statusLoadingId === t.id}
															onToggle={() =>
																onToggleTicketStatus(t.id, t.status)
															}
														/>
													)}

													<IconEdit
														to={`/operaciones/tickets/${makeEditSlug(t)}/editar-ticket`}
													/>

													<IconDelete
														onClick={() =>
															openModal({
																message: `¿Quieres eliminar el ticket numero "${t.numTicket}"?\nEsta acción no se podrá revertir.`,
																onConfirm: () => handleDeleteTicket(t),
															})
														}
													/>
												</div>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</div>

				{!showLoading && meta.total > 0 && (
					<Paginator page={page} lastPage={meta.last_page} setPage={setPage} />
				)}

				<DeleteConfirm
					isOpen={modal.isOpen}
					message={modal.message}
					onCancel={closeModal}
					onConfirm={confirm}
				/>

				<ExportModal
					isOpen={exportModalOpen}
					onClose={closeExportModal}
					onExportPdf={handleExportPdf}
					onExportExcel={handleExportExcel}
					onExportCsv={handleExportCsv}
					title="Exportar tickets"
					subtitle="Selecciona el formato y los filtros que deseas aplicar."
					entityLabel={`${meta.total} ticket(s)`}
					loadingPdf={exportLoading.pdf}
					loadingExcel={exportLoading.excel}
					loadingCsv={exportLoading.csv}
					filterMode={filterMode}
					onFilterModeChange={handleFilterModeChange}
					startDate={startDate}
					endDate={endDate}
					onStartDateChange={setStartDate}
					onEndDateChange={setEndDate}
					month={month}
					onMonthChange={setMonth}
					statusOptions={[
						{ value: 1, label: renderStatus(1) },
						{ value: 2, label: renderStatus(2) },
						{ value: 3, label: renderStatus(3) },
					]}
					selectedStatuses={selectedStatuses}
					onSelectedStatusesChange={setSelectedStatuses}
				/>
			</section>
		</div>
	);
}
