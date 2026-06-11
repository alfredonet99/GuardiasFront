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
	};
}

function isFilled(value) {
	return String(value ?? "").trim().length > 0;
}

// ✅ Traducción simple de mensajes típicos de Laravel
function translateLaravelMsg(msg, fieldKey = "") {
	const m = String(msg ?? "").trim();
	if (!m) return m;

	if (/has already been taken/i.test(m)) {
		if (/num\s*ticket/i.test(m) || fieldKey === "numTicket") {
			return "El número de ticket ya existe. Captura uno diferente.";
		}
		return "Este valor ya existe. Captura uno diferente.";
	}

	if (/The .* field is required\./i.test(m)) {
		return "Este campo es obligatorio.";
	}

	if (/must be an integer/i.test(m)) {
		return "Este campo debe ser un número entero.";
	}

	return m;
}

// ✅ helper: normaliza error 422 (Laravel)
function extractLaravelValidationMessage(e) {
	const status = e?.response?.status;
	const data = e?.response?.data;

	if (status !== 422) return null;

	const errors = data?.errors || {};
	const firstKey = Object.keys(errors)[0];
	const firstMsg =
		firstKey && Array.isArray(errors[firstKey]) ? errors[firstKey][0] : null;

	return {
		status,
		errors,
		message: String(
			firstMsg || data?.message || "Validación fallida. Revisa campos.",
		),
		firstKey: firstKey || "",
	};
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
					"Error al cargar usuarios";

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

	const validateTicket = useCallback((t) => {
		const missing = [];

		if (!isFilled(t.numTicket)) missing.push("Número de Ticket");
		if (!isFilled(t.titleTicket)) missing.push("Título");
		if (!isFilled(t.description)) missing.push("Descripción");
		if (!isFilled(t.creatorUserId)) missing.push("Usuario Creador");

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

	const buildPayload = useCallback(
		(t) => {
			const payload = {
				numTicket: Number(t.numTicket),
				numTicketNoct: t.numTicketNoct ? Number(t.numTicketNoct) : null,
				titleTicket: String(t.titleTicket ?? ""),
				descriptionTicket: String(t.description ?? ""),
			};

			// ✅ solo admin puede decidir quién crea el ticket
			if (authIsAdmin && t.creatorUserId) {
				payload.creator_user_id = Number(t.creatorUserId);
			}

			return payload;
		},
		[authIsAdmin],
	);

	// ✅ valida duplicados locales (numTicket debe ser único)
	const validateLocalDuplicateNumTicket = useCallback(() => {
		const map = new Map();

		for (const t of tickets) {
			const n = String(t?.numTicket ?? "").trim();
			if (!n) continue;

			if (!map.has(n)) map.set(n, []);
			map.get(n).push(t.id);
		}

		const duplicates = [...map.entries()].filter(([, ids]) => ids.length > 1);
		if (!duplicates.length) return { ok: true };

		const details = duplicates
			.map(([n, ids]) => `${n} en (${ids.join(", ")})`)
			.join(" | ");

		return {
			ok: false,
			message: `Hay números de ticket repetidos en el formulario: ${details}. El número de ticket debe ser único.`,
		};
	}, [tickets]);

	const submitTickets = useCallback(async () => {
		setSaving(true);
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

		const dupLocal = validateLocalDuplicateNumTicket();
		if (!dupLocal.ok) {
			fireFlash(dupLocal.message, "error");
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
				const v = extractLaravelValidationMessage(e);

				if (v?.status === 422) {
					if (v?.errors?.numTicket?.length) {
						const raw = String(v.errors.numTicket[0] ?? v.message);
						const baseMsg = translateLaravelMsg(raw, "numTicket");

						const dupNum = String(t?.numTicket ?? "").trim();
						const msg = dupNum
							? `❌ Ticket duplicado: ${dupNum}. ${baseMsg}`
							: `❌ ${baseMsg}`;

						fireFlash(msg, "error");
						results.push({ ok: false, local_id: t.id, message: msg });
						continue;
					}

					const raw = String(v.message);
					const msg = translateLaravelMsg(raw, v.firstKey || "");
					fireFlash(msg, "error");
					results.push({ ok: false, local_id: t.id, message: msg });
					continue;
				}

				const raw =
					e?.response?.data?.message || e?.message || "Error al crear ticket";
				const msg = translateLaravelMsg(raw);
				fireFlash(msg, "error");
				results.push({ ok: false, local_id: t.id, message: msg });
			}
		}

		const okCount = results.filter((r) => r.ok).length;
		const failCount = results.length - okCount;

		if (failCount === 0) {
			fireFlash(
				`✅ Se guardaron ${okCount} ticket(s) correctamente.`,
				"success",
			);
			if (typeof onSuccessRedirect === "function") onSuccessRedirect();
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
		validateLocalDuplicateNumTicket,
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

		canAddTicket,
		addTicketError,
		lastTicketValidation,

		saving,
		submitTickets,
	};
}
