import { useEffect, useState } from "react";
import { privateInstance } from "../../../api/axios";
import { useAuthMe } from "../../../hooks/Auth/AuthMe";
import useGlobalDelete from "../../../hooks/Confirm/DeleteG";
import { formatDateTime } from "../../../utils/date";
import {
	IconCreate,
	IconDelete,
	IconEdit,
	IconShow,
} from "../../icons/Crud/exportCrud";
import ToggleUserStatusButton from "../Active/BtnActive";
import DeleteConfirm from "../ConfirmBtn/DeleteConfirm";
import Paginator from "../Paginacion/PaginationUI";
import SearchInputLong from "../Search/SearchLong";

export default function TableUsers() {
	const [query, setQuery] = useState("");
	const [search, setSearch] = useState("");
	const [users, setUsers] = useState([]);
	const [loading, setLoading] = useState(true);
	const [page, setPage] = useState(1);
	const [meta, setMeta] = useState({ last_page: 1, total: 0, per_page: 0 });
	const [loadingUserId, setLoadingUserId] = useState(null);

	const { modal, openModal, closeModal, confirm } = useGlobalDelete();
	const { isAdmin, loading: loadingMe, user: me } = useAuthMe();

	const isUserAdmin = (u) =>
		(u.roles || []).some((r) => r.name === "Administrador");
	const myId = me?.id ?? null;

	useEffect(() => {
		const fetchUsers = async () => {
			setLoading(true);
			try {
				const res = await privateInstance.get("/users", {
					params: { search, page, per_page: 5 },
				});

				const preparedUsers = (res.data.data || []).map((u) => ({
					...u,
					active: Boolean(u.activo ?? u.Activo ?? u.active ?? false),
				}));

				setUsers(preparedUsers);

				setMeta({
					last_page: res.data.last_page ?? 1,
					total: res.data.total ?? (res.data.data?.length || 0),
					per_page: res.data.per_page ?? 0,
				});
			} catch (err) {
				console.error("Error al cargar usuarios:", err);
			} finally {
				setLoading(false);
			}
		};

		fetchUsers();
	}, [search, page]);

	const toggleUserStatus = async (u) => {
		const nextActive = !u.active;

		setUsers((prev) =>
			prev.map((x) => (x.id === u.id ? { ...x, active: nextActive } : x)),
		);

		setLoadingUserId(u.id);

		try {
			const res = await privateInstance.patch(`/users/${u.id}/status`, {
				activo: nextActive,
			});

			const updated = res.data.user;
			const activeFromApi = Boolean(
				updated.activo ?? updated.Activo ?? nextActive,
			);

			setUsers((prev) =>
				prev.map((x) => (x.id === u.id ? { ...x, active: activeFromApi } : x)),
			);
		} catch (err) {
			console.error("Error al actualizar estado:", err);

			setUsers((prev) =>
				prev.map((x) => (x.id === u.id ? { ...x, active: !nextActive } : x)),
			);
		} finally {
			setLoadingUserId(null);
		}
	};

	const getRoleLabel = (u) => {
		if (!u?.roles || u.roles.length === 0) return "Sin rol";
		return u.roles.map((r) => r.name).join(", ");
	};

	const handleDeleteUser = async (u) => {
		if (!isAdmin) return;
		if (myId && u.id === myId) return;

		try {
			await privateInstance.delete(`/users/${u.id}/delete`);

			setUsers((prev) => prev.filter((x) => x.id !== u.id));
			setMeta((m) => ({ ...m, total: Math.max(0, (m.total || 0) - 1) }));
		} catch (err) {
			console.error("Error al eliminar usuario:", err);
		}
	};

	return (
		<div className="mt-10 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
			<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
				<div className="relative w-full md:max-w-sm">
					<SearchInputLong
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						placeholder="Buscar usuarios por nombre o correo..."
						onDebouncedChange={(val) => {
							if ((val ?? "").trim() === (search ?? "").trim()) return;
							setSearch(val);
							setPage(1);
						}}
					/>
				</div>
				<IconCreate to="/admin/users/crear-usuario" label="Usuario" />
			</div>

			<div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
				{loading ? (
					<div className="p-6 text-center text-slate-500 dark:text-slate-400">
						{" "}
						Cargando usuarios...{" "}
					</div>
				) : users.length === 0 ? (
					<div className="p-6 text-center text-slate-500 dark:text-slate-400">
						{" "}
						No se encontraron usuarios{" "}
					</div>
				) : (
					<table className="min-w-full text-left">
						<thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase text-sm">
							<tr>
								<th className="px-4 py-3">Foto</th>
								<th className="px-4 py-3">Nombre</th>
								<th className="px-4 py-3">Correo</th>
								<th className="px-4 py-3">Rol</th>
								<th className="px-4 py-3">Área</th>
								<th className="px-4 py-3">Estado</th>
								<th className="px-4 py-3">Ultimo Acceso</th>
								<th className="px-4 py-3 text-center">Acciones</th>
							</tr>
						</thead>

						<tbody className="text-slate-700 dark:text-slate-300 text-sm">
							{users.map((u) => {
								const targetIsAdmin = isUserAdmin(u);
								const isMeRow = myId && u.id === myId;

								return (
									<tr
										key={u.id}
										className="border-t border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
									>
										<td className="px-4 py-3">
											<div className="w-10 h-10 rounded-full overflow-hidden bg-slate-300 dark:bg-slate-700 flex items-center justify-center">
												{u.avatar ? (
													<img
														src={u.avatar}
														alt="Foto perfil"
														className="w-full h-full object-cover"
													/>
												) : (
													<span className="text-xs text-slate-600 dark:text-slate-400">
														{" "}
														Sin foto{" "}
													</span>
												)}
											</div>
										</td>

										<td className="px-4 py-3">{u.name}</td>
										<td className="px-4 py-3">{u.email}</td>

										<td className="px-4 py-3">
											<span className="px-3 py-1 rounded-full text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
												{" "}
												{getRoleLabel(u)}{" "}
											</span>
										</td>

										<td className="px-4 py-3">
											<span className="px-3 py-1 rounded-full text-xs bg-slate-100 dark:bg-slate-800">
												{u.area?.name ?? "Administrador"}
											</span>
										</td>

										<td className="px-4 py-3">
											<span
												className={`px-3 py-1 rounded-full text-xs ${u.active ? "bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-300" : "bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-300"}`}
											>
												{u.active ? "Activo" : "Inactivo"}
											</span>
										</td>

										<td className="px-4 py-3 text-slate-600 dark:text-slate-300">
											{" "}
											{formatDateTime(u.last_login_at)}{" "}
										</td>

										<td className="px-4 py-3">
											<div className="flex justify-center gap-2">
												{(isAdmin || !targetIsAdmin) && (
													<IconEdit to={`/admin/users/${u.id}/editar`} />
												)}

												<IconShow to={`/admin/users/${u.id}/ver`} />

												{!isMeRow && (
													<ToggleUserStatusButton
														active={u.active}
														label={u.active ? "Desactivar" : "Activar"}
														loading={loadingUserId === u.id}
														onToggle={() => toggleUserStatus(u)}
													/>
												)}

												{!loadingMe && isAdmin && !isMeRow && (
													<IconDelete
														onClick={() =>
															openModal({
																message: `¿Quieres eliminar al usuario "${u.name}"?\nRol: ${getRoleLabel(u)}\nEsta acción no se podrá revertir.`,
																onConfirm: () => handleDeleteUser(u),
															})
														}
													/>
												)}
											</div>
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				)}
			</div>

			{!loading && meta.total > 0 && (
				<Paginator page={page} lastPage={meta.last_page} setPage={setPage} />
			)}

			<DeleteConfirm
				isOpen={modal.isOpen}
				message={modal.message}
				onCancel={closeModal}
				onConfirm={confirm}
			/>
		</div>
	);
}
