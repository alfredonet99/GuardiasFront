import { useEffect, useState } from "react";
import { privateInstance } from "../../api/axios";
import { IconCreate, IconDelete } from "../../components/icons/Crud/exportCrud";
import DeleteConfirm from "../../components/UI/ConfirmBtn/DeleteConfirm";
import Paginator from "../../components/UI/Paginacion/PaginationUI";
import SearchInputLong from "../../components/UI/Search/SearchLong";
import { useAuthMe } from "../../hooks/Auth/AuthMe";
import useGlobalDelete from "../../hooks/Confirm/DeleteG";
import PermissionDenied from "../Errors/PermissionDenied";

export default function ListPermissions() {
	const [query, setQuery] = useState("");
	const [search, setSearch] = useState("");
	const [permissions, setPermissions] = useState([]);
	const [loading, setLoading] = useState(true);
	const [page, setPage] = useState(1);
	const [meta, setMeta] = useState({ last_page: 1, total: 0, per_page: 0 });
	const { modal, openModal, closeModal, confirm } = useGlobalDelete();
	const { isAdmin, loading: loadingMe } = useAuthMe();

	useEffect(() => {
		const fetchPermissions = async () => {
			setLoading(true);
			try {
				const res = await privateInstance.get("/permissions", {
					params: { search, page },
				});
				setPermissions(res.data.data || []);
				setMeta({
					last_page: res.data.last_page ?? 1,
					total: res.data.total ?? (res.data.data?.length || 0),
					per_page: res.data.per_page ?? 0,
				});
			} catch (err) {
				console.error("Error cargando permisos:", err);
			} finally {
				setLoading(false);
			}
		};
		fetchPermissions();
	}, [search, page]);

	const handleDeletePermission = async (id) => {
		try {
			await privateInstance.delete(`/permissions/delete/${id}`);
			setPermissions((prev) => prev.filter((p) => p.id !== id));
		} catch (err) {
			console.error("Error al eliminar permiso:", err);
		}
	};

	if (loadingMe) return null;
	if (!isAdmin) return <PermissionDenied />;

	return (
		<div className="min-h-screen w-full bg-slate-100 dark:bg-slate-950 px-6 py-6 text-slate-800 dark:text-slate-200">
			<header className="flex items-center justify-between mb-6">
				<h1 className="text-2xl font-bold flex items-center gap-2 px-2">
					{" "}
					Permisos del Sistema{" "}
				</h1>
				<IconCreate to="/admin/permisos/crear" label="Permiso" />
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
							placeholder="Buscar permisos..."
						/>
					</div>
					<span className="text-xs text-slate-500 dark:text-slate-400">
						{" "}
						{meta.total} permiso(s){" "}
					</span>
				</div>

				<div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800">
					{loading ? (
						<div className="p-6 text-center text-slate-500 dark:text-slate-400">
							{" "}
							Cargando permisos...{" "}
						</div>
					) : permissions.length === 0 ? (
						<div className="p-6 text-center text-slate-500 dark:text-slate-400">
							{" "}
							No se encontraron permisos.{" "}
						</div>
					) : (
						<table className="min-w-full text-sm">
							<thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase text-xs">
								<tr>
									<th className="px-4 py-3 text-left">Permiso</th>
									<th className="px-4 py-3 text-left">Descripción</th>
									<th className="px-4 py-3 text-center w-32">Acciones</th>
								</tr>
							</thead>

							<tbody className="divide-y divide-slate-200 dark:divide-slate-800">
								{permissions.map((p, idx) => (
									<tr
										key={p.id}
										className={`${idx % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50 dark:bg-slate-900/60"} hover:bg-slate-100 dark:hover:bg-slate-800/70 transition`}
									>
										<td className="px-4 py-3 font-semibold"> {p.name} </td>
										<td className="px-4 py-3 text-slate-600 dark:text-slate-300">
											{" "}
											{p.description || "—"}{" "}
										</td>
										<td className="px-4 py-3">
											<div className="flex items-center justify-center gap-2">
												<IconDelete
													onClick={() =>
														openModal({
															message: `¿Quieres eliminar el permiso "${p.name}"?`,
															onConfirm: () => handleDeletePermission(p.id),
														})
													}
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

			<DeleteConfirm
				isOpen={modal.isOpen}
				message={modal.message}
				onCancel={closeModal}
				onConfirm={confirm}
			/>
		</div>
	);
}
