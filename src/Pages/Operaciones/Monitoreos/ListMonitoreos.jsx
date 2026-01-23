import { useEffect, useMemo, useState } from "react";
import { privateInstance } from "../../../api/axios";

import {
	IconCreate,
	IconDelete,
	IconEdit,
	IconShow,
} from "../../../components/icons/Crud/exportCrud";
import ToggleUserStatusButton from "../../../components/UI/Active/BtnActive";
import UnifiedFilterSelect from "../../../components/UI/Filters/FilterUI";
import TableLoadingMessage from "../../../components/UI/Loaders/TableLoader";
import TableStateMessage from "../../../components/UI/Loaders/TableStateMessage";
import Paginator from "../../../components/UI/Paginacion/PaginationUI";
import SearchInputLong from "../../../components/UI/Search/SearchLong";
import useDelayedRequestLoading from "../../../hooks/DelayRequestLoad";

function renderConcluidoLabel(row) {
	if (row?.concluido_label) return row.concluido_label;

	const s = Number(row?.concluido);
	if (s === 1) return "Abierto";
	if (s === 2) return "Concluido";
	if (s === 3) return "Anulado";
	return "—";
}

function resolveSiteDisplayName(row) {
	if (row?.siteApp_name) return String(row.siteApp_name);
	return "—";
}

export default function ListMonitoreos() {
	const [query, setQuery] = useState("");
	const [search, setSearch] = useState("");

	const [filters, setFilters] = useState({
		site: null,
		status: null,
	});

	const [items, setItems] = useState([]);
	const [page, setPage] = useState(1);
	const [meta, setMeta] = useState({ last_page: 1, total: 0, per_page: 100 });

	const [hasLoaded, setHasLoaded] = useState(false);

	const [errorLocal, setErrorLocal] = useState(null);

	const { loading, error, run } = useDelayedRequestLoading(2000);

	const [statusLoadingId, setStatusLoadingId] = useState(null);

	const filterSections = useMemo(
		() => [
			{
				key: "site",
				label: "Site",
				options: [
					{ value: "veeam", label: "Veeam", hint: "Monitoreo de backups" },
					{ value: "site24", label: "Site24", hint: "Monitoreo web / uptime" },
					{ value: "sophos", label: "Sophos", hint: "Seguridad / endpoints" },
				],
			},
			{
				key: "status",
				label: "Estatus",
				options: [
					{ value: "open", label: "Abierto", hint: "Pendiente / en proceso" },
					{ value: "done", label: "Finalizado", hint: "Completado" },
					{ value: "canceled", label: "Anulado", hint: "Cancelado / inválido" },
				],
			},
		],
		[],
	);

	useEffect(() => {
		setErrorLocal(null);

		run(
			(signal) => {
				const params = { page, per_page: 100 };

				const s = (search ?? "").trim();
				if (s) params.search = s;
				if (filters.site) params.site = filters.site;
				if (filters.status) params.status = filters.status;

				return privateInstance.get("/operaciones/monitoreos", {
					params,
					signal,
				});
			},
			{
				mapData: (res) => res.data,
				keepPreviousData: true,
			},
		).then((payload) => {
			if (!payload) return;

			const nextItems = Array.isArray(payload.data) ? payload.data : [];
			const nextMeta = payload.meta ?? {
				last_page: 1,
				total: 0,
				per_page: 100,
			};

			setItems(nextItems);
			setMeta(nextMeta);
			setHasLoaded(true);
		});
	}, [page, search, filters.site, filters.status, run]);

	const onToggleMonitoreoStatus = async (monitoreoId, currentConcluido) => {
		setStatusLoadingId(monitoreoId);
		setErrorLocal(null);

		try {
			const cur = Number(currentConcluido);

			if (cur === 2) return;

			const nextStatus = cur === 1 ? 3 : 1;

			const res = await privateInstance.patch(
				`/operaciones/monitoreos/${monitoreoId}/status`,
				{ concluido: nextStatus },
			);

			const payload = res.data || {};
			const updated = payload.data || payload.monitoreo || null;

			if (payload.success === false) {
				throw new Error(payload.message || "No se pudo actualizar el estatus.");
			}

			setItems((prev) =>
				prev.map((m) =>
					m.id === monitoreoId
						? {
								...m,
								...(updated || {}),
								concluido: updated?.concluido ?? nextStatus,
								concluido_label:
									payload.status_label ??
									updated?.concluido_label ??
									m.concluido_label,
							}
						: m,
				),
			);
		} catch (e) {
			console.error("[ListMonitoreos] update status error:", e);
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

	function statusPillClass(concluidoNum) {
		if (concluidoNum === 1) {
			// Abierto (verde)
			return "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800";
		}
		if (concluidoNum === 2) {
			// Concluido (azul)
			return "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800";
		}
		// Anulado (gris)
		return "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700";
	}

	return (
		<div className="min-h-screen w-full bg-slate-100 dark:bg-slate-950 px-6 py-6 text-slate-800 dark:text-slate-200">
			<header className="mb-6 flex items-center justify-between">
				<h1 className="px-2 text-2xl font-bold text-slate-800 dark:text-slate-100">
					Lista Monitoreos
				</h1>
			</header>

			<section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
				<div className="mb-4 flex flex-col gap-3">
					<div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
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
								{meta?.total ?? 0} monitoreo(s)
							</span>
							<IconCreate
								label="Monitoreo"
								to="/operaciones/monitoreos/crear"
							/>
						</div>
					</div>

					<div className="rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/30">
						<UnifiedFilterSelect
							title="Filtros"
							placeholder="Filtrar por Site o Estatus..."
							sections={filterSections}
							value={filters}
							disabled={showLoading}
							onChange={(next) => {
								setFilters(next);
								setPage(1);
							}}
						/>
					</div>
				</div>

				<div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800">
					{showLoading ? (
						<TableLoadingMessage
							title="Cargando datos"
							subtitle="Optimizando búsqueda y aplicando filtros…"
						/>
					) : mergedError ? (
						<TableStateMessage
							variant="error"
							message={
								mergedError?.response?.data?.message ||
								mergedError?.message ||
								"Error al consultar monitoreos."
							}
						/>
					) : items.length === 0 ? (
						<TableStateMessage variant="empty" message="No hay registros" />
					) : (
						<div className="ticket-table-zoom overflow-x-auto">
							<table className="w-full text-sm">
								<thead className="bg-slate-100 text-xs uppercase text-slate-600 dark:bg-slate-800 dark:text-slate-300">
									<tr>
										<th className="whitespace-nowrap px-4 py-3 text-left">
											ID Monitoreo
										</th>
										<th className="whitespace-nowrap px-4 py-3 text-left">
											Cliente
										</th>

										{/* ✅ Site ocupa el lugar de "Título" */}
										<th className="whitespace-nowrap px-4 py-3 text-left">
											Site
										</th>

										<th className="whitespace-nowrap px-4 py-3 text-left">
											Fechas
										</th>
										<th className="whitespace-nowrap px-4 py-3 text-left">
											Creado / Actualizado por
										</th>
										<th className="whitespace-nowrap px-4 py-3 text-left">
											Estatus
										</th>
										<th className="whitespace-nowrap px-4 py-3 text-left">
											Acciones
										</th>
									</tr>
								</thead>

								<tbody className="divide-y divide-slate-200 dark:divide-slate-800">
									{items.map((row) => {
										const concluidoNum = Number(row?.concluido);
										const canToggle = concluidoNum === 1 || concluidoNum === 3;

										return (
											<tr
												key={row.id}
												className="hover:bg-slate-50 dark:hover:bg-slate-800/40"
											>
												<td className="whitespace-nowrap px-4 py-3 font-semibold">
													#{row.id}
												</td>

												<td className="whitespace-nowrap px-4 py-3">
													{row.client_label || "—"}
												</td>

												<td className="whitespace-nowrap px-4 py-3">
													{resolveSiteDisplayName(row)}
												</td>

												<td className="whitespace-nowrap px-4 py-3">
													<div className="text-xs text-slate-600 dark:text-slate-300">
														Creado:{" "}
														{row.created_at ? String(row.created_at) : "—"}
													</div>
													<div className="text-xs text-slate-500 dark:text-slate-400">
														Upd: {row.updated_at ? String(row.updated_at) : "—"}
													</div>
												</td>

												<td className="whitespace-nowrap px-4 py-3">
													<div className="text-xs text-slate-600 dark:text-slate-300">
														Creó: {row.user_cre_name || "—"}
													</div>
													<div className="text-xs text-slate-500 dark:text-slate-400">
														Upd: {row.user_upd_name || "—"}
													</div>
												</td>

												<td className="whitespace-nowrap px-4 py-3">
													<span
														className={`px-3 py-1 rounded-full text-xs font-medium border ${statusPillClass(
															concluidoNum,
														)}`}
													>
														{renderConcluidoLabel(row)}
													</span>
												</td>

												<td className="whitespace-nowrap px-4 py-3">
													<div className="flex items-center gap-2">
														<IconShow
															to={`/operaciones/monitoreos/${row.id}`}
														/>

														{canToggle ? (
															<ToggleUserStatusButton
																active={concluidoNum === 1}
																label={
																	concluidoNum === 1 ? "Anular" : "Reactivar"
																}
																loading={statusLoadingId === row.id}
																onToggle={() =>
																	onToggleMonitoreoStatus(row.id, row.concluido)
																}
															/>
														) : null}

														<IconEdit
															to={`/operaciones/monitoreos/${row.id}/editar`}
														/>

														<IconDelete
															onClick={() => console.log("delete", row.id)}
														/>
													</div>
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>
					)}
				</div>

				{!showLoading && (meta?.total ?? 0) > 0 ? (
					<Paginator
						page={page}
						lastPage={meta?.last_page ?? 1}
						setPage={setPage}
					/>
				) : null}
			</section>
		</div>
	);
}
