import { useCallback, useEffect, useState } from "react";
import { privateInstance } from "../../../../api/axios";
import {
	IconCreate,
	IconDelete,
	IconEdit,
	IconShow,
	IconImport,
	IconExport,
} from "../../../../components/icons/Crud/exportCrud";
import ToggleUserStatusButton from "../../../../components/UI/Active/BtnActive";
import StatusList from "../../../../components/UI/Active/Status";
import DeleteConfirm from "../../../../components/UI/ConfirmBtn/DeleteConfirm";
import Paginator from "../../../../components/UI/Paginacion/PaginationUI";
import SearchInputLong from "../../../../components/UI/Search/SearchLong";
import useGlobalDelete from "../../../../hooks/Confirm/DeleteG";
import { formatDateNew } from "../../../../utils/date";
import ModalExportSimple from "../../../../components/UI/Modals/ModalExportSimple";
import ModalImportResult from "../../../../components/UI/Modals/ModalImportResult";
import BtnDisableSelectAll from "../../../../components/UI/Active/BtnDisableSelectAll";
import BtnActiveSelectAll from "../../../../components/UI/Active/BtnActiveSelectAll";
import SelectAllDesactive from "../../../../hooks/SelectAllDesactive";
import StyleCheck from "../../../../components/UI/CheckBox/StyleCheck";
import BtnCancelSelectAll from "../../../../components/UI/Active/BtnCancelSelectAll";

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

	const { modal, openModal, closeModal, confirm } = useGlobalDelete();

	const [exportOpen, setExportOpen] = useState(false);
	const [exporting, setExporting] = useState(false);

	const [processResultOpen, setProcessResultOpen] = useState(false);
	const [processResult, setProcessResult] = useState(null);

	const [bulkDisabling, setBulkDisabling] = useState(false);
	const [bulkEnabling, setBulkEnabling] = useState(false);
	const [bulkMode, setBulkMode] = useState(null);

	const fetchClientes = useCallback(
		async (overrides = {}) => {
			const nextSearch = overrides.search ?? search;
			const nextPage = overrides.page ?? page;
			const nextInactive = overrides.inactive ?? inactive;

			setLoading(true);
			setError(null);

			try {
				const res = await privateInstance.get("/operaciones/clientes/veeam", {
					params: {
						search: nextSearch,
						page: nextPage,
						inactive: nextInactive,
					},
				});

				const p = res.data || {};

				setClientes(Array.isArray(p.data) ? p.data : []);

				setMeta({
					last_page: p.last_page ?? 1,
					total: p.total ?? 0,
					per_page: p.per_page ?? 30,
				});

				setInitialLoaded(true);
			} catch (e) {
				setError(
					e?.response?.data?.message ||
						e?.message ||
						"Error al cargar clientes Veeam.",
				);

				setInitialLoaded(true);
			} finally {
				setLoading(false);
			}
		},
		[search, page, inactive],
	);

	useEffect(() => {
		fetchClientes();
	}, [fetchClientes]);

	const getClientId = useCallback((cliente) => cliente.id, []);

	const canSelectBulkClient = useCallback(
		(cliente) => {
			if (bulkMode === "disable") return !!cliente.activo;
			if (bulkMode === "enable") return !cliente.activo;

			return false;
		},
		[bulkMode],
	);

	const bulkClients = SelectAllDesactive({
		items: clientes,
		getId: getClientId,
		canSelect: canSelectBulkClient,
	});

	const tableColSpan = bulkClients.selectionMode ? 8 : 7;

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

	const handleDeleteClient = async (c) => {
		try {
			await privateInstance.delete(`/operaciones/cliente-veeam/${c.id}/delete`);

			setClientes((prev) => prev.filter((x) => x.id !== c.id));
		} catch (err) {
			if (err.response?.status === 409) {
				alert(
					err.response.data?.message ||
						"No se puede eliminar: el cliente tiene relaciones asignadas.",
				);
				return;
			}

			if (err.response?.status === 403) {
				alert(
					err.response.data?.message ||
						"No tienes permiso para eliminar clientes Veeam.",
				);
				return;
			}

			if (err.response?.status === 404) {
				alert(
					err.response.data?.message ||
						"El cliente no existe o ya fue eliminado.",
				);
				return;
			}

			console.error("Error al eliminar cliente Veeam:", err);
			alert("No se pudo eliminar el cliente. Intenta de nuevo.");
		}
	};

	const handleExportClientes = async (format = "xlsx") => {
		setExporting(true);

		try {
			const response = await privateInstance.get(
				"/operaciones/clientes-veeam/export",
				{
					params: { format },
					responseType: "blob",
				},
			);

			const extension = format === "csv" ? "csv" : "xlsx";

			const contentType =
				format === "csv"
					? "text/csv;charset=utf-8"
					: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

			const blob = new Blob([response.data], {
				type: contentType,
			});

			const url = window.URL.createObjectURL(blob);
			const link = document.createElement("a");

			link.href = url;
			link.setAttribute(
				"download",
				`clientes_veeam_${new Date().toISOString().slice(0, 10)}.${extension}`,
			);

			document.body.appendChild(link);
			link.click();

			link.remove();
			window.URL.revokeObjectURL(url);

			setExportOpen(false);
		} catch (error) {
			console.error("[ListClientVeeam] export error:", error);
			alert("No se pudo exportar el archivo de clientes Veeam.");
		} finally {
			setExporting(false);
		}
	};

	const handleImportClientes = async (file) => {
		const formData = new FormData();
		formData.append("file", file);

		const res = await privateInstance.post(
			"/operaciones/clientes/veeam/import",
			formData,
			{
				headers: {
					"Content-Type": "multipart/form-data",
				},
			},
		);

		const data = res.data || {};

		setProcessResult(data);
		setProcessResultOpen(true);

		setPage(1);
		await fetchClientes({ page: 1 });

		return res;
	};

	const handleBulkButton = (mode, action) => {
		if (bulkMode !== mode || !bulkClients.selectionMode) {
			setBulkMode(mode);
			bulkClients.clearSelection();
			bulkClients.openSelectionMode();
			return;
		}

		if (!bulkClients.hasSelected) return;

		action();
	};

	const handleDisableButton = () => {
		handleBulkButton("disable", handleBulkDeactivate);
	};

	const handleActiveButton = () => {
		handleBulkButton("enable", handleBulkActivate);
	};

	const handleBulkStatusChange = async ({
		nextActivo,
		setBulkLoading,
		errorMessage,
	}) => {
		if (!bulkClients.hasSelected) return;

		setBulkLoading(true);

		try {
			const ids = bulkClients.selectedIds;

			await Promise.all(
				ids.map((clientId) =>
					privateInstance.patch(
						`/operaciones/clientes/veeam/${clientId}/client-deactivate`,
						{ activo: nextActivo },
					),
				),
			);

			setClientes((prev) =>
				prev.map((cliente) =>
					ids.includes(cliente.id)
						? { ...cliente, activo: nextActivo }
						: cliente,
				),
			);

			handleCancelBulkSelection();
		} catch (error) {
			console.error("[ListClientVeeam] bulk status error:", error);
			alert(errorMessage);
		} finally {
			setBulkLoading(false);
		}
	};

	const handleBulkDeactivate = () => {
		handleBulkStatusChange({
			nextActivo: false,
			setBulkLoading: setBulkDisabling,
			errorMessage: "No se pudieron deshabilitar los clientes seleccionados.",
		});
	};

	const handleBulkActivate = () => {
		handleBulkStatusChange({
			nextActivo: true,
			setBulkLoading: setBulkEnabling,
			errorMessage: "No se pudieron habilitar los clientes seleccionados.",
		});
	};

	const handleCancelBulkSelection = () => {
		bulkClients.closeSelectionMode();
		setBulkMode(null);
	};

	const clientsTotal = meta.total ?? 0;
	const clientsPerPage = meta.per_page ?? 30;

	const clientsFrom = clientsTotal === 0 ? 0 : (page - 1) * clientsPerPage + 1;

	const clientsTo = Math.min(page * clientsPerPage, clientsTotal);

	const isDisableMode = bulkMode === "disable";
	const isEnableMode = bulkMode === "enable";
	const isBulkLoading = bulkDisabling || bulkEnabling;
	const isBulkSelectionMode = bulkClients.selectionMode;

	return (
		<div className=" min-h-screen w-full bg-slate-100 dark:bg-slate-950 px-6 py-6 text-slate-800 dark:text-slate-200">
			<header className="flex items-center justify-between mb-6">
				<h1 className="text-2xl font-bold px-2 text-slate-800 dark:text-slate-100">
					Lista Clientes Veeam
				</h1>

				<div className="flex items-center gap-2 justify-end">
					{isEnableMode ? (
						<BtnCancelSelectAll
							onClick={handleCancelBulkSelection}
							disabled={isBulkLoading}
						/>
					) : (
						<BtnDisableSelectAll
							onClick={handleDisableButton}
							active={isDisableMode && isBulkSelectionMode}
							count={isDisableMode ? bulkClients.selectedCount : 0}
							loading={bulkDisabling}
							disabled={loading || bulkEnabling}
						/>
					)}

					{isDisableMode ? (
						<BtnCancelSelectAll
							onClick={handleCancelBulkSelection}
							disabled={isBulkLoading}
						/>
					) : (
						<BtnActiveSelectAll
							onClick={handleActiveButton}
							active={isEnableMode && isBulkSelectionMode}
							count={isEnableMode ? bulkClients.selectedCount : 0}
							loading={bulkEnabling}
							disabled={loading || bulkDisabling}
						/>
					)}

					<StatusList
						value={inactive}
						onChange={(val) => {
							setInactive(val);
							setPage(1);
							handleCancelBulkSelection();
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
						<span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
							<span>Mostrando</span>

							<span className="text-slate-900 dark:text-slate-100">
								{clientsFrom}
							</span>

							<span>-</span>

							<span className="text-slate-900 dark:text-slate-100">
								{clientsTo}
							</span>

							<span>de</span>

							<span className="text-slate-900 dark:text-slate-100">
								{clientsTotal}
							</span>

							<span>clientes</span>
						</span>
						{bulkClients.selectionMode && (
							<span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700 dark:bg-red-900/40 dark:text-red-300">
								{bulkClients.selectedCount} seleccionado(s)
							</span>
						)}
						<IconImport onSubmit={handleImportClientes} />
						<IconExport
							onClick={() => setExportOpen(true)}
							disabled={exporting}
						/>
						<IconCreate
							to="/operaciones/clientes/veeam/crear-client-veeam"
							label={"Cliente"}
						/>
					</div>
				</div>

				<div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800">
					<table className="min-w-full text-sm">
						<thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase text-xs">
							<tr>
								{bulkClients.selectionMode && (
									<th className="px-4 py-3 text-center">
										<div className="flex justify-center">
											<StyleCheck
												checked={bulkClients.allVisibleSelected}
												indeterminate={bulkClients.someVisibleSelected}
												onChange={bulkClients.toggleAllVisible}
												disabled={bulkClients.selectableCount === 0}
												ariaLabel={
													isEnableMode
														? "Seleccionar todos los clientes inactivos"
														: "Seleccionar todos los clientes activos"
												}
											/>
										</div>
									</th>
								)}
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
										{bulkClients.selectionMode && (
											<td className="px-4 py-3 text-center">
												<div className="flex justify-center">
													<StyleCheck
														type="checkbox"
														checked={bulkClients.isSelected(c)}
														onChange={() => bulkClients.toggleOne(c)}
														disabled={
															isDisableMode
																? !c.activo
																: isEnableMode
																	? !!c.activo
																	: true
														}
														className="h-6 w-6 cursor-pointer rounded border-slate-300 text-red-600 focus:ring-red-500 disabled:cursor-not-allowed disabled:opacity-50"
													/>
												</div>
											</td>
										)}

										<td className="px-4 py-3 font-semibold">
											{c.numCV ?? "-"}
										</td>
										<td className="px-4 py-3">{c.nameCV ?? "-"}</td>
										<td className="px-4 py-3">
											{c.app_c_v?.nameService ?? "-"}
										</td>
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

										<td className="px-4 py-3">
											{c.last_restore_date
												? formatDateNew(c.last_restore_date)
												: "--"}
										</td>

										<td className="px-4 py-3 text-center">
											<div className="flex justify-center gap-2">
												<IconShow
													to={`/operaciones/clientes/veeam/${c.id}/ver-client-veeam`}
												/>
												<IconEdit
													to={`/operaciones/clientes/veeam/${c.id}/editar-client-veeam`}
												/>

												<ToggleUserStatusButton
													active={!!c.activo}
													label={c.activo ? "Desactivar" : "Activar"}
													loading={statusLoadingId === c.id}
													onToggle={() => onToggleClientStatus(c.id, c.activo)}
												/>

												<IconDelete
													onClick={() =>
														openModal({
															message: `¿Quieres eliminar el cliente "${c.nameCV} con ID ${c.numCV}? \nEsta acción no se podrá revertir.`,
															onConfirm: () => handleDeleteClient(c),
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
				{meta.total > 0 && (
					<Paginator page={page} lastPage={meta.last_page} setPage={setPage} />
				)}
				<DeleteConfirm
					isOpen={modal.isOpen}
					message={modal.message}
					onCancel={closeModal}
					onConfirm={confirm}
				/>
				<ModalExportSimple
					open={exportOpen}
					title="Exportar clientes Veeam"
					onClose={() => setExportOpen(false)}
					onExport={handleExportClientes}
					loading={exporting}
				/>
				<ModalImportResult
					open={processResultOpen}
					title="Resultado de importación"
					summary={{
						success: processResult?.inserted ?? 0,
						total: processResult?.processed ?? 0,
						label: "clientes correctos",
						message: processResult?.message ?? "Importación finalizada.",
					}}
					counters={[
						{
							label: "Procesados",
							value: processResult?.processed ?? 0,
						},
						{
							label: "Insertados",
							value: processResult?.inserted ?? 0,
						},
						{
							label: "Existentes",
							value: processResult?.skipped_existing ?? 0,
						},
						{
							label: "Duplicados archivo",
							value: processResult?.skipped_duplicates_file ?? 0,
						},
					]}
					rows={processResult?.not_processed ?? []}
					rowsTitle="Clientes no procesados"
					columns={[
						{
							header: "Fila",
							accessor: "row",
						},
						{
							header: "ID Cliente",
							accessor: "id_cliente",
						},
						{
							header: "Nombre",
							accessor: "nombre",
						},
						{
							header: "Motivo",
							accessor: "motivo",
							danger: true,
						},
					]}
					emptyMessage="Todos los clientes fueron procesados correctamente."
					onClose={() => {
						setProcessResultOpen(false);
						setProcessResult(null);
					}}
				/>
			</section>
		</div>
	);
}
