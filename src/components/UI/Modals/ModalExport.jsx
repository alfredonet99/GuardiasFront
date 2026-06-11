import React, { useEffect, useMemo, useState } from "react";
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import es from "date-fns/locale/es";

import { useAutoClearErrors } from "../../../hooks/Errors/clearErrorMessage";
import { useFieldErrors } from "../../../hooks/Errors/MessageInputs";
import FieldError from "../Errors/ElementsErrors";

registerLocale("es", es);

function parseDateString(value) {
	if (!value || typeof value !== "string") return null;

	const parts = value.split("-");
	if (parts.length !== 3) return null;

	const [year, month, day] = parts.map(Number);
	if (!year || !month || !day) return null;

	return new Date(year, month - 1, day);
}

function parseMonthString(value) {
	if (!value || typeof value !== "string") return null;

	const parts = value.split("-");
	if (parts.length !== 2) return null;

	const [year, month] = parts.map(Number);
	if (!year || !month) return null;

	return new Date(year, month - 1, 1);
}

function formatDateToString(date) {
	if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";

	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");

	return `${year}-${month}-${day}`;
}

function formatMonthToString(date) {
	if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";

	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");

	return `${year}-${month}`;
}

export default function ExportModal({
	isOpen,
	onClose,
	onGenerateReport,

	title = "Generar reporte",
	subtitle = "Selecciona los filtros que deseas aplicar.",
	entityLabel = "registros",

	loadingGenerate = false,

	filterMode = "range",
	onFilterModeChange,

	startDate = "",
	endDate = "",
	onStartDateChange,
	onEndDateChange,

	month = "",
	onMonthChange,

	statusOptions = [],
	selectedStatuses = [],
	onSelectedStatusesChange,

	children = null,
}) {
	const [touched, setTouched] = useState(false);

	const { localErrors, errorKey, validateFields, clearError } =
		useFieldErrors();

	const formValues = useMemo(
		() => ({
			filterMode,
			startDate,
			endDate,
			month,
			selectedStatuses: JSON.stringify(selectedStatuses ?? []),
		}),
		[filterMode, startDate, endDate, month, selectedStatuses],
	);

	useAutoClearErrors(formValues, localErrors, clearError);

	useEffect(() => {
		if (!isOpen) return;
		setTouched(false);
	}, [isOpen]);

	useEffect(() => {
		if (filterMode === "range") {
			clearError?.("month");
		} else {
			clearError?.("startDate");
			clearError?.("endDate");
		}
	}, [filterMode, clearError]);

	if (!isOpen) return null;

	const allSelected =
		statusOptions.length > 0 &&
		selectedStatuses.length === statusOptions.length;

	const selectedStartDate = parseDateString(startDate);
	const selectedEndDate = parseDateString(endDate);
	const selectedMonth = parseMonthString(month);

	const toggleAllStatuses = () => {
		if (!onSelectedStatusesChange) return;

		if (allSelected) {
			onSelectedStatusesChange([]);
			return;
		}

		onSelectedStatusesChange(statusOptions.map((s) => String(s.value)));
	};

	const toggleStatus = (value) => {
		if (!onSelectedStatusesChange) return;

		const strValue = String(value);
		const exists = selectedStatuses.includes(strValue);

		if (exists) {
			onSelectedStatusesChange(
				selectedStatuses.filter((item) => item !== strValue),
			);
			return;
		}

		onSelectedStatusesChange([...selectedStatuses, strValue]);
	};

	const handleStartDateChange = (date) => {
		onStartDateChange?.(date ? formatDateToString(date) : "");
	};

	const handleEndDateChange = (date) => {
		onEndDateChange?.(date ? formatDateToString(date) : "");
	};

	const handleMonthChange = (date) => {
		onMonthChange?.(date ? formatMonthToString(date) : "");
	};

	const baseInputClass = [
		"w-full rounded-xl border bg-white px-3 py-2 text-xs text-slate-800 shadow-sm outline-none transition",
		"xl:px-4 xl:py-2.5 xl:text-sm 2xl:px-4 2xl:py-3",
		"placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20",
		"disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400",
		"dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-blue-500 dark:focus:ring-blue-500/20 dark:disabled:bg-slate-800",
	].join(" ");

	const dateClassStart = [
		baseInputClass,
		localErrors?.startDate
			? "border-red-500 focus:ring-red-500 dark:border-red-500"
			: "border-slate-300 dark:border-slate-700",
	].join(" ");

	const dateClassEnd = [
		baseInputClass,
		localErrors?.endDate
			? "border-red-500 focus:ring-red-500 dark:border-red-500"
			: "border-slate-300 dark:border-slate-700",
	].join(" ");

	const monthClass = [
		baseInputClass,
		localErrors?.month
			? "border-red-500 focus:ring-red-500 dark:border-red-500"
			: "border-slate-300 dark:border-slate-700",
	].join(" ");

	const validateRangeFields = () => {
		let valid = true;

		if (!startDate) {
			validateFields(
				{
					startDate: {
						required: true,
						message: "La fecha de inicio es obligatoria.",
					},
				},
				{ startDate: "" },
			);
			valid = false;
		}

		if (!endDate) {
			validateFields(
				{
					endDate: {
						required: true,
						message: "La fecha de fin es obligatoria.",
					},
				},
				{ endDate: "" },
			);
			valid = false;
		}

		if (startDate) clearError?.("startDate");
		if (endDate) clearError?.("endDate");
		clearError?.("month");

		if (startDate && endDate) {
			const start = parseDateString(startDate);
			const end = parseDateString(endDate);

			if (start && end && start > end) {
				validateFields(
					{
						endDate: {
							required: true,
							message:
								"La fecha de fin debe ser mayor o igual a la fecha de inicio.",
						},
					},
					{ endDate: "" },
				);
				valid = false;
			}
		}

		return valid;
	};

	const validateMonthField = () => {
		let valid = true;

		if (!month) {
			validateFields(
				{
					month: {
						required: true,
						message: "El mes es obligatorio.",
					},
				},
				{ month: "" },
			);
			valid = false;
		} else {
			clearError?.("month");
		}

		clearError?.("startDate");
		clearError?.("endDate");

		return valid;
	};

	const validateStatusesField = () => {
		const ok = Array.isArray(selectedStatuses) && selectedStatuses.length > 0;

		if (!ok) {
			validateFields(
				{
					selectedStatuses: {
						required: true,
						message: "Debes seleccionar al menos un estatus.",
					},
				},
				{ selectedStatuses: "" },
			);
			return false;
		}

		clearError?.("selectedStatuses");
		return true;
	};

	const validateGenerateFields = () => {
		const dateValid =
			filterMode === "range" ? validateRangeFields() : validateMonthField();

		const statusesValid = validateStatusesField();

		return dateValid && statusesValid;
	};

	const handleGenerate = async () => {
		setTouched(true);

		const isValid = validateGenerateFields();
		if (!isValid) return;

		await onGenerateReport?.();
	};

	return (
		<div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 px-3 py-3">
			<div className="animate-fadeIn animate-scaleIn w-full max-w-[760px] xl:max-w-[940px] 2xl:max-w-[1100px] rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
				<div className="border-b border-slate-200 px-3 py-2.5 xl:px-5 xl:py-4 2xl:px-6 2xl:py-5 dark:border-slate-800">
					<h2 className="text-sm font-semibold text-slate-800 xl:text-lg 2xl:text-xl dark:text-slate-100">
						{title}
					</h2>
					<p className="mt-0.5 text-[11px] text-slate-500 xl:text-sm dark:text-slate-400">
						{subtitle}
					</p>
				</div>

				<div className="space-y-2.5 px-3 py-2.5 xl:space-y-4 xl:px-5 xl:py-4 2xl:space-y-5 2xl:px-6 2xl:py-5">
					<div className="rounded-xl border border-slate-200 p-2.5 xl:rounded-2xl xl:p-4 2xl:p-5 dark:border-slate-800">
						<div className="mb-2.5 xl:mb-4">
							<h3 className="text-[11px] font-semibold uppercase tracking-wide text-slate-700 xl:text-sm dark:text-slate-200">
								Filtro por fecha
							</h3>
							<p className="mt-0.5 text-[10px] text-slate-500 xl:text-xs dark:text-slate-400">
								Elige generar el reporte por rango o por un mes específico.
							</p>
						</div>

						<div className="mb-2.5 grid grid-cols-1 gap-2 md:grid-cols-2 xl:mb-4 xl:gap-3">
							<button
								type="button"
								onClick={() => {
									onFilterModeChange?.("range");
									clearError?.("month");
									if (touched) validateRangeFields();
								}}
								className={`rounded-lg border px-2.5 py-1.5 text-left transition xl:rounded-2xl xl:px-4 xl:py-3 ${
									filterMode === "range"
										? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm dark:border-blue-500 dark:bg-blue-950/40 dark:text-blue-300"
										: "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800/70"
								}`}
							>
								<div className="text-[11px] font-semibold xl:text-sm">
									Rango de fechas
								</div>
								<div className="mt-0.5 text-[10px] opacity-80 xl:mt-1 xl:text-xs">
									Selecciona fecha inicio y fecha fin.
								</div>
							</button>

							<button
								type="button"
								onClick={() => {
									onFilterModeChange?.("month");
									clearError?.("startDate");
									clearError?.("endDate");
									if (touched) validateMonthField();
								}}
								className={`rounded-lg border px-2.5 py-1.5 text-left transition xl:rounded-2xl xl:px-4 xl:py-3 ${
									filterMode === "month"
										? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm dark:border-blue-500 dark:bg-blue-950/40 dark:text-blue-300"
										: "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800/70"
								}`}
							>
								<div className="text-[11px] font-semibold xl:text-sm">
									Mes específico
								</div>
								<div className="mt-0.5 text-[10px] opacity-80 xl:mt-1 xl:text-xs">
									Selecciona un único mes de consulta.
								</div>
							</button>
						</div>

						<div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-3 xl:gap-4">
							<div>
								<label
									htmlFor=""
									className="mb-0.5 block text-[11px] font-medium text-slate-700 xl:text-sm dark:text-slate-200"
								>
									Fecha inicio{" "}
									{filterMode === "range" && (
										<span className="text-red-600">*</span>
									)}
								</label>

								<DatePicker
									selected={selectedStartDate}
									onChange={(date) => {
										handleStartDateChange(date);
										if (touched && filterMode === "range") {
											setTimeout(() => validateRangeFields(), 0);
										}
									}}
									onBlur={() => {
										if (filterMode !== "range") return;
										setTouched(true);
										validateRangeFields();
									}}
									disabled={filterMode === "month"}
									dateFormat="dd/MM/yyyy"
									placeholderText="Selecciona fecha inicio"
									isClearable
									locale="es"
									wrapperClassName="w-full"
									className={dateClassStart}
									popperClassName="z-[1000]"
									calendarClassName="shadow-xl border border-slate-200 rounded-2xl dark:bg-slate-900 dark:border-slate-700"
								/>

								{filterMode === "range" && (
									<FieldError
										message={localErrors?.startDate}
										resetKey={errorKey}
									/>
								)}
							</div>

							<div>
								<label
									htmlFor=""
									className="mb-0.5 block text-[11px] font-medium text-slate-700 xl:text-sm dark:text-slate-200"
								>
									Fecha fin{" "}
									{filterMode === "range" && (
										<span className="text-red-600">*</span>
									)}
								</label>

								<DatePicker
									selected={selectedEndDate}
									onChange={(date) => {
										handleEndDateChange(date);
										if (touched && filterMode === "range") {
											setTimeout(() => validateRangeFields(), 0);
										}
									}}
									onBlur={() => {
										if (filterMode !== "range") return;
										setTouched(true);
										validateRangeFields();
									}}
									disabled={filterMode === "month"}
									dateFormat="dd/MM/yyyy"
									placeholderText="Selecciona fecha fin"
									isClearable
									locale="es"
									wrapperClassName="w-full"
									className={dateClassEnd}
									popperClassName="z-[1000]"
									calendarClassName="shadow-xl border border-slate-200 rounded-2xl dark:bg-slate-900 dark:border-slate-700"
									minDate={selectedStartDate || undefined}
								/>

								{filterMode === "range" && (
									<FieldError
										message={localErrors?.endDate}
										resetKey={errorKey}
									/>
								)}
							</div>

							<div>
								<label
									htmlFor=""
									className="mb-0.5 block text-[11px] font-medium text-slate-700 xl:text-sm dark:text-slate-200"
								>
									Mes{" "}
									{filterMode === "month" && (
										<span className="text-red-600">*</span>
									)}
								</label>

								<DatePicker
									selected={selectedMonth}
									onChange={(date) => {
										handleMonthChange(date);
										if (touched && filterMode === "month") {
											setTimeout(() => validateMonthField(), 0);
										}
									}}
									onBlur={() => {
										if (filterMode !== "month") return;
										setTouched(true);
										validateMonthField();
									}}
									disabled={filterMode === "range"}
									showMonthYearPicker
									dateFormat="MMMM yyyy"
									placeholderText="Selecciona mes"
									isClearable
									locale="es"
									wrapperClassName="w-full"
									className={monthClass}
									popperClassName="z-[1000]"
									calendarClassName="shadow-xl border border-slate-200 rounded-2xl dark:bg-slate-900 dark:border-slate-700"
								/>

								{filterMode === "month" && (
									<FieldError
										message={localErrors?.month}
										resetKey={errorKey}
									/>
								)}
							</div>
						</div>
					</div>

					<div className="rounded-xl border border-slate-200 p-2.5 xl:rounded-2xl xl:p-4 2xl:p-5 dark:border-slate-800">
						<div className="mb-2.5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between xl:mb-4 xl:gap-3">
							<div>
								<h3 className="text-[11px] font-semibold uppercase tracking-wide text-slate-700 xl:text-sm dark:text-slate-200">
									Filtro por estatus
								</h3>
								<p className="mt-0.5 text-[10px] text-slate-500 xl:text-xs dark:text-slate-400">
									Puedes seleccionar uno, varios o todos.
								</p>
							</div>

							<button
								type="button"
								onClick={() => {
									toggleAllStatuses();
									if (touched) {
										setTimeout(() => validateStatusesField(), 0);
									}
								}}
								className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-[10px] font-medium text-slate-700 transition hover:bg-slate-100 xl:rounded-xl xl:px-3.5 xl:py-2 xl:text-xs dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
							>
								{allSelected ? "Quitar todos" : "Seleccionar todos"}
							</button>
						</div>

						<div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3 xl:gap-3">
							{statusOptions.map((status) => {
								const checked = selectedStatuses.includes(String(status.value));

								return (
									<label
										key={String(status.value)}
										className={`flex cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-1.5 text-[11px] transition xl:gap-3 xl:rounded-2xl xl:px-4 xl:py-3 xl:text-sm ${
											checked
												? "border-slate-400 bg-slate-100 text-slate-800 dark:border-slate-500 dark:bg-slate-800 dark:text-slate-100"
												: "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800/70"
										}`}
									>
										<input
											type="checkbox"
											checked={checked}
											onChange={() => {
												toggleStatus(status.value);
												if (touched) {
													setTimeout(() => validateStatusesField(), 0);
												}
											}}
											onBlur={() => {
												setTouched(true);
												validateStatusesField();
											}}
											className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 xl:h-4 xl:w-4"
										/>
										<span>{status.label}</span>
									</label>
								);
							})}
						</div>

						<FieldError
							message={localErrors?.selectedStatuses}
							resetKey={errorKey}
						/>

						<div className="mt-2 text-[10px] text-slate-500 xl:text-xs dark:text-slate-400">
							{selectedStatuses.length === 0
								? "Debes seleccionar al menos un estatus."
								: allSelected
									? "Se generará el reporte con todos los estatus."
									: `Estatus seleccionados: ${selectedStatuses.length}`}
						</div>
					</div>

					{children ? <div>{children}</div> : null}
				</div>

				<div className="flex flex-col-reverse gap-2 border-t border-slate-200 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-end xl:gap-3 xl:px-5 xl:py-4 2xl:px-6 2xl:py-5 dark:border-slate-800">
					<button
						type="button"
						onClick={onClose}
						className="rounded-lg border border-slate-300 px-3 py-1.5 text-[11px] font-medium text-slate-700 transition hover:bg-slate-100 xl:rounded-xl xl:px-4 xl:py-2.5 xl:text-sm dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
					>
						Cerrar
					</button>

					<button
						type="button"
						onClick={handleGenerate}
						disabled={loadingGenerate}
						className="rounded-lg border border-emerald-600 bg-emerald-600 px-3 py-1.5 text-[11px] font-medium text-white transition hover:border-blue-700 hover:bg-blue-700 xl:rounded-xl xl:px-4 xl:py-2.5 xl:text-sm disabled:cursor-not-allowed disabled:opacity-60"
					>
						{loadingGenerate ? "Generando..." : "Generar reporte"}
					</button>
				</div>
			</div>
		</div>
	);
}
