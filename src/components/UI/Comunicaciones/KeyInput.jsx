import { useEffect, useMemo, useState } from "react";
import { useAutoClearErrors } from "../../../hooks/Errors/clearErrorMessage";
import { useFieldErrors } from "../../../hooks/Errors/MessageInputs";
import FieldError from "../Errors/ElementsErrors";

// ✅ normaliza a minúsculas y limita longitud
function sanitizeKeyInput(text, maxLength) {
	let v = String(text ?? "").toLowerCase();

	const max = Number(maxLength);
	if (Number.isFinite(max) && max > 0) {
		v = v.slice(0, max);
	}

	return v;
}

export default function KeyInput({
	value,
	onChange,

	label = "Clave",
	placeholder = "Ej: mi-clave_123",
	id = "key_input",
	name = "key",
	disabled = false,

	required = true,
	hint,
	onValidChange,

	minLength = 1,
	maxLength = 20,
}) {
	const [touched, setTouched] = useState(false);

	const { localErrors, errorKey, validateFields, clearError } =
		useFieldErrors();

	const formValues = useMemo(() => ({ [name]: value }), [name, value]);
	useAutoClearErrors(formValues, localErrors, clearError);

	const cleaned = useMemo(
		() => sanitizeKeyInput(value, maxLength),
		[value, maxLength],
	);

	// ✅ si el user pega mayúsculas o se pasa del max, normalizamos y recortamos
	useEffect(() => {
		if ((value ?? "") !== cleaned) onChange?.(cleaned);
	}, [value, cleaned, onChange]);

	const empty = String(cleaned ?? "").trim().length === 0;

	// ✅ validación base: required + longitudes
	const len = String(cleaned ?? "").length;
	const validLength = empty
		? true
		: len >= Number(minLength) && len <= Number(maxLength);

	const isValid = required ? !empty && validLength : empty ? true : validLength;

	useEffect(() => {
		onValidChange?.(isValid);
	}, [isValid, onValidChange]);

	const errorMessage = required
		? `Este campo es obligatorio y debe tener entre ${minLength} y ${maxLength} caracteres.`
		: `Debe tener entre ${minLength} y ${maxLength} caracteres.`;

	const runValidation = (currentValue) => {
		const v = String(currentValue ?? "");
		const isEmpty = v.trim().length === 0;

		const invalidRequired = required && isEmpty;

		const L = v.length;
		const invalidLength =
			!isEmpty && (L < Number(minLength) || L > Number(maxLength));

		const shouldFail = invalidRequired || invalidLength;

		const rules = {
			[name]: {
				required,
				message: errorMessage,
			},
		};

		let payloadValue = v;
		if (touched && shouldFail) payloadValue = "";

		validateFields(rules, { [name]: payloadValue });
	};

	return (
		<div className="mb-4">
			<label htmlFor={id} className="font-semibold text-sm">
				{label} {required && <span className="text-red-600">*</span>}
			</label>

			<input
				id={id}
				name={name}
				type="text"
				autoComplete="off"
				autoCapitalize="none"
				autoCorrect="off"
				spellCheck={false}
				placeholder={placeholder}
				value={cleaned}
				disabled={disabled}
				maxLength={Number(maxLength) || undefined} // ✅ limita escritura nativo
				onBlur={() => {
					setTouched(true);
					runValidation(cleaned);
				}}
				onChange={(e) => {
					const next = sanitizeKeyInput(e.target.value, maxLength); // ✅ recorta
					onChange?.(next);

					if (touched) runValidation(next);
				}}
				className={[
					"mt-1 w-full px-4 py-2 rounded-lg border bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none",
					"border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-blue-600",
					localErrors?.[name] ? "border-red-500 focus:ring-red-500" : "",
					disabled ? "opacity-60 cursor-not-allowed" : "",
				].join(" ")}
			/>

			<FieldError message={localErrors?.[name]} resetKey={errorKey} />

			{hint && (
				<p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
					{hint}
				</p>
			)}
		</div>
	);
}
