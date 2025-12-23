import { useCallback, useEffect, useRef, useState } from "react";

export default function useFlashMessage(defaultDuration = 5000) {
	const [message, setMessage] = useState(null);
	const timerRef = useRef(null);

	const clearMessage = useCallback(() => {
		setMessage(null);
		if (timerRef.current) {
			clearTimeout(timerRef.current);
			timerRef.current = null;
		}
	}, []);

	const showMessage = useCallback(
		(text, type = "info", durationMs = defaultDuration) => {
			if (timerRef.current) {
				clearTimeout(timerRef.current);
			}

			setMessage({ text, type });

			timerRef.current = setTimeout(() => {
				setMessage(null);
				timerRef.current = null;
			}, durationMs);
		},
		[defaultDuration],
	);

	useEffect(() => {
		return () => {
			if (timerRef.current) {
				clearTimeout(timerRef.current);
			}
		};
	}, []);

	return { message, showMessage, clearMessage };
}
