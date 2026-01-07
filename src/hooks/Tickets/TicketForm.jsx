import { useCallback, useEffect, useMemo, useState } from "react";
import { privateInstance } from "../../api/axios";

/** ID simple */
let __ticketSeq = 0;
function newTicketId() {
	__ticketSeq += 1;
	return `t_${Date.now()}_${__ticketSeq}`;
}

function makeEmptyTicket({ authIsAdmin, authUserId, authUserName }) {
	return {
		id: newTicketId(),
		numTicket: "",
		numTicketNoct: "",
		titleTicket: "",
		description: "",
		creatorUserId: authIsAdmin ? "" : String(authUserId || ""),
		creatorUserName: authIsAdmin ? "" : String(authUserName || ""),
		assignedUserId: "",
	};
}

function isFilled(value) {
	return String(value ?? "").trim().length > 0;
}

export default function useTicketsForm({
	onSuccessRedirect,
	onFlash,
	onFlashClear,
} = {}) {
	const [booting, setBooting] = useState(true);

	const [usersAssignees, setUsersAssignees] = useState([]);
	const [authIsAdmin, setAuthIsAdmin] = useState(false);
	const [authUserId, setAuthUserId] = useState("");
	const [authUserName, setAuthUserName] = useState("");

	const [tickets, setTickets] = useState([]);

	const [addTicketError, setAddTicketError] = useState(null);

	const [saving, setSaving] = useState(false);
	const [submitResults, setSubmitResults] = useState([]);

	const fireFlash = useCallback(
		(text, type = "error") => {
			if (typeof onFlash === "function") onFlash(text, type);
		},
		[onFlash],
	);

	const clearFlash = useCallback(() => {
		if (typeof onFlashClear === "function") onFlashClear();
	}, [onFlashClear]);

	// ✅ BOOT: solo users + auth
	useEffect(() => {
		let mounted = true;

		const boot = async () => {
			setBooting(true);
			clearFlash();

			try {
				const res = await privateInstance.get("/users/tickets");
				const rows = Array.isArray(res.data?.users) ? res.data.users : [];

				const auth = res.data?.auth;
				const isAdmin = Boolean(auth?.is_admin);
				const aId = auth?.id ? String(auth.id) : "";
				const aName = auth?.name ? String(auth.name) : "";

				if (!mounted) return;

				setUsersAssignees(rows);
				setAuthIsAdmin(isAdmin);
				setAuthUserId(aId);
				setAuthUserName(aName);

				setTickets([
					makeEmptyTicket({
						authIsAdmin: isAdmin,
						authUserId: aId,
						authUserName: aName,
					}),
				]);
			} catch (e) {
				if (!mounted) return;

				const msg =
					e?.response?.data?.message ||
					e?.message ||
					"Error al cargar usuarios para asignación";

				fireFlash(msg, "error");

				setUsersAssignees([]);
				setAuthIsAdmin(false);
				setAuthUserId("");
				setAuthUserName("");

				setTickets([
					makeEmptyTicket({
						authIsAdmin: false,
						authUserId: "",
						authUserName: "",
					}),
				]);
			} finally {
				if (mounted) setBooting(false);
			}
		};

		boot();
		return () => {
			mounted = false;
		};
	}, [fireFlash, clearFlash]);

	const getAssigneesFiltered = useCallback(
		(creatorId) => {
			if (!creatorId) return usersAssignees;
			return usersAssignees.filter((u) => String(u.id) !== String(creatorId));
		},
		[usersAssignees],
	);

	const validateTicket = useCallback((t) => {
		const missing = [];
		if (!isFilled(t.numTicket)) missing.push("Número de Ticket");
		if (!isFilled(t.titleTicket)) missing.push("Título");
		if (!isFilled(t.description)) missing.push("Descripción");
		if (!isFilled(t.creatorUserId)) missing.push("Usuario Creador");
		if (!isFilled(t.assignedUserId)) missing.push("Usuario Asignado");

		if (
			isFilled(t.creatorUserId) &&
			isFilled(t.assignedUserId) &&
			String(t.creatorUserId) === String(t.assignedUserId)
		) {
			missing.push("El Asignado debe ser diferente al Creador");
		}

		return { ok: missing.length === 0, missing };
	}, []);

	const lastTicketValidation = useMemo(() => {
		const last = tickets.at(-1);
		if (!last) return { ok: false, missing: ["Ticket base no existe"] };
		return validateTicket(last);
	}, [tickets, validateTicket]);

	const canAddTicket = lastTicketValidation.ok;

	const addTicket = useCallback(() => {
		const last = tickets.at(-1);
		const v = last
			? validateTicket(last)
			: { ok: false, missing: ["Ticket base no existe"] };

		if (!v.ok) {
			const msg = `Completa este ticket antes de añadir otro: ${v.missing.join(", ")}.`;
			setAddTicketError(msg);
			fireFlash(msg, "error");
			return null;
		}

		setAddTicketError(null);

		const next = makeEmptyTicket({
			authIsAdmin,
			authUserId,
			authUserName,
		});

		setTickets((prev) => [...prev, next]);
		return next.id;
	}, [
		tickets,
		validateTicket,
		authIsAdmin,
		authUserId,
		authUserName,
		fireFlash,
	]);

	const removeTicket = useCallback((ticketId) => {
		setTickets((prev) => prev.filter((t) => t.id !== ticketId));
	}, []);

	const updateTicket = useCallback((ticketId, patch) => {
		setTickets((prev) =>
			prev.map((t) => (t.id === ticketId ? { ...t, ...patch } : t)),
		);
		setAddTicketError(null);
	}, []);

	// ✅ limpiar asignado si ya no aplica
	useEffect(() => {
		if (!tickets.length) return;

		setTickets((prev) =>
			prev.map((t) => {
				if (!t.assignedUserId) return t;

				const validList = getAssigneesFiltered(t.creatorUserId);
				const stillExists = validList.some(
					(u) => String(u.id) === String(t.assignedUserId),
				);
				const sameAsCreator =
					t.creatorUserId &&
					String(t.creatorUserId) === String(t.assignedUserId);

				return stillExists && !sameAsCreator ? t : { ...t, assignedUserId: "" };
			}),
		);
	}, [getAssigneesFiltered, tickets.length]);

	const buildPayload = useCallback(
		(t) => {
			const payload = {
				numTicket: Number(t.numTicket),
				numTicketNoct: t.numTicketNoct ? Number(t.numTicketNoct) : null,
				assigned_user_id: Number(t.assignedUserId),
				titleTicket: String(t.titleTicket ?? ""),
				descriptionTicket: String(t.description ?? ""),
			};

			// solo admin manda creator_user_id
			if (authIsAdmin && t.creatorUserId)
				payload.creator_user_id = Number(t.creatorUserId);

			return payload;
		},
		[authIsAdmin],
	);

	const submitTickets = useCallback(async () => {
		setSaving(true);
		setSubmitResults([]);
		clearFlash();

		const validations = tickets.map((t) => ({
			id: t.id,
			...validateTicket(t),
		}));
		const invalids = validations.filter((v) => !v.ok);

		if (invalids.length) {
			const msg =
				`Hay ${invalids.length} ticket(s) incompletos. Completa: ` +
				invalids.map((v) => `(${v.id}) ${v.missing.join(", ")}`).join(" | ");
			fireFlash(msg, "error");
			setSaving(false);
			return { ok: false };
		}

		const results = [];
		for (const t of tickets) {
			try {
				const payload = buildPayload(t);
				const res = await privateInstance.post(
					"/operaciones/tickets/crear",
					payload,
				);

				results.push({
					ok: true,
					local_id: t.id,
					api_ticket_id: res.data?.ticket?.id ?? null,
					message: res.data?.message ?? "OK",
				});
			} catch (e) {
				results.push({
					ok: false,
					local_id: t.id,
					message:
						e?.response?.data?.message || e?.message || "Error al crear ticket",
				});
			}
		}

		setSubmitResults(results);

		const okCount = results.filter((r) => r.ok).length;
		const failCount = results.length - okCount;

		if (failCount === 0) {
			if (typeof onSuccessRedirect === "function") onSuccessRedirect();
		} else {
			fireFlash(
				`Se guardaron ${okCount} y fallaron ${failCount}. Revisa resultados.`,
				"error",
			);
		}

		setSaving(false);
		return { ok: failCount === 0, results };
	}, [
		tickets,
		validateTicket,
		buildPayload,
		onSuccessRedirect,
		fireFlash,
		clearFlash,
	]);

	return {
		booting,

		usersAssignees,
		tickets,

		authIsAdmin,
		authUserName,

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
	};
}
