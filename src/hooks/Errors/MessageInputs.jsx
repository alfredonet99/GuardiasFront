import { useState } from "react";

export function useFieldErrors() {
  const [localErrors, setLocalErrors] = useState({});
  const [errorKey, setErrorKey] = useState(0);

  const triggerError = (field, message) => {
    setLocalErrors((prev) => ({ ...prev, [field]: message }));
    setErrorKey((k) => k + 1);
  };

  const clearError = (field) => {
    setLocalErrors((prev) => {
      const updated = { ...prev };
      delete updated[field];
      return updated;
    });
    setErrorKey((k) => k + 1);
  };

  const validateFields = (rules, data) => {
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
        triggerError(field, rule.message || `El campo ${field} es obligatorio.`);
        valid = false;
        continue; // 👈 si está vacío, no valida pattern
      }

      // ✅ pattern (formato)
      if (rule.pattern) {
        const str = String(value ?? "").trim();
        if (!rule.pattern.test(str)) {
          triggerError(field, rule.message || `Formato inválido en ${field}.`);
          valid = false;
          continue;
        }
      }
    }

    return valid;
  };

  return { localErrors, errorKey, triggerError, clearError, validateFields };
}
