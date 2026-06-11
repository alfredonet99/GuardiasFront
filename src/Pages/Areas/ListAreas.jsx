import { useEffect, useMemo, useState } from "react";
import { privateInstance } from "../../api/axios";
import { useUser } from "../../components/context/userContext";
import { IconCreate, IconDelete } from "../../components/icons/Crud/exportCrud";
import ToggleUserStatusButton from "../../components/UI/Active/BtnActive";
import DeleteConfirm from "../../components/UI/ConfirmBtn/DeleteConfirm";
import SearchInputLong from "../../components/UI/Search/SearchLong";
import useGlobalDelete from "../../hooks/Confirm/DeleteG";
import useOptimisticToggle from "../../hooks/useStatus";
import PermissionDenied from "../Errors/PermissionDenied";

export default function ListAreas() {
	const [areas, setAreas] = useState([]);
	const [search, setSearch] = useState("");
	const { user } = useUser();
	const isAdmin = (user?.roles || []).some((r) => r?.name === "Administrador");
	const { modal, openModal, closeModal, confirm } = useGlobalDelete();

	useEffect(() => {
		if (!user) return;
		if (!isAdmin) return;
		const loadAreas = async () => {
			try {
				const res = await privateInstance.get("/areas");
				setAreas(res.data);
			} catch (error) {
				console.error("Erro al cargar areas", error);
			}
		};
		loadAreas();
	}, [user, isAdmin]);

	const { toggle: toggleAreaStatus, loadingId: loadingAreaId } =
		useOptimisticToggle({
			setItems: setAreas,
			client: privateInstance,

			getId: (a) => a.id,
			getBool: (a) => a.activo,
			setBool: (a, next) => ({ ...a, activo: next }),

			buildUrl: (a) => `/areas/${a.id}/status`,
			buildBody: (next) => ({ activo: next }),

			readBoolFromResponse: (res, fallback) =>
				res.data?.area?.activo ?? res.data?.data?.activo ?? fallback,
		});

	const filterdAreas = useMemo(() => {
		return areas.filter((a) =>
			a.name.toLowerCase().includes(search.toLowerCase()),
		);
	}, [areas, search]);

	const handleDelete = async (area) => {
		try {
			await privateInstance.delete(`/areas/${area.id}/delete`);
			setAreas((prev) => prev.filter((x) => x.id !== area.id));
		} catch (err) {
			if (err.response?.status === 409) {
				alert(
					err.response.data?.message ||
						"No se puede eliminar: tiene usuarios asignados.",
				);
				return;
			}
			if (err.response?.status === 403) {
				alert(
					err.response.data?.message ||
						"No tienes permiso para eliminar áreas.",
				);
				return;
			}
			console.error("Error al eliminar área:", err);
			alert("No se pudo eliminar el área. Intenta de nuevo.");
		}
	};

	if (!user) {
		return (
			<div className="p-6 text-center text-slate-500 dark:text-slate-300">
				{" "}
				Cargando...{" "}
			</div>
		);
	}

	if (!isAdmin) return <PermissionDenied />;

	return (
		<div className="min-h-screen w-full bg-slate-100 dark:bg-slate-950 px-6 py-6 text-slate-800 dark:text-slate-200">
			<header className="flex items-center justify-between mb-6">
				<h1 className="text-2xl font-bold flex items-center gap-2 px-2">
					{" "}
					AREAS DE TRABAJO{" "}
				</h1>
				<IconCreate to="/admin/areas/create" label="Area" />
			</header>

			<section className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-5">
				<div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
					<div className="relative w-full md:max-w-sm">
						<SearchInputLong
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							placeholder="Buscar permisos..."
						/>
					</div>
					<span className="text-xs text-slate-500 dark:text-slate-400"> </span>
				</div>

				<div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800">
					<table className="min-w-full text-sm">
						<thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase text-xs">
							<tr>
								<th className="px-4 py-3 text-left">ID</th>
								<th className="px-4 py-3 text-left">Nombre</th>
								<th className="px-4 py-3 text-left">Activo</th>
								<th className="px-4 py-3 text-center w-[150px]">Acciones</th>
							</tr>
						</thead>

						<tbody className="divide-y divide-slate-200 dark:divide-slate-800">
							{filterdAreas.length === 0 ? (
								<tr>
									<td
										colSpan={3}
										className="px-4 py-6 text-center text-slate-500 dark:text-slate-400"
									>
										{" "}
										Cargando Areas...{" "}
									</td>
								</tr>
							) : (
								filterdAreas.map((area) => (
									<tr
										key={area.id}
										className="hover:bg-slate-100 dark:hover:bg-slate-800/70 transition"
									>
										<td className="px-4 py-3 font-semibold">{area.id}</td>
										<td className="px-4 py-3 font-semibold">{area.name}</td>
										<td className="px-4 py-3">
											<span
												className={`px-3 py-1 rounded-full text-xs ${area.activo ? "bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-300" : "bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-300"}`}
											>
												{area.activo ? "Activo" : "Inactivo"}
											</span>
										</td>
										<td className="px-4 py-3">
											<div className="flex justify-center gap-2">
												<ToggleUserStatusButton
													active={!!area.activo}
													loading={loadingAreaId === area.id}
													label={area.activo ? "Desactivar" : "Activar"}
													onToggle={() => toggleAreaStatus(area)}
												/>
												<IconDelete
													onClick={() =>
														openModal({
															message: `¿Quieres eliminar el area "${area.name} "?\nSi el area esta ligada a usuarios no se podra eliminar. \nEsta acción no se podrá revertir.`,
															onConfirm: () => handleDelete(area),
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
