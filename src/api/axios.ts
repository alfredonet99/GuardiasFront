import axios from "axios";
import { baseUrl } from "../utils/baseUrl";
import { devWarn } from "../utils/devLogs";

// Público (login, registro, etc.)
const publicInstance = axios.create({
	baseURL: baseUrl,
});

// Privado (envía Authorization: Bearer <token>)
const privateInstance = axios.create({
	baseURL: baseUrl,
});

let authHandled = false;
let permHandled = false;

privateInstance.interceptors.request.use((config) => {
	// ✅ si ya marcaste sesión expirada/inactiva, NO dispares más requests
	if (localStorage.getItem("sessionExpired") === "1") {
		return Promise.reject({ __CANCEL__: true, message: "SESSION_EXPIRED" });
	}

	const token = localStorage.getItem("token");
	if (token) config.headers.Authorization = `Bearer ${token}`;
	return config;
});

privateInstance.interceptors.response.use(
	(res) => res,
	(err) => {
		const status = err?.response?.status;
		const reason = err?.response?.data?.reason;
		const message =
			err?.response?.data?.message ||
			"No tienes permisos para acceder a esta sección.";

		// ✅ 401: token inválido/expirado
		if (status === 401 && !authHandled) {
			authHandled = true;
			devWarn("🔐 401 detectado por axios. Lo manejará el hook/modal.");

			localStorage.setItem("sessionExpired", "1");
			localStorage.setItem("expired_at", Date.now().toString());
			localStorage.setItem("session_reason", "expired");
			return Promise.reject(err);
		}

		// ✅ 403 inactive: usuario desactivado
		if (status === 403 && reason === "inactive" && !authHandled) {
			authHandled = true;
			localStorage.setItem("sessionExpired", "1");
			localStorage.setItem("expired_at", Date.now().toString());
			localStorage.setItem("session_reason", "inactive");
			localStorage.setItem("inactive_account", "1");
			return Promise.reject(err);
		}

		if (status === 403 && reason !== "inactive" && !permHandled) {
			permHandled = true;
			const method = (err?.config?.method || "").toLowerCase();
			if (method === "get") {
				window.dispatchEvent(
					new CustomEvent("app:permission-denied", {
						detail: { message },
					}),
				);
			} else {
				devWarn("⛔ 403 acción:", message);
			}
			setTimeout(() => {
				permHandled = false;
			}, 800);
		}

		return Promise.reject(err);
	},
);

export { publicInstance, privateInstance };
