import { useCallback, useEffect, useRef, useState } from "react";
import { getErrorMessage } from "../utils/ErrorsMessage";

function delayMs(ms, signal) {
	return new Promise((resolve) => {
		const t = setTimeout(resolve, ms);

		const clearAndResolve = () => {
			clearTimeout(t);
			resolve();
		};

		if (signal) {
			if (signal.aborted) {
				clearAndResolve();
			} else {
				signal.addEventListener("abort", clearAndResolve, { once: true });
			}
		}
	});
}

function isCanceledError(e) {
	const msg = String(e?.message ?? "").toLowerCase();
	return (
		e?.code === "ERR_CANCELED" ||
		e?.name === "CanceledError" ||
		e?.name === "AbortError" ||
		msg.includes("canceled") ||
		msg.includes("cancelled")
	);
}

function normalizeError(e) {
	const status = e?.response?.status ?? null;
	const apiCode = e?.response?.data?.code ?? null;

	// ✅ Mensaje final para usuario (si regresa null => no mostrar)
	const message = getErrorMessage(e);

	return {
		status,
		code: apiCode,
		message, // <- este es el que usas en TableStateMessage o Flash
		raw: e, // <- por si quieres debug
	};
}

/**
 * useDelayedRequestLoading(minMs)
 *
 * const { loading, error, data, run, cancel, resetError } = useDelayedRequestLoading(2000);
 *
 * await run((signal) => axios.get(url, { params, signal }), { mapData: (res) => res.data });
 */
export default function useDelayedRequestLoading(minMs = 2000) {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
	const [data, setData] = useState(null);

	const controllerRef = useRef(null);
	const aliveRef = useRef(true);

	useEffect(() => {
		aliveRef.current = true;

		return () => {
			aliveRef.current = false;

			if (controllerRef.current) {
				controllerRef.current.abort();
				controllerRef.current = null;
			}
		};
	}, []);

	const cancel = useCallback(() => {
		if (controllerRef.current) {
			controllerRef.current.abort();
			controllerRef.current = null;
		}
	}, []);

	const resetError = useCallback(() => {
		if (aliveRef.current) setError(null);
	}, []);

	const run = useCallback(
		async (makeRequest, options = {}) => {
			const { minDelayMs = minMs, keepPreviousData = true, mapData } = options;

			// cancela request anterior
			cancel();

			const controller = new AbortController();
			controllerRef.current = controller;

			if (aliveRef.current) {
				setLoading(true);
				setError(null);
				if (!keepPreviousData) setData(null);
			}

			let result = null;

			try {
				const reqPromise = makeRequest(controller.signal);

				// ✅ loader mínimo siempre se respeta
				const [res] = await Promise.all([
					reqPromise,
					delayMs(minDelayMs, controller.signal),
				]);

				const canCommit =
					aliveRef.current &&
					controllerRef.current === controller &&
					!controller.signal.aborted;

				if (canCommit) {
					result = mapData ? mapData(res) : res;
					setData(result);
				}
			} catch (e) {
				const canceled = isCanceledError(e) || controller.signal.aborted;

				const canCommit =
					aliveRef.current && controllerRef.current === controller && !canceled;

				if (canCommit) {
					setError(normalizeError(e));
				}
			} finally {
				if (controllerRef.current === controller) {
					controllerRef.current = null;
				}

				if (aliveRef.current) {
					setLoading(false);
				}
			}

			return result;
		},
		[minMs, cancel],
	);

	return {
		loading,
		error, // ✅ ahora es { status, code, message, raw }
		data,
		run,
		cancel,
		resetError,
		setData,
	};
}
