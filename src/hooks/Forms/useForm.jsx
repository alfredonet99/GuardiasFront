import { useEffect, useRef, useState } from "react";

export function useFormPage(loadFn) {
	const [loadingPage, setLoadingPage] = useState(true);
	const [submitting, setSubmitting] = useState(false);

	const loadRef = useRef(loadFn);
	loadRef.current = loadFn;

	useEffect(() => {
		let mounted = true;

		const run = async () => {
			try {
				if (loadRef.current) await loadRef.current();
			} finally {
				if (mounted) setLoadingPage(false);
			}
		};

		run();

		return () => {
			mounted = false;
		};
	}, []);

	return { loadingPage, submitting, setSubmitting };
}
