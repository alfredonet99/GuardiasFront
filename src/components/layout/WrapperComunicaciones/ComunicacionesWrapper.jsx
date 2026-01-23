import { useMemo, useState } from "react";
import { FiMessageCircle } from "react-icons/fi";
import { useMenuVisibilityFromRoutes } from "../../../helpers/MenuPermissions";
import ComunicacionesMenu, {
	COMUNICACIONES_MENU_ITEMS,
} from "./MenuComunicaciones";

function getCachedUser() {
	try {
		const raw = localStorage.getItem("user");
		return raw ? JSON.parse(raw) : null;
	} catch {
		return null;
	}
}

export default function ComunicacionesAdminWrapper({ isExpanded }) {
	const [open, setOpen] = useState(false);
	const { canView } = useMenuVisibilityFromRoutes();

	const u = getCachedUser();
	const areaId = u?.area_id;

	const isAdmin =
		Array.isArray(u?.roles) && u.roles.some((r) => r?.name === "Administrador");

	const hasComunicacionesItems = useMemo(() => {
		const all = [...COMUNICACIONES_MENU_ITEMS];
		return all.some((it) => canView(it.to));
	}, [canView]);

	if (!hasComunicacionesItems) return null;

	if (isAdmin) {
		return (
			<div className="w-full">
				<button
					type="button"
					onClick={() => setOpen((v) => !v)}
					className="flex items-center px-1.5 py-2 text-white hover:bg-blue-700 dark:hover:bg-slate-700 rounded w-full"
					title={isExpanded ? "" : "Comunicaciones"}
				>
					<span className="flex items-center gap-2 overflow-hidden">
						<FiMessageCircle className="text-xl shrink-0" />
						<span
							className={[
								"whitespace-nowrap pr-8 transition-all duration-200 overflow-hidden",
								isExpanded ? "opacity-100 w-[120px]" : "opacity-0 w-0",
							].join(" ")}
						>
							Comunicaciones
						</span>
					</span>

					{isExpanded && (
						<svg
							aria-hidden="true"
							focusable="false"
							className={[
								"w-4 h-4 ml-auto text-white transition-transform duration-200",
								open ? "rotate-0" : "-rotate-90",
							].join(" ")}
							viewBox="0 0 20 20"
							fill="currentColor"
						>
							<path d="M5.23 7.21a.75.75 0 011.06.02L10 11.207l3.71-3.977a.75.75 0 111.08 1.04l-4.24 4.54a.75.75 0 01-1.08 0l-4.24-4.54a.75.75 0 01.02-1.06z" />
						</svg>
					)}
				</button>

				{isExpanded && (
					<div
						className={[
							"overflow-hidden transition-[max-height] duration-200",
							open ? "max-h-screen" : "max-h-0",
							"pl-2 space-y-2",
						].join(" ")}
					>
						<ComunicacionesMenu isExpanded={isExpanded} />
					</div>
				)}
			</div>
		);
	}

	if (areaId === 4) {
		return (
			<div className="w-full space-y-2">
				<ComunicacionesMenu isExpanded={isExpanded} />
			</div>
		);
	}

	return null;
}
