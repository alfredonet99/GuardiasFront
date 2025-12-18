import axios from "axios";
import { baseUrl } from "../utils/baseUrl";

// Público (login, registro, etc.)
const publicInstance = axios.create({
  baseURL: baseUrl,
});

// Privado (envía Authorization: Bearer <token>)
const privateInstance = axios.create({
  baseURL: baseUrl,
});

let authHandled = false; // ✅ evita disparar la señal 20 veces

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

    // ✅ 401: token inválido/expirado
    if (status === 401 && !authHandled) {
      authHandled = true;
      console.warn("🔐 401 detectado por axios. Lo manejará el hook/modal.");

      localStorage.setItem("sessionExpired", "1");
      localStorage.setItem("expired_at", Date.now().toString());
      localStorage.setItem("session_reason", "expired");
    }

    // ✅ 403 inactive: usuario desactivado
    if (status === 403 && reason === "inactive" && !authHandled) {
      authHandled = true;
      console.warn("⛔ 403 inactive detectado por axios. Lo manejará el hook/modal.");

      localStorage.setItem("sessionExpired", "1");
      localStorage.setItem("expired_at", Date.now().toString());
      localStorage.setItem("session_reason", "inactive");
      localStorage.setItem("inactive_account", "1"); // opcional si lo usabas en login
    }

    return Promise.reject(err);
  }
);

export { publicInstance, privateInstance };
