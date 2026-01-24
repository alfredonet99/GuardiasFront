import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { privateInstance } from "../../../api/axios";

import useGuardiaCloseData from "../../../hooks/Guardia/getcloseGuard";
import TicketNumeric from "../Tickets/TicketNumeric";
import UserSelect from "../Tickets/userSelect";
import WordCountInput from "../WordCount/InputCount";
import WordCountTextarea from "../WordCount/TextAreaCount";

export default function TicketGuardiaEdit() {
	const {
		booting,
		guardia,
		tickets,
		setTickets,
		statusMap,
		error,
		saving,
		saveError,
		updateTicketLocal,
		closeGuardia,
	} = useGuardiaCloseData();

	const [usersAssignees, setUsersAssignees] = useState([]);
	const [loadingUsers, setLoadingUsers] = useState(true);
	const [usersError, setUsersError] = useState(null);

	const [authIsAdmin, setAuthIsAdmin] = useState(false);
	const [authUserId, setAuthUserId] = useState("");

	const [openMap, setOpenMap] = useState({});
	const firstAutoOpenedRef = useRef(false);

	// ✅ Helpers MEMO/CB para que Biome no marque deps
	const isNewTicket = useCallback((t) => !t?.id && !!t?.local_id, []);
	const makeLocalId = useCallback(
		() => `local_${Date.now()}_${Math.random().toString(16).slice(2)}`,
		[],
	);

	const isCompleteTicket = useCallback((t) => {
		const titleOk = String(t?.titleTicket ?? "").trim().length > 0;
		const descOk = String(t?.descriptionTicket ?? "").trim().length > 0;
		const userOk = String(t?.assigned_user_id ?? "").trim().length > 0;
		return titleOk && descOk && userOk;
	}, []);

	const isOpen = useCallback((id) => Boolean(openMap[String(id)]), [openMap]);
	const toggle = useCallback((id) => {
		const k = String(id);
		setOpenMap((prev) => ({ ...prev, [k]: !prev[k] }));
	}, []);

	const updateTicket = useCallback(
		(ticketIdOrLocalId, patch) => {
			updateTicketLocal(ticketIdOrLocalId, patch);
		},
		[updateTicketLocal],
	);

	const pendingTickets = useMemo(
		() => (tickets ?? []).filter((t) => !isNewTicket(t)),
		[tickets, isNewTicket],
	);

	const newTickets = useMemo(
		() => (tickets ?? []).filter((t) => isNewTicket(t)),
		[tickets, isNewTicket],
	);

	const orderedTickets = useMemo(
		() => [...pendingTickets, ...newTickets],
		[pendingTickets, newTickets],
	);

	const hasIncompleteNew = useMemo(
		() => newTickets.some((t) => !isCompleteTicket(t)),
		[newTickets, isCompleteTicket],
	);

	const canAddNew = !booting && !saving && !hasIncompleteNew;

	useEffect(() => {
		let mounted = true;

		const fetchUsers = async () => {
			setLoadingUsers(true);
			setUsersError(null);

			try {
				const res = await privateInstance.get("/users/tickets");
				const rows = Array.isArray(res.data?.users) ? res.data.users : [];

				const auth = res.data?.auth;
				const isAdmin = Boolean(auth?.is_admin);
				const aId = auth?.id ? String(auth.id) : "";

				if (!mounted) return;

				setUsersAssignees(rows);
				setAuthIsAdmin(isAdmin);
				setAuthUserId(aId);
			} catch (e) {
				if (!mounted) return;
				setUsersAssignees([]);
				setAuthIsAdmin(false);
				setAuthUserId("");
				setUsersError(
					e?.response?.data?.message ||
						e?.message ||
						"Error al cargar usuarios",
				);
			} finally {
				if (mounted) setLoadingUsers(false);
			}
		};

		fetchUsers();
		return () => {
			mounted = false;
		};
	}, []);

	useEffect(() => {
		if (booting) return;
		if (firstAutoOpenedRef.current) return;
		if (!orderedTickets.length) return;

		const first = orderedTickets[0];
		const firstId = first?.id ?? first?.local_id;
		if (!firstId) return;

		setOpenMap({ [String(firstId)]: true });
		firstAutoOpenedRef.current = true;
	}, [booting, orderedTickets]);

	useEffect(() => {
		if (authIsAdmin) return;
		if (!authUserId) return;
		if (!tickets?.length) return;

		tickets.forEach((t) => {
			const key = t.id ?? t.local_id;
			const status = Number(t.status ?? 1);
			const assigned = String(t.assigned_user_id ?? "");

			if (status === 2 && assigned !== authUserId) {
				updateTicketLocal(key, { assigned_user_id: authUserId });
			}

			if (status !== 2 && assigned === authUserId) {
				updateTicketLocal(key, { assigned_user_id: "" });
			}
		});
	}, [authIsAdmin, authUserId, tickets, updateTicketLocal]);

	const toggleConcluir = useCallback(
		(ticketIdOrLocalId) => {
			const current = (tickets ?? []).find(
				(x) => String(x.id ?? x.local_id) === String(ticketIdOrLocalId),
			);
			if (!current) return;

			const currentStatus = Number(current.status ?? 1);
			const nextStatus = currentStatus === 2 ? 1 : 2;

			if (!authIsAdmin) {
				if (nextStatus === 2) {
					updateTicketLocal(ticketIdOrLocalId, {
						status: nextStatus,
						assigned_user_id: authUserId || "",
					});
					return;
				}

				if (
					nextStatus === 1 &&
					String(current.assigned_user_id ?? "") === String(authUserId)
				) {
					updateTicketLocal(ticketIdOrLocalId, {
						status: nextStatus,
						assigned_user_id: "",
					});
					return;
				}
			}

			updateTicketLocal(ticketIdOrLocalId, { status: nextStatus });
		},
		[tickets, authIsAdmin, authUserId, updateTicketLocal],
	);

	const getUsersForTicket = useCallback(
		(t) => {
			if (authIsAdmin) return usersAssignees;

			const status = Number(t.status ?? 1);
			if (status !== 2 && authUserId) {
				return usersAssignees.filter(
					(u) => String(u.id) !== String(authUserId),
				);
			}
			return usersAssignees;
		},
		[authIsAdmin, usersAssignees, authUserId],
	);

	const addNewTicket = useCallback(() => {
		if (!canAddNew) return;

		const local_id = makeLocalId();
		const t = {
			local_id,
			numTicket: "",
			numTicketNoct: "",
			assigned_user_id: "",
			titleTicket: "",
			descriptionTicket: "",
			status: 1,
		};

		if (!authIsAdmin && authUserId) {
			t.assigned_user_id = String(authUserId);
		}

		setTickets((prev) => [...(prev ?? []), t]); // ✅ siempre al final (debajo)
		setOpenMap((prev) => ({ ...prev, [String(local_id)]: true }));
	}, [canAddNew, makeLocalId, authIsAdmin, authUserId, setTickets]);

	const removeNewTicket = useCallback(
		(localId) => {
			setTickets((prev) =>
				(prev ?? []).filter((t) => String(t.local_id) !== String(localId)),
			);
			setOpenMap((prev) => {
				const next = { ...prev };
				delete next[String(localId)];
				return next;
			});
		},
		[setTickets],
	);

	const closePayloadPreview = useMemo(
		() => ({
			tickets: (tickets ?? []).map((t) => ({
				id: t.id ? Number(t.id) : null,
				local_id: t.id ? null : String(t.local_id ?? ""),
				numTicket: t.numTicket ? Number(t.numTicket) : 0,
				numTicketNoct: t.numTicketNoct ? Number(t.numTicketNoct) : null,
				titleTicket: String(t.titleTicket ?? ""),
				descriptionTicket: String(t.descriptionTicket ?? t.description ?? ""),
				status: Number(t.status ?? 1),
				assigned_user_id: t.assigned_user_id
					? Number(t.assigned_user_id)
					: null,
			})),
		}),
		[tickets],
	);

	return (
		<section className="bg-white dark:bg-slate-900 rounded-xl shadow border border-slate-200 dark:border-slate-800 p-6">
			<header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-4">
				<div>
					<h2 className="text-lg font-bold">Tickets</h2>
				</div>

				<div className="text-xs text-slate-600 dark:text-slate-300">
					{guardia ? (
						<div className="flex items-center gap-2">
							<span className="font-semibold">Guardia activa:</span>
							<span className="font-mono">#{guardia.id}</span>
						</div>
					) : null}
				</div>
			</header>

			{saveError ? (
				<div className="mb-4 p-3 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm">
					{saveError}
				</div>
			) : null}

			{booting ? (
				<div className="p-4 text-slate-500 dark:text-slate-400">
					Cargando...
				</div>
			) : error ? (
				<div className="p-4 text-red-600">{error}</div>
			) : orderedTickets.length === 0 ? (
				<div className="p-4 text-slate-500 dark:text-slate-400">
					No hay tickets asignados para mostrar.
				</div>
			) : (
				<div className="space-y-6">
					{orderedTickets.map((t) => {
						const keyId = t.id ?? t.local_id;
						const opened = isOpen(keyId);
						const isDone = Number(t.status) === 2;
						const isLocal = isNewTicket(t);

						return (
							<div
								key={String(keyId)}
								className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden"
							>
								<div className="flex items-center justify-between">
									<button
										type="button"
										onClick={() => toggle(keyId)}
										aria-expanded={opened}
										aria-controls={`ticket_panel_${keyId}`}
										className="w-full text-left p-4 flex justify-between items-center font-bold text-blue-700"
									>
										<span className="flex items-center gap-2">
											<span>{isLocal ? "Ticket nuevo:" : "Ticket:"}</span>
											<span className="font-mono text-slate-600 dark:text-slate-300">
												{isLocal ? String(t.local_id) : String(t.id)}
											</span>
										</span>

										<svg
											aria-hidden="true"
											className={`w-5 h-5 transition-transform duration-300 ${
												opened ? "rotate-90" : ""
											}`}
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
										{isLocal ? (
											<button
												type="button"
												onClick={(e) => {
													e.stopPropagation();
													removeNewTicket(t.local_id);
												}}
												disabled={saving || booting}
												className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
											>
												Eliminar
											</button>
										) : null}
									</div>
								</div>

								{opened && (
									<div id={`ticket_panel_${keyId}`} className="px-4 pb-4">
										{!isLocal ? (
											<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
												<div className="text-xs text-slate-500 dark:text-slate-400">
													Estado actual:{" "}
													<span className="font-semibold">
														{isDone ? "Concluido" : "Activo"}
													</span>
												</div>

												<div className="flex items-center gap-2">
													<button
														type="button"
														onClick={() => toggleConcluir(keyId)}
														disabled={saving}
														className={[
															"inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-semibold border transition",
															isDone
																? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700"
																: "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700",
															saving ? "opacity-60 cursor-not-allowed" : "",
														].join(" ")}
													>
														{isDone ? "ACTIVAR" : "CONCLUIR"}
													</button>
												</div>
											</div>
										) : null}

										<div className="grid grid-cols-1 md:grid-cols-2 gap-2">
											<TicketNumeric
												id={`numTicket_${keyId}`}
												name={`ticket_${keyId}_numTicket`}
												label="Número de ticket"
												value={t.numTicket ?? ""}
												onChange={(v) => updateTicket(keyId, { numTicket: v })}
												minDigits={2}
												maxDigits={7}
												placeholder="1234567"
												required
												hint="Captura entre 2 y 7 dígitos."
											/>

											<TicketNumeric
												id={`numTicketNoct_${keyId}`}
												name={`ticket_${keyId}_numTicketNoct`}
												label="Número de ticket nocturno"
												value={t.numTicketNoct ?? ""}
												onChange={(v) =>
													updateTicket(keyId, { numTicketNoct: v })
												}
												minDigits={2}
												maxDigits={7}
												placeholder="1234567"
											/>
										</div>

										<WordCountInput
											label="Titulo del Ticket"
											placeholder="Problema Ejecucion"
											value={t.titleTicket ?? ""}
											onChange={(v) => updateTicket(keyId, { titleTicket: v })}
											required
											maxWords={70}
										/>

										<WordCountTextarea
											label="Descripcion del Ticket"
											placeholder="Se presentaron fallas en los modulos de ejemplo"
											value={t.descriptionTicket ?? t.description ?? ""}
											onChange={(v) =>
												updateTicket(keyId, { descriptionTicket: v })
											}
											required
											maxWords={1000}
										/>

										<UserSelect
											id={`assigned_${keyId}`}
											name={`ticket_${keyId}_assigned`}
											label="Usuario Asignado"
											value={String(t.assigned_user_id ?? "")}
											onChange={(v) =>
												updateTicket(keyId, { assigned_user_id: v })
											}
											users={getUsersForTicket(t)}
											loading={loadingUsers}
											error={usersError}
											required
											placeholder="Selecciona un usuario"
											disabled={!isLocal && isDone}
										/>
									</div>
								)}
							</div>
						);
					})}
				</div>
			)}

			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mt-6">
				<p className="text-sm text-slate-600 dark:text-slate-300">
					Puedes añadir múltiples tickets; completa el ticket nuevo antes de
					crear otro.
				</p>

				<div className="flex items-center justify-end gap-2">
					<button
						type="button"
						onClick={addNewTicket}
						disabled={!canAddNew}
						className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition disabled:opacity-50 disabled:hover:bg-blue-600"
						title={
							canAddNew
								? "Añadir Ticket"
								: "Completa el ticket nuevo: Título, Descripción y Usuario asignado"
						}
					>
						Añadir Ticket
					</button>

					<button
						type="button"
						onClick={closeGuardia}
						disabled={saving || booting || !guardia}
						className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition disabled:opacity-50"
					>
						{saving ? "Guardando..." : "Guardar y cerrar guardia"}
					</button>
				</div>
			</div>

			<pre className="mt-6 p-3 rounded-lg bg-slate-950 text-slate-100 text-xs overflow-auto">
				{JSON.stringify(
					{
						// ✅ estado general
						booting,
						saving,
						error,
						saveError,

						// ✅ guardia (lo que te interesa)
						guardia_is_null: guardia == null,
						guardia_id: guardia?.id ?? null,
						guardia_status: guardia?.status ?? null,
						guardia_dateFinish:
							guardia?.dateFinish ?? guardia?.date_finish ?? null,

						// ✅ por qué se bloquea el botón
						close_button_disabled: Boolean(saving || booting || !guardia),
						close_button_reasons: {
							saving,
							booting,
							guardia_missing: !guardia,
						},

						// ✅ tickets (resumen útil)
						tickets_count: tickets?.length ?? 0,
						tickets_summary: (tickets ?? []).map((t) => ({
							id: t?.id ?? null,
							local_id: t?.local_id ?? null,
							status: t?.status ?? null,
							assigned_user_id: t?.assigned_user_id ?? null,
							title_ok: String(t?.titleTicket ?? "").trim().length > 0,
							desc_ok:
								String(t?.descriptionTicket ?? t?.description ?? "").trim()
									.length > 0,
						})),

						// ✅ payload que vas a mandar
						closePayloadPreview,
					},
					null,
					2,
				)}
			</pre>
		</section>
	);
}
