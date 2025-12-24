import { useState } from "react";
import { FiBriefcase, FiCloud, FiLayers, FiPackage } from "react-icons/fi";
import { NavLink } from "react-router-dom";
import { useMenuVisibilityFromRoutes } from "../../../helpers/MenuPermissions";

export default function OperacionesClient({ isExpanded, isAdminWrap = false }) {
	const [open, setOpen] = useState(false);
	const { canView } = useMenuVisibilityFromRoutes();

	const itemBase =
		"flex items-center gap-2 px-2 py-2 rounded text-sm transition-colors w-full";
	const itemActive =
		"bg-blue-700/80 text-white dark:bg-slate-700 dark:text-white";
	const itemInactive =
		"text-white/90 hover:bg-blue-700/70 dark:text-slate-200 dark:hover:bg-slate-700";

	const menuItems = [
		{
			to: "/operaciones/clientes/netsuite/list-client-net",
			icon: <FiPackage />,
			label: "Clientes Netsuite",
		},
		{
			to: "/operaciones/clientes/veeam/ver-client-veeam",
			icon: <FiCloud />,
			label: "Clientes Veeam",
		},
		{
			to: "/operaciones/app",
			icon: <FiLayers />,
			label: "Aplicativos",
		},
	];

	const visibleItems = menuItems.filter((item) => canView(item.to));
	if (visibleItems.length === 0) return null;

	return (
		<div className="w-full">
			<button
				type="button"
				onClick={() => setOpen((v) => !v)}
				className="flex items-center px-1.5 py-2 text-white hover:bg-blue-700 dark:hover:bg-slate-700 rounded"
				title={isExpanded ? "" : "Operaciones"}
			>
				<span className="flex items-center gap-2 overflow-hidden">
					<FiBriefcase className="text-xl shrink-0" />
					<span
						className={[
							"whitespace-nowrap pr-8 transition-all duration-200",
							"overflow-hidden",
							isExpanded ? "opacity-100 w-[90px]" : "opacity-0 w-0",
						].join(" ")}
					>
						Clientes
					</span>
				</span>
				{isExpanded && (
					<svg
						aria-hidden="true"
						focusable="false"
						className={[
							"w-4 h-4 text-white transition-transform duration-200",
							isAdminWrap ? "ml-5" : "ml-8",
							isExpanded ? (open ? "rotate-0" : "-rotate-90") : "opacity-0",
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
						"pl-2",
					].join(" ")}
				>
					{visibleItems.map((item) => (
						<NavLink
							key={item.to}
							to={item.to}
							className={({ isActive }) =>
								`mt-2 ${itemBase} ${isActive ? itemActive : itemInactive}`
							}
							title={isExpanded ? "" : item.label}
						>
							<span className="text-lg shrink-0">{item.icon}</span>
							<span
								className={[
									"whitespace-nowrap transition-all duration-200 overflow-hidden",
									isExpanded ? "opacity-100 w-[112px]" : "opacity-0 w-0",
								].join(" ")}
							>
								{item.label}
							</span>
						</NavLink>
					))}
				</div>
			)}
		</div>
	);
}
