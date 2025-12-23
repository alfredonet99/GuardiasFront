import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import routeConfig from "../../routes/RouterConfig";
import { hasPermission, PERMISSIONS_BROADCAST_KEY } from "../../services/auth";

function resolveModuleFromPath(pathname) {
	const cleanPath = pathname.split("?")[0];

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

export default function useCrudPermission() {
	const { pathname } = useLocation();

	// ✅ esto fuerza re-render cuando cambien permisos
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

	const currentModule = useMemo(
		() => resolveModuleFromPath(pathname),
		[pathname],
	);

	const canDo = useCallback(
		(action, moduleOverride) => {
			// ✅ referencia permTick para que canDo se recalculé cuando cambien permisos
			void permTick;

			const mod = moduleOverride || currentModule;
			if (!mod) return false;

			const perm = `${mod}.${action}`;
			return hasPermission(perm);
		},
		[currentModule, permTick],
	);

	return { currentModule, canDo };
}
