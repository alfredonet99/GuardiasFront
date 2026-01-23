// components/UI/Monitoreos/MonitProblem.jsx
import { forwardRef, useMemo } from "react";
import DatePicker, { registerLocale } from "react-datepicker";
import useAccordion from "../../../hooks/Accordion";
import WordCountTextarea from "../WordCount/TextAreaCount";
import "react-datepicker/dist/react-datepicker.css";

import { format, isValid, parse } from "date-fns";
import { es } from "date-fns/locale";

registerLocale("es", es);

function strToDateOnly(v) {
	if (!v) return null;
	const d = parse(String(v), "yyyy-MM-dd", new Date());
	return isValid(d) ? d : null;
}

function dateToStrOnly(d) {
	if (!d) return "";
	return format(d, "yyyy-MM-dd");
}

function Chevron({ open }) {
	return (
		<svg
			aria-hidden="true"
			className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
		>
			<path d="M6 9l6 6 6-6" />
		</svg>
	);
}

const DateInput = forwardRef(function DateInput(
	{ value, onClick, onChange, placeholder, className, disabled },
	ref,
) {
	return (
		<input
			ref={ref}
			value={value ?? ""}
			onClick={onClick}
			onChange={onChange}
			placeholder={placeholder}
			disabled={disabled}
			readOnly
			className={className}
		/>
	);
});

export default function MonitProblem({
	items = [],
	loading = false,
	onBack,

	problemForm = {},
	onProblemChange,

	statusOptions = [],
	statusPlaceholder = "Seleccionar estatus",

	metaChips = null,

	// ✅ NUEVO: submit aquí cuando SÍ hay problemas
	onSubmitProblems = null,
}) {
	const { isOpen, toggle, openAll, closeAll, openCount } = useAccordion({
		single: false,
		defaultOpenIds: [],
	});

	const allIds = useMemo(() => items.map((c) => c.id), [items]);

	const fieldBase =
		"mt-1 w-full px-3 py-2 rounded-lg border bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none " +
		"border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-blue-600";

	const safeStatusOptions =
		Array.isArray(statusOptions) && statusOptions.length > 0
			? statusOptions
			: [{ value: "", label: statusPlaceholder }];

	return (
		<div className="mt-6">
			<div className="flex items-center justify-between gap-2 flex-wrap">
				<div className="text-sm text-slate-600 dark:text-slate-300">
					<b>Clientes:</b> {items.length} • <b>Expandido:</b> {openCount}
				</div>

				<div className="flex items-center gap-2">
					<button
						type="button"
						onClick={() => openAll(allIds)}
						disabled={loading || items.length === 0}
						className="px-3 py-2 rounded-lg border text-sm disabled:opacity-50"
					>
						Expandir todos
					</button>

					<button
						type="button"
						onClick={closeAll}
						disabled={loading || items.length === 0}
						className="px-3 py-2 rounded-lg border text-sm disabled:opacity-50"
					>
						Colapsar todos
					</button>

					{onBack ? (
						<button
							type="button"
							onClick={onBack}
							className="px-3 py-2 rounded-lg border text-sm"
						>
							Volver
						</button>
					) : null}
				</div>
			</div>

			<div className="mt-4 space-y-3">
				{loading ? (
					<div className="p-4 rounded-lg border text-sm">Cargando...</div>
				) : items.length === 0 ? (
					<div className="p-4 rounded-lg border text-sm">
						No hay clientes con problema.
					</div>
				) : (
					items.map((c) => {
						const open = isOpen(c.id);

						const f = problemForm?.[c.id] ?? {
							estatus: "",
							observacion: "",
							last_restore_date: "",
						};

						const title = c.label ?? c.nameCV ?? c.name ?? `ID ${c.id}`;

						return (
							<div
								key={c.id}
								className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden"
							>
								<button
									type="button"
									onClick={() => toggle(c.id)}
									className="w-full text-left px-4 py-3 flex items-start justify-between gap-3"
								>
									<div className="min-w-0">
										<div className="font-semibold truncate">{title}</div>

										<div className="mt-1 text-xs text-slate-600 dark:text-slate-400 flex flex-wrap gap-2">
											{typeof metaChips === "function"
												? metaChips(c, f)?.map((chip, idx) => (
														<span
															key={`${c.id}_${idx}_${chip?.label ?? "chip"}`}
															className="px-2 py-1 rounded-full border border-slate-200 dark:border-slate-700"
														>
															{chip.label}: {chip.value ?? "—"}
														</span>
													))
												: null}
										</div>
									</div>

									<div className="shrink-0 flex items-center gap-2 text-slate-500">
										<span className="text-xs">
											{open ? "Ocultar" : "Abrir"}
										</span>
										<Chevron open={open} />
									</div>
								</button>

								{open ? (
									<div className="px-4 pb-4">
										<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
											<div>
												<label htmlFor="" className="text-xs font-semibold">
													Estatus <span className="text-red-600">*</span>
												</label>

												<select
													value={f.estatus}
													onChange={(e) =>
														onProblemChange?.(c.id, { estatus: e.target.value })
													}
													className={fieldBase}
												>
													{safeStatusOptions.map((o) => (
														<option key={String(o.value)} value={o.value}>
															{o.label}
														</option>
													))}
												</select>
											</div>

											<div className="flex flex-col mt-1.5">
												<label htmlFor="" className="text-xs font-semibold">
													Último Punto de Restauración
												</label>

												<DatePicker
													locale="es"
													selected={strToDateOnly(f.last_restore_date)}
													onChange={(date) =>
														onProblemChange?.(c.id, {
															last_restore_date: dateToStrOnly(date),
														})
													}
													dateFormat="dd/MM/yyyy"
													placeholderText="Selecciona una fecha"
													maxDate={new Date()}
													disabled={loading}
													wrapperClassName="block"
													popperPlacement="bottom-start"
													customInput={
														<DateInput
															className={fieldBase}
															placeholder="Selecciona una fecha"
															disabled={loading}
														/>
													}
												/>
											</div>
										</div>

										<div className="mt-3">
											<WordCountTextarea
												id={`observacion_${c.id}`}
												name={`observacion_${c.id}`}
												label="Observación"
												placeholder="Describe el problema encontrado..."
												value={f.observacion}
												onChange={(txt) =>
													onProblemChange?.(c.id, { observacion: txt })
												}
												required={true}
												minChars={5}
												maxWords={2000}
												rows={4}
											/>
										</div>
									</div>
								) : null}
							</div>
						);
					})
				)}
			</div>

			{/* ✅ NUEVO: barra inferior para Guardar cuando hay problemas */}
			<div className="sticky bottom-0 w-full mt-6 border-t border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur">
				<div className="px-6 py-4 flex items-center justify-end gap-2">
					<button
						type="button"
						onClick={onBack}
						className="px-4 py-2 rounded-xl border text-sm"
					>
						Volver
					</button>

					<button
						type="button"
						onClick={onSubmitProblems}
						disabled={loading || items.length === 0}
						className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold
              hover:opacity-95 disabled:opacity-50"
					>
						Guardar
					</button>
				</div>
			</div>
		</div>
	);
}
