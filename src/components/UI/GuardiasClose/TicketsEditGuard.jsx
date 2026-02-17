import {
	forwardRef,
	useCallback,
	useEffect,
	useImperativeHandle,
	useMemo,
	useRef,
	useState,
} from "react";
import { privateInstance } from "../../../api/axios";

import useGuardiaCloseData from "../../../hooks/Guardia/getcloseGuard";
import BackBtnSection from "../../icons/BtnBackSection";
import TicketNumeric from "../Tickets/TicketNumeric";
import UserSelect from "../Tickets/userSelect";
import WordCountInput from "../WordCount/InputCount";
import WordCountTextarea from "../WordCount/TextAreaCount";

const TicketGuardiaEdit = forwardRef(function TicketGuardiaEdit(
	{ onBackToMonitoreos },
	ref,
) {
	const {
		booting,
		guardia,
		tickets,
		setTickets,
		_statusMap,
		error,
		saving,
		saveError,
		updateTicketLocal,
		closeGuardia,

		// ✅ NUEVO (snapshot de descripción original desde el GET)
		originalDescById,
	} = useGuardiaCloseData();

	const [usersAssignees, setUsersAssignees] = useState([]);
	const [loadingUsers, setLoadingUsers] = useState(true);
	const [usersError, setUsersError] = useState(null);

	const [authIsAdmin, setAuthIsAdmin] = useState(false);
	const [authUserId, setAuthUserId] = useState("");

	const [openMap, setOpenMap] = useState({});
	const firstAutoOpenedRef = useRef(false);

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

	// ✅ users + auth context
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

	// ✅ auto-open primer ticket
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

	// ✅ regla de asignación para no-admin
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

		setTickets((prev) => [...(prev ?? []), t]);
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

	const usersMap = useMemo(() => {
		const m = new Map();
		(usersAssignees ?? []).forEach((u) => {
			m.set(String(u?.id), String(u?.name ?? u?.email ?? u?.username ?? "—"));
		});
		return m;
	}, [usersAssignees]);

	// =========================================================
	// ✅ regla "2+ días => forzar cambio de descripción"
	//    PERO: si status == 2 (concluido) => NO validar
	// =========================================================
	const isOlderThanDays = useCallback((createdAt, days) => {
		if (!createdAt) return false;
		const created = new Date(createdAt).getTime();
		if (!Number.isFinite(created)) return false;
		const diffMs = Date.now() - created;
		return diffMs >= days * 24 * 60 * 60 * 1000;
	}, []);

	const mustChangeDesc = useCallback(
		(t) => {
			if (!t?.id) return false; // solo BD

			// ✅ NUEVO: si está concluido, ya NO obligamos descripción
			const status = Number(t?.status ?? 1);
			if (status === 2) return false;

			// ⚠️ Ajusta aquí si tu backend manda otra llave
			const createdAt = t?.created_at;

			if (!isOlderThanDays(createdAt, 2)) return false;

			const original = String(originalDescById?.[String(t.id)] ?? "").trim();
			const current = String(
				t?.descriptionTicket ?? t?.description ?? "",
			).trim();

			if (!original) return false;

			return current === original; // no cambió => bloquear
		},
		[isOlderThanDays, originalDescById],
	);

	const getTicketsSnapshot = useCallback(() => {
		const arr = Array.isArray(tickets) ? tickets : [];

		const normalized = arr.map((t) => {
			const key = t?.id ? String(t.id) : String(t?.local_id ?? "");
			const assignedId = String(t?.assigned_user_id ?? "").trim();
			const assignedName =
				usersMap.get(assignedId) ?? (assignedId ? `ID ${assignedId}` : "—");

			return {
				_key: key || `row_${Math.random().toString(16).slice(2)}`,
				_from: t?.id ? "db" : "new",

				id: t?.id ?? null,
				local_id: t?.local_id ?? null,

				numTicket: t?.numTicket ?? "",
				numTicketNoct: t?.numTicketNoct ?? "",
				titleTicket: t?.titleTicket ?? "",
				descriptionTicket: t?.descriptionTicket ?? t?.description ?? "",

				status: Number(t?.status ?? 1),
				assigned_user_id: assignedId || "",
				assigned_user_name: assignedName,
			};
		});

		const pending = normalized.filter(
			(x) => x._from === "new" || x.status !== 2,
		);
		const concluded = normalized.filter(
			(x) => x._from === "db" && x.status === 2,
		);

		const concludedByUser = concluded.reduce((acc, t) => {
			const k = t.assigned_user_name || "—";
			if (!acc[k]) acc[k] = [];
			acc[k].push(t);
			return acc;
		}, {});

		return {
			pending,
			concluded,
			concludedByUser,
			counters: {
				total: normalized.length,
				pending: pending.length,
				concluded: concluded.length,
				newTickets: normalized.filter((x) => x._from === "new").length,
			},
		};
	}, [tickets, usersMap]);

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

	const submitClose = useCallback(async () => {
		console.log("[TicketGuardiaEdit] payload preview =>", closePayloadPreview);
		const res = await closeGuardia();
		console.log("[TicketGuardiaEdit] result =>", res);
		return res;
	}, [closePayloadPreview, closeGuardia]);

	const validateBeforeContinue = useCallback(() => {
		const arr = Array.isArray(tickets) ? tickets : [];

		for (const t of arr) {
			// ✅ Regla: BD con 2+ días => descripción debe cambiar
			//    (pero mustChangeDesc ya ignora concluidos)
			if (mustChangeDesc(t)) {
				const keyId = t?.id ?? t?.local_id;

				if (keyId != null) {
					setOpenMap((prev) => ({ ...prev, [String(keyId)]: true }));
				}

				return {
					ok: false,
					invalidKey: keyId ?? null,
					message:
						"Este ticket fue creado hace más de 2 días. Debes actualizar la descripción antes de continuar.",
				};
			}

			const titleOk = String(t?.titleTicket ?? "").trim().length > 0;
			const descOk = String(t?.descriptionTicket ?? "").trim().length > 0;
			const userOk = String(t?.assigned_user_id ?? "").trim().length > 0;

			if (titleOk && descOk && userOk) continue;

			const keyId = t?.id ?? t?.local_id;

			if (keyId != null) {
				setOpenMap((prev) => ({ ...prev, [String(keyId)]: true }));
			}

			const missing = [
				!titleOk ? "Título" : null,
				!descOk ? "Descripción" : null,
				!userOk ? "Usuario asignado" : null,
			].filter(Boolean);

			return {
				ok: false,
				invalidKey: keyId ?? null,
				message: `Faltan campos obligatorios en un ticket: ${missing.join(", ")}.`,
			};
		}

		return { ok: true };
	}, [tickets, mustChangeDesc]);

	useImperativeHandle(
		ref,
		() => ({
			submitClose,
			isBusy: () => saving || booting,
			getTicketsSnapshot,
			validateBeforeContinue,
		}),
		[submitClose, saving, booting, getTicketsSnapshot, validateBeforeContinue],
	);

	return (
		<section className="bg-white dark:bg-slate-900 rounded-xl shadow border border-slate-200 dark:border-slate-800 p-6">
			<header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-4">
				<div>
					<h2 className="text-lg font-bold">TICKETS</h2>
				</div>

				<div className="flex items-center justify-end gap-2">
					{typeof onBackToMonitoreos === "function" ? (
						<BackBtnSection label="Monitoreos" onClick={onBackToMonitoreos} />
					) : null}

					<div className="text-xs text-slate-600 dark:text-slate-300" />
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
					No hay tickets asignados para mostrar. Puedes crear uno nuevo.
				</div>
			) : (
				<div className="space-y-6">
					{orderedTickets.map((t) => {
						const keyId = t.id ?? t.local_id;
						const opened = isOpen(keyId);
						const isDone = Number(t.status) === 2;
						const isLocal = isNewTicket(t);

						// ✅ mustChangeDesc ya ignora concluidos
						const needsDescUpdate = !isLocal && mustChangeDesc(t);

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
											placeholder="Selecciona un usuario"
											disabled={!isLocal && isDone}
										/>

										<div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
											Si no seleccionas un usuario, el ticket se asignará
											automáticamente a ti.
										</div>

										{needsDescUpdate ? (
											<div className="mt-2 p-3 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 text-sm">
												Este ticket fue creado hace más de 2 días. Para
												continuar, debes actualizar la descripción.
											</div>
										) : null}
									</div>
								)}
							</div>
						);
					})}
				</div>
			)}

			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end mt-6">
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
				</div>
			</div>

			<pre className="mt-6 p-3 rounded-lg bg-slate-950 text-slate-100 text-xs overflow-auto">
				{JSON.stringify(
					{
						booting,
						saving,
						error,
						saveError,
						guardia_is_null: guardia == null,
						guardia_id: guardia?.id ?? null,
						tickets_count: tickets?.length ?? 0,
						closePayloadPreview,
						users_count: usersAssignees?.length ?? 0,
					},
					null,
					2,
				)}
			</pre>
		</section>
	);
});

export default TicketGuardiaEdit;
