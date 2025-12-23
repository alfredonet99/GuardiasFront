import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { usePasswordToggle } from "../../hooks/passwordVisible";
import { useFormValidation } from "../../hooks/useFormValidation";
import { loginApi } from "../../services/auth";

export default function Login() {
	const { values, errors, handleChange, handleBlur, validateForm } =
		useFormValidation({ email: "", password: "" });
	const [PasswordInputType, ToggleIcon] = usePasswordToggle(values.password);

	const [serverError, setServerError] = useState("");
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (localStorage.getItem("inactive_account") === "1") {
			setServerError("Tu usuario está desactivado. Contacta a Sistemas.");
			localStorage.removeItem("inactive_account");
		}
	}, []);

	useEffect(() => {
		if (serverError) {
			const timer = setTimeout(() => {
				setServerError("");
			}, 3000);

			return () => clearTimeout(timer);
		}
	}, [serverError]);

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!validateForm()) return;

		try {
			setLoading(true);
			setServerError("");
			await loginApi(values);
			window.location.assign("/inicio");
		} catch (err) {
			const status = err?.response?.status;
			const msg = err?.response?.data?.message ?? "No se pudo iniciar sesión";
			if (status === 403) {
				setServerError(msg); // "Tu usuario está desactivado..."
				return;
			}
			setServerError(msg);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="flex h-screen flex-col md:flex-row bg-gray-100 dark:bg-gray-900 transition-colors">
			<div className="hidden md:flex w-1/2 bg-blue-600 dark:bg-blue-800 items-center justify-center text-white transition-colors">
				<h1 className="text-3xl font-bold">Bienvenido</h1>
			</div>

			<div className="flex flex-1 items-center justify-center p-6">
				<form
					className="bg-slate-50 dark:bg-gray-800 p-6 sm:p-8 rounded shadow-lg w-full max-w-sm transition-colors"
					onSubmit={handleSubmit}
					noValidate
				>
					<h2 className="text-2xl font-semibold mb-6 text-center text-gray-900 dark:text-gray-100">
						Iniciar Sesión
					</h2>
					<div className="mb-4">
						<input
							name="email"
							type="email"
							value={values.email}
							onBlur={handleBlur}
							onChange={handleChange}
							placeholder="Correo"
							className={`w-full p-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-300 transition-colors 
                            ${errors.email ? "border-red-500" : "border-gray-300"}`}
						/>
						{errors.email && (
							<p className="mt-2 p-2 text-sm text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded text-center">
								{errors.email}
							</p>
						)}
					</div>
					<div className="mb-4">
						<div className="relative">
							<input
								id="password"
								name="password"
								type={PasswordInputType}
								onBlur={handleBlur}
								placeholder="Contraseña"
								value={values.password}
								onChange={handleChange}
								className={`w-full p-2 border rounded pr-10 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-300 transition-colors 
                                ${errors.password ? "border-red-500" : "border-gray-300"}`}
							/>
							<div className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer dark:text-gray-300">
								{ToggleIcon}
							</div>
						</div>
						{errors.password && (
							<p className="mt-2 p-2 text-sm text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded text-center">
								{errors.password}
							</p>
						)}
					</div>
					{serverError && (
						<p className="mb-4 p-2 text-sm text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded text-center whitespace-pre-line transition-colors">
							{serverError}
						</p>
					)}
					<button
						type="submit"
						className="w-full bg-blue-600 dark:bg-blue-700 text-white py-2 rounded hover:bg-blue-700 dark:hover:bg-blue-600 transition disabled:bg-blue-400 dark:disabled:bg-blue-500"
						disabled={loading}
					>
						{loading ? "Iniciando Sesion..." : "Entrar"}
					</button>

					<div className="mt-2 text-center">
						<NavLink
							to="/restaurar-password"
							className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
						>
							¿Olvidaste tu contraseña?
						</NavLink>
					</div>

					<div className="flex items-center gap-2">
						<hr className="flex-1 border-gray-300 dark:border-gray-700" />
						<span className="text-gray-500 dark:text-gray-300 text-sm">o</span>
						<hr className="flex-1 border-gray-300 dark:border-gray-700" />
					</div>

					<div className="flex gap-2">
						<a
							href="/auth/google"
							className="flex-1 flex items-center justify-center gap-2 border py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100 transition-colors"
						>
							<img
								src="https://www.svgrepo.com/show/355037/google.svg"
								alt="Google"
								className="w-5 h-5"
							/>
							Google
						</a>

						<a
							href="/auth/outlook"
							className="flex-1 flex items-center justify-center gap-2 border py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100 transition-colors"
						>
							<img
								src="https://www.svgrepo.com/show/452062/microsoft.svg"
								alt="Microsoft"
								className="w-5 h-5"
							/>
							Microsoft
						</a>
					</div>
				</form>
			</div>
		</div>
	);
}
