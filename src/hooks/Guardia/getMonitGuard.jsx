// hooks/Guardia/getMonitGuard.jsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { privateInstance } from "../../api/axios";

// ✅ Por ahora SOLO VEEAM (manteniendo estructura por site para futuro)
const ENABLED_SITES = ["veeam"];
const DEFAULT_SITE = "veeam";

// ✅ funciones puras fuera del hook (Biome OK)
function getOkUrl(site) {
	if (site === "veeam") return "/operaciones/obtener/lista-veeam";
	// futuro:
	// if (site === "site24") return "/operaciones/obtener/lista-site24";
	return "";
}

function getPendingUrl(site) {
	if (site === "veeam") return "/operaciones/monitoreos/pendientes/veeam";
	// futuro:
	// if (site === "site24") return "/operaciones/monitoreos/pendientes/site24";
	return "";
}

function normalizeSite(site) {
	return ENABLED_SITES.includes(site) ? site : DEFAULT_SITE;
}

export default function useGuardMonitData(activeSite) {
	// ✅ mantenemos "sites" como antes (pero solo trae veeam)
	const sites = useMemo(() => [...ENABLED_SITES], []);

	// ✅ normalizamos el activeSite (si te pasan site24, cae a veeam)
	const safeActiveSite = useMemo(
		() => normalizeSite(String(activeSite || DEFAULT_SITE)),
		[activeSite],
	);

	// =========================
	// ✅ Lista OK (MonitOk)
	// =========================
	const [itemsBySite, setItemsBySite] = useState(() => ({
		veeam: [],
		// futuro: site24: [],
	}));

	// =========================
	// ✅ Lista Pendientes BD (MonitProblemGuard)
	// =========================
	const [pendingBySite, setPendingBySite] = useState(() => ({
		veeam: [],
		// futuro: site24: [],
	}));

	// ✅ status map por site (para selects)
	const [statusBySite, setStatusBySite] = useState(() => ({
		veeam: {},
		// futuro: site24: {},
	}));

	// loading OK
	const [loadingBySite, setLoadingBySite] = useState(() => ({
		veeam: false,
		// futuro: site24: false,
	}));

	// loading Pendientes
	const [loadingPendingBySite, setLoadingPendingBySite] = useState(() => ({
		veeam: false,
		// futuro: site24: false,
	}));

	// error OK
	const [errorBySite, setErrorBySite] = useState(() => ({
		veeam: null,
		// futuro: site24: null,
	}));

	// error Pendientes
	const [errorPendingBySite, setErrorPendingBySite] = useState(() => ({
		veeam: null,
		// futuro: site24: null,
	}));

	// attempted OK
	const [attemptedBySite, setAttemptedBySite] = useState(() => ({
		veeam: false,
		// futuro: site24: false,
	}));

	// attempted Pendientes
	const [attemptedPendingBySite, setAttemptedPendingBySite] = useState(() => ({
		veeam: false,
		// futuro: site24: false,
	}));

	// =========================
	// ✅ guardar OK (store)
	// =========================
	const [savingOkBySite, setSavingOkBySite] = useState(() => ({
		veeam: false,
		// futuro: site24: false,
	}));
	const [saveOkErrorBySite, setSaveOkErrorBySite] = useState(() => ({
		veeam: null,
		// futuro: site24: null,
	}));

	// =========================
	// ✅ guardar PROBLEMS (MonitGuardEdit)
	// =========================
	const [savingProblemsBySite, setSavingProblemsBySite] = useState(() => ({
		veeam: false,
		// futuro: site24: false,
	}));
	const [saveProblemsErrorBySite, setSaveProblemsErrorBySite] = useState(
		() => ({
			veeam: null,
			// futuro: site24: null,
		}),
	);

	// =========================
	// ✅ fetch OK
	// =========================
	const fetchOkSite = useCallback(
		async (siteArg, { force = false } = {}) => {
			const site = normalizeSite(String(siteArg || DEFAULT_SITE));
			if (!sites.includes(site)) return;

			// cache
			if (!force && attemptedBySite?.[site]) return;

			setLoadingBySite((p) => ({ ...p, [site]: true }));
			setErrorBySite((p) => ({ ...p, [site]: null }));

			try {
				const url = getOkUrl(site);
				if (!url) throw new Error(`No hay endpoint OK para: ${site}`);

				const res = await privateInstance.get(url);
				const items = Array.isArray(res.data?.items) ? res.data.items : [];

				setItemsBySite((p) => ({ ...p, [site]: items }));
			} catch (e) {
				const msg =
					e?.response?.data?.message ||
					e?.message ||
					"Error cargando lista OK del site.";
				setErrorBySite((p) => ({ ...p, [site]: msg }));
			} finally {
				setAttemptedBySite((p) => ({ ...p, [site]: true }));
				setLoadingBySite((p) => ({ ...p, [site]: false }));
			}
		},
		[sites, attemptedBySite],
	);

	// =========================
	// ✅ fetch Pendientes BD
	// =========================
	const fetchPendingSite = useCallback(
		async (siteArg, { force = false } = {}) => {
			const site = normalizeSite(String(siteArg || DEFAULT_SITE));
			if (!sites.includes(site)) return;

			// cache
			if (!force && attemptedPendingBySite?.[site]) return;

			setLoadingPendingBySite((p) => ({ ...p, [site]: true }));
			setErrorPendingBySite((p) => ({ ...p, [site]: null }));

			try {
				const url = getPendingUrl(site);
				if (!url) throw new Error(`No hay endpoint PENDIENTES para: ${site}`);

				const res = await privateInstance.get(url);

				// ✅ endpoint devuelve: { items: [...], status: {...}, source: "veeam" }
				const items = Array.isArray(res.data?.items) ? res.data.items : [];
				const status =
					res.data?.status && typeof res.data.status === "object"
						? res.data.status
						: {};

				setPendingBySite((p) => ({ ...p, [site]: items }));
				setStatusBySite((p) => ({ ...p, [site]: status }));

				// ✅ IMPORTANTE: ahora sí retornamos para evitar "stale state" en el caller
				return { ok: true, items, status };
			} catch (e) {
				const msg =
					e?.response?.data?.message ||
					e?.message ||
					"Error cargando pendientes del site.";
				setErrorPendingBySite((p) => ({ ...p, [site]: msg }));
				return { ok: false, message: msg };
			} finally {
				setAttemptedPendingBySite((p) => ({ ...p, [site]: true }));
				setLoadingPendingBySite((p) => ({ ...p, [site]: false }));
			}
		},
		[sites, attemptedPendingBySite],
	);

	// ✅ por defecto: solo carga OK al cambiar tab (aunque sea solo veeam)
	useEffect(() => {
		if (!safeActiveSite) return;
		fetchOkSite(safeActiveSite);
	}, [safeActiveSite, fetchOkSite]);

	// ✅ helpers refresh
	const refreshActive = useCallback(() => {
		if (!safeActiveSite) return;
		fetchOkSite(safeActiveSite, { force: true });
	}, [safeActiveSite, fetchOkSite]);

	const refreshPendingActive = useCallback(() => {
		if (!safeActiveSite) return;
		fetchPendingSite(safeActiveSite, { force: true });
	}, [safeActiveSite, fetchPendingSite]);

	// ✅ opcional: carga ambas listas del tab activo (OK + pendientes)
	const prefetchBothActive = useCallback(() => {
		if (!safeActiveSite) return;
		fetchOkSite(safeActiveSite, { force: true });
		fetchPendingSite(safeActiveSite, { force: true });
	}, [safeActiveSite, fetchOkSite, fetchPendingSite]);

	// ✅ convertir statusMap a options para select (misma estructura)
	const statusOptionsBySite = useMemo(() => {
		const out = {};
		for (const s of sites) {
			const map = statusBySite?.[s] ?? {};
			out[s] = Object.entries(map).map(([value, label]) => ({
				value: String(value),
				label: String(label),
			}));
		}
		return out;
	}, [sites, statusBySite]);

	// =========================
	// ✅ enviar OK al backend (store)
	// =========================
	const storeOk = useCallback(
		async (siteArg, rows) => {
			const site = normalizeSite(String(siteArg || DEFAULT_SITE));
			if (!sites.includes(site)) {
				return { ok: false, message: "Site inválido." };
			}

			const safeRows = Array.isArray(rows) ? rows : [];
			if (!safeRows.length) {
				return { ok: false, message: "No hay rows para guardar." };
			}

			setSavingOkBySite((p) => ({ ...p, [site]: true }));
			setSaveOkErrorBySite((p) => ({ ...p, [site]: null }));

			try {
				const payload = { site, rows: safeRows };
				const res = await privateInstance.post(
					"/operaciones/monitoreos/store",
					payload,
				);
				return { ok: true, data: res.data };
			} catch (e) {
				const msg =
					e?.response?.data?.message ||
					e?.message ||
					"Error guardando monitoreos OK.";
				setSaveOkErrorBySite((p) => ({ ...p, [site]: msg }));
				return { ok: false, message: msg, errors: e?.response?.data?.errors };
			} finally {
				setSavingOkBySite((p) => ({ ...p, [site]: false }));
			}
		},
		[sites],
	);

	// =========================
	// ✅ enviar PROBLEMS al backend (MonitGuardEdit)
	// =========================
	const closeProblems = useCallback(
		async (siteArg, rows, { sync = false } = {}) => {
			const site = normalizeSite(String(siteArg || DEFAULT_SITE));
			if (!sites.includes(site)) {
				return { ok: false, message: "Site inválido." };
			}

			const safeRows = Array.isArray(rows) ? rows : [];
			if (!safeRows.length) {
				return { ok: true, data: { message: "Sin rows de problems. (skip)" } };
			}

			setSavingProblemsBySite((p) => ({ ...p, [site]: true }));
			setSaveProblemsErrorBySite((p) => ({ ...p, [site]: null }));

			try {
				const payload = { site, rows: safeRows, sync: Boolean(sync) };
				const res = await privateInstance.patch(
					"/operaciones/monitoreos/close/guard",
					payload,
				);
				return { ok: true, data: res.data };
			} catch (e) {
				const msg =
					e?.response?.data?.message ||
					e?.message ||
					"Error guardando monitoreos PROBLEMS.";
				setSaveProblemsErrorBySite((p) => ({ ...p, [site]: msg }));
				return { ok: false, message: msg, errors: e?.response?.data?.errors };
			} finally {
				setSavingProblemsBySite((p) => ({ ...p, [site]: false }));
			}
		},
		[sites],
	);

	return {
		// OK
		itemsBySite,
		loadingBySite,
		errorBySite,
		attemptedBySite,
		fetchOkSite,
		refreshActive,

		// Pendientes
		pendingBySite,
		loadingPendingBySite,
		errorPendingBySite,
		attemptedPendingBySite,
		fetchPendingSite,
		refreshPendingActive,

		// status para selects
		statusBySite,
		statusOptionsBySite,

		// opcional
		prefetchBothActive,

		// store OK
		storeOk,
		savingOkBySite,
		saveOkErrorBySite,

		// close problems
		closeProblems,
		savingProblemsBySite,
		saveProblemsErrorBySite,

		// ✅ por si lo ocupas en componentes
		activeSite: safeActiveSite,
		sites,
	};
}
