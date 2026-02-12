import { useCallback, useEffect, useState } from "react";
import { privateInstance } from "../../api/axios";

export default function useGuardiaCloseData() {
	const [booting, setBooting] = useState(true);
	const [guardia, setGuardia] = useState(null);
	const [tickets, setTickets] = useState([]);
	const [statusMap, setStatusMap] = useState({});
	const [error, setError] = useState(null);

	// ✅ guardado/cierre
	const [saving, setSaving] = useState(false);
	const [saveError, setSaveError] = useState(null);

	// ✅ creación (por si quieres usar createTicket aparte)
	const [creating, setCreating] = useState(false);
	const [createError, setCreateError] = useState(null);

	useEffect(() => {
		let mounted = true;

		const run = async () => {
			setBooting(true);
			setError(null);

			try {
				const res = await privateInstance.get("/operaciones/guardias/close");
				if (!mounted) return;

				setGuardia(res.data?.guardia ?? null);
				setTickets(Array.isArray(res.data?.tickets) ? res.data.tickets : []);
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
			} finally {
				if (mounted) setBooting(false);
			}
		};

		run();
		return () => {
			mounted = false;
		};
	}, []);

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

	/** ✅ Crear ticket (usa TU store) - opcional */
	const createTicket = useCallback(async (form) => {
		setCreating(true);
		setCreateError(null);

		try {
			const payload = {
				numTicket: form?.numTicket ? Number(form.numTicket) : null,
				numTicketNoct: form?.numTicketNoct ? Number(form.numTicketNoct) : null,
				assigned_user_id: form?.assigned_user_id
					? Number(form.assigned_user_id)
					: null,
				titleTicket: String(form?.titleTicket ?? ""),
				descriptionTicket: String(form?.descriptionTicket ?? ""),
				...(form?.creator_user_id
					? { creator_user_id: Number(form.creator_user_id) }
					: {}),
			};

			const res = await privateInstance.post(
				"/operaciones/tickets/crear",
				payload,
			);
			const newTicket = res.data?.ticket;

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
	}, []);

	/**
	 * ✅ Guardar TODO en un botón:
	 * 1) crea tickets nuevos (local_id)
	 * 2) PATCH masivo (tickets con id)
	 * 3) cierra guardia SIEMPRE
	 */
	const closeGuardia = useCallback(async () => {
		setSaving(true);
		setSaveError(null);

		try {
			const all = tickets ?? [];

			// 1) separar locales
			const toCreate = all.filter((t) => !t?.id && !!t?.local_id);

			// 2) crear nuevos
			const createdMap = []; // [{ local_id, ticket }]
			if (toCreate.length) {
				for (const t of toCreate) {
					const payload = {
						numTicket: t?.numTicket ? Number(t.numTicket) : null,
						numTicketNoct: t?.numTicketNoct ? Number(t.numTicketNoct) : null,
						assigned_user_id: t?.assigned_user_id
							? Number(t.assigned_user_id)
							: null,
						titleTicket: String(t?.titleTicket ?? ""),
						descriptionTicket: String(
							t?.descriptionTicket ?? t?.description ?? "",
						),
					};

					const res = await privateInstance.post(
						"/operaciones/tickets/crear",
						payload,
					);

					const newTicket = res.data?.ticket;
					if (!newTicket?.id) throw new Error("Store no devolvió ticket.id");

					createdMap.push({ local_id: String(t.local_id), ticket: newTicket });
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

			// 4) PATCH MASIVO (⚠️ solo tickets que YA tenían id desde el GET)
			//    Para evitar el caso: "creé un ticket asignado a otro" y luego PATCH lo intenta editar.
			const patchTickets = (all ?? [])
				.filter((t) => !!t?.id) // ✅ SOLO los existentes, no los recién creados
				.map((t) => ({
					id: Number(t.id),
					numTicket: t?.numTicket ? Number(t.numTicket) : 0,
					numTicketNoct: t?.numTicketNoct ? Number(t.numTicketNoct) : null,
					titleTicket: String(t?.titleTicket ?? ""),
					descriptionTicket: String(
						t?.descriptionTicket ?? t?.description ?? "",
					),
					status: Number(t?.status ?? 1),
					assigned_user_id: t?.assigned_user_id
						? Number(t.assigned_user_id)
						: null,
				}));

			if (patchTickets.length) {
				await privateInstance.patch("/operaciones/tickets/update-tickets", {
					tickets: patchTickets,
				});
			}

			// 5) CERRAR GUARDIA SIEMPRE
			const resClose = await privateInstance.post(
				"/operaciones/guardias/close/data",
				{},
			);

			// 6) refrescar state
			// Si el endpoint de cierre NO devuelve tickets, dejamos merged.
			setTickets(
				Array.isArray(resClose.data?.tickets) ? resClose.data.tickets : merged,
			);

			if (resClose.data?.guardia) {
				setGuardia(resClose.data.guardia);
			} else if (resClose.data?.closed) {
				// fallback si solo manda flags
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
	}, [tickets]);

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
	};
}
