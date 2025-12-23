import { useCallback, useState } from "react";

export function useFieldErrors() {
	const [localErrors, setLocalErrors] = useState({});
	const [errorKey, setErrorKey] = useState(0);

	const bumpKey = useCallback(() => {
		setErrorKey((k) => k + 1);
	}, []);

	const triggerError = useCallback(
		(field, message) => {
			setLocalErrors((prev) => {
				// ✅ si ya existe el mismo mensaje, no re-render innecesario
				if (prev?.[field] === message) return prev;
				return { ...prev, [field]: message };
			});
			bumpKey();
		},
		[bumpKey],
	);

	const clearError = useCallback(
		(field) => {
			setLocalErrors((prev) => {
				// ✅ si no existe, no cambies state
				if (!Object.hasOwn(prev, field)) return prev;

				const updated = { ...prev };
				delete updated[field];
				return updated;
			});
			bumpKey();
		},
		[bumpKey],
	);

	const validateFields = useCallback(
		(rules, data) => {
			let valid = true;

			for (const field in rules) {
				const value = data[field];
				const rule = rules[field];

				const isEmpty =
					value === null ||
					value === undefined ||
					(typeof value === "string" && value.trim() === "") ||
					(Array.isArray(value) && value.length === 0);

				// ✅ requerido
				if (rule.required && isEmpty) {
					triggerError(
						field,
						rule.message || `El campo ${field} es obligatorio.`,
					);
					valid = false;
					continue;
				}

				// ✅ minLength
				if (rule.minLength) {
					const str = String(value ?? "");
					if (str.length < rule.minLength) {
						triggerError(
							field,
							rule.message || `Mínimo ${rule.minLength} caracteres.`,
						);
						valid = false;
					}
				}

				// ✅ equals
				if (Object.hasOwn(rule, "equals")) {
					if ((value ?? "") !== (rule.equals ?? "")) {
						triggerError(
							field,
							rule.message || `El campo ${field} no coincide.`,
						);
						valid = false;
					}
				}

				// ✅ pattern
				if (rule.pattern) {
					const str = String(value ?? "").trim();
					if (!rule.pattern.test(str)) {
						triggerError(
							field,
							rule.message || `Formato inválido en ${field}.`,
						);
						valid = false;
					}
				}
			}

			return valid;
		},
		[triggerError],
	);

	return { localErrors, errorKey, triggerError, clearError, validateFields };
}
