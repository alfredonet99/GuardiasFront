import { useMemo, useState } from "react";
import { FiLayers } from "react-icons/fi";
import { useMenuVisibilityFromRoutes } from "../../../helpers/MenuPermissions";
import OperacionesMenu, { OPERACIONES_MENU_ITEMS } from "./MenuOperaciones";
import OperacionesClient, { OPERACIONES_CLIENT_ITEMS } from "./Operaciones";

function getCachedUser() {
	try {
		const raw = localStorage.getItem("user");
		return raw ? JSON.parse(raw) : null;
	} catch {
		return null;
	}
}

export default function OperacionesAdminWrapper({
	isExpanded,
	onItemClick,
	showChevron = true,
	isOpen,
	onToggleOpen,
}) {
	const [internalOpen, setInternalOpen] = useState(false);

	const open = typeof isOpen === "boolean" ? isOpen : internalOpen;

	const handleToggle = () => {
		if (onToggleOpen) {
			onToggleOpen();
			return;
		}

		setInternalOpen((v) => !v);
	};

	const { canView } = useMenuVisibilityFromRoutes();

	const u = getCachedUser();
	const areaId = u?.area_id;
	const isAdmin =
		Array.isArray(u?.roles) && u.roles.some((r) => r?.name === "Administrador");

	const hasOperacionesItems = useMemo(() => {
		const all = [...OPERACIONES_CLIENT_ITEMS, ...OPERACIONES_MENU_ITEMS];
		return all.some((it) => canView(it.to));
	}, [canView]);

	if (!hasOperacionesItems) return null;

	if (isAdmin) {
		return (
			<div className="w-full">
				<button
					type="button"
					onClick={handleToggle}
					className="flex items-center px-1.5 py-2 text-white hover:bg-blue-700 dark:hover:bg-slate-700 rounded w-full"
					title={isExpanded ? "" : "Operaciones"}
				>
					<span className="flex items-center gap-2 overflow-hidden">
						<FiLayers className="text-xl shrink-0" />
						<span
							className={[
								"whitespace-nowrap pr-8 transition-all duration-200 overflow-hidden",
								isExpanded ? "opacity-100 w-[120px]" : "opacity-0 w-0",
							].join(" ")}
						>
							Operaciones
						</span>
					</span>

					{isExpanded && showChevron && (
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
							"grid transition-[grid-template-rows,opacity] duration-300 ease-out",
							open
								? "grid-rows-[1fr] opacity-100"
								: "grid-rows-[0fr] opacity-0",
							"pl-2",
						].join(" ")}
					>
						<div className="min-h-0 overflow-hidden space-y-2">
							<OperacionesClient
								isExpanded={isExpanded}
								isAdminWrap
								onItemClick={onItemClick}
								showChevron={showChevron}
							/>

							<OperacionesMenu
								isExpanded={isExpanded}
								onItemClick={onItemClick}
							/>
						</div>
					</div>
				)}
			</div>
		);
	}

	if (areaId === 1) {
		return (
			<div className="w-full space-y-2">
				<OperacionesClient
					isExpanded={isExpanded}
					isAdminWrap={false}
					onItemClick={onItemClick}
					showChevron={showChevron}
				/>

				<OperacionesMenu isExpanded={isExpanded} onItemClick={onItemClick} />
			</div>
		);
	}

	return null;
}
