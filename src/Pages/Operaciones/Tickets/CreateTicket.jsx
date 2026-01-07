import { useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

import ExitConfirm from "../../../components/UI/ConfirmBtn/ExitConfirm";
import FlashMessage from "../../../components/UI/Errors/ErrorsGlobal";
import TicketNumeric from "../../../components/UI/Tickets/TicketNumeric";
import UserSelect from "../../../components/UI/Tickets/userSelect";
import WordCountInput from "../../../components/UI/WordCount/InputCount";
import WordCountTextarea from "../../../components/UI/WordCount/TextAreaCount";

import useAccordion from "../../../hooks/Accordion";
import useFlashMessage from "../../../hooks/Errors/ErrorMessage";
import useTicketsForm from "../../../hooks/Tickets/TicketForm";

export default function CreateTicket() {
	const navigate = useNavigate();
	const { message, showMessage, clearMessage } = useFlashMessage();

	// ✅ callbacks estables (evita 429)
	const onFlash = useCallback(
		(text, type = "error") => showMessage(text, type),
		[showMessage],
	);
	const onFlashClear = useCallback(() => clearMessage(), [clearMessage]);

	const {
		booting,
		usersAssignees,
		tickets,
		authIsAdmin,

		addTicket,
		removeTicket,
		updateTicket,
		getAssigneesFiltered,

		canAddTicket,
		addTicketError,
		lastTicketValidation,

		saving,
		submitResults,
		submitTickets,
	} = useTicketsForm({
		onSuccessRedirect: () => navigate("/operaciones/tickets"),
		onFlash,
		onFlashClear,
	});

	const accordion = useAccordion({ single: false });
	const firstAutoOpenedRef = useRef(false);

	useEffect(() => {
		if (booting) return;
		if (firstAutoOpenedRef.current) return;
		if (!tickets?.length) return;

		const firstId = tickets[0]?.id;
		if (!firstId) return;

		accordion.open(firstId);
		firstAutoOpenedRef.current = true;
	}, [booting, tickets, accordion]);

	const handleAddTicket = () => {
		const prevId = tickets.at(-1)?.id;
		const newId = addTicket();
		if (!newId) return;

		if (prevId) accordion.close(prevId);
		accordion.open(newId);
	};

	return (
		<div className="min-h-screen w-full px-6 py-6 bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-200">
			<header className="flex items-center justify-between mb-6">
				<h1 className="text-2xl font-bold flex items-center gap-2 mx-1">
					Crear Tickets
				</h1>
				<ExitConfirm to="/operaciones/tickets" />
			</header>

			<section className="bg-white dark:bg-slate-900 rounded-xl shadow border border-slate-200 dark:border-slate-800 p-6">
				{booting ? (
					<div className="animate-pulse">
						<div className="mb-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 px-4 py-3">
							<div className="h-4 w-60 rounded bg-slate-200 dark:bg-slate-800" />
							<div className="mt-2 h-3 w-80 rounded bg-slate-200 dark:bg-slate-800" />
						</div>
					</div>
				) : (
					<>
						{addTicketError && (
							<div className="mb-4 rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
								{addTicketError}
							</div>
						)}

						{submitResults?.length > 0 && (
							<div className="mb-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 px-4 py-3 text-sm">
								<p className="font-semibold mb-2">Resultados:</p>
								<ul className="space-y-1">
									{submitResults.map((r) => (
										<li
											key={r.local_id}
											className={r.ok ? "text-emerald-700" : "text-red-700"}
										>
											{r.ok ? "✅" : "❌"} {r.local_id} —{" "}
											{r.message || (r.ok ? "OK" : "Error")}
											{r.api_ticket_id ? ` (ID: ${r.api_ticket_id})` : ""}
										</li>
									))}
								</ul>
							</div>
						)}

						{tickets.map((t, idx) => {
							const assigneesFiltered = getAssigneesFiltered(t.creatorUserId);
							const opened = accordion.isOpen(t.id);

							return (
								<div
									key={t.id}
									className="mb-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden"
								>
									<div className="flex items-center justify-between">
										<button
											type="button"
											onClick={() => accordion.toggle(t.id)}
											aria-expanded={opened}
											aria-controls={`ticket_panel_${t.id}`}
											className="w-full text-left p-4 flex justify-between items-center font-bold text-blue-700"
										>
											<span className="flex items-center gap-2">
												<span>Ticket:</span>
												<span className="font-mono text-slate-600 dark:text-slate-300">
													{t.id}
												</span>
											</span>

											<svg
												aria-hidden="true"
												className={`w-5 h-5 transition-transform duration-300 ${opened ? "rotate-90" : ""}`}
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={1.5}
													d="M9 5l7 7-7 7"
												/>
											</svg>
										</button>

										<div className="pr-4">
											<button
												type="button"
												onClick={(e) => {
													e.stopPropagation();
													removeTicket(t.id);
												}}
												disabled={tickets.length <= 1 || saving}
												className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
											>
												Eliminar
											</button>
										</div>
									</div>

									{opened && (
										<div id={`ticket_panel_${t.id}`} className="px-4 pb-4">
											{authIsAdmin ? (
												<div className="mb-2">
													<label htmlFor="" className="font-semibold text-sm">
														Usuario Creador{" "}
														<span className="text-red-600">*</span>
													</label>

													<UserSelect
														id={`creator_user_id_${t.id}`}
														name={`tickets[${idx}][creator_user_id]`}
														label=""
														value={t.creatorUserId}
														onChange={(v) =>
															updateTicket(t.id, {
																creatorUserId: v,
																assignedUserId:
																	String(v) === String(t.assignedUserId)
																		? ""
																		: t.assignedUserId,
															})
														}
														users={usersAssignees}
														loading={false}
														error={null}
														required
														placeholder="Selecciona un usuario"
														className="mb-0"
													/>
												</div>
											) : (
												<input
													type="hidden"
													name={`tickets[${idx}][creator_user_id]`}
													value={t.creatorUserId}
												/>
											)}

											<div className="grid grid-cols-1 md:grid-cols-2 gap-2">
												<TicketNumeric
													id={`num_ticket_${t.id}`}
													name={`tickets[${idx}][num_ticket]`}
													label="Número de ticket"
													value={t.numTicket}
													onChange={(v) => updateTicket(t.id, { numTicket: v })}
													minDigits={2}
													maxDigits={7}
													placeholder="1234567"
													required
													hint="Captura entre 2 y 7 dígitos."
												/>

												<TicketNumeric
													id={`num_ticket_noct_${t.id}`}
													name={`tickets[${idx}][num_ticket_noct]`}
													label="Número de ticket nocturno"
													value={t.numTicketNoct}
													onChange={(v) =>
														updateTicket(t.id, { numTicketNoct: v })
													}
													minDigits={2}
													maxDigits={7}
													placeholder="1234567"
												/>
											</div>

											<WordCountInput
												label="Titulo del Ticket"
												placeholder="Problema Ejecucion"
												value={t.titleTicket}
												onChange={(v) => updateTicket(t.id, { titleTicket: v })}
												required
												maxWords={70}
											/>

											<WordCountTextarea
												label="Descripcion del Ticket"
												placeholder="Se presentaron fallas en los modulos de ejemplo"
												value={t.description}
												onChange={(v) => updateTicket(t.id, { description: v })}
												required
												maxWords={1000}
											/>

											<UserSelect
												id={`assigned_user_id_${t.id}`}
												name={`tickets[${idx}][assigned_user_id]`}
												label="Usuario Asignado"
												value={t.assignedUserId}
												onChange={(v) =>
													updateTicket(t.id, { assignedUserId: v })
												}
												users={assigneesFiltered}
												loading={false}
												error={null}
												required
												placeholder="Selecciona un usuario"
											/>
										</div>
									)}
								</div>
							);
						})}

						<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mt-2">
							<p className="text-sm text-slate-600 dark:text-slate-300">
								Puedes añadir múltiples tickets y capturarlos uno por uno.
							</p>

							<div className="flex items-center justify-end gap-2">
								<button
									type="button"
									onClick={handleAddTicket}
									disabled={!canAddTicket || saving}
									className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition disabled:opacity-50 disabled:hover:bg-blue-600"
									title={
										canAddTicket
											? "Añadir Ticket"
											: `Completa el ticket actual: ${lastTicketValidation.missing.join(", ")}`
									}
								>
									Añadir Ticket
								</button>

								<button
									type="button"
									onClick={submitTickets}
									disabled={saving || tickets.length === 0}
									className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition disabled:opacity-50"
								>
									{saving ? "Guardando..." : "Guardar"}
								</button>
							</div>
						</div>
					</>
				)}

				{/* ✅ FLASH SIEMPRE ABAJO */}
				<FlashMessage message={message} />
			</section>
		</div>
	);
}
