import { Navigate, Route, Routes } from "react-router-dom";
import MainLayout from "../components/layout/Layout";
import RouteGuard from "../helpers/RouteGuard";
import routeConfig from "./RouterConfig";

const pages = import.meta.glob("../Pages/**/*.jsx", { eager: true });

export default function MainRoutes() {
	const token = localStorage.getItem("token");
	const sessionExpired = localStorage.getItem("sessionExpired") === "1";
	const expStr = localStorage.getItem("token_expires_at");
	const tokenExpiredByTime = expStr
		? Date.now() >= parseInt(expStr, 10)
		: false;
	const hasValidToken = !!token && !sessionExpired && !tokenExpiredByTime;

	const LoginPage = Object.entries(pages).find(([path]) =>
		path.includes("Login.jsx"),
	)?.[1].default;

	const RecoverPasswordPage = Object.entries(pages).find(([path]) =>
		path.includes("RestorePass.jsx"),
	)?.[1].default;

	const PasswordPage = Object.entries(pages).find(([path]) =>
		path.includes("PagePassword.jsx"),
	)?.[1].default;

	const ExpiredToken = Object.entries(pages).find(([path]) =>
		path.includes("ExpiredToken.jsx"),
	)?.[1].default;

	return (
		<Routes>
			<Route
				path="/login"
				element={
					hasValidToken ? <Navigate to="/inicio" replace /> : <LoginPage />
				}
			/>
			<Route path="/restaurar-password" element={<RecoverPasswordPage />} />
			<Route path="/confirm-pass" element={<PasswordPage />} />
			<Route path="/error-400" element={<ExpiredToken />} />
			<Route
				path="/"
				element={
					hasValidToken ? <Navigate to="/inicio" replace /> : <LoginPage />
				}
			/>

			<Route
				element={
					hasValidToken ? <MainLayout /> : <Navigate to="/login" replace />
				}
			>
				{routeConfig.map(({ path, component, module, permissions }) => {
					const PageComponent = Object.entries(pages).find(([p]) =>
						p.endsWith(`/${component}.jsx`),
					)?.[1].default;

					if (!PageComponent) return null;

					return (
						<Route
							key={path}
							path={path}
							element={
								<RouteGuard module={module} required={permissions}>
									<PageComponent />
								</RouteGuard>
							}
						/>
					);
				})}
			</Route>
		</Routes>
	);
}
