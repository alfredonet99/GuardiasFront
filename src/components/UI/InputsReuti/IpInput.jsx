import { useEffect, useMemo, useState } from "react";
import { useAutoClearErrors } from "../../../hooks/Errors/clearErrorMessage";
import { useFieldErrors } from "../../../hooks/Errors/MessageInputs";
import FieldError from "../Errors/ElementsErrors";

function sanitizeIpInput(text) {
	const raw = String(text ?? "");
	const cleaned = raw.replace(/[^\d.]/g, "").slice(0, 16);

	// evita "...." excesivos (opcional, suave)
	return cleaned.replace(/\.{2,}/g, ".");
}

// Validación estricta IPv4 (0-255) con 4 octetos
function isValidIPv4(ip) {
	const s = String(ip ?? "").trim();
	const parts = s.split(".");
	if (parts.length !== 4) return false;

	for (const p of parts) {
		if (!/^\d+$/.test(p)) return false;
		const n = Number(p);
		if (n < 0 || n > 255) return false;
	}

	return true;
}

export default function IpInput({
	value,
	onChange,

	label = "IP",
	placeholder = "Ej: 192.168.1.10",
	id = "ip_input",
	name = "ip",
	disabled = false,

	required = true,
	hint,
	onValidChange,
}) {
	const [touched, setTouched] = useState(false);

	const { localErrors, errorKey, validateFields, clearError } =
		useFieldErrors();

	const formValues = useMemo(() => ({ [name]: value }), [name, value]);
	useAutoClearErrors(formValues, localErrors, clearError);

	const cleaned = useMemo(() => sanitizeIpInput(value), [value]);

	useEffect(() => {
		if (value !== cleaned) onChange(cleaned);
	}, [value, cleaned, onChange]);

	const empty = cleaned.trim().length === 0;
	const valid = !empty && isValidIPv4(cleaned);

	const isValid = required ? valid : empty ? true : valid;

	useEffect(() => {
		onValidChange?.(isValid);
	}, [isValid, onValidChange]);

	const errorMessage = required
		? "Este campo es obligatorio y debe ser una IP válida (IPv4)."
		: "Debe ser una IP válida (IPv4).";

	const runValidation = (currentValue) => {
		const v = String(currentValue ?? "").trim();

		const invalidRequired = required && v.length === 0;
		const invalidFormat = v.length > 0 && !isValidIPv4(v);

		const shouldFail = invalidRequired || invalidFormat;

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
				inputMode="numeric"
				autoComplete="off"
				spellCheck={false}
				placeholder={placeholder}
				value={cleaned}
				disabled={disabled}
				onBlur={() => {
					setTouched(true);
					runValidation(cleaned);
				}}
				onChange={(e) => {
					const next = sanitizeIpInput(e.target.value);
					onChange(next);

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
