import { useCallback, useEffect, useState } from "react";
import routeConfig from "../routes/RouterConfig";
import { hasPermission, PERMISSIONS_BROADCAST_KEY } from "../services/auth";

function resolveModuleFromPath(pathname) {
	const cleanPath = String(pathname).split("?")[0];

	const candidates = routeConfig
		.filter((r) => r.module)
		.map((r) => {
			const base = r.path.split("/:")[0];
			return { ...r, base };
		})
		.sort((a, b) => b.base.length - a.base.length);

	const match = candidates.find((r) => cleanPath.startsWith(r.base));
	return match?.module || null;
}

export function useMenuVisibilityFromRoutes() {
	// ✅ fuerza re-render cuando cambien permisos
	const [permTick, setPermTick] = useState(0);

	useEffect(() => {
		const sync = () => setPermTick((t) => t + 1);

		const onStorage = (e) => {
			if (e.key === "permissions" || e.key === PERMISSIONS_BROADCAST_KEY) {
				sync();
			}
		};

		window.addEventListener("storage", onStorage);
		window.addEventListener("permissions:changed", sync);

		return () => {
			window.removeEventListener("storage", onStorage);
			window.removeEventListener("permissions:changed", sync);
		};
	}, []);

	const canView = useCallback(
		(path) => {
			// ✅ referencia permTick para recalcular cuando cambien permisos
			void permTick;

			const mod = resolveModuleFromPath(path);

			// si no hay module, lo dejamos visible
			if (!mod) return true;

			// regla del menú: visible si tiene browse
			return hasPermission(`${mod}.browse`);
		},
		[permTick],
	);

	return { canView };
}
