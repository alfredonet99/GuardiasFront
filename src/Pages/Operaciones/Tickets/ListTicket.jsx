import { useEffect, useState } from "react";
import { privateInstance } from "../../../api/axios";
import {
	IconCreate,
	IconDelete,
	IconEdit,
	IconShow,
} from "../../../components/icons/Crud/exportCrud";
import ToggleUserStatusButton from "../../../components/UI/Active/BtnActive";
import Paginator from "../../../components/UI/Paginacion/PaginationUI";
import SearchInputLong from "../../../components/UI/Search/SearchLong";
import { formatDateTime } from "../../../utils/date";

export default function ListTickets() {
	const [query, setQuery] = useState("");
	const [search, setSearch] = useState("");

	const [tickets, setTickets] = useState([]);
	const [statusTicket, setStatusTicket] = useState({});
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [statusLoadingId, setStatusLoadingId] = useState(null);

	const [page, setPage] = useState(1);
	const [meta, setMeta] = useState({ last_page: 1, total: 0, per_page: 50 });

	useEffect(() => {
		const fetchTickets = async () => {
			setLoading(true);
			setError(null);

			try {
				const res = await privateInstance.get("/operaciones/tickets", {
					params: { search, page },
				});

				// ✅ paginado Laravel: tickets.data
				const pag = res.data?.tickets;
				const rows = pag?.data || [];

				setTickets(Array.isArray(rows) ? rows : []);
				setStatusTicket(res.data?.statusTicket || {});
				setMeta({
					last_page: pag?.last_page ?? 1,
					total: pag?.total ?? (rows?.length || 0),
					per_page: pag?.per_page ?? 50,
				});
			} catch (e) {
				setError(
					e?.response?.data?.message ||
						e?.message ||
						"Error al cargar la lista de tickets",
				);
				setTickets([]);
				setStatusTicket({});
				setMeta({ last_page: 1, total: 0, per_page: 50 });
			} finally {
				setLoading(false);
			}
		};

		fetchTickets();
	}, [search, page]);

	const renderStatus = (s) => statusTicket?.[s] ?? s ?? "—";

	const makeEditSlug = (t) => {
		const num = t?.numTicket ?? "0";
		const id = t?.id ?? "";
		return `${num}+${id}`;
	};

	// ✅ toggle tipo clientes: 1<->3 (2 no entra)
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
		} finally {
			setStatusLoadingId(null);
		}
	};

	return (
		<div className="min-h-screen w-full bg-slate-100 dark:bg-slate-950 px-6 py-6 text-slate-800 dark:text-slate-200">
			<header className="flex items-center justify-between mb-6">
				<h1 className="text-2xl font-bold px-2 text-slate-800 dark:text-slate-100">
					Lista Tickets
				</h1>

				<div className="flex items-center gap-3">
					<IconCreate label="Ticket" to="/operaciones/tickets/crear-ticket" />
				</div>
			</header>

			<section className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-5">
				<div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
					<div className="relative w-full md:max-w-lg">
						<SearchInputLong
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							onDebouncedChange={(val) => {
								if ((val ?? "").trim() === (search ?? "").trim()) return;
								setSearch(val);
								setPage(1);
							}}
							placeholder="Buscar por ticket, usuario creador, fecha o estatus..."
						/>
					</div>

					<span className="text-xs text-slate-500 dark:text-slate-400">
						{meta.total} ticket(s)
					</span>
				</div>

				<div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800">
					{loading ? (
						<div className="p-6 text-center text-slate-500 dark:text-slate-400">
							Cargando tickets...
						</div>
					) : error ? (
						<div className="p-6 text-center text-red-600">{error}</div>
					) : tickets.length === 0 ? (
						<div className="p-6 text-center text-slate-500 dark:text-slate-400">
							No hay registros
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="min-w-full text-sm">
								<thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase text-xs">
									<tr>
										<th className="px-4 py-3 text-left whitespace-nowrap">
											Ticket
										</th>

										<th className="px-4 py-3 text-left whitespace-nowrap hidden lg:table-cell">
											Creado por
										</th>

										<th className="px-4 py-3 text-left whitespace-nowrap hidden lg:table-cell">
											Asignado a
										</th>

										<th className="px-4 py-3 text-left">Título</th>

										<th className="px-4 py-3 text-left whitespace-nowrap hidden md:table-cell">
											Fechas
										</th>

										<th className="px-4 py-3 text-left whitespace-nowrap">
											Estatus
										</th>

										<th className="px-4 py-3 text-right whitespace-nowrap">
											Acciones
										</th>
									</tr>
								</thead>

								<tbody className="divide-y divide-slate-200 dark:divide-slate-800">
									{tickets.map((t, idx) => (
										<tr
											key={t.id}
											className={`${
												idx % 2 === 0
													? "bg-white dark:bg-slate-900"
													: "bg-slate-50 dark:bg-slate-900/60"
											} hover:bg-slate-100 dark:hover:bg-slate-800/70 transition`}
										>
											<td className="px-4 py-3 whitespace-nowrap">
												<div className="font-semibold text-slate-800 dark:text-slate-100">
													#{t.numTicket ?? "—"}
												</div>
												<div className="text-xs text-slate-500 dark:text-slate-400">
													Noct: {t.numTicketNoct ?? "—"}
												</div>
											</td>

											<td className="px-4 py-3 hidden lg:table-cell whitespace-nowrap">
												{t.creator?.name ?? "—"}
											</td>

											<td className="px-4 py-3 hidden lg:table-cell whitespace-nowrap">
												{/* tu backend manda assignedUser, pero aquí ya lo tenías como assigned_user */}
												{t.assigned_user?.name ?? t.assignedUser?.name ?? "—"}
											</td>

											<td className="px-4 py-3 hidden lg:table-cell whitespace-nowrap">
												{t.titleTicket ?? "—"}
											</td>

											<td className="px-4 py-3 hidden md:table-cell whitespace-nowrap">
												<div className="text-xs text-slate-500 dark:text-slate-400">
													Creado:{" "}
													{t.created_at ? formatDateTime(t.created_at) : "—"}
												</div>
												<div className="text-xs text-slate-500 dark:text-slate-400">
													Actualizado:{" "}
													{t.updated_at ? formatDateTime(t.updated_at) : "—"}
												</div>
											</td>

											<td className="px-4 py-3 whitespace-nowrap">
												<span
													className={`px-3 py-1 rounded-full text-xs font-medium border ${
														t.status === 1
															? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800"
															: t.status === 2
																? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
																: "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700"
													}`}
												>
													{renderStatus(t.status)}
												</span>
											</td>

											<td className="px-4 py-3 whitespace-nowrap text-right">
												<div className="inline-flex items-center justify-end gap-2">
													<IconShow to={`/operaciones/tickets/${t.id}`} />

													{/* ✅ SOLO 1 y 3 renderizan. 2 NO */}
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
														onClick={() => console.log("delete", t.id)}
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

				{!loading && meta.total > 0 && (
					<Paginator page={page} lastPage={meta.last_page} setPage={setPage} />
				)}
			</section>
		</div>
	);
}
