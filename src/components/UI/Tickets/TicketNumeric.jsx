import { useEffect, useMemo, useState } from "react";
import { useAutoClearErrors } from "../../../hooks/Errors/clearErrorMessage";
import { useFieldErrors } from "../../../hooks/Errors/MessageInputs";
import FieldError from "../Errors/ElementsErrors";

export default function TicketNumeric({
	label = "Número",
	value,
	onChange,
	minDigits = 2,
	maxDigits = 7,
	placeholder = "1234",
	required = false,
	id = "numeric_ticket",
	name = "numTicket",
	disabled = false,
	onValidChange,
}) {
	const [touched, setTouched] = useState(false);

	// ✅ tu sistema de errores
	const { localErrors, errorKey, validateFields, clearError } =
		useFieldErrors();

	// Para que el hook pueda limpiar al cambiar value
	const formValues = useMemo(() => ({ [name]: value }), [name, value]);
	useAutoClearErrors(formValues, localErrors, clearError);

	const cleaned = useMemo(() => {
		const v = String(value ?? "");
		return v.replace(/\D/g, "").slice(0, maxDigits);
	}, [value, maxDigits]);

	useEffect(() => {
		if (value !== cleaned) onChange(cleaned);
	}, [value, cleaned, onChange]);

	const isEmpty = cleaned.length === 0;
	const isValidLength = isEmpty
		? !required
		: cleaned.length >= minDigits && cleaned.length <= maxDigits;

	const isValid = isValidLength;

	useEffect(() => {
		onValidChange?.(isValid);
	}, [isValid, onValidChange]);

	const errorMessage = `Debe tener ${
		required ? "" : "si se captura, "
	}entre ${minDigits} y ${maxDigits} dígitos.`;

	const runValidation = (currentValue) => {
		const rules = {
			[name]: {
				required,
				message: errorMessage,
			},
		};

		const v = String(currentValue ?? "");
		const len = v.length;

		let payloadValue = v;

		if (touched) {
			const invalidLen =
				len === 0 ? required : len < minDigits || len > maxDigits;
			if (invalidLen) payloadValue = "";
		}

		validateFields(rules, { [name]: payloadValue });
	};

	return (
		<div className="mb-2">
			<label
				htmlFor={id}
				className="font-semibold text-sm text-slate-800 dark:text-slate-200"
			>
				{label} {required && <span className="text-red-600">*</span>}
			</label>

			<input
				id={id}
				name={name}
				type="text"
				inputMode="numeric"
				pattern="[0-9]*"
				maxLength={maxDigits}
				value={cleaned}
				disabled={disabled}
				onBlur={() => {
					setTouched(true);
					runValidation(cleaned);
				}}
				onChange={(e) => {
					const next = e.target.value.replace(/\D/g, "").slice(0, maxDigits);
					onChange(next);

					if (touched) runValidation(next);
				}}
				placeholder={placeholder}
				className={[
					"mt-1 w-full px-4 py-2 rounded-lg border bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none",
					"border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-blue-600",
					localErrors?.[name] ? "border-red-500 focus:ring-red-500" : "",
					disabled ? "opacity-60 cursor-not-allowed" : "",
				].join(" ")}
			/>
			<FieldError message={localErrors?.[name]} resetKey={errorKey} />
		</div>
	);
}
