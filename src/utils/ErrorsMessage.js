export function getErrorMessage(
	err,
	fallback = "Ocurrió un problema. Intenta nuevamente.",
) {
	// cancelado
	const msg = String(err?.message ?? "").toLowerCase();
	if (
		err?.code === "ERR_CANCELED" ||
		err?.name === "CanceledError" ||
		err?.name === "AbortError" ||
		msg.includes("canceled") ||
		msg.includes("cancelled")
	) {
		return null; // no mostrar nada
	}

	const status = err?.response?.status;
	const apiMsg = err?.response?.data?.message;
	const apiCode = err?.response?.data?.code;

	// ✅ si backend ya mandó message amable, úsalo
	if (apiMsg) return apiMsg;

	// ✅ si no vino message, usa fallback por status/code
	if (status === 404 || apiCode === "ROUTE_NOT_FOUND")
		return "No pudimos cargar la información. Intenta más tarde.";
	if (status === 500 || apiCode === "SERVER_ERROR")
		return "Ocurrió un problema en el sistema. Intenta nuevamente.";
	if (status === 422 || apiCode === "VALIDATION_FAILED")
		return "Revisa la información capturada.";
	if (status === 0 || !status)
		return "No se pudo conectar con el servidor. Verifica tu internet o intenta más tarde.";

	return fallback;
}
