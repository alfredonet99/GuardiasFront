// hooks/useTouchedFields.js
import { useState, useCallback } from "react";

export function useTouchedFields(initial = {}) {
  const [touched, setTouched] = useState(initial);

  const markTouched = useCallback((field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  const markAllTouched = useCallback((fields) => {
    const all = {};
    fields.forEach((f) => (all[f] = true));
    setTouched(all);
  }, []);

  const isTouched = useCallback(
    (field) => Boolean(touched[field]),
    [touched]
  );

  return {
    touched,
    markTouched,
    markAllTouched,
    isTouched,
  };
}
