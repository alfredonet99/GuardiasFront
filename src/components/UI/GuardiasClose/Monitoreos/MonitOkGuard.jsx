// components/UI/GuardiasClose/Monitoreos/MonitOkGuard.jsx
import { useCallback, useEffect, useMemo, useState } from "react";
import useGuardMonitData from "../../../../hooks/Guardia/getMonitGuard";
import TableLoadingMessage from "../../Loaders/TableLoader";
import TableStateMessage from "../../Loaders/TableStateMessage";
import MonitOk from "../../Monitoreos/MonitOk";

export default function MonitOkGuard({
	onContinue,
	defaultSite = "veeam",
	defaultSelectedBySite = { veeam: new Set() }, // ✅ SOLO VEEAM
}) {
	void defaultSite;

	const tabs = useMemo(() => [{ key: "veeam", label: "VEEAM" }], []);

	const [active, setActive] = useState("veeam");

	useEffect(() => {
		// ✅ aseguramos que no se “cuele” site24 aunque venga por props
		setActive("veeam");
	}, []);

	const {
		// OK list
		itemsBySite,
		loadingBySite,
		errorBySite,
		attemptedBySite,
		refreshActive,

		// ✅ Pendientes BD desde hook (sin duplicar axios aquí)
		fetchPendingSite,
		pendingBySite,
		loadingPendingBySite,
		errorPendingBySite,
		attemptedPendingBySite,
	} = useGuardMonitData(active);

	const [selectedBySite, setSelectedBySite] = useState(() => ({
		veeam: defaultSelectedBySite?.veeam ?? new Set(),
	}));

	// ✅ Snapshot OK items listos (con veeam_id/veeam_name) por site
	const [okSnapshotBySite, setOkSnapshotBySite] = useState(() => ({
		veeam: [],
	}));

	const selectedIds = selectedBySite[active] ?? new Set();
	const loading = Boolean(loadingBySite?.[active]);
	const items = itemsBySite?.[active] ?? [];
	const error = errorBySite?.[active] ?? null;
	const attempted = Boolean(attemptedBySite?.[active]);

	// ✅ pendientes BD (desde hook)
	const dbPending = pendingBySite?.[active] ?? [];
	const dbAttempted = Boolean(attemptedPendingBySite?.[active]);
	const dbLoading = Boolean(loadingPendingBySite?.[active]);
	const dbError = errorPendingBySite?.[active] ?? null;

	const setSelectedIds = (updater) => {
		setSelectedBySite((prev) => {
			const current = prev?.[active] ?? new Set();
			const nextSet =
				typeof updater === "function" ? updater(current) : updater;
			return { ...prev, [active]: nextSet };
		});
	};

	// ✅ pendientes "nuevos" = NO seleccionados
	const pendingNewItems = useMemo(() => {
		if (!items?.length) return [];
		return items.filter((c) => !selectedIds.has(c.id));
	}, [items, selectedIds]);

	// ✅ prefetch de pendientes BD al cambiar tab (1 vez por tab)
	useEffect(() => {
		if (!active) return;
		if (dbAttempted) return;
		fetchPendingSite(active);
	}, [active, dbAttempted, fetchPendingSite]);

	/**
	 * ✅ MonitOk (wizard) nos manda okItems listos (con veeam_id/veeam_name).
	 * Guardamos por site para que al cambiar tab no se pierda.
	 */
	const handleWizardPayload = useCallback((payload) => {
		const siteKey = payload?.site;
		if (!siteKey) return;

		const okItems = Array.isArray(payload?.okItems) ? payload.okItems : [];
		setOkSnapshotBySite((prev) => ({ ...prev, [siteKey]: okItems }));
	}, []);

	const handleContinue = useCallback(async () => {
		// 1) pendientes nuevos por NO seleccionados
		const pendingNew = pendingNewItems;

		// 2) pendientes en BD (si no se han cargado, los cargamos aquí)
		let dbPendingNow = dbPending;
		if (!dbAttempted) {
			await fetchPendingSite(active, { force: true });
			dbPendingNow = pendingBySite?.[active] ?? [];
		}

		const hasPendingNew = pendingNew.length > 0;
		const hasPendingDb = (dbPendingNow ?? []).length > 0;
		const hasPending = hasPendingNew || hasPendingDb;

		// ✅ OK items listos (si no llegaron por wizard payload, calculamos fallback)
		const okItems =
			okSnapshotBySite?.[active]?.length > 0
				? okSnapshotBySite[active]
				: (selectedIds.size > 0
						? items.filter((c) => selectedIds.has(c.id))
						: items
					).map((c) => ({
						id: c.id,
						estatus: "1",
						site: active,
						veeam_id: c.veeam_id ?? c.app ?? null,
						veeam_name: c.veeam_name ?? null,
						numCV: c.numCV ?? null,
						nameCV: c.nameCV ?? null,
						backup: c.backup ?? null,
						jobs: c.jobs ?? null,
						last_dateRest: c.last_dateRest ?? null,
						label: c.label ?? null,
					}));

		onContinue?.({
			site: active,
			selectedIds: Array.from(selectedIds),

			// ✅ OK listos con site + veeam
			okItems,

			// 👇 NO seleccionados
			pendingNewItems: pendingNew,

			// 👇 resumen de BD
			hasPendingDb,
			dbPendingCount: (dbPendingNow ?? []).length,

			hasPending,
		});
	}, [
		onContinue,
		active,
		selectedIds,
		pendingNewItems,
		items,
		okSnapshotBySite,

		// DB
		dbPending,
		dbAttempted,
		fetchPendingSite,
		pendingBySite,
	]);

	/**
	 * ✅ AQUÍ ES DONDE LO “PINTAMOS”
	 * - SOLO VEEAM
	 */
	const metaRows = (c) => {
		return [
			{ label: "Veeam", value: c?.veeam_name ?? "—" },
			{ label: "Backup", value: c?.backup ?? "—" },
			{ label: "Jobs", value: c?.jobs ?? "—" },
			{
				label: "Últ. restauración",
				value: c?.last_dateRest ?? "Sin registro",
			},
		];
	};

	const renderTabContent = () => {
		if (!attempted || loading) {
			return (
				<TableLoadingMessage
					title="Cargando Veeam"
					subtitle="Optimizando búsqueda y aplicando filtros…"
					minHeight="220px"
				/>
			);
		}

		if (error) {
			return (
				<TableStateMessage variant="error" message={error} minHeight="220px" />
			);
		}

		if (!items.length) {
			return (
				<TableStateMessage
					variant="empty"
					message="No hay elementos para mostrar."
					minHeight="220px"
				/>
			);
		}

		return (
			<MonitOk
				site={active}
				loading={loading}
				items={items}
				selectedIds={selectedIds}
				setSelectedIds={setSelectedIds}
				onContinue={handleContinue}
				hasProblems={false}
				onSubmitOk={() => {}}
				metaRows={metaRows}
				mode="wizard"
				onWizardContinuePayload={handleWizardPayload}
				debugExtra={{
					source: "MonitOkGuard",
					activeTab: active,
					pendingNewCount: pendingNewItems.length,

					// DB desde hook
					dbPendingCount: (dbPending ?? []).length,
					dbLoading,
					dbError,
					dbAttempted,

					okSnapshotCount: (okSnapshotBySite?.[active] ?? []).length,
				}}
			/>
		);
	};

	return (
		<section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
			<header className="flex flex-col gap-2 border-b border-slate-200 p-5 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
						Monitoreos (Guardia)
					</h2>
					<p className="text-sm text-slate-600 dark:text-slate-400">
						Selecciona los OK. Los NO seleccionados se van a Pendientes.
					</p>
				</div>

				<div className="flex items-center gap-2">
					<button
						type="button"
						onClick={refreshActive}
						className="px-3 py-2 rounded-xl text-sm border border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
					>
						Refrescar lista
					</button>
				</div>
			</header>

			<div className="p-5">
				<div className="flex flex-wrap items-center gap-2">
					{tabs.map((t) => {
						const isActive = active === t.key;
						return (
							<button
								key={t.key}
								type="button"
								onClick={() => setActive(t.key)}
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

				<div className="mt-4">{renderTabContent()}</div>
			</div>
		</section>
	);
}
