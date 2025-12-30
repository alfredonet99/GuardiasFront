import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { privateInstance } from "../../../../api/axios";
import BackButton from "../../../../components/UI/ConfirmBtn/ExitConfirmShow";
import FlashMessage from "../../../../components/UI/Errors/ErrorsGlobal";
import useFlashMessage from "../../../../hooks/Errors/ErrorMessage";

export default function ShowClientVeeam() {
	const { id } = useParams();

	const [loading, setLoading] = useState(true);
	const [cliente, setCliente] = useState(null);

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

	if (loading) {
		return (
			<div className="p-8 text-center text-slate-500 dark:text-slate-300">
				Cargando cliente...
			</div>
		);
	}

	console.log(cliente);
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
								{/* ID */}
								<div>
									<div className="text-sm text-slate-500 dark:text-slate-400">
										ID Cliente
									</div>
									<div className="mt-1 text-lg font-semibold">
										{cliente.numCV || "NO IDENTIFICADO"}
									</div>
								</div>

								{/* Nombre */}
								<div>
									<div className="text-sm text-slate-500 dark:text-slate-400">
										Nombre del Cliente
									</div>
									<div className="mt-1 text-lg font-semibold">
										{cliente.nameCV || "-"}
									</div>
								</div>

								{/* Aplicativo */}
								<div>
									<div className="text-sm text-slate-500 dark:text-slate-400">
										Aplicativo
									</div>
									<div className="mt-1 text-lg font-semibold">
										{cliente.app_c_v?.nameService ?? "-"}
									</div>
								</div>

								{/* Storage */}
								<div>
									<div className="text-sm text-slate-500 dark:text-slate-400">
										Almacenamiento
									</div>
									<div className="mt-1 text-lg font-semibold">
										{cliente.backup || "-"}
									</div>
								</div>

								{/* Jobs */}
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

								{/* Status */}
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
						<table className="min-w-full text-left">
							<thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase text-sm">
								<th className="px-4 py-3 text-center">
									HISTORIAL PUNTOS DE RESTAURACION
								</th>
							</thead>
							<tbody className="text-slate-700 dark:text-slate-300">
								<tr className="border-t border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
									<th className="px-4 py-3 text-center">hola</th>
								</tr>
							</tbody>
						</table>

						<div className="h-px bg-slate-200 dark:bg-slate-800" />
					</div>
				)}
			</section>
		</div>
	);
}
