import { useCallback, useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { logout } from "../../api/auth";
import { useAuthCheck } from "../../hooks/Auth/AuthCheck";
import { useTokenRefresh } from "../../hooks/Auth/RefreshTok";
import { useActivityDebug } from "../../hooks/Auth/RenovationToken";
import { useTabLeader } from "../../hooks/Auth/TabLeader";
import { useTabsDebug } from "../../hooks/Auth/TabsDuplicate";
import PermissionDenied from "../../Pages/Errors/PermissionDenied";
import { LOGOUT_BROADCAST_KEY, refreshPermissions } from "../../services/auth";
import { PageTitleProvider } from "../context/TitlePage";
import {
	AdminPanel,
	IconHome,
	IconLogout,
	SearchGlobal,
} from "../icons/exportIcon";
import SessionExpiredModal from "../Modals/Sesion/FinishSesion";
import PageHeader from "./PageHeader";
import Profile from "./profile";
import RoutePageTitleManager from "./RouteLayout";
import OperacionesAdminWrapper from "./WrapperOperaciones/OpereacionesWrapper";

export default function MainLayout() {
	const [permDenied, setPermDenied] = useState(false);
	const [_permMessage, setPermMessage] = useState("");
	const location = useLocation();

	const [isHovered, setIsHovered] = useState(false);

	const { isLeader } = useTabLeader(true);

	useActivityDebug();
	useTabsDebug();

	const { expired } = useAuthCheck({ isLeader });
	useTokenRefresh({ isLeader });

	useEffect(() => {
		const onStorage = (e) => {
			if (e.key !== LOGOUT_BROADCAST_KEY) return;
			localStorage.removeItem("token");
			localStorage.removeItem("user");
			localStorage.removeItem("permissions");
			localStorage.removeItem("token_expires_at");
			localStorage.removeItem("last_activity");
			localStorage.removeItem("activity_seen");

			localStorage.removeItem("sessionExpired");
			localStorage.removeItem("expired_at");
			localStorage.removeItem("session_reason");
			localStorage.removeItem("inactive_account");
			localStorage.removeItem("session_expired");

			window.location.assign("/login");
		};

		window.addEventListener("storage", onStorage);
		return () => window.removeEventListener("storage", onStorage);
	}, []);

	const handleLogout = () => {
		localStorage.setItem(LOGOUT_BROADCAST_KEY, Date.now().toString());
		logout();
		window.location.assign("/login");
	};

	const lastRunRef = useRef(0);

	const run = useCallback(
		async (from = "unknown") => {
			const token = localStorage.getItem("token");
			if (!token) return;
			if (!isLeader) return;
			if (localStorage.getItem("sessionExpired") === "1") return;

			const now = Date.now();
			if (now - lastRunRef.current < 1500) return; // 1.5s
			lastRunRef.current = now;

			console.log(`🟦[PERMS] refreshPermissions() from=${from}`);
			await refreshPermissions();
		},
		[isLeader],
	);

	useEffect(() => {
		run("mount");

		const onFocus = () => run("focus");

		const onVisibility = () => {
			if (document.visibilityState === "visible") run("visibility");
		};

		window.addEventListener("focus", onFocus);
		document.addEventListener("visibilitychange", onVisibility);

		return () => {
			window.removeEventListener("focus", onFocus);
			document.removeEventListener("visibilitychange", onVisibility);
		};
	}, [run]);

	useEffect(() => {
		const onDenied = (e) => {
			console.log("⛔ [PERMISSION GATE] recibido:", e?.detail);
			setPermMessage(
				e?.detail?.message || "No tienes permisos para acceder a esta sección.",
			);
			setPermDenied(true);
		};

		window.addEventListener("app:permission-denied", onDenied);
		return () => window.removeEventListener("app:permission-denied", onDenied);
	}, []);

	useEffect(() => {
		const _path = location.pathname;
		setPermDenied(false);
		setPermMessage("");
	}, [location.pathname]);

	return (
		<div className="bg-white dark:bg-slate-900 min-h-screen">
			{expired && <SessionExpiredModal onConfirm={handleLogout} />}
			<aside
				className={`fixed top-0 left-0 h-full bg-blue-600 dark:bg-slate-800 text-white  z-50 overflow-hidden transition-[width] duration-300 ease-in-out`}
				style={{ width: isHovered ? "208px" : "64px" }}
				onMouseEnter={() => setIsHovered(true)}
				onMouseLeave={() => setIsHovered(false)}
			>
				<div className="flex flex-col p-4 text-white space-y-2 transition-all duration-500 ease-in-out">
					<NavLink
						to="/inicio"
						className="flex items-center  p-2 mt-6 hover:bg-blue-700 dark:hover:bg-slate-700 rounded transition-all duration-500 ease-in-out"
					>
						<IconHome label={isHovered ? "Inicio" : ""} />
					</NavLink>

					<AdminPanel isExpanded={isHovered} />
					<OperacionesAdminWrapper isExpanded={isHovered} />

					<button
						type="button"
						onClick={handleLogout}
						className="flex items-center p-1 mt-1 hover:bg-blue-700 dark:hover:bg-slate-700 rounded transition-all duration-500 ease-in-out"
					>
						<IconLogout label={isHovered ? "Cerrar Sesión" : ""} />
					</button>
				</div>
			</aside>

			<PageTitleProvider>
				<main className=" ml-16 p-4 transition-all duration-300 relative">
					<div
						className="fixed top-0 left-16 right-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700
							shadow-sm px-4 py-3 flex items-center justify-between gap-4 backdrop-blur-md transition-colors"
					>
						<RoutePageTitleManager />
						<PageHeader />
						<SearchGlobal />
						<Profile />
					</div>
					<div className="h-[72px]"></div>
					{permDenied ? <PermissionDenied /> : <Outlet />}
				</main>
			</PageTitleProvider>
		</div>
	);
}
