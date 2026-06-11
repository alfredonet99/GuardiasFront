// pages/Comunicaciones/Sucursales/ListSucursal.jsx
import { useEffect, useState } from "react";
import { privateInstance } from "../../../api/axios";

import {
	IconCreate,
	IconDelete,
	IconEdit,
	IconExport,
	IconImport,
} from "../../../components/icons/Crud/exportCrud";
import DeleteConfirm from "../../../components/UI/ConfirmBtn/DeleteConfirm";
import TableLoadingMessage from "../../../components/UI/Loaders/TableLoader";
import TableStateMessage from "../../../components/UI/Loaders/TableStateMessage";
import Paginator from "../../../components/UI/Paginacion/PaginationUI";
import SearchInputLong from "../../../components/UI/Search/SearchLong";
import useGlobalDelete from "../../../hooks/Confirm/DeleteG";
import useDelayedRequestLoading from "../../../hooks/DelayRequestLoad";

function platformLabel(v) {
	const n = Number(v);
	if (n === 1) return "ARUBA";
	if (n === 2) return "ALESTRA";
	if (n === 3) return "RESPALDOS";
	return "—";
}

function LabelSucursal(s) {
	const n = Number(s);
	if (n === 1) return "VALLE";
	if (n === 2) return "GDL";
	if (n === 3) return "MTY";
	if (n === 4) return "MER";
	return "—";
}

export default function ListSucursal() {
	const [query, setQuery] = useState("");
	const [search, setSearch] = useState("");

	const [sucursales, setSucursales] = useState([]);
	const [page, setPage] = useState(1);
	const [meta, setMeta] = useState({ last_page: 1, total: 0, per_page: 15 });

	const [hasLoaded, setHasLoaded] = useState(false);

	const [refetchKey, setRefetchKey] = useState(0);

	const { loading, error, run, resetError } = useDelayedRequestLoading(1000);

	const { modal, openModal, closeModal, confirm } = useGlobalDelete();

	useEffect(() => {
		void refetchKey;
		let mounted = true;
		setHasLoaded(false);
		resetError?.();

		run(
			(signal) => {
				const params = { page, per_page: 15 };
				const s = (search ?? "").trim();
				if (s) params.search = s;

				return privateInstance.get("/comunicaciones/list/sucursales", {
					params,
					signal,
				});
			},
			{
				mapData: (res) => res.data,
				keepPreviousData: true,
			},
		)
			.then((payload) => {
				if (!mounted) return;
				setHasLoaded(true);

				if (!payload) return;

				const rows = Array.isArray(payload.data) ? payload.data : [];
				setSucursales(rows);

				setMeta({
					last_page: payload?.last_page ?? payload?.meta?.last_page ?? 1,
					total: payload?.total ?? payload?.meta?.total ?? rows.length ?? 0,
					per_page: payload?.per_page ?? payload?.meta?.per_page ?? 15,
				});
			})
			.finally(() => {
				if (mounted) setHasLoaded(true);
			});

		return () => {
			mounted = false;
		};
	}, [page, search, refetchKey, run, resetError]);

	const showLoading = loading || !hasLoaded;

	const handleImport = async (file) => {
		const form = new FormData();
		form.append("file", file);

		const res = await privateInstance.post(
			"/comunicaciones/sucursales/import",
			form,
			{
				headers: { "Content-Type": "multipart/form-data" },
			},
		);

		if (res?.status >= 400) {
			const msg =
				res?.data?.message ||
				(res?.data?.errors
					? Object.values(res.data.errors).flat().join(" • ")
					: res?.data?.error) ||
				(res?.status === 422
					? "Validación fallida. Revisa el archivo."
					: "No se pudo importar.");

			const err = new Error(msg);
			err.response = res;
			throw err;
		}

		setPage(1);
		setRefetchKey((k) => k + 1);

		return res;
	};

	const handleDelete = async (s) => {
		try {
			await privateInstance.delete(`comunicaciones/delete/sucursal/${s.id}`);
			setSucursales((prev) => prev.filter((x) => x.id !== s.id));
		} catch (err) {
			if (err.response?.status === 409) {
				alert(
					err.response.data?.message ||
						"No se puede eliminar el host: tiene relaciones asignadas.",
				);
				return;
			}

			if (err.response?.status === 403) {
				alert(
					err.response.data?.message ||
						"No tienes permiso para eliminar hosts.",
				);
				return;
			}

			if (err.response?.status === 404) {
				alert(
					err.response.data?.message || "El host no existe o ya fue eliminado.",
				);
				return;
			}

			console.error("Error al eliminar host:", err);
			alert("No se pudo eliminar el host. Intenta de nuevo.");
		}
	};
	return (
		<div className="min-h-screen w-full bg-slate-100 dark:bg-slate-950 px-6 py-6 text-slate-800 dark:text-slate-200">
			<header className="flex items-center justify-between mb-6">
				<h1 className="text-2xl font-bold flex items-center gap-2 px-2">
					LISTA SUCURSALES
				</h1>

				<div className="flex items-center gap-2">
					<IconImport onSubmit={handleImport} />
					<IconExport />
					<IconCreate
						to="/comunicaciones/sucursales/crear-sucursal"
						label="sucursal"
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
								const next = (val ?? "").trim();
								const prev = (search ?? "").trim();
								if (next === prev) return;
								setSearch(next);
								setPage(1);
								setRefetchKey((k) => k + 1);
							}}
							placeholder="Buscar sucursal, host, plataforma, ip o key"
						/>
					</div>

					<span className="text-xs text-slate-500 dark:text-slate-400">
						{meta?.total ?? 0} sucursal(es)
					</span>
				</div>

				<div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800">
					{showLoading ? (
						<TableLoadingMessage
							title="Cargando sucursales"
							subtitle="Optimizando búsqueda…"
						/>
					) : error ? (
						<TableStateMessage
							variant="error"
							message={error?.message || "Error al consultar sucursales."}
						/>
					) : sucursales.length === 0 ? (
						<TableStateMessage variant="empty" message="No hay registros" />
					) : (
						<div className="overflow-x-auto ticket-table-zoom">
							<table className="min-w-full text-sm">
								<thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase text-xs">
									<tr>
										<th className="px-4 py-3 text-left whitespace-nowrap">
											SUCURSAL
										</th>
										<th className="px-4 py-3 text-left whitespace-nowrap">
											HOST
										</th>
										<th className="px-4 py-3 text-left whitespace-nowrap">
											Plataforma
										</th>
										<th className="px-4 py-3 text-left whitespace-nowrap">
											IP / Llave
										</th>
										<th className="px-4 py-3 text-center w-[180px] whitespace-nowrap">
											Acciones
										</th>
									</tr>
								</thead>

								<tbody className="divide-y divide-slate-200 dark:divide-slate-800">
									{sucursales.map((s, idx) => (
										<tr
											key={s.id}
											className={`${
												idx % 2 === 0
													? "bg-white dark:bg-slate-900"
													: "bg-slate-50 dark:bg-slate-900/60"
											} hover:bg-slate-100 dark:hover:bg-slate-800/70 transition`}
										>
											<td className="px-4 py-3 whitespace-nowrap font-semibold">
												{LabelSucursal(s.nameS)}
											</td>

											<td className="px-4 py-3 whitespace-nowrap">
												{s.servHost ?? "—"}
											</td>

											<td className="px-4 py-3 whitespace-nowrap">
												{platformLabel(s.plat)}
											</td>

											<td className="px-4 py-3 whitespace-nowrap">
												{s.ip ? (
													<span className="font-mono text-xs">{s.ip}</span>
												) : s.keys ? (
													<span className="font-mono text-xs">{s.keys}</span>
												) : (
													"—"
												)}
											</td>

											<td className="px-4 py-3">
												<div className="flex items-center justify-center gap-2">
													{s?.id ? (
														<IconEdit
															to={`/comunicaciones/sucursales/${s.id}/editar`}
														/>
													) : null}
													<IconDelete
														onClick={() =>
															openModal({
																message: `¿Quieres eliminar el host "${s.servHost}" asociado a la sucursal "${LabelSucursal(s.nameS)}`,
																onConfirm: () => handleDelete(s),
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

				{!showLoading && (meta?.total ?? 0) > 0 ? (
					<Paginator
						page={page}
						lastPage={meta?.last_page ?? 1}
						setPage={setPage}
					/>
				) : null}

				<DeleteConfirm
					isOpen={modal.isOpen}
					message={modal.message}
					onCancel={closeModal}
					onConfirm={confirm}
				/>
			</section>
		</div>
	);
}
