import { useEffect, useState } from "react";
import { privateInstance } from "../../../api/axios";
import {
	IconCreate,
	IconDelete,
	IconEdit,
	IconShow,
} from "../../../components/icons/Crud/exportCrud";
import Paginator from "../../../components/UI/Paginacion/PaginationUI";
import SearchInputLong from "../../../components/UI/Search/SearchLong";
import { formatDateTime } from "../../../utils/date";

export default function Guardias() {
	const [query, setQuery] = useState("");
	const [search, setSearch] = useState("");
	const [guardias, setGuardias] = useState([]);
	const [statusMap, setStatusMap] = useState({});
	const [loading, setLoading] = useState(true);
	const [page, setPage] = useState(1);
	const [meta, setMeta] = useState({ last_page: 1, total: 0, per_page: 0 });
	const [error, setError] = useState(null);

	useEffect(() => {
		const fetchGuardias = async () => {
			setLoading(true);
			setError(null);

			try {
				const res = await privateInstance.get("/operaciones/guardias", {
					params: { search, page },
				});

				const pag = res.data?.guardias;
				const rows = pag?.data || [];

				setGuardias(Array.isArray(rows) ? rows : []);
				setStatusMap(res.data?.statusMap || {});
				setMeta({
					last_page: pag?.last_page ?? 1,
					total: pag?.total ?? (rows?.length || 0),
					per_page: pag?.per_page ?? 20,
				});
			} catch (e) {
				setError(
					e?.response?.data?.message ||
						e?.message ||
						"Error al cargar la lista de guardias",
				);
				setGuardias([]);
				setMeta({ last_page: 1, total: 0, per_page: 0 });
			} finally {
				setLoading(false);
			}
		};

		fetchGuardias();
	}, [search, page]);

	return (
		<div className="min-h-screen w-full bg-slate-100 dark:bg-slate-950 px-6 py-6 text-slate-800 dark:text-slate-200">
			<header className="flex items-center justify-between mb-6">
				<h1 className="text-2xl font-bold px-2 text-slate-800 dark:text-slate-100">
					Lista Guardias
				</h1>

				<div className="flex items-center gap-3">
					{/* Ajusta la ruta si tu crear guardia es otra */}
					<IconCreate label="Registro" to="/operaciones/guardias/crear" />
				</div>
			</header>

			<section className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-5">
				<div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
					<div className="relative w-full md:max-w-sm">
						<SearchInputLong
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							onDebouncedChange={(val) => {
								if ((val ?? "").trim() === (search ?? "").trim()) return;
								setSearch(val);
								setPage(1);
							}}
							placeholder="Buscar por ID, usuario, fecha o estatus..."
						/>
					</div>

					<span className="text-xs text-slate-500 dark:text-slate-400">
						{meta.total} guardia(s)
					</span>
				</div>

				<div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800">
					{loading ? (
						<div className="p-6 text-center text-slate-500 dark:text-slate-400">
							Cargando guardias...
						</div>
					) : error ? (
						<div className="p-6 text-center text-red-600">{error}</div>
					) : guardias.length === 0 ? (
						<div className="p-6 text-center text-slate-500 dark:text-slate-400">
							No hay registros
						</div>
					) : (
						<table className="min-w-full text-sm">
							<thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase text-xs">
								<tr>
									<th className="px-4 py-3 text-left">ID GUARDIA</th>
									<th className="px-4 py-3 text-left">USUARIO</th>
									<th className="px-4 py-3 text-left">
										FECHA Y HORA DE ENTRADA
									</th>
									<th className="px-4 py-3 text-left">
										FECHA Y HORA DE SALIDA
									</th>
									<th className="px-4 py-3 text-left">ESTATUS</th>
									<th className="px-4 py-3 text-center w-32">ACCIONES</th>
								</tr>
							</thead>

							<tbody className="divide-y divide-slate-200 dark:divide-slate-800">
								{guardias.map((g, idx) => (
									<tr
										key={g.id}
										className={`${
											idx % 2 === 0
												? "bg-white dark:bg-slate-900"
												: "bg-slate-50 dark:bg-slate-900/60"
										} hover:bg-slate-100 dark:hover:bg-slate-800/70 transition`}
									>
										<td className="px-4 py-3 font-semibold">{g.id}</td>

										<td className="px-4 py-3">{g.user?.name || "—"}</td>

										<td className="px-4 py-3">{formatDateTime(g.dateInit)}</td>

										<td className="px-4 py-3">
											{g.dateFinish
												? formatDateTime(g.dateFinish)
												: "SIN REGISTRAR AÚN"}
										</td>

										<td className="px-4 py-3">
											<span
												title={statusMap[g.status]}
												className={`inline-flex max-w-[140px] items-center truncate rounded-full px-3 py-1 text-xs font-medium ${
													g.status === 1
														? "bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-300"
														: g.status === 2
															? "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300"
															: "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300"
												}`}
											>
												{statusMap[g.status]}
											</span>
										</td>

										<td className="px-4 py-3">
											<div className="flex items-center justify-center gap-2">
												{(g.status === 2 || g.status === 3) && (
													<IconShow to={`/operaciones/guardias/${g.id}`} />
												)}
												{g.status === 1 && (
													<IconEdit
														to={`/operaciones/guardias/${g.id}/editar`}
													/>
												)}
												<IconDelete
													// si tu IconDelete recibe onClick o endpoint/id, ajústalo a tu estándar
													onClick={() => console.log("delete", g.id)}
												/>
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					)}
				</div>

				{!loading && meta.total > 0 && (
					<Paginator page={page} lastPage={meta.last_page} setPage={setPage} />
				)}
			</section>
		</div>
	);
}
