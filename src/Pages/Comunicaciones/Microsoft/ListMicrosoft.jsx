import { useEffect, useMemo, useState } from "react";
import { privateInstance } from "../../../api/axios";

import {
	IconCreate,
	IconDelete,
	IconEdit,
	IconShow,
} from "../../../components/icons/Crud/exportCrud";

import UnifiedFilterSelect from "../../../components/UI/Filters/FilterUI";
import TableLoadingMessage from "../../../components/UI/Loaders/TableLoader";
import TableStateMessage from "../../../components/UI/Loaders/TableStateMessage";
import Paginator from "../../../components/UI/Paginacion/PaginationUI";
import SearchInputLong from "../../../components/UI/Search/SearchLong";
import useDelayedRequestLoading from "../../../hooks/DelayRequestLoad";
import { formatDateNew } from "../../../utils/date";

function renderEstadoLabel(row) {
	if (row?.state_label) return String(row.state_label);

	const s = Number(row?.state);
	if (s === 1) return "OK";
	if (s === 2) return "Advertencia";
	if (s === 3) return "Incidencia";
	return "—";
}

function resolveServicioLabel(row, serviciosMap) {
	// si backend manda label, úsalo
	if (row?.service_label) return String(row.service_label);

	const key = String(row?.serviceName ?? "");
	return serviciosMap?.[key] ?? "—";
}

export default function ListMicrosoft() {
	const [query, setQuery] = useState("");
	const [search, setSearch] = useState("");

	const [filters, setFilters] = useState({
		service: null,
		state: null,
	});

	const [items, setItems] = useState([]);
	const [page, setPage] = useState(1);
	const [meta, setMeta] = useState({ last_page: 1, total: 0, per_page: 100 });

	const [hasLoaded, setHasLoaded] = useState(false);
	const [errorLocal, setErrorLocal] = useState(null);

	// catálogos que vienen del backend (idealmente index devuelve servicio/estado)
	const [catalogServicio, setCatalogServicio] = useState({});
	const [catalogEstado, setCatalogEstado] = useState({});

	const { loading, error, run } = useDelayedRequestLoading(2000);

	const filterSections = useMemo(() => {
		const servicioOptions = Object.entries(catalogServicio || {}).map(
			([value, label]) => ({
				value: String(value),
				label: String(label),
				hint: "Servicio Microsoft",
			}),
		);

		const estadoOptions = Object.entries(catalogEstado || {}).map(
			([value, label]) => ({
				value: String(value),
				label: String(label),
				hint: "Estado del monitoreo",
			}),
		);

		return [
			{
				key: "service",
				label: "Servicio",
				options: servicioOptions,
			},
			{
				key: "state",
				label: "Estado",
				options: estadoOptions,
			},
		];
	}, [catalogServicio, catalogEstado]);

	useEffect(() => {
		setErrorLocal(null);

		run(
			(signal) => {
				const params = { page, per_page: 100 };

				const s = (search ?? "").trim();
				if (s) params.search = s;

				if (filters.service) params.service = filters.service;
				if (filters.state) params.state = filters.state;

				return privateInstance.get("/comunicaciones/microsoft/list", {
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

			// ✅ soporta 2 formatos:
			// A) payload.microsoft.data
			// B) payload.data (como Laravel paginate)
			const paginated = payload.microsoft ?? payload.monitoreos ?? payload;

			const nextItems = Array.isArray(paginated?.data)
				? paginated.data
				: Array.isArray(payload?.data)
					? payload.data
					: [];

			const nextMeta = paginated?.meta ??
				payload?.meta ?? {
					last_page: 1,
					total: 0,
					per_page: 100,
				};

			setItems(nextItems);
			setMeta(nextMeta);
			setHasLoaded(true);

			// ✅ catálogos: si el backend los manda en index
			if (payload?.servicio) setCatalogServicio(payload.servicio);
			if (payload?.estado) setCatalogEstado(payload.estado);
		});
	}, [page, search, filters.service, filters.state, run]);

	const showLoading = loading || !hasLoaded;
	const mergedError = error || errorLocal;

	function estadoPillClass(stateNum) {
		if (stateNum === 1) {
			return "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800";
		}
		if (stateNum === 2) {
			return "bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-800";
		}
		return "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800";
	}

	return (
		<div className="min-h-screen w-full bg-slate-100 dark:bg-slate-950 px-6 py-6 text-slate-800 dark:text-slate-200">
			<header className="mb-6 flex items-center justify-between">
				<h1 className="px-2 text-2xl font-bold text-slate-800 dark:text-slate-100">
					Lista Monitoreos Microsoft
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
								placeholder="Buscar por servicio, usuario creador, fecha o estado..."
							/>
						</div>

						<div className="flex items-center gap-3">
							<span className="text-xs text-slate-500 dark:text-slate-400">
								{meta?.total ?? 0} monitoreo(s)
							</span>

							<IconCreate
								label="Monitoreo"
								to="/comunicaciones/microsoft/monitoreos/crear"
							/>
						</div>
					</div>

					<div className="rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/30">
						<UnifiedFilterSelect
							title="Filtros"
							placeholder="Filtrar por Servicio o Estado..."
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
								"Error al consultar monitoreos Microsoft."
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
											Servicio
										</th>
										<th className="whitespace-nowrap px-4 py-3 text-left">
											Fecha de Revisión
										</th>
										<th className="whitespace-nowrap px-4 py-3 text-left">
											Estado
										</th>
										<th className="whitespace-nowrap px-4 py-3 text-left">
											Ejecución
										</th>
										<th className="whitespace-nowrap px-4 py-3 text-left">
											Creado Por
										</th>
										<th className="whitespace-nowrap px-4 py-3 text-left">
											Acciones
										</th>
									</tr>
								</thead>

								<tbody className="divide-y divide-slate-200 dark:divide-slate-800">
									{items.map((row) => {
										const stateNum = Number(row?.state);

										return (
											<tr
												key={row.id}
												className="hover:bg-slate-50 dark:hover:bg-slate-800/40"
											>
												<td className="whitespace-nowrap px-4 py-3 font-semibold">
													#{row.id}
												</td>

												<td className="whitespace-nowrap px-4 py-3">
													{resolveServicioLabel(row, catalogServicio)}
												</td>

												<td className="whitespace-nowrap px-4 py-3">
													{formatDateNew(row?.revisionDate)}
												</td>

												<td className="whitespace-nowrap px-4 py-3">
													<span
														className={`px-3 py-1 rounded-full text-xs font-medium border ${estadoPillClass(
															stateNum,
														)}`}
													>
														{renderEstadoLabel(row)}
													</span>
												</td>

												<td className="px-4 py-3">
													<div className="max-w-[320px] truncate">
														{row?.ejecution ? String(row.ejecution) : "—"}
													</div>
												</td>

												<td className="whitespace-nowrap px-4 py-3">
													{row.user_crea?.name ?? "—"}
												</td>

												<td className="whitespace-nowrap px-4 py-3">
													<div className="flex items-center gap-2">
														<IconShow
															to={`/comunicaciones/microsoft/${row.id}`}
														/>
														<IconEdit
															to={`/comunicaciones/microsoft/${row.id}/editar`}
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
