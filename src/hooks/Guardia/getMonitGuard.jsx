import { useCallback, useEffect, useMemo, useState } from "react";
import { privateInstance } from "../../api/axios";

// ✅ Por ahora SOLO VEEAM
const ENABLED_SITES = ["veeam"];
const DEFAULT_SITE = "veeam";

function getOkUrl(site) {
	if (site === "veeam") return "/operaciones/obtener/lista-veeam";
	return "";
}

function getPendingUrl(site) {
	if (site === "veeam") return "/operaciones/monitoreos/pendientes/veeam";
	return "";
}

function normalizeSite(site) {
	return ENABLED_SITES.includes(site) ? site : DEFAULT_SITE;
}

export default function useGuardMonitData(activeSite, guardiaIdParam = null) {
	const sites = useMemo(() => [...ENABLED_SITES], []);

	const safeActiveSite = useMemo(
		() => normalizeSite(String(activeSite || DEFAULT_SITE)),
		[activeSite],
	);

	const guardiaId = useMemo(() => {
		const n = Number(guardiaIdParam);
		return Number.isFinite(n) && n > 0 ? n : null;
	}, [guardiaIdParam]);

	const [itemsBySite, setItemsBySite] = useState(() => ({
		veeam: [],
	}));

	const [pendingBySite, setPendingBySite] = useState(() => ({
		veeam: [],
	}));

	const [statusBySite, setStatusBySite] = useState(() => ({
		veeam: {},
	}));

	const [loadingBySite, setLoadingBySite] = useState(() => ({
		veeam: false,
	}));

	const [loadingPendingBySite, setLoadingPendingBySite] = useState(() => ({
		veeam: false,
	}));

	const [errorBySite, setErrorBySite] = useState(() => ({
		veeam: null,
	}));

	const [errorPendingBySite, setErrorPendingBySite] = useState(() => ({
		veeam: null,
	}));

	const [attemptedBySite, setAttemptedBySite] = useState(() => ({
		veeam: false,
	}));

	const [attemptedPendingBySite, setAttemptedPendingBySite] = useState(() => ({
		veeam: false,
	}));

	const [savingOkBySite, setSavingOkBySite] = useState(() => ({
		veeam: false,
	}));

	const [saveOkErrorBySite, setSaveOkErrorBySite] = useState(() => ({
		veeam: null,
	}));

	const [savingProblemsBySite, setSavingProblemsBySite] = useState(() => ({
		veeam: false,
	}));

	const [saveProblemsErrorBySite, setSaveProblemsErrorBySite] = useState(
		() => ({
			veeam: null,
		}),
	);

	const fetchOkSite = useCallback(
		async (siteArg, { force = false } = {}) => {
			const site = normalizeSite(String(siteArg || DEFAULT_SITE));
			if (!sites.includes(site)) return;

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

	const fetchPendingSite = useCallback(
		async (siteArg, { force = false } = {}) => {
			const site = normalizeSite(String(siteArg || DEFAULT_SITE));
			if (!sites.includes(site)) return;

			if (!force && attemptedPendingBySite?.[site]) return;

			setLoadingPendingBySite((p) => ({ ...p, [site]: true }));
			setErrorPendingBySite((p) => ({ ...p, [site]: null }));

			try {
				const url = getPendingUrl(site);
				if (!url) throw new Error(`No hay endpoint PENDIENTES para: ${site}`);

				const res = await privateInstance.get(url);

				const items = Array.isArray(res.data?.items) ? res.data.items : [];
				const status =
					res.data?.status && typeof res.data.status === "object"
						? res.data.status
						: {};

				setPendingBySite((p) => ({ ...p, [site]: items }));
				setStatusBySite((p) => ({ ...p, [site]: status }));

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

	useEffect(() => {
		if (!safeActiveSite) return;
		fetchOkSite(safeActiveSite);
	}, [safeActiveSite, fetchOkSite]);

	const refreshActive = useCallback(() => {
		if (!safeActiveSite) return;
		fetchOkSite(safeActiveSite, { force: true });
	}, [safeActiveSite, fetchOkSite]);

	const refreshPendingActive = useCallback(() => {
		if (!safeActiveSite) return;
		fetchPendingSite(safeActiveSite, { force: true });
	}, [safeActiveSite, fetchPendingSite]);

	const prefetchBothActive = useCallback(() => {
		if (!safeActiveSite) return;
		fetchOkSite(safeActiveSite, { force: true });
		fetchPendingSite(safeActiveSite, { force: true });
	}, [safeActiveSite, fetchOkSite, fetchPendingSite]);

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

	const storeOk = useCallback(
		async (siteArg, rows) => {
			const site = normalizeSite(String(siteArg || DEFAULT_SITE));
			if (!sites.includes(site)) {
				return { ok: false, message: "Site inválido." };
			}

			if (!guardiaId) {
				return {
					ok: false,
					message: "No se encontró guardia_id para guardar monitoreos.",
				};
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
					`/operaciones/guardias/monitoreos/${guardiaId}`,
					payload,
				);

				return { ok: true, data: res.data };
			} catch (e) {
				const msg =
					e?.response?.data?.message ||
					e?.message ||
					"Error guardando monitoreos OK.";
				setSaveOkErrorBySite((p) => ({ ...p, [site]: msg }));
				return {
					ok: false,
					message: msg,
					errors: e?.response?.data?.errors,
				};
			} finally {
				setSavingOkBySite((p) => ({ ...p, [site]: false }));
			}
		},
		[sites, guardiaId],
	);

	const closeProblems = useCallback(
		async (siteArg, rows, { sync = false } = {}) => {
			const site = normalizeSite(String(siteArg || DEFAULT_SITE));
			if (!sites.includes(site)) {
				return { ok: false, message: "Site inválido." };
			}

			if (!guardiaId) {
				return {
					ok: false,
					message:
						"No se encontró guardia_id para actualizar monitoreos pendientes.",
				};
			}

			const safeRows = Array.isArray(rows) ? rows : [];
			if (!safeRows.length) {
				return { ok: true, data: { message: "Sin rows de problems. (skip)" } };
			}

			setSavingProblemsBySite((p) => ({ ...p, [site]: true }));
			setSaveProblemsErrorBySite((p) => ({ ...p, [site]: null }));

			try {
				const payload = {
					site,
					rows: safeRows,
					sync: Boolean(sync),
				};

				const res = await privateInstance.patch(
					`/operaciones/monitoreos/close/guard/${guardiaId}`,
					payload,
				);

				return { ok: true, data: res.data };
			} catch (e) {
				const msg =
					e?.response?.data?.message ||
					e?.message ||
					"Error guardando monitoreos PROBLEMS.";
				setSaveProblemsErrorBySite((p) => ({ ...p, [site]: msg }));
				return {
					ok: false,
					message: msg,
					errors: e?.response?.data?.errors,
				};
			} finally {
				setSavingProblemsBySite((p) => ({ ...p, [site]: false }));
			}
		},
		[sites, guardiaId],
	);

	return {
		itemsBySite,
		loadingBySite,
		errorBySite,
		attemptedBySite,
		fetchOkSite,
		refreshActive,

		pendingBySite,
		loadingPendingBySite,
		errorPendingBySite,
		attemptedPendingBySite,
		fetchPendingSite,
		refreshPendingActive,

		statusBySite,
		statusOptionsBySite,

		prefetchBothActive,

		storeOk,
		savingOkBySite,
		saveOkErrorBySite,

		closeProblems,
		savingProblemsBySite,
		saveProblemsErrorBySite,

		activeSite: safeActiveSite,
		sites,
		guardiaId,
	};
}
