import { privateInstance } from "../../../api/axios";
import { useParams } from "react-router-dom";
import EditShow from "../../../components/icons/Crud/EditShow";
import BackButton from "../../../components/UI/ConfirmBtn/ExitConfirmShow";
import FlashMessage from "../../../components/UI/Errors/ErrorsGlobal";
import useFlashMessage from "../../../hooks/Errors/ErrorMessage";
import { formatDateTime } from "../../../utils/date";
import { useEffect, useState } from "react";

export default function ShowGuardias() {
	const { id } = useParams();

	const [guardia, setGuardia] = useState(null);
	const [loading, setLoading] = useState(true);

	const { message, showMessage, clearMessage } = useFlashMessage();

	useEffect(() => {
		if (!id) return;
		let alive = true;
		const load = async () => {
			setLoading(true);
			clearMessage();
			try {
				const res = await privateInstance.get(
					`operaciones/guardias/${id}/show`,
				);
				if (!alive) return;
				const g = res.data?.data || res.data?.guardia || res.data || null;
				setGuardia(g);
			} catch (err) {
				if (!alive) return;
				const status = err?.response?.status || 0;
				if (status === 404) {
					showMessage("Guardia no encontrada", "error");
				} else {
					showMessage("Error al cargar la guardia", "error");
				}
				setGuardia(null);
			} finally {
				if (!alive) setLoading(false);
			}
		};
		load();
		return () => {
			alive = false;
		};
	}, [id, showMessage, clearMessage]);

	console.log(guardia);
	return (
		<div className="min-h-screen w-full px-8 py-8 bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-200">
			<header className="flex items-start justify-between mb-6">
				<div>
					<p className="text-lg font-semibold">Guardias</p>
					<h1 className="text-3xl font-bold mx-1">
						Detalle de la Guardia #{guardia?.id || "Cargando..."}
					</h1>
				</div>
				<div className="flex items-center gap-2">
					<EditShow></EditShow>
					<BackButton></BackButton>
				</div>
			</header>
			<FlashMessage message={message} />

			{!guardia ? (
				<div className="text-center text-slate-500 dark:text-slate-300 py-14">
					Sin información para mostrar.
				</div>
			) : (
				<div className="space-y-5 w-[90%] mx-auto">
					<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
						<div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3">
							<p className="text-xs text-slate-400 dark:text-slate-500 mb-1">
								USUARIO
							</p>
							<p className="text-base font-semibold text-slate-800 dark:text-slate-100">
								{guardia.user?.name || "—"}
							</p>
						</div>

						<div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3">
							<p className="text-xs text-slate-400 dark:text-slate-500 mb-1">
								ENTRADA
							</p>
							<p className="text-base font-semibold text-slate-800 dark:text-slate-100 truncate">
								{formatDateTime(guardia.dateInit) || "—"}
							</p>
						</div>

						<div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3">
							<p className="text-xs text-slate-400 dark:text-slate-500 mb-1">
								SALIDA
							</p>
							<p className="text-base font-semibold text-slate-800 dark:text-slate-100 truncate">
								{formatDateTime(guardia.dateFinish) || "NO REGISTRADA AÚN"}
							</p>
						</div>
						<div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3">
							<p className="text-xs text-slate-400 dark:text-slate-500 mb-1">
								ESTATUS GUARDIA
							</p>
							<p className="text-base font-semibold text-slate-800 dark:text-slate-100 truncate">
								{guardia.status_label}
							</p>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
