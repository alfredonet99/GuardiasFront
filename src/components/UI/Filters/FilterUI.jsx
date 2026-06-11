import { useEffect, useMemo, useRef, useState } from "react";

function TagPill({ label, onRemove }) {
	return (
		<span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold dark:border-slate-700 dark:bg-slate-900">
			<span className="truncate">{label}</span>

			{/* biome-ignore lint/a11y/useSemanticElements: Necesitamos evitar <button> dentro de <button> en el trigger */}
			<span
				role="button"
				tabIndex={0}
				onClick={(e) => {
					e.preventDefault();
					e.stopPropagation();
					onRemove?.();
				}}
				onKeyDown={(e) => {
					if (e.key === "Enter" || e.key === " ") {
						e.preventDefault();
						e.stopPropagation();
						onRemove?.();
					}
				}}
				className="inline-flex h-5 w-5 cursor-pointer items-center justify-center rounded-full border border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
				aria-label={`Quitar ${label}`}
				title="Quitar"
			>
				<svg
					aria-hidden="true"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					className="h-3.5 w-3.5"
				>
					<path d="M18 6L6 18" />
					<path d="M6 6l12 12" />
				</svg>
			</span>
		</span>
	);
}

function SectionHeader({ children }) {
	return (
		<div className="border-b border-slate-200 bg-slate-50/60 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-600 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-300">
			{children}
		</div>
	);
}

function OptionRow({ active, label, hint, onClick }) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={[
				"flex w-full items-start justify-between gap-3 px-3 py-2 text-left text-sm",
				"hover:bg-slate-50 dark:hover:bg-slate-800",
				active ? "bg-slate-50 dark:bg-slate-800" : "",
			].join(" ")}
		>
			<div className="min-w-0">
				<div className="truncate">{label}</div>
				{hint ? (
					<div className="truncate text-xs text-slate-500 dark:text-slate-400">
						{hint}
					</div>
				) : null}
			</div>
			{active ? <span className="text-xs text-slate-500">✓</span> : null}
		</button>
	);
}

export default function UnifiedFilterSelect({
	title = "Filtros",
	placeholder = "Filtrar...",
	disabled = false,
	sections = [],
	value = {},
	onChange,
	closeOnSelect = true,
}) {
	const [open, setOpen] = useState(false);
	const [q, setQ] = useState("");
	const boxRef = useRef(null);

	// ✅ cierre al click afuera
	useEffect(() => {
		if (!open) return;

		const onDown = (e) => {
			if (!boxRef.current) return;
			if (!boxRef.current.contains(e.target)) setOpen(false);
		};

		window.addEventListener("mousedown", onDown);
		return () => window.removeEventListener("mousedown", onDown);
	}, [open]);

	const hasAny = useMemo(
		() => sections.some((s) => Boolean(value?.[s.key])),
		[sections, value],
	);

	const clearAll = () => {
		const next = {};
		for (const s of sections) next[s.key] = null;
		onChange?.(next);
		setQ("");
		setOpen(false);
	};

	const filteredSections = useMemo(() => {
		const needle = q.trim().toLowerCase();
		if (!needle) return sections;

		return sections.map((sec) => ({
			...sec,
			options: (sec.options || []).filter((o) =>
				`${o.label} ${o.hint ?? ""}`.toLowerCase().includes(needle),
			),
		}));
	}, [q, sections]);

	const setKeyValue = (key, v) => {
		const next = { ...(value || {}) };
		next[key] = v ?? null; // ✅ NO string here
		onChange?.(next);
	};

	const toggleOpen = () => {
		if (disabled) return;
		setOpen((v) => !v);
	};

	return (
		<div ref={boxRef} className="w-full">
			<div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
				{title}
			</div>

			{/* ✅ Trigger vuelve a ser <button> (Biome feliz) */}
			<button
				type="button"
				disabled={disabled}
				aria-expanded={open}
				onClick={toggleOpen}
				className={[
					"w-full rounded-xl border bg-white px-3 py-2 text-left dark:bg-slate-900",
					"border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800",
					"disabled:cursor-not-allowed disabled:opacity-60",
				].join(" ")}
			>
				{hasAny ? (
					<div className="flex items-center justify-between gap-2">
						<div className="flex flex-wrap items-center gap-2">
							{sections.map((sec) => {
								const v = value?.[sec.key];
								if (!v) return null;

								const optLabel =
									sec.options?.find((x) => String(x.value) === String(v))
										?.label ?? String(v);

								return (
									<TagPill
										key={`tag_${sec.key}`}
										label={`${sec.label}: ${optLabel}`}
										onRemove={() => setKeyValue(sec.key, null)}
									/>
								);
							})}
						</div>

						<span className="text-xs text-slate-500 dark:text-slate-400">
							Click para cambiar
						</span>
					</div>
				) : (
					<span className="text-sm text-slate-500 dark:text-slate-400">
						{placeholder}
					</span>
				)}
			</button>

			{/* Dropdown */}
			{open && !disabled ? (
				<div className="relative">
					<div className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
						{/* search */}
						<div className="border-b border-slate-200 p-2 dark:border-slate-800">
							<div className="relative">
								<input
									value={q}
									onChange={(e) => setQ(e.target.value)}
									placeholder="Buscar filtros..."
									className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-slate-800 outline-none focus:ring-2 focus:ring-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
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

						<div className="max-h-72 overflow-auto">
							{filteredSections.map((sec) => (
								<div key={`sec_${sec.key}`}>
									<SectionHeader>{sec.label}</SectionHeader>

									{(sec.options || []).length === 0 ? (
										<div className="px-3 py-2 text-sm text-slate-500 dark:text-slate-400">
											Sin resultados en {sec.label}.
										</div>
									) : (
										(sec.options || []).map((opt) => (
											<OptionRow
												key={`${sec.key}_${String(opt.value)}`}
												active={
													String(value?.[sec.key] ?? "") === String(opt.value)
												}
												label={opt.label}
												hint={opt.hint}
												onClick={() => {
													// ✅ Guardar value tal cual (int o string)
													setKeyValue(sec.key, opt.value);

													if (closeOnSelect) {
														setOpen(false);
														setQ("");
													}
												}}
											/>
										))
									)}
								</div>
							))}
						</div>

						<div className="flex items-center justify-between border-t border-slate-200 p-2 dark:border-slate-800">
							<button
								type="button"
								onClick={() => {
									setOpen(false);
									setQ("");
								}}
								className="rounded-lg border px-3 py-1.5 text-xs hover:bg-slate-50 dark:hover:bg-slate-800"
							>
								Cerrar
							</button>

							<button
								type="button"
								onClick={clearAll}
								className="rounded-lg border px-3 py-1.5 text-xs hover:bg-slate-50 dark:hover:bg-slate-800"
							>
								Limpiar filtros
							</button>
						</div>
					</div>
				</div>
			) : null}
		</div>
	);
}
