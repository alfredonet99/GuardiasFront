import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { privateInstance } from "../../../../api/axios";
import BackButton from "../../../../components/UI/ConfirmBtn/ExitConfirmShow";
import FlashMessage from "../../../../components/UI/Errors/ErrorsGlobal";
import useFlashMessage from "../../../../hooks/Errors/ErrorMessage";
import { formatDate } from "../../../../utils/date";

const PER_PAGE = 10; // ✅ prueba 1 en 1

export default function ShowClientVeeam() {
	const { id } = useParams();

	const [loading, setLoading] = useState(true);
	const [cliente, setCliente] = useState(null);

	// ✅ paginación (front)
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

	// ✅ backend manda dateRest no-null y único (A) (igual lo aseguramos)
	const restoreDates = useMemo(() => {
		const rows = Array.isArray(cliente?.monit_v) ? cliente.monit_v : [];
		const uniq = Array.from(
			new Set(
				rows.map((r) => String(r?.dateRest ?? "").trim()).filter(Boolean),
			),
		);
		return uniq;
	}, [cliente]);

	// ✅ cuando cambie la data, regresamos a la primer página
	useEffect(() => {
		setPage(1);
	}, [restoreDates.length]);

	const totalPages = useMemo(() => {
		return Math.max(1, Math.ceil(restoreDates.length / PER_PAGE));
	}, [restoreDates.length]);

	const pageItems = useMemo(() => {
		const start = (page - 1) * PER_PAGE;
		return restoreDates.slice(start, start + PER_PAGE);
	}, [restoreDates, page]);

	// ✅ clamp por si cambia el array y la page queda fuera
	useEffect(() => {
		if (page > totalPages) setPage(totalPages);
		if (page < 1) setPage(1);
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
			<header className="flex items-center justify-between mb-8">
				<div className="space-y-1">
					<h1 className="text-3xl font-bold mx-1">Detalle Cliente Veeam</h1>
				</div>
				<BackButton to="/operaciones/clientes/veeam/lista-client-veeam" />
			</header>

			<section className="bg-white dark:bg-slate-900 rounded-2xl shadow border border-slate-200 dark:border-slate-800 p-8 max-w-4xl mx-auto">
				<FlashMessage message={message} />

				{!cliente ? (
					<div className="text-center text-slate-500 dark:text-slate-300 py-14">
						Sin información para mostrar.
					</div>
				) : (
					<div className="space-y-6">
						{/* Tarjeta principal */}
						<div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 px-6 py-6">
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-6">
								<div>
									<div className="text-sm text-slate-500 dark:text-slate-400">
										ID Cliente
									</div>
									<div className="mt-1 text-lg font-semibold">
										{cliente.numCV || "NO IDENTIFICADO"}
									</div>
								</div>

								<div>
									<div className="text-sm text-slate-500 dark:text-slate-400">
										Nombre del Cliente
									</div>
									<div className="mt-1 text-lg font-semibold">
										{cliente.nameCV || "-"}
									</div>
								</div>

								<div>
									<div className="text-sm text-slate-500 dark:text-slate-400">
										Aplicativo
									</div>
									<div className="mt-1 text-lg font-semibold">
										{cliente.app_c_v?.nameService ?? "-"}
									</div>
								</div>

								<div>
									<div className="text-sm text-slate-500 dark:text-slate-400">
										Almacenamiento
									</div>
									<div className="mt-1 text-lg font-semibold">
										{cliente.backup || "-"}
									</div>
								</div>

								<div>
									<div className="text-sm text-slate-500 dark:text-slate-400">
										Cantidad de Jobs
									</div>
									<div className="mt-1 text-lg font-semibold">
										{Number.isFinite(Number(cliente.jobs))
											? Number(cliente.jobs)
											: 0}
									</div>
								</div>

								<div>
									<div className="text-sm text-slate-500 dark:text-slate-400">
										Estatus
									</div>
									<div className="mt-2">
										<span
											className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-semibold border ${
												cliente.activo
													? "bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-300"
													: "bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-300"
											}`}
										>
											{cliente.activo ? "Activo" : "Inactivo"}
										</span>
									</div>
								</div>
							</div>
						</div>

						{/* ✅ HISTORIAL PUNTOS DE RESTAURACIÓN */}
						<table className="min-w-full text-left border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
							<thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase text-sm">
								<tr>
									<th className="px-4 py-3 text-center">
										HISTORIAL PUNTOS DE RESTAURACIÓN
									</th>
								</tr>
							</thead>

							<tbody className="text-slate-700 dark:text-slate-300">
								{restoreDates.length ? (
									pageItems.map((dateStr) => (
										<tr
											key={dateStr}
											className="border-t border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
										>
											<td className="px-4 py-3 text-center font-semibold">
												{formatDate(dateStr)}
											</td>
										</tr>
									))
								) : (
									<tr className="border-t border-slate-200 dark:border-slate-700">
										<td className="px-4 py-3 text-center text-slate-500 dark:text-slate-400">
											Sin puntos de restauración registrados.
										</td>
									</tr>
								)}
							</tbody>
						</table>

						{/* ✅ CONTROLES PAGINACIÓN */}
						{restoreDates.length > 0 ? (
							<div className="mt-3 flex items-center justify-between gap-3">
								<button
									type="button"
									onClick={() => setPage((p) => Math.max(1, p - 1))}
									disabled={page <= 1}
									className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-semibold disabled:opacity-50"
								>
									Anterior
								</button>

								<div className="text-sm text-slate-600 dark:text-slate-300">
									Página <b>{page}</b> de <b>{totalPages}</b>
								</div>

								<button
									type="button"
									onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
									disabled={page >= totalPages}
									className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-semibold disabled:opacity-50"
								>
									Siguiente
								</button>
							</div>
						) : null}

						<div className="h-px bg-slate-200 dark:bg-slate-800" />
					</div>
				)}
			</section>
		</div>
	);
}
