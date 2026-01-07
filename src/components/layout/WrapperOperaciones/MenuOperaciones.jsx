import { FiInbox, FiLayers, FiUserCheck } from "react-icons/fi";
import { NavLink } from "react-router-dom";
import { useMenuVisibilityFromRoutes } from "../../../helpers/MenuPermissions";

export const OPERACIONES_MENU_ITEMS = [
	{
		to: "/operaciones/app",
		label: "Aplicativos",
		icon: <FiLayers />,
	},
	{
		to: "/operaciones/guardias",
		label: "Guardias",
		icon: <FiUserCheck />,
	},
	{
		to: "/operaciones/tickets",
		icon: <FiInbox />,
		label: "Tickets",
	},
];

export default function OperacionesMenu({ isExpanded }) {
	const { canView } = useMenuVisibilityFromRoutes();

	const itemBase =
		"flex items-center gap-2 px-2 py-2 rounded text-sm transition-colors w-full";
	const itemActive =
		"bg-blue-700/80 text-white dark:bg-slate-700 dark:text-white";
	const itemInactive =
		"text-white/90 hover:bg-blue-700/70 dark:text-slate-200 dark:hover:bg-slate-700";

	const visibleItems = OPERACIONES_MENU_ITEMS.filter((it) => canView(it.to));
	if (!visibleItems.length) return null;

	return (
		<>
			{visibleItems.map((it) => (
				<NavLink
					key={it.to}
					to={it.to}
					className={({ isActive }) =>
						`${itemBase} ${isActive ? itemActive : itemInactive}`
					}
					title={isExpanded ? "" : it.collapsedTitle || it.label}
				>
					<span className="text-lg shrink-0">{it.icon}</span>

					<span
						className={[
							"whitespace-nowrap transition-all duration-200 overflow-hidden",
							isExpanded
								? `opacity-100 ${it.widthExpanded || "w-[112px]"}`
								: "opacity-0 w-0",
						].join(" ")}
					>
						{it.label}
					</span>
				</NavLink>
			))}
		</>
	);
}
