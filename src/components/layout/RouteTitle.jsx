import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { getRouteModuleTitle } from "../../utils/RouteTitleModule";

export default function RouteTitleUpdater() {
	const location = useLocation();

	useEffect(() => {
		const moduleTitle = getRouteModuleTitle(location.pathname);
		document.title = `${moduleTitle}`;
	}, [location.pathname]);

	return null;
}
