// components/UI/GuardiasClose/Monitoreos/MonitProblemGuard.jsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { privateInstance } from "../../../../api/axios";
import BackBtnSection from "../../../icons/BtnBackSection";
import TableLoadingMessage from "../../Loaders/TableLoader";
import TableStateMessage from "../../Loaders/TableStateMessage";
import MonitProblem from "../../Monitoreos/MonitProblem";

const FORCE_CHANGE_AFTER_DAYS = 7;

function normalizeDateRest(v) {
	if (!v) return "";
	return String(v).slice(0, 10);
}

// ✅ parse robusto para "2026-02-16 10:00:00" o ISO
function toMsSafe(dateLike) {
	if (!dateLike) return null;

	const raw = String(dateLike).trim();
	if (!raw) return null;

	// si viene "YYYY-MM-DD HH:mm:ss" => lo hacemos ISO "YYYY-MM-DDTHH:mm:ss"
	const isoish =
		raw.includes(" ") && !raw.includes("T") ? raw.replace(" ", "T") : raw;

	const ms = Date.parse(isoish);
	return Number.isFinite(ms) ? ms : null;
}

function ageDaysFromCreatedAt(createdAt) {
	const ms = toMsSafe(createdAt);
	if (!ms) return null;
	const now = Date.now();
	const diff = now - ms;
	if (diff < 0) return 0;
	return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function normalizeClientItemFromDb(row, site) {
	const id = String(row?.id ?? "");
	const code = row?.client_code ?? row?.numCV ?? "";
	const name = row?.client_name ?? row?.nameCV ?? row?.name ?? "";
	const label =
		row?.client_label ??
		String(code && name ? `${code} - ${name}` : name || code || `ID ${id}`);

	return {
		id: row?.id ?? row?.client_id ?? id,

		label,
		numCV: code,
		nameCV: name,

		backup: row?.client_backup ?? row?.backup,
		jobs: row?.client_jobs ?? row?.jobs,

		monitoreo_id: row?.monitoreo_id ?? row?.id_monitoreo ?? null,
		dateRest: normalizeDateRest(row?.dateRest),

		estatus: String(row?.estatus ?? ""),
		observacion: String(row?.observacion ?? ""),

		concluido: row?.concluido ?? null,

		veeam_id: row?.veeam_id ?? row?.siteApp ?? null,
		veeam_name: row?.veeam_name ?? row?.siteApp_name ?? null,

		// ✅ para regla +7 días
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

export default function MonitProblemGuard({
	site = "veeam",
	pendingItemsBySite = { veeam: [] },
	onBack,
	onSaved,
}) {
	void site;

	const tabs = useMemo(() => [{ key: "veeam", label: "VEEAM" }], []);

	const [active, setActive] = useState(site || "veeam");

	useEffect(() => {
		setActive("veeam");
	}, []);

	const [dbPendingBySite, setDbPendingBySite] = useState(() => ({
		veeam: [],
	}));
	const [statusBySite, setStatusBySite] = useState(() => ({
		veeam: {},
	}));

	const [loadingDbBySite, setLoadingDbBySite] = useState(() => ({
		veeam: false,
	}));
	const [errorDbBySite, setErrorDbBySite] = useState(() => ({
		veeam: null,
	}));
	const [attemptedDbBySite, setAttemptedDbBySite] = useState(() => ({
		veeam: false,
	}));

	const attemptedRef = useRef(attemptedDbBySite);
	useEffect(() => {
		attemptedRef.current = attemptedDbBySite;
	}, [attemptedDbBySite]);

	const getDbUrl = useCallback((s) => {
		if (s === "veeam") return "/operaciones/monitoreos/pendientes/veeam";
		return "";
	}, []);

	const fetchDbPending = useCallback(
		async (s, { force = false } = {}) => {
			if (!s) return;
			if (s !== "veeam") return;
			if (!force && attemptedRef.current?.[s]) return;

			const url = getDbUrl(s);
			if (!url) {
				setAttemptedDbBySite((p) => ({ ...p, [s]: true }));
				return;
			}

			setLoadingDbBySite((p) => ({ ...p, [s]: true }));
			setErrorDbBySite((p) => ({ ...p, [s]: null }));

			try {
				const res = await privateInstance.get(url);

				const raw = Array.isArray(res.data?.items)
					? res.data.items
					: Array.isArray(res.data?.data)
						? res.data.data
						: [];

				const status =
					res.data?.status && typeof res.data.status === "object"
						? res.data.status
						: {};

				const normalized = raw.map((r) => normalizeClientItemFromDb(r, s));

				setDbPendingBySite((p) => ({ ...p, [s]: normalized }));
				setStatusBySite((p) => ({ ...p, [s]: status }));
			} catch (e) {
				const msg =
					e?.response?.data?.message ||
					e?.message ||
					"Error cargando pendientes BD.";
				setErrorDbBySite((p) => ({ ...p, [s]: msg }));
			} finally {
				setAttemptedDbBySite((p) => ({ ...p, [s]: true }));
				setLoadingDbBySite((p) => ({ ...p, [s]: false }));
			}
		},
		[getDbUrl],
	);

	useEffect(() => {
		if (!active) return;
		fetchDbPending(active);
	}, [active, fetchDbPending]);

	const newPending = pendingItemsBySite?.[active] ?? [];
	const dbPending = dbPendingBySite?.[active] ?? [];

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

	const loading = Boolean(loadingDbBySite?.[active]);
	const error = errorDbBySite?.[active] ?? null;
	const attempted = Boolean(attemptedDbBySite?.[active]);

	const [problemFormBySite, setProblemFormBySite] = useState(() => ({
		veeam: {},
	}));

	const problemForm = problemFormBySite?.[active] ?? {};

	// ✅ snapshot inicial (para comparar cambios en items DB)
	const [initialSnapshotBySite, setInitialSnapshotBySite] = useState(() => ({
		veeam: {},
	}));

	const initialSnapshot = initialSnapshotBySite?.[active] ?? {};

	useEffect(() => {
		if (!attempted || loading || error) return;

		// 1) precarga form (como ya lo tienes)
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

		// 2) snapshot inicial SOLO para items DB (no lo sobre-escribimos)
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

		if (opts.length === 0) return [{ value: "", label: "Seleccionar estatus" }];
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
			// ✅ tu botón de concluir hoy hace esto
			handleProblemChange(clientId, { estatus: "1" });
		},
		[mergedItems, handleProblemChange],
	);

	const metaChips = useCallback((c, f) => {
		const chips = [];
		if (c?._source === "db") chips.push({ label: "Origen", value: "BD" });
		if (c?._source === "new") chips.push({ label: "Origen", value: "Nuevo" });
		if (c?.veeam_name) chips.push({ label: "Veeam", value: c.veeam_name });
		if (f?.estatus) chips.push({ label: "Estatus", value: f.estatus });
		if (f?.last_restore_date)
			chips.push({ label: "Restauración", value: f.last_restore_date });

		// ✅ opcional: mostrar antigüedad si existe created_at
		const days = ageDaysFromCreatedAt(c?.created_at);
		if (Number.isFinite(days) && days !== null) {
			chips.push({ label: "Antigüedad", value: `${days} día(s)` });
		}

		return chips;
	}, []);

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

	// ✅ helper: para los DB >7 días, obligar AL MENOS 1 acción:
	// - cambiar estatus vs inicial
	// - cambiar observación vs inicial
	// - o concluir (estatus === "1" según tu botón)
	const requiresActionForItem = useCallback((item) => {
		if (!item) return false;
		if (item?._source !== "db") return false;

		const days = ageDaysFromCreatedAt(item?.created_at);
		if (days === null) return false; // si no hay created_at, no forzamos (evita falsos bloqueos)
		return days > FORCE_CHANGE_AFTER_DAYS;
	}, []);

	const didUserDoOneAction = useCallback(
		(item) => {
			const key = String(item?.id ?? "");
			if (!key) return true;

			const init = initialSnapshot?.[key] ?? {
				estatus: String(item?.estatus ?? ""),
				observacion: String(item?.observacion ?? ""),
			};

			const cur = problemForm?.[key] ?? {};
			const curStatus = String(cur?.estatus ?? "").trim();
			const curObs = String(cur?.observacion ?? "").trim();

			const initStatus = String(init?.estatus ?? "").trim();
			const initObs = String(init?.observacion ?? "").trim();

			const statusChanged =
				curStatus.length > 0 && String(curStatus) !== String(initStatus);

			const obsChanged =
				curObs.length > 0 && String(curObs) !== String(initObs);

			// ✅ "concluir" según tu UI actual (botón => estatus "1")
			const concluded = curStatus === "1";

			return statusChanged || obsChanged || concluded;
		},
		[initialSnapshot, problemForm],
	);

	const handleContinue = useCallback(() => {
		setFormError("");

		const allRows = [...(payloadDb?.rows ?? []), ...(payloadNew?.rows ?? [])];

		// ✅ tu validación original (no pasa si faltan campos)
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

		// ✅ NUEVA REGLA: DB con más de 7 días => obligar 1 acción (estatus u observación o concluir)
		const mustAct = (mergedItems ?? []).filter((it) =>
			requiresActionForItem(it),
		);
		const notActed = mustAct.filter((it) => !didUserDoOneAction(it));

		if (notActed.length > 0) {
			// mensaje con ejemplo
			const first = notActed[0];
			const label =
				String(first?.label ?? "").trim() ||
				(String(first?.numCV ?? "").trim() && String(first?.nameCV ?? "").trim()
					? `${first.numCV} - ${first.nameCV}`
					: "");

			setFormError(
				`Hay ${notActed.length} monitoreo(s) de BD con más de ${FORCE_CHANGE_AFTER_DAYS} días que requieren al menos 1 acción: cambiar Estatus, cambiar Observación o Concluir. ` +
					(label ? `Ejemplo: ${label}.` : ""),
			);
			return;
		}

		const rowsForResume = (mergedItems ?? []).map((c) => {
			const key = String(c?.id ?? "");
			const f = problemForm?.[key] ?? {};

			const numCV = String(c?.numCV ?? "").trim();
			const nameCV = String(c?.nameCV ?? "").trim();
			const label = String(c?.label ?? "").trim();

			const estatusVeeamToSend = String(f?.estatus ?? c?.estatus ?? "").trim();
			const previewConcluido =
				computePreviewConcluidoFromVeeamStatus(estatusVeeamToSend);

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
			};
		});

		onSaved?.(active, { payloadDb, payloadNew, mergedItems, rowsForResume });
	}, [
		payloadDb,
		payloadNew,
		onSaved,
		active,
		mergedItems,
		problemForm,
		requiresActionForItem,
		didUserDoOneAction,
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
						Pendientes / Problemas (Guardia)
					</h2>
					<p className="text-sm text-slate-600 dark:text-slate-400">
						Se muestran: <b>No seleccionados</b> + <b>Pendientes BD</b>{" "}
						(concluido=1).
					</p>
					<p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
						Regla: si un monitoreo viene de BD y tiene más de{" "}
						{FORCE_CHANGE_AFTER_DAYS} días, debes hacer al menos 1 acción:
						cambiar Estatus, cambiar Observación o Concluir.
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
