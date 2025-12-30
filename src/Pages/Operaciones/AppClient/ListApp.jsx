import { useEffect, useMemo, useState } from "react";
import { privateInstance } from "../../../api/axios";
import {
	IconCreate,
	IconDelete,
	IconEdit,
} from "../../../components/icons/Crud/exportCrud";
import ToggleUserStatusButton from "../../../components/UI/Active/BtnActive";
import DeleteConfirm from "../../../components/UI/ConfirmBtn/DeleteConfirm";
import SearchInputLong from "../../../components/UI/Search/SearchLong";
import useGlobalDelete from "../../../hooks/Confirm/DeleteG";

export default function ListApp() {
	const [apps, setApps] = useState([]);
	const [loading, setLoading] = useState(true);
	const [initialLoaded, setInitialLoaded] = useState(false);
	const [error, setError] = useState(null);
	const [statusLoadingId, setStatusLoadingId] = useState(null);
	const { modal, openModal, closeModal, confirm } = useGlobalDelete();

	const [search, setSearch] = useState("");

	useEffect(() => {
		let mounted = true;

		const fetchApps = async () => {
			setLoading(true);
			setError(null);

			try {
				const res = await privateInstance.get("/operaciones/app");
				const data = res.data;

				if (!mounted) return;

				setApps(Array.isArray(data) ? data : []);
				setInitialLoaded(true);
			} catch (e) {
				if (!mounted) return;

				setError(
					e?.response?.data?.message ||
						e?.message ||
						"Error al cargar aplicativos.",
				);
				setInitialLoaded(true);
			} finally {
				if (mounted) setLoading(false);
			}
		};

		fetchApps();

		return () => {
			mounted = false;
		};
	}, []);

	const filteredApps = useMemo(() => {
		const q = String(search || "")
			.trim()
			.toLowerCase();
		if (!q) return apps;

		return apps.filter((a) => {
			const id = String(a?.id ?? "").toLowerCase();
			const name = String(a?.nameService ?? "").toLowerCase();
			const desc = String(a?.descriptionService ?? "").toLowerCase();
			return id.includes(q) || name.includes(q) || desc.includes(q);
		});
	}, [apps, search]);

	const onToggleAppStatus = async (appId, currentActivo) => {
		setStatusLoadingId(appId);

		try {
			const nextActivo = !currentActivo;

			const res = await privateInstance.patch(
				`/operaciones/app/${appId}/app-deactivate`,
				{ activo: nextActivo },
			);

			const payload = res.data || {};

			const updated =
				payload?.data && typeof payload.data === "object"
					? payload.data
					: payload;

			setApps((prev) =>
				prev.map((a) => (a.id === appId ? { ...a, ...updated } : a)),
			);
		} catch (e) {
			console.error("[ListApp] update status error:", e);
		} finally {
			setStatusLoadingId(null);
		}
	};

	const handleDeleteApp = async (id) => {
		try {
			await privateInstance.delete(`/operaciones/app/${id}/delete`);
			setApps((prev) => prev.filter((a) => a.id !== id));
		} catch (err) {
			console.error("Error al eliminar permiso:", err);
		}
	};

	return (
		<div className="min-h-screen w-full bg-slate-100 dark:bg-slate-950 px-6 py-6 text-slate-800 dark:text-slate-200">
			<header className="flex items-center justify-between mb-6">
				<h1 className="text-2xl font-bold px-2 text-slate-800 dark:text-slate-100">
					Lista Applicativos
				</h1>

				<div className="flex items-center gap-3">
					<IconCreate label="Aplicativo" to="/operaciones/app/crear" />
				</div>
			</header>

			<section className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-5">
				<div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
					<div className="relative w-full md:max-w-sm">
						<SearchInputLong
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							placeholder="Buscar por ID, nombre o descripción..."
						/>
					</div>

					<span className="text-xs text-slate-500 dark:text-slate-400">
						{filteredApps.length} aplicativo(s)
					</span>
				</div>

				<div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800">
					<table className="min-w-full text-sm">
						<thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase text-xs">
							<tr>
								<th className="px-4 py-3 text-left">ID APLICATIVO</th>
								<th className="px-4 py-3 text-left">APLICATIVO</th>
								<th className="px-4 py-3 text-left">DESCRIPCION</th>
								<th className="px-4 py-3 text-left">ACTIVO</th>
								<th className="px-4 py-3 text-left">ACCIONES</th>
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
							) : initialLoaded && filteredApps.length === 0 ? (
								<tr>
									<td
										colSpan={5}
										className="px-4 py-6 text-center text-slate-500 dark:text-slate-400"
									>
										{search?.trim()
											? "No hay resultados para tu búsqueda."
											: "No hay aplicativos registrados."}
									</td>
								</tr>
							) : (
								filteredApps.map((a, idx) => (
									<tr
										key={a.id}
										className={`${
											idx % 2 === 0
												? "bg-white dark:bg-slate-900"
												: "bg-slate-50 dark:bg-slate-900/60"
										} hover:bg-slate-100 dark:hover:bg-slate-800/70 transition`}
									>
										<td className="px-4 py-3 font-semibold">{a.id ?? "-"}</td>
										<td className="px-4 py-3">{a.nameService ?? "-"}</td>
										<td className="px-4 py-3">{a.descriptionService ?? "-"}</td>

										<td className="px-4 py-3">
											<span
												className={`px-3 py-1 rounded-full text-xs ${
													a.activo
														? "bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-300"
														: "bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-300"
												}`}
											>
												{a.activo ? "Activo" : "Inactivo"}
											</span>
										</td>

										<td className="px-4 py-3">
											<div className="flex justify-center gap-2">
												<IconEdit to={`/operaciones/app/${a.id}/editar `} />
												<ToggleUserStatusButton
													active={!!a.activo}
													label={a.activo ? "Desactivar" : "Activar"}
													loading={statusLoadingId === a.id}
													onToggle={() => onToggleAppStatus(a.id, a.activo)}
												/>
												<IconDelete
													onClick={() =>
														openModal({
															message: `¿Quieres eliminar el aplicativo "${a.nameService}"?`,
															onConfirm: () => handleDeleteApp(a.id),
														})
													}
												/>
											</div>
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
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
