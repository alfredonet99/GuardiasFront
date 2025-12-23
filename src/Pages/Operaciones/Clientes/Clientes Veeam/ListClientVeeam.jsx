import { useEffect, useState } from "react";
import { privateInstance } from "../../../../api/axios";
import {
	IconCreate,
	IconDelete,
	IconEdit,
	IconShow,
} from "../../../../components/icons/Crud/exportCrud";
import ToggleUserStatusButton from "../../../../components/UI/Active/BtnActive";
import StatusList from "../../../../components/UI/Active/Status";
import Paginator from "../../../../components/UI/Paginacion/PaginationUI";
import SearchInputLong from "../../../../components/UI/Search/SearchLong";

export default function ListClientVeeam() {
	const [query, setQuery] = useState("");
	const [search, setSearch] = useState("");

	const [inactive, setInactive] = useState("");

	const [clientes, setClientes] = useState([]);
	const [loading, setLoading] = useState(true);
	const [initialLoaded, setInitialLoaded] = useState(false);

	const [page, setPage] = useState(1);
	const [meta, setMeta] = useState({ last_page: 1, total: 0, per_page: 30 });

	const [error, setError] = useState(null);
	const [statusLoadingId, setStatusLoadingId] = useState(null);

	useEffect(() => {
		let mounted = true;

		const fetchClientes = async () => {
			setLoading(true);
			setError(null);

			try {
				const res = await privateInstance.get("/operaciones/clientes/veeam", {
					params: { search, page, inactive },
				});

				// ✅ backend simple paginate() => res.data ya es paginator
				const p = res.data || {};

				if (!mounted) return;

				setClientes(Array.isArray(p.data) ? p.data : []);

				setMeta({
					last_page: p.last_page ?? 1,
					total: p.total ?? 0,
					per_page: p.per_page ?? 30,
				});

				setInitialLoaded(true);
			} catch (e) {
				if (!mounted) return;
				setError(
					e?.response?.data?.message ||
						e?.message ||
						"Error al cargar clientes Veeam.",
				);
				setInitialLoaded(true);
			} finally {
				if (mounted) setLoading(false);
			}
		};

		fetchClientes();

		return () => {
			mounted = false;
		};
	}, [search, page, inactive]);

	const onToggleClientStatus = async (clientId, currentActivo) => {
		setStatusLoadingId(clientId);

		try {
			const nextActivo = !currentActivo;

			const res = await privateInstance.patch(
				`/operaciones/clientes/veeam/${clientId}/client-deactivate`,
				{ activo: nextActivo },
			);

			const payload = res.data || {};
			if (!payload.success) {
				throw new Error(payload.message || "No se pudo actualizar el estatus.");
			}

			const updated = payload.data || {};

			setClientes((prev) =>
				prev.map((c) => (c.id === clientId ? { ...c, ...updated } : c)),
			);
		} catch (e) {
			console.error("[ListClientVeeam] update status error:", e);
		} finally {
			setStatusLoadingId(null);
		}
	};

	return (
		<div className="min-h-screen w-full bg-slate-100 dark:bg-slate-950 px-6 py-6 text-slate-800 dark:text-slate-200">
			<header className="flex items-center justify-between mb-6">
				<h1 className="text-2xl font-bold px-2 text-slate-800 dark:text-slate-100">
					Lista Clientes Veeam
				</h1>

				<div className="flex items-center gap-2 justify-end">
					<StatusList
						value={inactive}
						onChange={(val) => {
							setInactive(val);
							setPage(1);
						}}
						name="inactive"
						id="inactive"
						disabled={false}
					/>
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
							placeholder="Buscar ID, Nombre o Aplicativo..."
						/>
					</div>

					<div className="flex items-center gap-3">
						<span className="text-xs text-slate-500 dark:text-slate-400">
							{meta.total} cliente(s)
						</span>
						<IconCreate label={"Cliente"} />
					</div>
				</div>

				<div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800">
					<table className="min-w-full text-sm">
						<thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase text-xs">
							<tr>
								<th className="px-4 py-3 text-left">ID Cliente</th>
								<th className="px-4 py-3 text-left">Nombre</th>
								<th className="px-4 py-3 text-left">Aplicativo</th>
								<th className="px-4 py-3 text-left">Repositorio</th>
								<th className="px-4 py-3 text-left">Activo</th>
								<th className="px-4 py-3 text-left">
									Ultimo Punto de Restauracion
								</th>
								<th className="px-4 py-3 text-center">Acciones</th>
							</tr>
						</thead>

						<tbody className="divide-y divide-slate-200 dark:divide-slate-800">
							{/* ✅ error dentro de la tabla, NO pantalla completa */}
							{error ? (
								<tr>
									<td
										colSpan={7}
										className="px-4 py-6 text-center text-red-600"
									>
										{error}
									</td>
								</tr>
							) : loading ? (
								<tr>
									<td
										colSpan={7}
										className="px-4 py-6 text-center text-slate-500 dark:text-slate-400"
									>
										Cargando clientes...
									</td>
								</tr>
							) : initialLoaded && clientes.length === 0 ? (
								<tr>
									<td
										colSpan={7}
										className="px-4 py-6 text-center text-slate-500 dark:text-slate-400"
									>
										No hay clientes registrados.
									</td>
								</tr>
							) : (
								clientes.map((c, idx) => (
									<tr
										key={c.id}
										className={`${
											idx % 2 === 0
												? "bg-white dark:bg-slate-900"
												: "bg-slate-50 dark:bg-slate-900/60"
										} hover:bg-slate-100 dark:hover:bg-slate-800/70 transition`}
									>
										<td className="px-4 py-3 font-semibold">
											{c.numCV ?? "-"}
										</td>
										<td className="px-4 py-3">{c.nameCV ?? "-"}</td>
										<td className="px-4 py-3">{c.app ?? "-"}</td>
										<td className="px-4 py-3">{c.backup ?? "-"}</td>

										<td className="px-4 py-3">
											<span
												className={`px-3 py-1 rounded-full text-xs ${
													c.activo
														? "bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-300"
														: "bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-300"
												}`}
											>
												{c.activo ? "Activo" : "Inactivo"}
											</span>
										</td>

										<td className="px-4 py-3">hola</td>

										<td className="px-4 py-3 text-center">
											<div className="flex justify-center gap-2">
												<IconShow />
												<IconEdit />

												<ToggleUserStatusButton
													active={!!c.activo}
													label={c.activo ? "Desactivar" : "Activar"}
													loading={statusLoadingId === c.id}
													onToggle={() => onToggleClientStatus(c.id, c.activo)}
												/>

												<IconDelete />
											</div>
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>

				{/* ✅ paginador siempre visible cuando haya total */}
				{meta.total > 0 && (
					<Paginator page={page} lastPage={meta.last_page} setPage={setPage} />
				)}
			</section>
		</div>
	);
}
