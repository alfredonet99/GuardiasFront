import { useState, useEffect } from "react";

export function useFormPage(loadFn) {
  const [loadingPage, setLoadingPage] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      try {
        if (loadFn) await loadFn();
      } finally {
        if (mounted) setLoadingPage(false);
      }
    };

    run();

    return () => {
      mounted = false;
    };
  }, []);

  return {
    loadingPage,
    submitting,
    setSubmitting,
  };
}
