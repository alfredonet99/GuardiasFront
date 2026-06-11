import { privateInstance, publicInstance } from "../api/axios";
import type { User } from "../types/user";

export interface Credentials {
	email: string;
	password: string;
}

export interface LoginResponse {
	token: string;
	token_type: string;
	expires_in: number;
	user: User;
	permissions: string[];
}

export function setSessionExpired(reason: "expired" | "inactive") {
	localStorage.setItem("sessionExpired", "1");
	localStorage.setItem("session_reason", reason);
	localStorage.setItem("expired_at", Date.now().toString());

	// storage NO se dispara en la misma pestaña, por eso avisamos manualmente
	window.dispatchEvent(new Event("session:changed"));
}

export function clearSessionExpired() {
	localStorage.removeItem("sessionExpired");
	localStorage.removeItem("session_reason");
	localStorage.removeItem("expired_at");
	localStorage.removeItem("inactive_account");

	// compat vieja (por si existía)
	localStorage.removeItem("session_expired");

	window.dispatchEvent(new Event("session:changed"));
}

export const PERMISSIONS_BROADCAST_KEY = "permissions_broadcast_v1";

function broadcastPermissionsChanged() {
	// ✅ otras pestañas (storage) + misma pestaña (event)
	localStorage.setItem(PERMISSIONS_BROADCAST_KEY, Date.now().toString());
	window.dispatchEvent(new Event("permissions:changed"));
}

const GUARDIA_MODAL_SHOW_ON_LOGIN = "guardia_modal_show_on_login_v1";

export async function loginApi(payload: Credentials): Promise<LoginResponse> {
	const { data } = await publicInstance.post<LoginResponse>("/login", payload);

	localStorage.setItem("token", data.token);
	localStorage.setItem("user", JSON.stringify(data.user));

	const expiresAt = Date.now() + data.expires_in * 1000;
	localStorage.setItem("token_expires_at", expiresAt.toString());

	if (data.permissions) {
		localStorage.setItem("permissions", JSON.stringify(data.permissions));
	} else {
		localStorage.setItem("permissions", "[]");
	}

	broadcastPermissionsChanged();

	clearSessionExpired();

	localStorage.setItem("activity_seen", "0");
	localStorage.removeItem("last_activity");

	console.log(
		`✅ Login OK. El token expira a las: ${new Date(expiresAt).toLocaleTimeString()}`,
	);

	sessionStorage.setItem(GUARDIA_MODAL_SHOW_ON_LOGIN, "1");

	return data;
}

export async function meApi(): Promise<User> {
	const { data } = await privateInstance.get<User>("/profile");
	return data;
}

export const LOGOUT_BROADCAST_KEY = "logout_broadcast_v1";

export function logout() {
	localStorage.removeItem("token");
	localStorage.removeItem("user");
	localStorage.removeItem("permissions");
	localStorage.removeItem("token_expires_at");

	localStorage.removeItem("last_activity");
	localStorage.removeItem("activity_seen");

	localStorage.setItem(LOGOUT_BROADCAST_KEY, Date.now().toString());

	broadcastPermissionsChanged();
	// ✅ claves correctas
	clearSessionExpired();
}

export async function refreshPermissions(): Promise<string[]> {
	// ✅ si ya está expirada la sesión, no intentes refrescar
	if (localStorage.getItem("sessionExpired") === "1") {
		return getPermissions();
	}

	try {
		const { data } = await privateInstance.get<{ permissions: string[] }>(
			"/user/permissions",
		);

		localStorage.setItem("permissions", JSON.stringify(data.permissions));

		// ✅ AVISA QUE YA CAMBIARON PERMISOS
		broadcastPermissionsChanged();

		return data.permissions;
	} catch (err: unknown) {
		// ✅ si axios canceló por sessionExpired, no lo loguees como error
		if (typeof err === "object" && err !== null && "__CANCEL__" in err) {
			return getPermissions();
		}

		console.error("❌ Error al refrescar permisos:", err);
		return getPermissions();
	}
}

export function getPermissions(): string[] {
	const raw = localStorage.getItem("permissions");
	try {
		return raw ? JSON.parse(raw) : [];
	} catch {
		return [];
	}
}

export function hasPermission(perm: string): boolean {
	const permissions = getPermissions();
	return permissions.includes(perm);
}
