import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { privateInstance } from "../../../api/axios";
import IconEditShow from "../../../components/icons/Crud/EditShow";
import BackButton from "../../../components/UI/ConfirmBtn/ExitConfirmShow";
import FlashMessage from "../../../components/UI/Errors/ErrorsGlobal";
import FormLoader from "../../../components/UI/Loaders/FormLoader";
import useFlashMessage from "../../../hooks/Errors/ErrorMessage";
import { formatDateTime } from "../../../utils/date";
export default function ShowTicket() {
	const { slug } = useParams();
	const [ticket, setTicket] = useState(null);
	const [statusTicket, setStatusTicket] = useState({});
	const [loading, setLoading] = useState(true);

	const { message, showMessage, clearMessage } = useFlashMessage();

	const { id, _numTicketFromSlug } = useMemo(() => {
		const raw = String(slug || "").trim();
		const [numPart, idPart] = raw.split("+");
		return {
			numTicketFromSlug: String(numPart || "").trim(),
			id: String(idPart || "").trim(),
		};
	}, [slug]);

	const makeEditSlug = (ticket) => {
		const num = ticket?.numTicket ?? "0";
		const id = ticket?.id ?? "";
		return `${num}+${id}`;
	};

	useEffect(() => {
		if (!id) return;

		let alive = true;

		const load = async () => {
			setLoading(true);
			clearMessage();

			try {
				const res = await privateInstance.get(
					`operaciones/tickets/${id}/ver-ticket`,
				);

				if (!alive) return;
				const t = res.data?.data || res.data?.ticket || res.data || null;
				setTicket(t);
				setStatusTicket(res.data?.statusTicket || {});
			} catch (error) {
				if (!alive) return;

				const status = error.response?.status;
				if (status === 404) {
					showMessage("El ticket no existe o fue eliminado.", "error");
				} else {
					showMessage(
						error.response?.data?.message ||
							"No se pudo cargar el ticket. Intenta de nuevo.",
						"error",
					);
				}
				setTicket(null);
			} finally {
				if (alive) setLoading(false);
			}
		};

		load();
		return () => {
			alive = false;
		};
	}, [id, clearMessage, showMessage]);

	const statusLabel = statusTicket?.[ticket?.status] ?? "—";

	if (loading) return <FormLoader />;

	return (
		<div className="min-h-screen w-full px-8 py-8 bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-200">
			<header className="flex items-center justify-between mb-8">
				<div className="space-y-1">
					<h1 className="text-3xl font-bold mx-1">Detalle del Ticket</h1>
				</div>
				<div className="flex items-center gap-2">
					<BackButton to="/operaciones/tickets" />
					<IconEditShow
						to={`/operaciones/tickets/${makeEditSlug(ticket)}/editar-ticket`}
					/>
				</div>
			</header>
			<section className="bg-white dark:bg-slate-900 rounded-2xl shadow border border-slate-200 dark:border-slate-800 p-8 max-w-5xl mx-auto">
				<FlashMessage message={message} />
				{ticket && (
					<div className="space-y-6">
						<div className="flex items-center justify-between gap-3">
							<h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100">
								Ticket #{ticket?.numTicket || "—"}
							</h2>

							<span
								className={`shrink-0 px-3.5 py-1.5 rounded-full text-sm font-semibold border
                                ${
																	Number(ticket?.status) === 1
																		? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800"
																		: Number(ticket?.status) === 2
																			? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
																			: "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700"
																}`}
							>
								{statusLabel}
							</span>
						</div>
						<div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 px-6 py-6">
							<div>
								<div className="text-sm text-slate-500 dark:text-slate-400">
									Creado Por
								</div>
								<div className="mt-1 w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
									{ticket.creator.name || "-"}
								</div>
							</div>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-6 mt-3">
								<div>
									<div className="text-sm text-slate-500 dark:text-slate-400">
										Num. Ticket
									</div>
									<div className="mt-1 w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
										{ticket.numTicket || "-"}
									</div>
								</div>
								<div>
									<div className="text-sm text-slate-500 dark:text-slate-400">
										Num. Ticket Nocturno
									</div>
									<div className="mt-1 w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
										{ticket.numTicketNoct || "-"}
									</div>
								</div>
							</div>
							<div className="mt-2">
								<div className="text-sm text-slate-500 dark:text-slate-400">
									Titulo
								</div>
								<div className="mt-1 w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
									{ticket.titleTicket || "—"}
								</div>
							</div>

							<div className="mt-2">
								<div className="text-sm text-slate-500 dark:text-slate-400">
									Descripción
								</div>
								<div className="mt-1 w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
									{ticket.descriptionTicket || "—"}
								</div>
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-6 mt-3">
								<div>
									<div className="text-sm text-slate-500 dark:text-slate-400">
										Creado
									</div>
									<div className="mt-1 w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
										{formatDateTime(ticket.created_at) || "-"}
									</div>
								</div>
								<div>
									<div className="text-sm text-slate-500 dark:text-slate-400">
										Actualizado
									</div>
									<div className="mt-1 w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
										{formatDateTime(ticket.updated_at) || "-"}
									</div>
								</div>
							</div>

							<div className="mt-3">
								<div className="text-sm text-slate-500 dark:text-slate-400">
									Usuario Asignado
								</div>
								<div className="mt-1 w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
									{ticket.assigned_user?.name || "-"}
								</div>
							</div>
						</div>
					</div>
				)}
			</section>
		</div>
	);
}
