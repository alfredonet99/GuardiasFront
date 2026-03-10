// hooks/MonitRedes/RedesForm.js

import { format } from "date-fns";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { privateInstance } from "../../api/axios";
import useAccordion from "../Accordion";

const FRIENDLY_SAVE_ERROR = "No se pudo guardar, intente más tarde.";
const STATUS_ONLINE = "1"; // 1 => ONLINE

function buildMonitoreoDraft() {
	return {
		id: crypto?.randomUUID?.() ?? String(Date.now() + Math.random()),

		platSelected: "",
		hostSelected: "",

		dateRed: null,
		timeDown: null,
		timeUp: null,

		statusRed: STATUS_ONLINE,

		affectation: "",
		reason: "",
		note: "",
	};
}

function isNonEmpty(v) {
	return String(v ?? "").trim().length > 0;
}

function timeToHHmm(d) {
	if (!d) return null;
	try {
		return format(d, "HH:mm");
	} catch {
		return null;
	}
}

/**
 * Reglas:
 * - Siempre: platSelected, hostSelected, dateRed, statusRed, reason
 * - Si statusRed != ONLINE: timeDown y affectation obligatorios
 * - Siempre opcional: note, timeUp
 */
function isComplete(m) {
	if (!m) return false;

	const baseOk =
		isNonEmpty(m.platSelected) &&
		isNonEmpty(m.hostSelected) &&
		!!m.dateRed &&
		isNonEmpty(m.statusRed) &&
		isNonEmpty(m.reason);

	if (!baseOk) return false;

	const isOnline = String(m.statusRed) === STATUS_ONLINE;
	if (isOnline) return true;

	return !!m.timeDown && isNonEmpty(m.affectation);
}

function mapToOptions(map) {
	return Object.entries(map ?? {}).map(([value, label]) => ({
		value: String(value),
		label: String(label),
	}));
}

export default function RedesForm(navigate) {
	const [loadingCatalogs, setLoadingCatalogs] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState(null);

	// catálogos backend
	const [plataforma, setPlataforma] = useState([]);
	const [stateRed, setStateRed] = useState({});
	const [stateMonit, setStateMonit] = useState({});
	const [sucursales, setSucursales] = useState({}); // ✅ NUEVO: catálogo sucursales (1=>VALLE,...)

	// lista de monitoreos
	const [monitoreos, setMonitoreos] = useState([buildMonitoreoDraft()]);

	const accordion = useAccordion({ single: false });
	const firstAutoOpenedRef = useRef(false);

	// ====== derivados ======
	const { canAddMonitoreo, canSave } = useMemo(() => {
		const last = monitoreos.at(-1);
		const lastComplete = isComplete(last);
		const allComplete = monitoreos.length > 0 && monitoreos.every(isComplete);

		return {
			canAddMonitoreo: !saving && lastComplete,
			canSave: !saving && allComplete,
		};
	}, [monitoreos, saving]);

	// ====== cargar catálogos ======
	useEffect(() => {
		const controller = new AbortController();

		const load = async () => {
			try {
				setLoadingCatalogs(true);
				setError(null);

				const res = await privateInstance.get(
					"/comunicaciones/monitAA/create",
					{
						signal: controller.signal,
					},
				);

				const payload = res?.data?.data ?? {};
				setPlataforma(payload?.plataforma ?? []);
				setStateRed(payload?.stateRed ?? {});
				setStateMonit(payload?.stateMonit ?? {});
				setSucursales(payload?.sucursales ?? {}); // ✅
			} catch (e) {
				setPlataforma([]);
				setStateRed({});
				setStateMonit({});
				setSucursales({});
				setError(
					e?.response?.data?.message ||
						e?.message ||
						"Error al cargar catálogos de Monitoreos Redes",
				);
			} finally {
				setLoadingCatalogs(false);
			}
		};

		void load();
		return () => controller.abort();
	}, []);

	// ====== auto abrir primero ======
	useEffect(() => {
		if (loadingCatalogs || firstAutoOpenedRef.current || !monitoreos.length)
			return;

		const firstId = monitoreos[0]?.id;
		if (!firstId) return;

		accordion.open(firstId);
		firstAutoOpenedRef.current = true;
	}, [loadingCatalogs, monitoreos, accordion]);

	// ====== opciones globales ======
	const plataformasList = useMemo(() => {
		const map = new Map();

		for (const s of plataforma || []) {
			const key = String(s.plat ?? "");
			if (!key) continue;

			const label =
				s.plat_label ??
				(String(s.plat) === "1"
					? "Aruba"
					: String(s.plat) === "2"
						? "Alestra"
						: "Desconocido");

			if (!map.has(key)) map.set(key, { value: key, label });
		}

		return Array.from(map.values()).sort(
			(a, b) => Number(a.value) - Number(b.value),
		);
	}, [plataforma]);

	const statusRedOptions = useMemo(() => mapToOptions(stateRed), [stateRed]);

	// ====== hosts por plataforma ======
	const hostsListByPlat = useMemo(() => {
		const out = new Map();

		for (const row of plataforma || []) {
			const platKey = String(row?.plat ?? "");
			const hostName = String(row?.servHost ?? "").trim();
			const id = String(row?.id ?? "");

			if (!platKey || !hostName || !id) continue;

			if (!out.has(platKey)) out.set(platKey, new Map());
			const map = out.get(platKey);

			if (!map.has(id)) map.set(id, { value: id, label: hostName });
		}

		const normalized = new Map();
		for (const [platKey, map] of out.entries()) {
			normalized.set(
				platKey,
				Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label)),
			);
		}

		return normalized;
	}, [plataforma]);

	function getHostsList(m) {
		const platKey = String(m?.platSelected ?? "");
		if (!platKey) return [];
		return hostsListByPlat.get(platKey) ?? [];
	}

	function findHostRowById(hostId) {
		const id = String(hostId ?? "");
		if (!id) return null;
		return (plataforma || []).find((r) => String(r.id) === id) ?? null;
	}

	function getIpKeyMeta(m) {
		const platKey = String(m?.platSelected ?? "");
		const hostId = String(m?.hostSelected ?? "");
		const row = hostId ? findHostRowById(hostId) : null;

		if (!platKey) return { label: "IP/KEY", value: "" };
		if (platKey === "1") return { label: "IP", value: row?.ip ?? "" };
		if (platKey === "2") return { label: "KEY", value: row?.keys ?? "" };
		return { label: "IP/KEY", value: "" };
	}

	// ✅ SUCURSAL LABEL (VALLE/GDL/MTY/MER) - NO EL ID
	function getSucursalMeta(m) {
		const hostId = String(m?.hostSelected ?? "");
		const row = hostId ? findHostRowById(hostId) : null;

		// 1) lo que ya mandas desde backend por cada host
		const direct = String(row?.sucursal_label ?? "").trim();
		if (direct) return { label: "SUCURSAL", value: direct };

		// 2) fallback: catálogo completo sucursales[ nameS ]
		const key = String(row?.nameS ?? "").trim(); // nameS viene como '1','2','3','4' según tu lógica
		const mapped = String(sucursales?.[key] ?? "").trim();
		if (mapped) return { label: "SUCURSAL", value: mapped };

		// 3) último fallback: muestra nameS tal cual
		return { label: "SUCURSAL", value: key };
	}

	// ====== CRUD ======
	const updateMonitoreo = useCallback((id, patch) => {
		setMonitoreos((prev) =>
			prev.map((m) => (m.id === id ? { ...m, ...patch } : m)),
		);
	}, []);

	// ✅ helper: cambia statusRed y limpia si ONLINE
	const setStatusRedValue = useCallback((id, nextStatusRed) => {
		setMonitoreos((prev) =>
			prev.map((m) => {
				if (m.id !== id) return m;

				const next = { ...m, statusRed: String(nextStatusRed ?? "") };

				if (String(next.statusRed) === STATUS_ONLINE) {
					next.timeDown = null;
					next.affectation = "";
				}

				return next;
			}),
		);
	}, []);

	const handleAddMonitoreo = useCallback(() => {
		if (!canAddMonitoreo) return;

		const next = buildMonitoreoDraft();

		setMonitoreos((prev) => {
			const prevId = prev.at(-1)?.id;

			queueMicrotask(() => {
				if (prevId) accordion.close(prevId);
				accordion.open(next.id);
			});

			return [...prev, next];
		});
	}, [canAddMonitoreo, accordion]);

	const removeMonitoreo = useCallback(
		(id) => {
			setMonitoreos((prev) => {
				if (prev.length <= 1) return prev;

				const next = prev.filter((m) => m.id !== id);

				queueMicrotask(() => {
					accordion.close(id);
					const firstId = next[0]?.id;
					if (firstId) accordion.open(firstId);
				});

				return next;
			});
		},
		[accordion],
	);

	// ====== submit ======
	const submitMonitoreos = useCallback(async () => {
		try {
			setSaving(true);
			setError(null);

			if (!canSave) return;

			const payload = {
				monitoreos: monitoreos.map((m) => {
					const statusRed = String(m.statusRed || STATUS_ONLINE);
					const statusMonit = statusRed === STATUS_ONLINE ? 3 : 1;

					return {
						// ✅ se manda el ID del host/sucursal
						sucursal_id: Number(m.hostSelected),

						dateRed: m.dateRed ? format(m.dateRed, "yyyy-MM-dd") : null,
						statusRed: Number(statusRed),

						time_down: timeToHHmm(m.timeDown),
						time_up: timeToHHmm(m.timeUp),

						affectation: String(m.affectation ?? "").trim(),
						reason: String(m.reason ?? "").trim(),
						note: String(m.note ?? "").trim(),

						statusMonit,
					};
				}),
			};

			await privateInstance.post("/comunicaciones/monitAA/store", payload);

			setMonitoreos([buildMonitoreoDraft()]);
			firstAutoOpenedRef.current = false;

			if (typeof navigate === "function") {
				navigate("/comunicaciones/monitoreos-aa");
			}
		} catch {
			throw new Error(FRIENDLY_SAVE_ERROR);
		} finally {
			setSaving(false);
		}
	}, [canSave, monitoreos, navigate]);

	return {
		loadingCatalogs,
		saving,
		canSave,
		canAddMonitoreo,

		plataforma,
		stateRed,
		stateMonit,
		sucursales, // ✅ por si lo ocupas en otro lado

		plataformasList,
		statusRedOptions,

		getHostsList,
		getIpKeyMeta,
		getSucursalMeta,

		monitoreos,
		updateMonitoreo,
		setStatusRed: setStatusRedValue, // ✅ exportado con el nombre que ya usas en el page
		removeMonitoreo,
		handleAddMonitoreo,
		accordion,
		submitMonitoreos,

		error,
	};
}
