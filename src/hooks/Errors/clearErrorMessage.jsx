// hooks/Errors/clearErrorMessage.js
import { useEffect } from "react";

export function useAutoClearErrors(values, localErrors, clearError, rules = {}) {
  useEffect(() => {
    Object.keys(localErrors).forEach((field) => {
      const value = values[field];
      const rule = rules[field];

      if (!rule) return;

      // requerido
      if (rule.required) {
        if (
          value === null ||
          value === undefined ||
          (typeof value === "string" && value.trim() === "") ||
          (Array.isArray(value) && value.length === 0)
        ) {
          return; // sigue inválido → NO limpiar
        }
      }

      // pattern
      if (rule.pattern) {
        const str = String(value ?? "").trim();
        if (!rule.pattern.test(str)) {
          return; // sigue inválido → NO limpiar
        }
      }

      // ✅ si llegó aquí → es válido
      clearError(field);
    });
  }, [values, localErrors, clearError, rules]);
}
