import {
	forwardRef,
	useCallback,
	useEffect,
	useImperativeHandle,
	useMemo,
	useRef,
	useState,
} from "react";
import { useParams } from "react-router-dom";

import useGuardiaCloseData from "../../../hooks/Guardia/getcloseGuard";
import BackBtnSection from "../../icons/BtnBackSection";
import TicketNumeric from "../Tickets/TicketNumeric";
import WordCountInput from "../WordCount/InputCount";
import WordCountTextarea from "../WordCount/TextAreaCount";

const TicketGuardiaEdit = forwardRef(function TicketGuardiaEdit(
	{ onBackToMonitoreos },
	ref,
) {
	const { id } = useParams();

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
		originalDescById,
	} = useGuardiaCloseData(id);

	const [openMap, setOpenMap] = useState({});
	const firstAutoOpenedRef = useRef(false);

	const isNewTicket = useCallback((t) => !t?.id && !!t?.local_id, []);
	const makeLocalId = useCallback(
		() => `local_${Date.now()}_${Math.random().toString(16).slice(2)}`,
		[],
	);

	const isCompleteTicket = useCallback((t) => {
		const numOk = String(t?.numTicket ?? "").trim().length > 0;
		const titleOk = String(t?.titleTicket ?? "").trim().length > 0;
		const descOk = String(t?.descriptionTicket ?? "").trim().length > 0;
		return numOk && titleOk && descOk;
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
		if (booting) return;
		if (firstAutoOpenedRef.current) return;
		if (!orderedTickets.length) return;

		const first = orderedTickets[0];
		const firstId = first?.id ?? first?.local_id;
		if (!firstId) return;

		setOpenMap({ [String(firstId)]: true });
		firstAutoOpenedRef.current = true;
	}, [booting, orderedTickets]);

	const toggleConcluir = useCallback(
		(ticketIdOrLocalId) => {
			const current = (tickets ?? []).find(
				(x) => String(x.id ?? x.local_id) === String(ticketIdOrLocalId),
			);
			if (!current) return;

			const currentStatus = Number(current.status ?? 1);
			const nextStatus = currentStatus === 2 ? 1 : 2;

			updateTicketLocal(ticketIdOrLocalId, { status: nextStatus });
		},
		[tickets, updateTicketLocal],
	);

	const addNewTicket = useCallback(() => {
		if (!canAddNew) return;

		const local_id = makeLocalId();
		const t = {
			local_id,
			numTicket: "",
			numTicketNoct: "",
			titleTicket: "",
			descriptionTicket: "",
			status: 1,
		};

		setTickets((prev) => [...(prev ?? []), t]);
		setOpenMap((prev) => ({ ...prev, [String(local_id)]: true }));
	}, [canAddNew, makeLocalId, setTickets]);

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

	const isOlderThanDays = useCallback((createdAt, days) => {
		if (!createdAt) return false;
		const created = new Date(createdAt).getTime();
		if (!Number.isFinite(created)) return false;
		const diffMs = Date.now() - created;
		return diffMs >= days * 24 * 60 * 60 * 1000;
	}, []);

	const mustChangeDesc = useCallback(
		(t) => {
			if (!t?.id) return false;

			const status = Number(t?.status ?? 1);
			if (status === 2) return false;

			const createdAt = t?.created_at;
			if (!isOlderThanDays(createdAt, 2)) return false;

			const original = String(originalDescById?.[String(t.id)] ?? "").trim();
			const current = String(
				t?.descriptionTicket ?? t?.description ?? "",
			).trim();

			if (!original) return false;

			return current === original;
		},
		[isOlderThanDays, originalDescById],
	);

	const duplicateNumMap = useMemo(() => {
		const arr = Array.isArray(tickets) ? tickets : [];
		const seen = new Map();
		const duplicates = new Set();

		for (const t of arr) {
			const num = String(t?.numTicket ?? "").trim();
			if (!num) continue;

			if (!seen.has(num)) {
				seen.set(num, 1);
			} else {
				seen.set(num, seen.get(num) + 1);
			}
		}

		for (const [num, count] of seen.entries()) {
			if (count > 1) duplicates.add(num);
		}

		return duplicates;
	}, [tickets]);

	const validateDuplicateNumTicket = useCallback(() => {
		const arr = Array.isArray(tickets) ? tickets : [];
		const seen = new Map();

		for (const t of arr) {
			const num = String(t?.numTicket ?? "").trim();
			if (!num) continue;

			const keyId = t?.id ?? t?.local_id ?? null;
			if (!keyId) continue;

			if (!seen.has(num)) {
				seen.set(num, [keyId]);
			} else {
				seen.get(num).push(keyId);
			}
		}

		const duplicates = [...seen.entries()].filter(([, ids]) => ids.length > 1);

		if (!duplicates.length) {
			return { ok: true };
		}

		const [dupNum, dupIds] = duplicates[0];

		return {
			ok: false,
			numTicket: dupNum,
			ids: dupIds,
			message: `El número de ticket ${dupNum} ya está capturado en la lista actual. Corrige ese número antes de continuar.`,
		};
	}, [tickets]);

	const getTicketsSnapshot = useCallback(() => {
		const arr = Array.isArray(tickets) ? tickets : [];

		const normalized = arr.map((t) => {
			const key = t?.id ? String(t.id) : String(t?.local_id ?? "");
			const assignedId = String(t?.assigned_user_id ?? "").trim();
			const assignedName =
				String(t?.assignedUser?.name ?? "").trim() ||
				(assignedId ? `ID ${assignedId}` : "Se definirá al cerrar");

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
	}, [tickets]);

	const closePayloadPreview = useMemo(() => {
		const arr = Array.isArray(tickets) ? tickets : [];

		return {
			guardia_id: Number(guardia?.id ?? 0),
			tickets: arr.map((t) => ({
				id: t.id ? Number(t.id) : null,
				local_id: t.id ? null : String(t.local_id ?? ""),
				numTicket: t.numTicket ? Number(t.numTicket) : 0,
				numTicketNoct: t.numTicketNoct ? Number(t.numTicketNoct) : null,
				titleTicket: String(t.titleTicket ?? ""),
				descriptionTicket: String(t.descriptionTicket ?? t.description ?? ""),
				status: Number(t.status ?? 1),
			})),
		};
	}, [tickets, guardia]);

	const submitClose = useCallback(async () => {
		console.log("[TicketGuardiaEdit] payload preview =>", closePayloadPreview);
		const res = await closeGuardia();
		console.log("[TicketGuardiaEdit] result =>", res);
		return res;
	}, [closePayloadPreview, closeGuardia]);

	const validateBeforeContinue = useCallback(() => {
		const arr = Array.isArray(tickets) ? tickets : [];

		const dupCheck = validateDuplicateNumTicket();
		if (!dupCheck.ok) {
			for (const dupId of dupCheck.ids ?? []) {
				if (dupId != null) {
					setOpenMap((prev) => ({ ...prev, [String(dupId)]: true }));
				}
			}

			return {
				ok: false,
				invalidKey: dupCheck.ids?.[0] ?? null,
				message: dupCheck.message,
			};
		}

		for (const t of arr) {
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
			const numOk = String(t?.numTicket ?? "").trim().length > 0;

			if (titleOk && descOk && numOk) continue;

			const keyId = t?.id ?? t?.local_id;

			if (keyId != null) {
				setOpenMap((prev) => ({ ...prev, [String(keyId)]: true }));
			}

			const missing = [
				!numOk ? "Número de Ticket" : null,
				!titleOk ? "Título" : null,
				!descOk ? "Descripción" : null,
			].filter(Boolean);

			return {
				ok: false,
				invalidKey: keyId ?? null,
				message: `Faltan campos obligatorios en un ticket: ${missing.join(", ")}.`,
			};
		}

		return { ok: true };
	}, [tickets, mustChangeDesc, validateDuplicateNumTicket]);

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

						const needsDescUpdate = !isLocal && mustChangeDesc(t);

						const headerNum = String(t.numTicket ?? "").trim();
						const isDuplicateHeader =
							headerNum.length > 0 && duplicateNumMap.has(headerNum);

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
											<span className={isDuplicateHeader ? "text-red-600" : ""}>
												{isLocal ? "Ticket nuevo:" : "Ticket:"}
											</span>

											<span
												className={`font-mono ${
													isDuplicateHeader
														? "text-red-600 dark:text-red-400"
														: "text-slate-600 dark:text-slate-300"
												}`}
											>
												{headerNum || "Sin número"}
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

										<div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
											El usuario asignado se definirá automáticamente al cerrar
											la guardia.
										</div>

										{isDuplicateHeader ? (
											<div className="mt-2 p-3 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm">
												El número de ticket {headerNum} está repetido.
											</div>
										) : null}

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
								: "Completa el ticket nuevo: Número, Título y Descripción"
						}
					>
						Añadir Ticket
					</button>
				</div>
			</div>

			{/**
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
						has_guardia: Boolean(guardia?.id),
					},
					null,
					2,
				)}
			</pre>
			*/}
		</section>
	);
});

export default TicketGuardiaEdit;
