import { useEffect, useMemo, useState } from "react";
import { privateInstance } from "../../../api/axios";
import {
	IconCreate,
	IconDelete,
	IconEdit,
	IconShow,
} from "../../../components/icons/Crud/exportCrud";
import SearchInputLong from "../../../components/UI/Search/SearchLong";
import { formatDateTime } from "../../../utils/date";

export default function Guardias() {
	const [guardias, setGuardias] = useState([]);
	const [statusMap, setStatusMap] = useState({});
	const [search, setSearch] = useState("");

	const [loading, setLoading] = useState(true);
	const [initialLoaded, setInitialLoaded] = useState(false);
	const [error, setError] = useState(null);

	useEffect(() => {
		let mounted = true;

		const fetchGuardias = async () => {
			setLoading(true);
			setError(null);

			try {
				const res = await privateInstance.get("/operaciones/guardias");
				if (!mounted) return;

				const { guardias, statusMap } = res.data;

				setGuardias(Array.isArray(guardias) ? guardias : []);
				setStatusMap(statusMap || {});
				setInitialLoaded(true);
			} catch (e) {
				if (!mounted) return;

				setError(
					e?.response?.data?.message ||
						e?.message ||
						"Error al cargar la lista de guardias",
				);
				setInitialLoaded(true);
			} finally {
				if (mounted) setLoading(false);
			}
		};

		fetchGuardias();

		return () => {
			mounted = false;
		};
	}, []);

	return (
		<div className="min-h-screen w-full bg-slate-100 dark:bg-slate-950 px-6 py-6 text-slate-800 dark:text-slate-200">
			<header className="flex items-center justify-between mb-6">
				<h1 className="text-2xl font-bold px-2 text-slate-800 dark:text-slate-100">
					Lista Guardias
				</h1>

				<div className="flex items-center gap-3">
					<IconCreate label="Registro" to="/operaciones/app/crear" />
				</div>
			</header>

			<section className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-5">
				<div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
					<div className="relative w-full md:max-w-sm">
						<SearchInputLong
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							placeholder="Buscar por ID, nombre o fecha inicial..."
						/>
					</div>

					<span className="text-xs text-slate-500 dark:text-slate-400"></span>
				</div>
				<div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800">
					<table className="min-w-full text-sm">
						<thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase text-xs">
							<tr>
								<th className="px-4 py-3 text-left">ID GUARDIA</th>
								<th className="px-4 py-3 text-left">USUARIO</th>
								<th className="px-4 py-3 text-left">FECHA Y HORA DE ENTRADA</th>
								<th className="px-4 py-3 text-left">FECHA Y HORA DE SALIDA</th>
								<th className="px-4 py-3 text-left">ESTATUS</th>
								<th className="px-4 py-3 ">ACCIONES</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-slate-200 dark:divide-slate-800">
							{error ? (
								<tr>
									<td
										colSpan={5}
										className="px-4 py-6 text-center text-red-600"
									>
										{error}
									</td>
								</tr>
							) : loading ? (
								<tr>
									<td
										colSpan={5}
										className="px-4 py-6 text-center text-slate-500 dark:text-slate-400"
									>
										Cargando aplicativos...
									</td>
								</tr>
							) : guardias.length === 0 ? (
								<tr>
									<td
										colSpan={5}
										className="px-4 py-6 text-center text-slate-500 dark:text-slate-400"
									>
										No hay registros
									</td>
								</tr>
							) : (
								guardias.map((g) => (
									<tr
										key={g.id}
										className="hover:bg-slate-50 dark:hover:bg-slate-800"
									>
										<td className="px-4 py-3">{g.id}</td>
										<td className="px-4 py-3">{g.user?.name || "—"}</td>
										<td className="px-4 py-3">
											{" "}
											{formatDateTime(g.dateInit)}{" "}
										</td>
										<td className="px-4 py-3">
											{g.dateFinish
												? formatDateTime(g.dateFinish)
												: "SIN REGISTRAR AÚN"}
										</td>
										<td className="px-4 py-3">
											<span
												className={`px-3 py-1 rounded-full text-xs font-medium ${
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
											<div className="flex justify-center gap-2">
												<IconShow />
												<IconEdit />
												<IconDelete />
											</div>
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
			</section>
		</div>
	);
}
