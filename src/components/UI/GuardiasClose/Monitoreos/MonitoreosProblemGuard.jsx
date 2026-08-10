// components/UI/GuardiasClose/Monitoreos/MonitProblemGuard.jsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import useGuardMonitData from "../../../../hooks/Guardia/getMonitGuard";
import BackBtnSection from "../../../icons/BtnBackSection";
import TableLoadingMessage from "../../Loaders/TableLoader";
import TableStateMessage from "../../Loaders/TableStateMessage";
import MonitProblem from "../../Monitoreos/MonitProblem";

const FORCE_CHANGE_AFTER_DAYS = 7;
const MIN_DISTINCT_WORDS = 3;
const MAX_ALLOWED_WORD_OVERLAP = 0.7;
const BLOCK_SAME_PREFIX_WORDS = 3;

function normalizeDateRest(v) {
	if (!v) return "";
	return String(v).slice(0, 10);
}

function getUpdatedAtValue(row) {
	return (
		row?.updatedAt ??
		row?.updated_at ??
		row?.updateAt ??
		row?.update_at ??
		row?.modifiedAt ??
		row?.modified_at ??
		row?.created_at ??
		row?.createdAt ??
		null
	);
}

function toMsSafe(dateLike) {
	if (!dateLike) return null;

	const raw = String(dateLike).trim();
	if (!raw) return null;

	const isoish =
		raw.includes(" ") && !raw.includes("T") ? raw.replace(" ", "T") : raw;

	const ms = Date.parse(isoish);
	return Number.isFinite(ms) ? ms : null;
}

function ageDaysFromUpdatedAt(updatedAt) {
	const ms = toMsSafe(updatedAt);
	if (!ms) return null;

	const now = Date.now();
	const diff = now - ms;

	if (diff < 0) return 0;

	return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function stripAccents(value) {
	return String(value ?? "")
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "");
}

function normalizeObservationText(value) {
	return stripAccents(value)
		.toLowerCase()
		.replace(/[^a-z0-9\s]/g, " ")
		.replace(/\s+/g, " ")
		.trim();
}

function getObservationWords(value) {
	const normalized = normalizeObservationText(value);
	if (!normalized) return [];

	return normalized.split(" ").filter(Boolean);
}

function getMeaningfulObservationWords(value) {
	return getObservationWords(value).filter((word) => word.length >= 3);
}

function getCommonPrefixWordsCount(wordsA, wordsB) {
	const limit = Math.min(wordsA.length, wordsB.length);
	let count = 0;

	for (let i = 0; i < limit; i += 1) {
		if (wordsA[i] !== wordsB[i]) break;
		count += 1;
	}

	return count;
}

function getWordOverlapRatio(wordsA, wordsB) {
	const setA = new Set(wordsA);
	const setB = new Set(wordsB);

	if (setA.size === 0 || setB.size === 0) return 0;

	let intersection = 0;

	for (const word of setA) {
		if (setB.has(word)) intersection += 1;
	}

	return intersection / Math.max(setA.size, setB.size);
}

function isMeaningfullyDifferentObservation(previousValue, nextValue) {
	const prevNormalized = normalizeObservationText(previousValue);
	const nextNormalized = normalizeObservationText(nextValue);

	if (!nextNormalized) return false;
	if (!prevNormalized) return nextNormalized.length > 0;

	if (nextNormalized === prevNormalized) return false;

	if (
		prevNormalized.includes(nextNormalized) ||
		nextNormalized.includes(prevNormalized)
	) {
		return false;
	}

	const prevWordsAll = getObservationWords(previousValue);
	const nextWordsAll = getObservationWords(nextValue);

	const prevWords = getMeaningfulObservationWords(previousValue);
	const nextWords = getMeaningfulObservationWords(nextValue);

	if (nextWords.length < MIN_DISTINCT_WORDS) return false;

	const commonPrefixCount = getCommonPrefixWordsCount(
		prevWordsAll,
		nextWordsAll,
	);

	const minWordsForPrefixBlock = Math.min(
		BLOCK_SAME_PREFIX_WORDS,
		prevWordsAll.length,
		nextWordsAll.length,
	);

	if (
		minWordsForPrefixBlock > 0 &&
		commonPrefixCount >= minWordsForPrefixBlock
	) {
		return false;
	}

	const overlapRatio = getWordOverlapRatio(prevWords, nextWords);
	if (overlapRatio >= MAX_ALLOWED_WORD_OVERLAP) return false;

	return true;
}

function normalizeClientItemFromDb(row, site) {
	const id = String(row?.id ?? "");
	const code = row?.client_code ?? row?.numCV ?? "";
	const name = row?.client_name ?? row?.nameCV ?? row?.name ?? "";

	const label =
		row?.client_label ??
		String(code && name ? `${code} - ${name}` : name || code || `ID ${id}`);

	const updatedAt = getUpdatedAtValue(row);

	return {
		id: row?.id ?? row?.client_id ?? id,

		label,
		numCV: code,
		nameCV: name,

		backup: row?.client_backup ?? row?.backup,
		jobs: row?.client_jobs ?? row?.jobs,

		monitoreo_id: row?.monitoreo_id ?? row?.id_monitoreo ?? row?.id ?? null,
		dateRest: normalizeDateRest(row?.dateRest),

		estatus: String(row?.estatus ?? ""),
		observacion: String(row?.observacion ?? ""),

		concluido: row?.concluido ?? null,

		veeam_id: row?.veeam_id ?? row?.siteApp ?? null,
		veeam_name: row?.veeam_name ?? row?.siteApp_name ?? null,

		updatedAt,
		updated_at: updatedAt,

		created_at: row?.created_at ?? row?.createdAt ?? null,

		site,
		_source: "db",
	};
}

function computePreviewConcluidoFromVeeamStatus(estatusVeeam) {
	const s = String(estatusVeeam ?? "").trim();

	if (s === "1" || s === "2") return "2";
	if (!s) return "";

	return "1";
}

function getClientDisplayLabel(item) {
	const label = String(item?.label ?? "").trim();
	if (label) return label;

	const numCV = String(item?.numCV ?? "").trim();
	const nameCV = String(item?.nameCV ?? "").trim();

	if (numCV && nameCV) return `${numCV} - ${nameCV}`;
	if (numCV) return numCV;
	if (nameCV) return nameCV;

	return `ID ${item?.id ?? ""}`;
}

export default function MonitProblemGuard({
	site = "veeam",
	pendingItemsBySite = { veeam: [] },
	onBack,
	onSaved,
}) {
	const { id } = useParams();

	const tabs = useMemo(() => [{ key: "veeam", label: "VEEAM" }], []);
	const [active, setActive] = useState(site || "veeam");

	useEffect(() => {
		setActive("veeam");
	}, []);

	const {
		pendingBySite,
		loadingPendingBySite,
		errorPendingBySite,
		attemptedPendingBySite,
		fetchPendingSite,
		statusBySite,
	} = useGuardMonitData(active, id);

	const dbPendingRaw = pendingBySite?.[active] ?? [];

	const dbPending = useMemo(
		() => dbPendingRaw.map((r) => normalizeClientItemFromDb(r, active)),
		[dbPendingRaw, active],
	);

	const loading = Boolean(loadingPendingBySite?.[active]);
	const error = errorPendingBySite?.[active] ?? null;
	const attempted = Boolean(attemptedPendingBySite?.[active]);

	useEffect(() => {
		if (!active) return;
		if (attempted) return;

		fetchPendingSite(active);
	}, [active, attempted, fetchPendingSite]);

	const newPending = pendingItemsBySite?.[active] ?? [];

	const mergedItems = useMemo(() => {
		const map = new Map();

		for (const it of dbPending) {
			const key = String(it?.id ?? "");
			if (!key) continue;

			map.set(key, it);
		}

		for (const it of newPending) {
			const key = String(it?.id ?? "");
			if (!key) continue;

			const prev = map.get(key);

			map.set(key, {
				...prev,
				...it,
				_source: prev ? "db" : "new",
			});
		}

		return Array.from(map.values());
	}, [dbPending, newPending]);

	const [problemFormBySite, setProblemFormBySite] = useState(() => ({
		veeam: {},
	}));

	const problemForm = problemFormBySite?.[active] ?? {};

	const [initialSnapshotBySite, setInitialSnapshotBySite] = useState(() => ({
		veeam: {},
	}));

	const initialSnapshot = initialSnapshotBySite?.[active] ?? {};

	useEffect(() => {
		if (!attempted || loading || error) return;

		setProblemFormBySite((prev) => {
			const nextSiteForm = { ...(prev?.[active] ?? {}) };
			let changed = false;

			for (const it of mergedItems) {
				const key = String(it?.id ?? "");

				if (!key) continue;
				if (nextSiteForm[key]) continue;

				const pre = {
					estatus: String(it?.estatus ?? ""),
					observacion: String(it?.observacion ?? ""),
					last_restore_date: normalizeDateRest(it?.dateRest),
				};

				if (pre.estatus || pre.observacion || pre.last_restore_date) {
					nextSiteForm[key] = pre;
					changed = true;
				}
			}

			if (!changed) return prev;

			return { ...prev, [active]: nextSiteForm };
		});

		setInitialSnapshotBySite((prev) => {
			const cur = { ...(prev?.[active] ?? {}) };
			let changed = false;

			for (const it of mergedItems) {
				if (it?._source !== "db") continue;

				const key = String(it?.id ?? "");

				if (!key) continue;
				if (cur[key]) continue;

				cur[key] = {
					estatus: String(it?.estatus ?? ""),
					observacion: String(it?.observacion ?? ""),
					last_restore_date: normalizeDateRest(it?.dateRest),
					updatedAt: getUpdatedAtValue(it),
				};

				changed = true;
			}

			if (!changed) return prev;

			return { ...prev, [active]: cur };
		});
	}, [attempted, loading, error, mergedItems, active]);

	const [formError, setFormError] = useState("");

	const handleProblemChange = useCallback(
		(clientId, patch) => {
			setFormError("");

			const key = String(clientId);

			setProblemFormBySite((prev) => {
				const currentSite = prev?.[active] ?? {};

				const currentRow = currentSite?.[key] ?? {
					estatus: "",
					observacion: "",
					last_restore_date: "",
				};

				return {
					...prev,
					[active]: {
						...currentSite,
						[key]: { ...currentRow, ...patch },
					},
				};
			});
		},
		[active],
	);

	const statusOptions = useMemo(() => {
		const map = statusBySite?.[active] ?? {};

		const opts = Object.entries(map).map(([value, label]) => ({
			value: String(value),
			label: String(label),
		}));

		if (opts.length === 0) {
			return [{ value: "", label: "Seleccionar estatus" }];
		}

		return [{ value: "", label: "Seleccionar estatus" }, ...opts];
	}, [statusBySite, active]);

	const getStatusOptions = useCallback(
		(c) => {
			const base = statusOptions ?? [];

			if (c?._source === "new") {
				return base.filter((o) => String(o.value) !== "1");
			}

			return base;
		},
		[statusOptions],
	);

	useEffect(() => {
		if (!mergedItems?.length) return;

		setProblemFormBySite((prev) => {
			const siteForm = { ...(prev?.[active] ?? {}) };
			let changed = false;

			for (const it of mergedItems) {
				if (it?._source !== "new") continue;

				const key = String(it?.id ?? "");
				if (!key) continue;

				const row = siteForm[key];
				if (!row) continue;

				if (String(row.estatus ?? "") === "1") {
					siteForm[key] = { ...row, estatus: "" };
					changed = true;
				}
			}

			if (!changed) return prev;

			return { ...prev, [active]: siteForm };
		});
	}, [mergedItems, active]);

	const handleConcludeDbItem = useCallback(
		(clientId) => {
			const key = String(clientId);

			const item = (mergedItems ?? []).find((x) => String(x?.id ?? "") === key);
			if (!item || item._source !== "db") return;

			setFormError("");
			handleProblemChange(clientId, { estatus: "1" });
		},
		[mergedItems, handleProblemChange],
	);

	const getChangeFlags = useCallback(
		(item, formRow = {}) => {
			const key = String(item?.id ?? "");

			const init = initialSnapshot?.[key] ?? {
				estatus: String(item?.estatus ?? ""),
				observacion: String(item?.observacion ?? ""),
				last_restore_date: normalizeDateRest(item?.dateRest),
				updatedAt: getUpdatedAtValue(item),
			};

			const curStatus = String(formRow?.estatus ?? "").trim();
			const curObs = String(formRow?.observacion ?? "").trim();
			const curDate = normalizeDateRest(formRow?.last_restore_date);

			const initStatus = String(init?.estatus ?? "").trim();
			const initObs = String(init?.observacion ?? "").trim();
			const initDate = normalizeDateRest(init?.last_restore_date);

			const statusChanged =
				curStatus.length > 0 && String(curStatus) !== String(initStatus);

			// ✅ Cambio simple: para pintar verde y clasificar en resumen
			const observationChanged =
				normalizeObservationText(curObs) !== normalizeObservationText(initObs);

			// ✅ Cambio estricto: solo para validar monitoreos > 7 días
			const observationMeaningfullyChanged = isMeaningfullyDifferentObservation(
				initObs,
				curObs,
			);

			const dateRestChanged = curDate !== initDate;

			const concluded = curStatus === "1";

			const concludedInGuard = concluded && initStatus !== "1";

			// ✅ Cualquier cambio real cuenta como modificado en guardia
			const changedInGuard =
				statusChanged ||
				observationChanged ||
				dateRestChanged ||
				concludedInGuard;

			// ✅ Acción válida obligatoria para monitoreos con más de 7 días
			const validOldMonitorAction =
				statusChanged ||
				observationMeaningfullyChanged ||
				dateRestChanged ||
				concludedInGuard;

			return {
				initStatus,
				initObs,
				initDate,
				curStatus,
				curObs,
				curDate,

				statusChanged,

				observationChanged,
				observationMeaningfullyChanged,

				// Alias para compatibilidad con partes anteriores
				obsChanged: observationMeaningfullyChanged,

				dateRestChanged,
				concluded,
				concludedInGuard,

				changedInGuard,
				validOldMonitorAction,
			};
		},
		[initialSnapshot],
	);

	const payloadDb = useMemo(() => {
		const rows = (mergedItems ?? [])
			.filter((c) => c?._source === "db")
			.map((c) => {
				const clientId = Number(c?.id);
				const key = String(c?.id ?? "");
				const f = problemForm?.[key] ?? {};
				const monitId = Number(c?.monitoreo_id ?? 0);

				const row = {
					id: monitId > 0 ? monitId : undefined,
					client_id: clientId,
					siteApp: null,
					estatus: String(f.estatus ?? ""),
					observacion: String(f.observacion ?? ""),
					dateRest: String(f.last_restore_date ?? ""),
				};

				if (!row.id) {
					const { id, ...rest } = row;
					return rest;
				}

				return row;
			})
			.filter((r) => Number.isFinite(r.client_id) && r.client_id > 0);

		return { site: active, rows };
	}, [mergedItems, problemForm, active]);

	const payloadNew = useMemo(() => {
		const rows = (mergedItems ?? [])
			.filter((c) => c?._source === "new")
			.map((c) => {
				const clientId = Number(c?.id);
				const key = String(c?.id ?? "");
				const f = problemForm?.[key] ?? {};

				return {
					client_id: clientId,
					siteApp: null,
					estatus: String(f.estatus ?? ""),
					observacion: String(f.observacion ?? ""),
					dateRest: String(
						f.last_restore_date ??
							c?.last_dateRest ??
							c?.dateRest ??
							c?.last_restore_date ??
							"",
					),
				};
			})
			.filter((r) => Number.isFinite(r.client_id) && r.client_id > 0);

		return { site: active, rows };
	}, [mergedItems, problemForm, active]);

	const requiresActionForItem = useCallback((item) => {
		if (!item) return false;
		if (item?._source !== "db") return false;

		const days = ageDaysFromUpdatedAt(getUpdatedAtValue(item));
		if (days === null) return false;

		return days > FORCE_CHANGE_AFTER_DAYS;
	}, []);

	const didUserDoOneAction = useCallback(
		(item) => {
			const key = String(item?.id ?? "");
			if (!key) return true;

			const cur = problemForm?.[key] ?? {};
			const flags = getChangeFlags(item, cur);

			// ✅ Esta función solo valida la regla estricta para monitoreos viejos
			return flags.validOldMonitorAction;
		},
		[problemForm, getChangeFlags],
	);

	const hasRepeatedOrSlightlyAdjustedObservation = useCallback(
		(item) => {
			if (!item || item?._source !== "db") return false;

			// ✅ Esta validación SOLO aplica para monitoreos con más de 7 días
			if (!requiresActionForItem(item)) return false;

			const key = String(item?.id ?? "");
			if (!key) return false;

			const cur = problemForm?.[key] ?? {};
			const flags = getChangeFlags(item, cur);

			const curStatus = String(cur?.estatus ?? "").trim();
			const curObs = String(cur?.observacion ?? "").trim();

			if (!curObs) return false;
			if (curStatus === "1") return false;

			if (flags.statusChanged) return false;
			if (flags.dateRestChanged) return false;
			if (flags.concludedInGuard) return false;

			if (flags.observationMeaningfullyChanged) return false;

			return true;
		},
		[problemForm, getChangeFlags, requiresActionForItem],
	);

	const metaChips = useCallback(
		(c, f) => {
			const chips = [];

			if (c?.veeam_name) {
				chips.push({ label: "Veeam", value: c.veeam_name });
			}

			if (f?.estatus) {
				chips.push({ label: "Estatus", value: f.estatus });
			}

			if (f?.last_restore_date) {
				chips.push({ label: "Restauración", value: f.last_restore_date });
			}

			const days = ageDaysFromUpdatedAt(getUpdatedAtValue(c));

			if (Number.isFinite(days) && days !== null) {
				const requiresChange = days > FORCE_CHANGE_AFTER_DAYS;
				const flags = getChangeFlags(c, f);

				/*
					✅ Verde:
					- cualquier monitoreo que tuvo un cambio real en esta guardia
					- sin importar si tiene 0, 2, 5 o más días
					- pero si tiene más de 7 días, solo se pone verde si la acción cumple la validación estricta

					✅ Rojo:
					- monitoreo con más de 7 días desde updatedAt
					- todavía no tiene una acción válida
				*/
				const showGreenUpdated =
					flags.changedInGuard &&
					(!requiresChange || flags.validOldMonitorAction);

				const showRedRequired = requiresChange && !flags.validOldMonitorAction;

				chips.push({
					label: showGreenUpdated
						? "Monitoreo"
						: showRedRequired
							? "Requiere Cambio de Estatus u Observación"
							: "Última Actualización",
					value: showGreenUpdated ? "Actualizado Ahora" : `${days} día(s)`,
					className: showGreenUpdated
						? "border-emerald-300 bg-emerald-50 text-emerald-700 font-bold dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
						: showRedRequired
							? "border-red-300 bg-red-50 text-red-700 font-bold dark:border-red-700 dark:bg-red-950/40 dark:text-red-300"
							: "",
				});
			}

			return chips;
		},
		[getChangeFlags],
	);

	const buildResumeRow = useCallback(
		(c) => {
			const key = String(c?.id ?? "");
			const f = problemForm?.[key] ?? {};

			const numCV = String(c?.numCV ?? "").trim();
			const nameCV = String(c?.nameCV ?? "").trim();
			const label = String(c?.label ?? "").trim();

			const estatusVeeamToSend = String(f?.estatus ?? c?.estatus ?? "").trim();

			const previewConcluido =
				computePreviewConcluidoFromVeeamStatus(estatusVeeamToSend);

			const flags = getChangeFlags(c, f);

			const isNewInGuard = c?._source === "new";

			// ✅ Para resumen usamos cambio simple
			const closedInGuard =
				c?._source === "db" && flags.changedInGuard && previewConcluido === "2";

			const pendingUpdatedInGuard =
				c?._source === "db" && flags.changedInGuard && previewConcluido !== "2";

			const unchangedInGuard = c?._source === "db" && !flags.changedInGuard;

			const guardCategory = closedInGuard
				? "closed_in_guard"
				: pendingUpdatedInGuard
					? "pending_updated_in_guard"
					: isNewInGuard
						? "new_in_guard"
						: "unchanged_in_guard";

			const updatedAt = getUpdatedAtValue(c);
			const updatedAgeDays = ageDaysFromUpdatedAt(updatedAt);

			return {
				numCV,
				nameCV,
				client_label: label || (numCV && nameCV ? `${numCV} - ${nameCV}` : ""),

				site: "veeam",
				veeam_name: c?.veeam_name ?? "",

				backup: c?.backup ?? "",

				last_restore_date: String(
					f?.last_restore_date ?? c?.last_dateRest ?? c?.dateRest ?? "",
				),

				estatus_veeam: estatusVeeamToSend,

				observacion: String(f?.observacion ?? c?.observacion ?? "").trim(),

				estatus_monitoreo: previewConcluido,

				_source: c?._source,

				updatedAt,
				updated_at: updatedAt,
				updated_age_days: updatedAgeDays,

				changed_in_guard: flags.changedInGuard,
				status_changed_in_guard: flags.statusChanged,

				// ✅ Para resumen
				observation_changed_in_guard: flags.observationChanged,

				// ✅ Para validación estricta
				observation_meaningfully_changed_in_guard:
					flags.observationMeaningfullyChanged,

				restore_date_changed_in_guard: flags.dateRestChanged,

				valid_old_monitor_action: flags.validOldMonitorAction,

				closed_in_guard: closedInGuard,
				pending_updated_in_guard: pendingUpdatedInGuard,
				new_in_guard: isNewInGuard,
				unchanged_in_guard: unchangedInGuard,
				guard_category: guardCategory,
			};
		},
		[problemForm, getChangeFlags],
	);

	const handleContinue = useCallback(() => {
		setFormError("");

		const allRows = [...(payloadDb?.rows ?? []), ...(payloadNew?.rows ?? [])];

		const invalid = allRows.find((r) => {
			const estatusOk = String(r.estatus ?? "").trim().length > 0;
			const observacionOk = String(r.observacion ?? "").trim().length > 0;

			return !r.client_id || !estatusOk || !observacionOk;
		});

		if (invalid) {
			const missing = [
				!String(invalid.estatus ?? "").trim() ? "Estatus" : null,
				!String(invalid.observacion ?? "").trim() ? "Observación" : null,
			].filter(Boolean);

			setFormError(
				`Falta capturar: ${missing.join(" y ")} en uno o más clientes.`,
			);

			return;
		}

		const repeatedObservationItem = (mergedItems ?? []).find((item) =>
			hasRepeatedOrSlightlyAdjustedObservation(item),
		);

		if (repeatedObservationItem) {
			const label = getClientDisplayLabel(repeatedObservationItem);

			setFormError(
				`El monitoreo del cliente ${label} tiene más de ${FORCE_CHANGE_AFTER_DAYS} días desde su última actualización. Debes hacer una acción real: cambiar Estatus, cambiar Fecha de Restauración, Concluir o capturar una observación realmente distinta. No se permite repetirla, recortarla, dejar el mismo inicio ni hacer ajustes mínimos como puntos, comas o una sola palabra diferente.`,
			);

			return;
		}

		const mustAct = (mergedItems ?? []).filter((it) =>
			requiresActionForItem(it),
		);

		const notActed = mustAct.filter((it) => !didUserDoOneAction(it));

		if (notActed.length > 0) {
			const first = notActed[0];
			const label = getClientDisplayLabel(first);

			setFormError(
				`Hay ${notActed.length} monitoreo(s) con más de ${FORCE_CHANGE_AFTER_DAYS} días desde su última actualización que requieren una acción real: cambiar Estatus, capturar una observación distinta, cambiar Fecha de Restauración o Concluir. ` +
					(label ? `Ejemplo: ${label}.` : ""),
			);

			return;
		}

		const rowsForResume = (mergedItems ?? []).map((c) => buildResumeRow(c));

		onSaved?.(active, { payloadDb, payloadNew, mergedItems, rowsForResume });
	}, [
		payloadDb,
		payloadNew,
		onSaved,
		active,
		mergedItems,
		requiresActionForItem,
		didUserDoOneAction,
		hasRepeatedOrSlightlyAdjustedObservation,
		buildResumeRow,
	]);

	const renderTabs = () => (
		<div className="flex flex-wrap items-center gap-2">
			{tabs.map((t) => {
				const isActive = active === t.key;

				return (
					<button
						key={t.key}
						type="button"
						onClick={() => {
							setFormError("");
							setActive(t.key);
						}}
						className={[
							"px-4 py-2 rounded-xl text-sm font-semibold border transition",
							isActive
								? "bg-blue-600 text-white border-blue-600"
								: "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800",
						].join(" ")}
					>
						{t.label}
					</button>
				);
			})}
		</div>
	);

	return (
		<section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
			<header className="flex flex-col gap-2 border-b border-slate-200 p-5 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
						Pendientes De Cierre
					</h2>

					<p className="text-sm text-slate-600 dark:text-slate-400">
						Se muestran los clientes que presentan problemas.
					</p>

					<p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
						Recuerda: si un monitoreo está pendiente y tiene más de{" "}
						{FORCE_CHANGE_AFTER_DAYS} días desde su última actualización, debes
						hacer una acción real: cambiar Estatus, capturar una observación
						distinta, cambiar Fecha de Restauración o Concluir.
					</p>
				</div>

				<div className="flex items-center gap-2">
					<BackBtnSection label="Monitoreos Ok" onClick={onBack} />
				</div>
			</header>

			<div className="p-5">
				{renderTabs()}

				<div className="mt-4">
					{!attempted || loading ? (
						<TableLoadingMessage
							title="Cargando pendientes Veeam"
							subtitle="Leyendo pendientes desde BD…"
							minHeight="220px"
						/>
					) : error ? (
						<TableStateMessage
							variant="error"
							message={error}
							minHeight="220px"
						/>
					) : mergedItems.length === 0 ? (
						<TableStateMessage
							variant="empty"
							message="No hay pendientes en este site."
							minHeight="220px"
						/>
					) : (
						<MonitProblem
							mode="wizard"
							site={active}
							items={mergedItems}
							loading={false}
							onBack={onBack}
							problemForm={problemForm}
							onProblemChange={handleProblemChange}
							statusPlaceholder="Seleccionar estatus"
							statusOptions={statusOptions}
							metaChips={metaChips}
							onContinue={handleContinue}
							getStatusOptions={getStatusOptions}
							onConcludeItem={handleConcludeDbItem}
						/>
					)}

					{formError ? (
						<div className="mt-4 p-3 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm">
							{formError}
						</div>
					) : null}
				</div>
			</div>
		</section>
	);
}
