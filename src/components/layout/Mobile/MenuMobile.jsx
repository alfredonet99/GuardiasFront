import { useState } from "react";
import { NavLink } from "react-router-dom";
import { AdminPanel, IconHome } from "../../icons/exportIcon";
import OperacionesAdminWrapper from "../WrapperOperaciones/OpereacionesWrapper";

export default function FloatingMobileMenu() {
	const [open, setOpen] = useState(false);
	const [activeSection, setActiveSection] = useState(null);

	const toggleMenu = () => {
		setOpen((prev) => {
			const next = !prev;

			if (!next) {
				setActiveSection(null);
			}

			return next;
		});
	};

	const closeMenu = () => {
		setOpen(false);
		setActiveSection(null);
	};

	const toggleSection = (section) => {
		setActiveSection((prev) => (prev === section ? null : section));
	};

	return (
		<div className="lg:hidden fixed bottom-6 right-5 z-[9999]">
			<button
				type="button"
				onClick={toggleMenu}
				className="w-14 h-14 rounded-full bg-blue-600 dark:bg-slate-800 text-white shadow-xl flex items-center justify-center active:scale-95 transition"
				aria-label="Abrir menú móvil"
				aria-expanded={open}
			>
				<span className="text-2xl leading-none">{open ? "×" : "☰"}</span>
			</button>

			{open && (
				<div className="absolute bottom-16 right-0 w-64 max-h-[75vh] overflow-y-auto rounded-2xl bg-blue-600 dark:bg-slate-800 text-white shadow-2xl p-3 space-y-2 border border-blue-500/40 dark:border-slate-700 animate-scaleIn">
					<div className="px-3 py-2 border-b border-white/20">
						<p className="text-sm font-semibold">Menú</p>
						<p className="text-xs text-white/70">Accesos principales</p>
					</div>

					<NavLink
						to="/inicio"
						onClick={closeMenu}
						className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-slate-700 transition text-sm text-left"
					>
						<IconHome label="Inicio" />
					</NavLink>

					<AdminPanel
						isExpanded={true}
						onItemClick={closeMenu}
						showChevron={false}
						isOpen={activeSection === "admin"}
						onToggleOpen={() => toggleSection("admin")}
					/>

					<OperacionesAdminWrapper
						isExpanded={true}
						onItemClick={closeMenu}
						showChevron={false}
						isOpen={activeSection === "operaciones"}
						onToggleOpen={() => toggleSection("operaciones")}
					/>

					<div className="border-t border-white/20 pt-2">
						<button
							type="button"
							onClick={closeMenu}
							className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-500/30 transition text-sm text-left"
						>
							<span className="text-lg">🚪</span>
							<span>Cerrar sesión</span>
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
