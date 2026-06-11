import { matchPath } from "react-router-dom";
import routeConfig from "../routes/RouterConfig";

function formatModuleName(moduleName) {
	if (!moduleName) return "Panel";

	return String(moduleName)
		.replace(/[-_]/g, " ")
		.replace(/\b\w/g, (c) => c.toUpperCase());
}

export function getRouteModuleTitle(pathname) {
	const foundRoute = routeConfig.find((route) =>
		matchPath({ path: route.path, end: true }, pathname),
	);

	if (!foundRoute) return "Panel";

	return formatModuleName(foundRoute.module);
}
