import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { privateInstance } from "../../../api/axios";

import TriStatusBar from "../../../components/UI/Active/TriStatusBar";
import ExitConfirm from "../../../components/UI/ConfirmBtn/ExitConfirm";
import FlashMessage from "../../../components/UI/Errors/ErrorsGlobal";

import TicketNumeric from "../../../components/UI/Tickets/TicketNumeric";
import WordCountInput from "../../../components/UI/WordCount/InputCount";
import WordCountTextarea from "../../../components/UI/WordCount/TextAreaCount";

import useFlashMessage from "../../../hooks/Errors/ErrorMessage";
import useTriStatus from "../../../hooks/TriStatus";

import { devLog } from "../../../utils/devLogs";

function isFilled(value) {
	return String(value ?? "").trim().length > 0;
}

export default function EditTicket() {
	const navigate = useNavigate();
	const { slug } = useParams();

	const { message, showMessage, clearMessage } = useFlashMessage();

	const fireFlash = useCallback(
		(text, type = "error") => showMessage(text, type),
		[showMessage],
	);

	const clearFlash = useCallback(() => clearMessage(), [clearMessage]);

	const { ticketId, numTicketFromSlug } = useMemo(() => {
		const raw = String(slug || "").trim();
		const [numPart, idPart] = raw.split("+");
		return {
			numTicketFromSlug: String(numPart || "").trim(),
			ticketId: String(idPart || "").trim(),
		};
	}, [slug]);

	const [booting, setBooting] = useState(true);
	const [saving, setSaving] = useState(false);

	const [authIsAdmin, setAuthIsAdmin] = useState(false);
	const [ticket, setTicket] = useState(null);

	const [_canOverrideClosed, setCanOverrideClosed] = useState(false);

	const updateField = useCallback((key, value) => {
		setTicket((prev) => (prev ? { ...prev, [key]: value } : prev));
	}, []);

	const triStatusUI = useTriStatus({
		value: ticket?.status,
		onChange: (next) => updateField("status", next),
		disabled: saving,
		title: "Estatus",
		labels: { 1: "Abierto", 2: "Concluido", 3: "Anulado" },
		switchOptions: [1, 3],
		canSwitch: (s) => (authIsAdmin ? true : s === 1 || s === 3),
		secondaryActionLabel: "Concluir",
		canSecondary: (s) => s === 1,
		secondaryAction: (s) => (s === 1 ? 2 : s),
		helpText:
			authIsAdmin && Number(ticket?.status) === 2
				? "Estatus concluido: puedes reabrirlo (Abierto) o anularlo."
				: undefined,
	});

	const validateTicket = useCallback((t) => {
		const missing = [];

		if (!isFilled(t.numTicket)) missing.push("Número de Ticket");
		if (!isFilled(t.titleTicket)) missing.push("Título");
		if (!isFilled(t.description)) missing.push("Descripción");

		return { ok: missing.length === 0, missing };
	}, []);

	useEffect(() => {
		if (!ticketId) return;

		let mounted = true;

		const load = async () => {
			setBooting(true);
			clearFlash();

			try {
				const ures = await privateInstance.get("/users/tickets");
				if (!mounted) return;

				const uPayload = ures.data || {};
				const isAdmin = !!uPayload.auth?.is_admin;
				setAuthIsAdmin(isAdmin);
				setCanOverrideClosed(isAdmin);

				const tres = await privateInstance.get(
					`/operaciones/tickets/${ticketId}/editar`,
				);
				if (!mounted) return;

				const apiTicket = tres.data?.ticket || null;

				if (!apiTicket) {
					setTicket(null);
					fireFlash(tres.data?.message || "No se encontró el ticket.", "error");
					return;
				}

				devLog("Ticket cargado para edición:", apiTicket);

				setTicket({
					id: apiTicket.id,
					numTicket: apiTicket.numTicket ?? "",
					numTicketNoct: apiTicket.numTicketNoct ?? "",
					titleTicket: apiTicket.titleTicket ?? "",
					description:
						apiTicket.descriptionTicket ?? apiTicket.description ?? "",
					creatorUserName:
						apiTicket.creator?.name ?? apiTicket.creator_name ?? "",
					assignedUserName: apiTicket.assigned_user?.name ?? "",
					status: apiTicket.status ?? 1,
				});

				devLog("Ticket cargado para edición:", apiTicket);
			} catch (e) {
				if (!mounted) return;

				fireFlash(
					e?.response?.data?.message || e?.message || "Error al cargar ticket.",
					"error",
				);
				setTicket(null);
			} finally {
				if (mounted) setBooting(false);
			}
		};

		load();
		return () => {
			mounted = false;
		};
	}, [ticketId, clearFlash, fireFlash]);

	devLog("Ticket state:", ticket);

	const handleUpdate = useCallback(async () => {
		clearFlash();

		if (!ticketId || !ticket) {
			fireFlash("No hay información del ticket para actualizar.", "error");
			return;
		}

		const v = validateTicket(ticket);
		if (!v.ok) {
			fireFlash(`Completa: ${v.missing.join(", ")}.`, "error");
			return;
		}

		setSaving(true);

		try {
			const payload = {
				numTicket: Number(ticket.numTicket),
				numTicketNoct:
					String(ticket.numTicketNoct ?? "").trim() === ""
						? null
						: Number(ticket.numTicketNoct),
				titleTicket: String(ticket.titleTicket ?? "").trim(),
				descriptionTicket: String(ticket.description ?? "").trim(),
				status: Number(ticket.status),
			};

			await privateInstance.put(
				`/operaciones/tickets/${ticketId}/update`,
				payload,
			);

			navigate("/operaciones/tickets");
		} catch (e) {
			console.error("Error al actualizar ticket:", e);
			fireFlash(
				e?.response?.data?.message ||
					e?.message ||
					"No se pudo actualizar el ticket.",
				"error",
			);
		} finally {
			setSaving(false);
		}
	}, [ticketId, ticket, validateTicket, clearFlash, fireFlash, navigate]);

	return (
		<div className="min-h-screen w-full px-6 py-6 bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-200">
			<header className="flex items-center justify-between mb-6">
				<h1 className="text-2xl font-bold flex items-center gap-2 mx-1">
					Editar Ticket{" "}
					<span className="font-mono text-slate-600 dark:text-slate-300">
						#{ticket?.numTicket || numTicketFromSlug || "—"}
					</span>
				</h1>
				<ExitConfirm to="/operaciones/tickets" />
			</header>

			<section className="bg-white dark:bg-slate-900 rounded-xl shadow border border-slate-200 dark:border-slate-800 p-6">
				{booting ? (
					<div className="p-6 text-center text-slate-500 dark:text-slate-300">
						Cargando ticket...
					</div>
				) : !ticket ? (
					<div className="p-6 text-center text-slate-500 dark:text-slate-400">
						No se encontró el ticket.
					</div>
				) : (
					<>
						<div className="mb-4">
							<TriStatusBar ui={triStatusUI} />
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
							<div>
								<label
									htmlFor=""
									className="font-semibold text-sm text-slate-800 dark:text-slate-200"
								>
									Creado Por
								</label>
								<div className="mt-1 w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
									{ticket.creatorUserName || "Sin dato"}
								</div>
							</div>

							<div>
								<label htmlFor="" className="font-semibold text-sm block mb-1">
									Actualizado Por
								</label>
								<div className="mt-1 w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
									{ticket.assignedUserName || "Sin dato"}
								</div>
							</div>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-2">
							<TicketNumeric
								id={`num_ticket_${ticket.id}`}
								name="num_ticket"
								label="Número de ticket"
								value={ticket.numTicket}
								onChange={(v) => updateField("numTicket", v)}
								minDigits={2}
								maxDigits={7}
								placeholder="1234567"
								required
								disabled
								hint="Captura entre 2 y 7 dígitos."
							/>

							<TicketNumeric
								id={`num_ticket_noct_${ticket.id}`}
								name="num_ticket_noct"
								label="Número de ticket nocturno"
								value={ticket.numTicketNoct}
								onChange={(v) => updateField("numTicketNoct", v)}
								minDigits={2}
								maxDigits={7}
								placeholder="1234567"
							/>
						</div>

						<WordCountInput
							label="Titulo del Ticket"
							placeholder="Problema Ejecucion"
							value={ticket.titleTicket}
							onChange={(v) => updateField("titleTicket", v)}
							required
							maxWords={70}
						/>

						<WordCountTextarea
							label="Descripcion del Ticket"
							placeholder="Se presentaron fallas en los modulos de ejemplo"
							value={ticket.description}
							onChange={(v) => updateField("description", v)}
							required
							maxWords={1000}
						/>

						<div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
							Al actualizar el ticket, el usuario asignado pasará a ser el mismo
							usuario que realiza la modificación.
						</div>

						<div className="mt-4 flex w-full items-center justify-end gap-2">
							<button
								type="button"
								onClick={() => navigate("/operaciones/tickets")}
								disabled={saving}
								className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-50"
							>
								Cancelar
							</button>

							<button
								type="button"
								onClick={handleUpdate}
								disabled={saving || !ticket}
								className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition disabled:opacity-50"
							>
								{saving ? "Guardando..." : "Guardar Cambios"}
							</button>
						</div>
					</>
				)}

				<FlashMessage message={message} />
			</section>
		</div>
	);
}
