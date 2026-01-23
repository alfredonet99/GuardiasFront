// components/UI/Monitoreos/MonitOk.jsx
import { useMemo, useState } from "react";
import SelectCard from "../Card/SelectCard";

export default function MonitOk({
	site,
	loading,
	items = [],
	selectedIds,
	setSelectedIds,
	onContinue,

	hasProblems = false,
	onSubmitOk = null,

	metaRows = null,
	debugExtra = null,
}) {
	const [query, setQuery] = useState("");

	const filtered = useMemo(() => {
		const q = query.trim().toLowerCase();
		if (!q) return items;

		return items.filter((c) => {
			const label = String(c.label ?? "").toLowerCase();
			const name = String(c.nameCV ?? c.name ?? "").toLowerCase();
			const code = String(c.numCV ?? c.code ?? "").toLowerCase();

			let metaText = "";
			if (typeof metaRows === "function") {
				const rows = metaRows(c) ?? [];
				metaText = rows
					.map((r) => `${r?.label ?? ""} ${r?.value ?? ""}`.toLowerCase())
					.join(" ");
			}

			return (
				label.includes(q) ||
				name.includes(q) ||
				code.includes(q) ||
				metaText.includes(q)
			);
		});
	}, [items, query, metaRows]);

	const toggleOne = (id) => {
		setSelectedIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	};

	const selectAllVisible = () => {
		setSelectedIds((prev) => {
			const next = new Set(prev);
			for (const c of filtered) next.add(c.id);
			return next;
		});
	};

	const clearAll = () => setSelectedIds(new Set());

	const siteLabel =
		site === "veeam"
			? "Veeam"
			: site === "site24"
				? "Site24"
				: site === "sophos"
					? "Sophos"
					: "—";

	/**
	 * ✅ OK Preview (debug)
	 * - si selectedIds tiene algo => OK = SOLO SELECCIONADOS
	 * - si selectedIds está vacío => OK = TODOS
	 * - estatus="1"
	 * - ✅ siteApp NO se manda: el backend lo resuelve por cliente
	 */
	const okMode = useMemo(() => {
		if (!site) return null;
		return selectedIds.size > 0 ? "selected" : "allItems";
	}, [site, selectedIds]);

	const okItems = useMemo(() => {
		if (!site) return [];

		const base =
			selectedIds.size > 0 ? items.filter((c) => selectedIds.has(c.id)) : items;

		return base.map((c) => ({
			...c,
			estatus: "1",
		}));
	}, [site, items, selectedIds]);

	const okCount = useMemo(() => {
		if (!site) return null;
		return okItems.length;
	}, [site, okItems]);

	// ✅ Acción del botón principal
	const handlePrimaryAction = () => {
		// si hay problemas, solo continuar a Paso 2
		if (hasProblems) return onContinue?.();

		// si NO hay problemas, guardamos aquí
		return onSubmitOk?.();
	};

	return (
		<>
			{/* Toolbar */}
			<div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex items-center gap-2">
					<span className="text-sm font-semibold">Lista</span>

					<span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-950">
						Site: {siteLabel}
					</span>

					<span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-950">
						{items.length} total
					</span>

					<span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-950">
						{selectedIds.size} seleccionados
					</span>
				</div>

				<div className="flex items-center gap-2">
					<button
						type="button"
						onClick={selectAllVisible}
						disabled={loading || filtered.length === 0}
						className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
					>
						Seleccionar Todos
					</button>

					<button
						type="button"
						onClick={clearAll}
						disabled={loading || selectedIds.size === 0}
						className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
					>
						Limpiar
					</button>
				</div>
			</div>

			{/* Search */}
			<div className="mt-3">
				<div className="relative">
					<input
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						disabled={!site || loading}
						placeholder={site ? "Buscar..." : "Selecciona un site primero"}
						className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-slate-800 outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
					/>
					<svg
						aria-hidden="true"
						className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
					>
						<path d="M21 21l-4.35-4.35" />
						<circle cx="11" cy="11" r="7" />
					</svg>
				</div>
			</div>

			{/* Content */}
			<div className="mt-4">
				{!site ? (
					<div className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-400">
						Selecciona un <b>Site</b> para cargar la lista.
					</div>
				) : loading ? (
					<div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-950">
						<div className="animate-pulse space-y-3">
							<div className="h-4 w-1/3 rounded bg-slate-200 dark:bg-slate-800" />
							<div className="h-24 rounded bg-slate-200 dark:bg-slate-800" />
							<div className="h-24 rounded bg-slate-200 dark:bg-slate-800" />
						</div>
					</div>
				) : filtered.length === 0 ? (
					<div className="rounded-2xl border border-slate-200 p-6 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-400">
						No hay elementos para mostrar con ese filtro.
					</div>
				) : (
					<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
						{filtered.map((c) => {
							const checked = selectedIds.has(c.id);
							const rows =
								typeof metaRows === "function" ? (metaRows(c) ?? []) : [];

							return (
								<SelectCard
									key={c.id}
									checked={checked}
									onToggle={() => toggleOne(c.id)}
									title={c.label ?? `ID ${c.id}`}
									subtitle={c.numCV ?? null}
								>
									{rows.length === 0 ? (
										<div className="text-xs text-slate-500">—</div>
									) : (
										<div className="space-y-1">
											{rows.map((r, idx) => (
												<div
													key={`${c.id}_${idx}_${r?.label ?? "row"}`}
													className="text-xs text-slate-600 dark:text-slate-400"
												>
													<span className="font-semibold text-slate-700 dark:text-slate-300">
														{r.label}:
													</span>{" "}
													{r.value ?? "—"}
												</div>
											))}
										</div>
									)}
								</SelectCard>
							);
						})}
					</div>
				)}
			</div>

			{/* Debug temporal */}
			<div className="mt-6">
				<div className="mb-2 text-xs text-slate-500">DEBUG (temporal)</div>
				<pre className="whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs dark:border-slate-800 dark:bg-slate-950">
					{JSON.stringify(
						{
							site,
							selected: Array.from(selectedIds),
							itemsPreview: items.slice(0, 3),
							...(site
								? {
										okMode,
										okCount,
										okPreview: okItems,
										hasProblems,
									}
								: {}),
							...(debugExtra ? { debugExtra } : {}),
						},
						null,
						2,
					)}
				</pre>
			</div>

			{/* Bottom action bar */}
			<div className="sticky bottom-0 w-full border-t border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
				<div className="flex items-center justify-between px-6 py-4">
					<div className="text-sm">
						<span className="font-semibold">{selectedIds.size}</span>{" "}
						seleccionados
						{site ? (
							<span className="text-slate-600 dark:text-slate-400">
								{" "}
								• Site: {siteLabel}
							</span>
						) : null}
					</div>

					<button
						type="button"
						onClick={handlePrimaryAction}
						disabled={!site || items.length === 0}
						className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-50"
					>
						{hasProblems ? "Continuar" : "Guardar"}
					</button>
				</div>
			</div>
		</>
	);
}
