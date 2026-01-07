import { useEffect, useMemo, useState } from "react";
import { useAutoClearErrors } from "../../../hooks/Errors/clearErrorMessage";
import { useFieldErrors } from "../../../hooks/Errors/MessageInputs";
import FieldError from "../Errors/ElementsErrors";

function countChars(text) {
	return String(text ?? "").length; // incluye espacios
}

function clampToCharLimit(text, limit) {
	const raw = String(text ?? "");
	if (!limit || limit <= 0) return raw;
	return raw.length <= limit ? raw : raw.slice(0, limit);
}

export default function WordCountTextarea({
	value,
	onChange,

	// ✅ validaciones
	required = false,
	minChars = 0,
	maxWords = 2000, // MAX CHARS

	label = "Texto",
	placeholder = "",
	id = "word_count_textarea",
	name = "text",
	disabled = false,
	hint,
	showCounter = true,
	rows = 4,

	// ✅ opcional: igual que TicketNumeric
	onValidChange,
}) {
	const [touched, setTouched] = useState(false);

	// ✅ tu sistema de errores
	const { localErrors, errorKey, validateFields, clearError } =
		useFieldErrors();

	// ✅ para que el hook pueda limpiar al cambiar value
	const formValues = useMemo(() => ({ [name]: value }), [name, value]);
	useAutoClearErrors(formValues, localErrors, clearError);

	const cleaned = useMemo(() => {
		return clampToCharLimit(value, maxWords);
	}, [value, maxWords]);

	// ✅ asegura que nunca pase del max
	useEffect(() => {
		if (value !== cleaned) onChange(cleaned);
	}, [value, cleaned, onChange]);

	const charsUsed = useMemo(() => countChars(cleaned), [cleaned]);
	const atLimit = charsUsed >= maxWords;

	// ✅ reglas de validación
	const isEmpty = charsUsed === 0;
	const isValid =
		(required ? !isEmpty : true) &&
		(minChars > 0 ? charsUsed >= minChars || isEmpty : true);

	useEffect(() => {
		onValidChange?.(isValid);
	}, [isValid, onValidChange]);

	const errorMessage = required
		? minChars > 0
			? `Este campo es obligatorio y debe tener al menos ${minChars} caracteres.`
			: "Este campo es obligatorio."
		: minChars > 0
			? `Si se captura, debe tener al menos ${minChars} caracteres.`
			: "Valor inválido.";

	const runValidation = (currentValue) => {
		const v = String(currentValue ?? "");
		const len = v.length;

		// si es requerido y está vacío => inválido
		const invalidRequired = required && len === 0;

		// si hay minChars => inválido cuando:
		// - requerido: len < minChars
		// - no requerido: solo si escribió algo (len > 0) y len < minChars
		const invalidMin =
			minChars > 0
				? required
					? len < minChars
					: len > 0 && len < minChars
				: false;

		const shouldFail = invalidRequired || invalidMin;

		const rules = {
			[name]: {
				required,
				message: errorMessage,
			},
		};

		// igual que TicketNumeric: si tocó y está mal, mandamos vacío para forzar error
		let payloadValue = v;
		if (touched && shouldFail) payloadValue = "";

		validateFields(rules, { [name]: payloadValue });
	};

	return (
		<div className="mb-4">
			<label htmlFor={id} className="font-semibold text-sm">
				{label} {required && <span className="text-red-600">*</span>}
			</label>

			<textarea
				id={id}
				name={name}
				rows={rows}
				placeholder={placeholder}
				value={cleaned}
				disabled={disabled}
				onBlur={() => {
					setTouched(true);
					runValidation(cleaned);
				}}
				onChange={(e) => {
					const next = clampToCharLimit(e.target.value, maxWords);
					onChange(next);

					if (touched) runValidation(next);
				}}
				className={[
					"mt-1 w-full px-4 py-2 rounded-lg border bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none resize-y",
					"border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-blue-600",
					localErrors?.[name] ? "border-red-500 focus:ring-red-500" : "",
					disabled ? "opacity-60 cursor-not-allowed" : "",
				].join(" ")}
			/>

			{/* ✅ error como todos tus campos */}
			<FieldError message={localErrors?.[name]} resetKey={errorKey} />

			{showCounter && (
				<p
					className={[
						"mt-1 text-xs text-right",
						atLimit
							? "text-red-600 dark:text-red-400 font-semibold"
							: "text-slate-500 dark:text-slate-400",
					].join(" ")}
				>
					{charsUsed} de {maxWords}
				</p>
			)}

			{hint && (
				<p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
					{hint}
				</p>
			)}
		</div>
	);
}
