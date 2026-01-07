import { useEffect, useMemo, useState } from "react";
import { useAutoClearErrors } from "../../../hooks/Errors/clearErrorMessage";
import { useFieldErrors } from "../../../hooks/Errors/MessageInputs";
import FieldError from "../Errors/ElementsErrors";

export default function UserSelect({
	id,
	name,
	label,
	value,
	onChange,
	users = [],
	loading = false,
	disabled = false,
	error = null, // <- opcional (server error). Lo integramos al mismo FieldError
	required = false,
	placeholder = "Selecciona un usuario",
	className = "",
	onValidChange, // <- opcional, igual que TicketNumeric
}) {
	const [touched, setTouched] = useState(false);

	// ✅ tu sistema de errores
	const { localErrors, errorKey, validateFields, clearError, setLocalErrors } =
		useFieldErrors();

	// ✅ para auto-limpiar al cambiar value
	const formValues = useMemo(() => ({ [name]: value }), [name, value]);
	useAutoClearErrors(formValues, localErrors, clearError);

	// ✅ si te llega "error" externo (API), lo metemos al mismo canal
	useEffect(() => {
		if (!error) return;

		// si tu hook NO expone setLocalErrors, dime y lo ajustamos a tu implementación real
		setLocalErrors?.((prev) => ({ ...prev, [name]: String(error) }));
	}, [error, name, setLocalErrors]);

	const isFilled = String(value ?? "").trim().length > 0;
	const isValid = required ? isFilled : true;

	useEffect(() => {
		onValidChange?.(isValid);
	}, [isValid, onValidChange]);

	const errorMessage = required
		? "Seleccion un usuario."
		: "Seleccion inválida.";

	const runValidation = (currentValue) => {
		const rules = {
			[name]: {
				required,
				message: errorMessage,
			},
		};

		// si tocó y es inválido, mandamos vacío para forzar tu error
		const v = String(currentValue ?? "").trim();
		const payloadValue = touched && required && !v ? "" : v;

		validateFields(rules, { [name]: payloadValue });
	};

	return (
		<div className={`mb-4 ${className}`}>
			{label ? (
				<label htmlFor={id} className="font-semibold text-sm">
					{label} {required && <span className="text-red-600">*</span>}
				</label>
			) : null}

			<select
				id={id}
				name={name}
				value={value}
				onChange={(e) => {
					const next = e.target.value;
					onChange?.(next);

					if (touched) runValidation(next);
				}}
				onBlur={() => {
					setTouched(true);
					runValidation(value);
				}}
				disabled={disabled || loading}
				className={[
					"mt-1 w-full px-4 py-2 rounded-lg border bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none",
					"border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-blue-600",
					localErrors?.[name] ? "border-red-500 focus:ring-red-500" : "",
					disabled || loading ? "opacity-60 cursor-not-allowed" : "",
				].join(" ")}
			>
				<option value="">
					{loading ? "Cargando usuarios..." : placeholder}
				</option>

				{users.map((u) => (
					<option key={u.id} value={u.id}>
						{u.name}
					</option>
				))}
			</select>

			{/* ✅ mismo componente de error */}
			<FieldError message={localErrors?.[name]} resetKey={errorKey} />
		</div>
	);
}
