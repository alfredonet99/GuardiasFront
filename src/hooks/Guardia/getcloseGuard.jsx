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

	// ✅ creación
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
			prev.map((t) => {
				const sameLocal =
					t.local_id && String(t.local_id) === String(localIdOrId);
				const sameId = String(t.id) === String(localIdOrId);

				if (!sameLocal && !sameId) return t;
				return { ...t, ...patch };
			}),
		);
	}, []);

	/** ✅ Crear ticket (usa TU store) */
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
				// solo si admin lo manda
				...(form?.creator_user_id
					? { creator_user_id: Number(form.creator_user_id) }
					: {}),
			};

			// ✅ RUTA REAL
			const res = await privateInstance.post(
				"/operaciones/tickets/crear",
				payload,
			);

			const newTicket = res.data?.ticket;

			// ✅ store devuelve 1 ticket (no array)
			if (newTicket?.id) {
				setTickets((prev) => [{ ...newTicket }, ...prev]);
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

	/** ✅ Guardar por lote + cerrar guardia (1 request) */
	const closeGuardia = useCallback(async () => {
		if (!guardia?.id) {
			const msg = "No hay guardia activa para cerrar.";
			setSaveError(msg);
			return { ok: false, message: msg };
		}

		setSaving(true);
		setSaveError(null);

		try {
			const payload = {
				tickets: tickets.map((t) => ({
					id: Number(t.id),
					numTicket: t.numTicket ? Number(t.numTicket) : 0,
					numTicketNoct: t.numTicketNoct ? Number(t.numTicketNoct) : null,
					titleTicket: String(t.titleTicket ?? ""),
					descriptionTicket: String(t.descriptionTicket ?? t.description ?? ""),
					status: Number(t.status ?? 1),
					assigned_user_id: t.assigned_user_id
						? Number(t.assigned_user_id)
						: null,
				})),
			};

			const res = await privateInstance.patch(
				"/operaciones/guardias/close/tickets",
				payload,
			);

			// ✅ aquí sí esperamos tickets[]
			if (Array.isArray(res.data?.tickets)) {
				setTickets(res.data.tickets);
			}

			return { ok: true, data: res.data };
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
	}, [guardia?.id, tickets]);

	useEffect(() => {
		console.log("[TicketGuardiaEdit] guardia =>", guardia);
		console.log("[TicketGuardiaEdit] tickets =>", tickets);
		console.log("[TicketGuardiaEdit] booting/saving =>", { booting, saving });
	}, [guardia, tickets, booting, saving]);
	return {
		booting,
		guardia,
		tickets,
		setTickets,
		statusMap,
		error,

		// ✅ cerrar
		saving,
		saveError,
		closeGuardia,

		// ✅ editar local
		updateTicketLocal,

		// ✅ crear
		creating,
		createError,
		createTicket,
	};
}
