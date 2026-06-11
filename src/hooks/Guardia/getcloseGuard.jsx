import { useCallback, useEffect, useState } from "react";
import { privateInstance } from "../../api/axios";

export default function useGuardiaCloseData(guardiaIdParam = null) {
	const [booting, setBooting] = useState(true);
	const [guardia, setGuardia] = useState(null);
	const [tickets, setTickets] = useState([]);
	const [statusMap, setStatusMap] = useState({});
	const [error, setError] = useState(null);

	// ✅ snapshot de descripción original (solo tickets BD)
	const [originalDescById, setOriginalDescById] = useState({});

	// ✅ guardado/cierre
	const [saving, setSaving] = useState(false);
	const [saveError, setSaveError] = useState(null);

	// ✅ creación manual/local
	const [creating, setCreating] = useState(false);
	const [createError, setCreateError] = useState(null);

	useEffect(() => {
		let mounted = true;

		const run = async () => {
			setBooting(true);
			setError(null);

			try {
				const guardiaId = guardiaIdParam ? Number(guardiaIdParam) : null;

				if (!guardiaId) {
					throw new Error("No se recibió guardia_id para cargar el cierre.");
				}

				const res = await privateInstance.get(
					`/operaciones/guardias/${guardiaId}/edit`,
				);

				if (!mounted) return;

				setGuardia(res.data?.guardia ?? null);

				const rows = Array.isArray(res.data?.tickets) ? res.data.tickets : [];
				setTickets(rows);

				// ✅ snapshot descripción original
				const snap = {};
				for (const t of rows) {
					if (t?.id) {
						const desc = String(
							t?.descriptionTicket ?? t?.description ?? "",
						).trim();
						snap[String(t.id)] = desc;
					}
				}
				setOriginalDescById(snap);

				setStatusMap(res.data?.statusMap ?? {});
			} catch (e) {
				if (!mounted) return;

				setError(
					e?.response?.data?.message ||
						e?.message ||
						"Error al cargar datos de cierre",
				);
				setGuardia(null);
				setTickets([]);
				setStatusMap({});
				setOriginalDescById({});
			} finally {
				if (mounted) setBooting(false);
			}
		};

		run();
		return () => {
			mounted = false;
		};
	}, [guardiaIdParam]);

	/** ✅ update en memoria (por local_id o id) */
	const updateTicketLocal = useCallback((localIdOrId, patch) => {
		setTickets((prev) =>
			(prev ?? []).map((t) => {
				const sameLocal =
					t?.local_id && String(t.local_id) === String(localIdOrId);
				const sameId = t?.id && String(t.id) === String(localIdOrId);

				if (!sameLocal && !sameId) return t;
				return { ...t, ...patch };
			}),
		);
	}, []);

	/** ✅ Crear un ticket dentro del contexto de guardia */
	const createTicket = useCallback(
		async (form) => {
			setCreating(true);
			setCreateError(null);

			try {
				const guardiaId = guardia?.id ? Number(guardia.id) : null;

				if (!guardiaId) {
					throw new Error(
						"No se encontró la guardia activa para crear el ticket.",
					);
				}

				const payload = {
					numTicket: form?.numTicket ? Number(form.numTicket) : null,
					numTicketNoct: form?.numTicketNoct
						? Number(form.numTicketNoct)
						: null,
					titleTicket: String(form?.titleTicket ?? ""),
					descriptionTicket: String(form?.descriptionTicket ?? ""),
				};

				const res = await privateInstance.post(
					`/operaciones/guardias/tickets/${guardiaId}`,
					payload,
				);

				const newTicket =
					res.data?.ticket ||
					(Array.isArray(res.data?.tickets) ? res.data.tickets[0] : null);

				if (newTicket?.id) {
					setTickets((prev) => [{ ...newTicket }, ...(prev ?? [])]);
				}

				return { ok: true, ticket: newTicket ?? null, data: res.data };
			} catch (e) {
				const msg =
					e?.response?.data?.message || e?.message || "Error al crear ticket";
				setCreateError(msg);
				return { ok: false, message: msg };
			} finally {
				setCreating(false);
			}
		},
		[guardia],
	);

	/**
	 * ✅ Guardar TODO en un botón:
	 * 1) crea tickets nuevos (local_id)  -> endpoint guardia
	 * 2) PATCH masivo (tickets con id)   -> manda guardia_id
	 * 3) cierra guardia SIEMPRE          -> manda guardia_id
	 */
	const closeGuardia = useCallback(async () => {
		setSaving(true);
		setSaveError(null);

		try {
			const all = tickets ?? [];
			const guardiaId = guardia?.id ? Number(guardia.id) : null;

			if (!guardiaId) {
				throw new Error("No se encontró la guardia activa para procesar.");
			}

			// 1) separar locales
			const toCreate = all.filter((t) => !t?.id && !!t?.local_id);

			// 2) crear nuevos dentro del contexto de guardia
			const createdMap = [];
			if (toCreate.length) {
				for (const t of toCreate) {
					const payload = {
						numTicket: t?.numTicket ? Number(t.numTicket) : null,
						numTicketNoct: t?.numTicketNoct ? Number(t.numTicketNoct) : null,
						titleTicket: String(t?.titleTicket ?? ""),
						descriptionTicket: String(
							t?.descriptionTicket ?? t?.description ?? "",
						),
					};

					const res = await privateInstance.post(
						`/operaciones/guardias/tickets/${guardiaId}`,
						payload,
					);

					const newTicket =
						res.data?.ticket ||
						(Array.isArray(res.data?.tickets) ? res.data.tickets[0] : null);

					if (!newTicket?.id) {
						throw new Error("storeTicketFromGuardia no devolvió ticket.id");
					}

					createdMap.push({
						local_id: String(t.local_id),
						ticket: newTicket,
					});
				}
			}

			// 3) merged: reemplaza locals por reales
			const merged = all.map((t) => {
				if (t?.id) return t;

				const hit = createdMap.find(
					(x) => String(x.local_id) === String(t?.local_id),
				);

				return hit ? hit.ticket : t;
			});

			// 4) PATCH MASIVO solo tickets existentes
			const patchTickets = (all ?? [])
				.filter((t) => !!t?.id)
				.map((t) => ({
					id: Number(t.id),
					numTicket: t?.numTicket ? Number(t.numTicket) : 0,
					numTicketNoct: t?.numTicketNoct ? Number(t.numTicketNoct) : null,
					titleTicket: String(t?.titleTicket ?? ""),
					descriptionTicket: String(
						t?.descriptionTicket ?? t?.description ?? "",
					),
					status: Number(t?.status ?? 1),
				}));

			if (patchTickets.length) {
				await privateInstance.patch("/operaciones/tickets/update-tickets", {
					guardia_id: guardiaId,
					tickets: patchTickets,
				});
			}

			// 5) CERRAR GUARDIA
			const resClose = await privateInstance.post(
				"/operaciones/guardias/close/data",
				{
					guardia_id: guardiaId,
				},
			);

			// 6) refrescar state
			setTickets(
				Array.isArray(resClose.data?.tickets) ? resClose.data.tickets : merged,
			);

			if (resClose.data?.guardia) {
				setGuardia(resClose.data.guardia);
			} else if (resClose.data?.closed) {
				setGuardia((prev) =>
					prev
						? {
								...prev,
								status: 2,
								dateFinish: prev.dateFinish ?? new Date().toISOString(),
							}
						: prev,
				);
			}

			return { ok: true, data: resClose.data };
		} catch (e) {
			const msg =
				e?.response?.data?.message ||
				e?.message ||
				"Error al guardar y cerrar guardia";
			setSaveError(msg);
			return { ok: false, message: msg };
		} finally {
			setSaving(false);
		}
	}, [tickets, guardia]);

	useEffect(() => {
		console.log("[useGuardiaCloseData] guardia =>", guardia);
		console.log("[useGuardiaCloseData] tickets =>", tickets);
		console.log("[useGuardiaCloseData] booting/saving =>", { booting, saving });
	}, [guardia, tickets, booting, saving]);

	return {
		booting,
		guardia,
		tickets,
		setTickets,
		statusMap,
		error,

		saving,
		saveError,
		closeGuardia,

		updateTicketLocal,

		creating,
		createError,
		createTicket,

		originalDescById,
	};
}
