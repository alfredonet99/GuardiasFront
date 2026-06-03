import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { privateInstance } from "../../../../api/axios";
import BackButton from "../../../../components/UI/ConfirmBtn/ExitConfirmShow";
import FlashMessage from "../../../../components/UI/Errors/ErrorsGlobal";
import useFlashMessage from "../../../../hooks/Errors/ErrorMessage";
import { formatDate } from "../../../../utils/date";
import EditShow from "../../../../components/icons/Crud/EditShow";

const PER_PAGE = 10;

// ── Calcula "hace N días / meses / años" desde una fecha string ──────────────
function timeAgo(dateStr) {
	const date = new Date(dateStr);
	if (isNaN(date)) return "";

	const now = new Date();
	const diffMs = now - date;
	const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

	if (diffDays < 1) return "hoy";
	if (diffDays === 1) return "hace 1 día";
	if (diffDays < 30) return `hace ${diffDays} días`;
	if (diffDays < 365) {
		const months = Math.floor(diffDays / 30);
		return months === 1 ? "hace 1 mes" : `hace ${months} meses`;
	}
	const years = Math.floor(diffDays / 365);
	return years === 1 ? "hace 1 año" : `hace ${years} años`;
}

export default function ShowClientVeeam() {
	const { id } = useParams();

	const [loading, setLoading] = useState(true);
	const [cliente, setCliente] = useState(null);
	const [page, setPage] = useState(1);

	const { message, showMessage, clearMessage } = useFlashMessage();

	useEffect(() => {
		if (!id) return;

		let alive = true;
		const load = async () => {
			setLoading(true);
			clearMessage();

			try {
				const res = await privateInstance.get(
					`operaciones/cliente-veeam/show/${id}`,
				);
				if (!alive) return;
				const c = res.data?.data || res.data?.cliente || res.data || null;
				setCliente(c);
			} catch (error) {
				if (!alive) return;
				const status = error.response?.status;
				if (status === 404) {
					showMessage("El cliente no existe o fue eliminado.", "error");
				} else {
					showMessage(
						error.response?.data?.message ||
							"No se pudo cargar el cliente. Intenta de nuevo.",
						"error",
					);
				}
				setCliente(null);
			} finally {
				if (alive) setLoading(false);
			}
		};

		load();
		return () => {
			alive = false;
		};
	}, [id, clearMessage, showMessage]);

	const restoreDates = useMemo(() => {
		const rows = Array.isArray(cliente?.monit_v) ? cliente.monit_v : [];
		return Array.from(
			new Set(
				rows.map((r) => String(r?.dateRest ?? "").trim()).filter(Boolean),
			),
		);
	}, [cliente]);

	useEffect(() => {
		if (restoreDates.length === 0) {
			setPage(1);
			return;
		}

		setPage(1);
	}, [restoreDates.length]);

	const totalPages = useMemo(
		() => Math.max(1, Math.ceil(restoreDates.length / PER_PAGE)),
		[restoreDates.length],
	);

	const pageItems = useMemo(() => {
		const start = (page - 1) * PER_PAGE;
		return restoreDates.slice(start, start + PER_PAGE);
	}, [restoreDates, page]);

	useEffect(() => {
		if (page > totalPages) setPage(totalPages);
		if (page < 1) setPage(1);
	}, [page, totalPages]);

	// ── Genera el rango de páginas a mostrar (máx 5) ────────────────────────
	const pageRange = useMemo(() => {
		const delta = 2;
		const range = [];
		const left = Math.max(1, page - delta);
		const right = Math.min(totalPages, page + delta);
		for (let i = left; i <= right; i++) range.push(i);
		return range;
	}, [page, totalPages]);

	if (loading) {
		return (
			<div className="p-8 text-center text-slate-500 dark:text-slate-300">
				Cargando cliente...
			</div>
		);
	}

	return (
		<div className="min-h-screen w-full px-8 py-8 bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-200">
			{/* ── Header ──────────────────────────────────────────────────────── */}
			<header className="flex items-start justify-between mb-6">
				<div>
					<p className="text-xs font-medium uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">
						Clientes Veeam
					</p>
					<h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100 leading-tight">
						{cliente?.nameCV ?? "Sin nombre"}
					</h1>
				</div>

				<div className="flex items-center gap-2">
					<EditShow
						to={`/operaciones/clientes/veeam/${id}/editar-client-veeam`}
						id={id}
					/>
					<BackButton to="/operaciones/clientes/veeam/lista-client-veeam" />
				</div>
			</header>

			<FlashMessage message={message} />

			{!cliente ? (
				<div className="text-center text-slate-500 dark:text-slate-300 py-14">
					Sin información para mostrar.
				</div>
			) : (
				<div className="space-y-5 max-w-4xl mx-auto">
					{/* ── Métricas rápidas ───────────────────────────────────────── */}
					<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
						{/* ID */}
						<div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3">
							<p className="text-xs text-slate-400 dark:text-slate-500 mb-1">
								ID Cliente
							</p>
							<p className="text-base font-semibold text-slate-800 dark:text-slate-100">
								{cliente.numCV || "—"}
							</p>
						</div>

						{/* Aplicativo */}
						<div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3">
							<p className="text-xs text-slate-400 dark:text-slate-500 mb-1">
								Aplicativo
							</p>
							<p className="text-base font-semibold text-slate-800 dark:text-slate-100 truncate">
								{cliente.app_c_v?.nameService ?? "—"}
							</p>
						</div>

						{/* Repositorio */}
						<div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3">
							<p className="text-xs text-slate-400 dark:text-slate-500 mb-1">
								Repositorio
							</p>
							<p className="text-base font-semibold text-slate-800 dark:text-slate-100">
								{cliente.backup || "—"}
							</p>
						</div>

						{/* Jobs */}
						<div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3">
							<p className="text-xs text-slate-400 dark:text-slate-500 mb-1">
								Jobs
							</p>
							<p className="text-base font-semibold text-slate-800 dark:text-slate-100">
								{Number.isFinite(Number(cliente.jobs))
									? Number(cliente.jobs)
									: 0}
							</p>
						</div>

						{/* Estatus */}
						<div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3">
							<p className="text-xs text-slate-400 dark:text-slate-500 mb-1">
								Estatus
							</p>
							<span
								className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
									cliente.activo
										? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300"
										: "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300"
								}`}
							>
								<span
									className={`w-1.5 h-1.5 rounded-full ${
										cliente.activo ? "bg-green-500" : "bg-red-500"
									}`}
								/>
								{cliente.activo ? "Activo" : "Inactivo"}
							</span>
						</div>
					</div>

					{/* ── Historial puntos de restauración ──────────────────────── */}
					<div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
						{/* Título + contador */}
						<div className="flex items-center justify-between mb-4">
							<div className="flex items-center gap-2">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="16"
									height="16"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
									className="text-slate-400"
									aria-hidden="true"
								>
									<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
									<path d="M3 3v5h5" />
									<path d="M12 7v5l4 2" />
								</svg>
								<span className="text-xs font-medium uppercase tracking-widest text-slate-500 dark:text-slate-400">
									Historial puntos de restauración
								</span>
							</div>
							{restoreDates.length > 0 && (
								<span className="text-xs text-slate-400 dark:text-slate-500">
									{restoreDates.length} registro
									{restoreDates.length !== 1 ? "s" : ""}
									{totalPages > 1 && ` · pág. ${page} de ${totalPages}`}
								</span>
							)}
						</div>

						{/* Tabla */}
						<div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800">
							<table className="min-w-full text-sm">
								<thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">
									<tr>
										<th className="px-4 py-2.5 text-left font-medium">#</th>
										<th className="px-4 py-2.5 text-left font-medium">Fecha</th>
										<th className="px-4 py-2.5 text-right font-medium">
											Antigüedad
										</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-slate-100 dark:divide-slate-800">
									{restoreDates.length === 0 ? (
										<tr>
											<td
												colSpan={3}
												className="px-4 py-8 text-center text-slate-400 dark:text-slate-500"
											>
												Sin puntos de restauración registrados.
											</td>
										</tr>
									) : (
										pageItems.map((dateStr, i) => (
											<tr
												key={dateStr}
												className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
											>
												<td className="px-4 py-3 text-slate-400 dark:text-slate-500 text-xs">
													{(page - 1) * PER_PAGE + i + 1}
												</td>
												<td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-100">
													{formatDate(dateStr)}
												</td>
												<td className="px-4 py-3 text-right text-xs text-slate-400 dark:text-slate-500">
													{timeAgo(dateStr)}
												</td>
											</tr>
										))
									)}
								</tbody>
							</table>
						</div>

						{/* Paginación con números */}
						{totalPages > 1 && (
							<div className="flex items-center justify-between mt-4">
								<button
									type="button"
									onClick={() => setPage((p) => Math.max(1, p - 1))}
									disabled={page <= 1}
									className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg
										border border-slate-200 dark:border-slate-700
										bg-white dark:bg-slate-900
										text-sm text-slate-600 dark:text-slate-300
										disabled:opacity-40 disabled:cursor-not-allowed
										hover:bg-slate-50 dark:hover:bg-slate-800 transition"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="14"
										height="14"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="2.5"
										strokeLinecap="round"
										strokeLinejoin="round"
										aria-hidden="true"
									>
										<path d="m15 18-6-6 6-6" />
									</svg>
									Anterior
								</button>

								<div className="flex items-center gap-1">
									{pageRange.map((p) => (
										<button
											key={p}
											type="button"
											onClick={() => setPage(p)}
											className={`w-8 h-8 rounded-lg text-sm font-medium transition ${
												p === page
													? "bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900"
													: "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
											}`}
										>
											{p}
										</button>
									))}
								</div>

								<button
									type="button"
									onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
									disabled={page >= totalPages}
									className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg
										border border-slate-200 dark:border-slate-700
										bg-white dark:bg-slate-900
										text-sm text-slate-600 dark:text-slate-300
										disabled:opacity-40 disabled:cursor-not-allowed
										hover:bg-slate-50 dark:hover:bg-slate-800 transition"
								>
									Siguiente
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="14"
										height="14"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="2.5"
										strokeLinecap="round"
										strokeLinejoin="round"
										aria-hidden="true"
									>
										<path d="m9 18 6-6-6-6" />
									</svg>
								</button>
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
