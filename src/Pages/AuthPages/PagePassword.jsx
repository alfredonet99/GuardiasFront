import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { publicInstance } from "../../api/axios";

export default function PasswordPage() {
	const [params] = useSearchParams();
	const token = params.get("token");
	const email = params.get("email");

	const navigate = useNavigate();

	const [password, setPassword] = useState("");
	const [passwordConfirm, setPasswordConfirm] = useState("");

	const [loading, setLoading] = useState(false);
	const [validating, setValidating] = useState(true);
	const [isValidUrl, setIsValidUrl] = useState(false);

	const [message, setMessage] = useState("");
	const [error, setError] = useState("");

	useEffect(() => {
		let alive = true;

		async function validate() {
			try {
				const res = await publicInstance.get("/password/validate", {
					params: { token, email },
				});

				if (!alive) return;

				if (res.data.valid === true) {
					setIsValidUrl(true);
				} else {
					navigate("/error-400", { replace: true });
				}
			} catch {
				if (!alive) return;
				navigate("/error-400", { replace: true });
			} finally {
				if (alive) setValidating(false);
			}
		}

		if (!token || !email) {
			navigate("/error-400", { replace: true });
			setValidating(false);
			return;
		}

		validate();

		return () => {
			alive = false;
		};
	}, [token, email, navigate]);

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError("");
		setMessage("");

		if (password !== passwordConfirm) {
			setError("Las contraseñas no coinciden.");
			return;
		}

		setLoading(true);

		try {
			const res = await publicInstance.post("/password/reset", {
				email,
				token,
				password,
				password_confirmation: passwordConfirm,
			});

			setMessage(res.data.message);

			setTimeout(() => navigate("/login"), 2000);
		} catch (err) {
			const backendMsg = err.response?.data?.message;

			if (backendMsg === "El enlace ha expirado, solicita uno nuevo.") {
				navigate("/error-400");
				return;
			}

			setError(backendMsg || "Error al actualizar contraseña.");
		}

		setLoading(false);
	};

	if (validating) {
		return (
			<div className="min-h-screen flex items-center justify-center text-slate-700 dark:text-slate-200">
				{" "}
				Validando enlace…{" "}
			</div>
		);
	}

	if (!isValidUrl) return null;

	return (
		<div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-950 transition-colors px-4">
			<div className="w-full max-w-md bg-white/70 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden backdrop-blur-sm transition-colors">
				<div className="p-8">
					<div className="flex justify-center mb-6">
						<div className="w-14 h-14 flex items-center justify-center rounded-full border border-slate-400 dark:border-slate-500 bg-slate-200/60 dark:bg-slate-800/40 transition">
							<span className="text-3xl text-slate-700 dark:text-slate-300">
								{" "}
								🔑{" "}
							</span>
						</div>
					</div>

					<h2 className="text-center text-xl font-semibold text-slate-800 dark:text-white">
						{" "}
						Restablecer contraseña{" "}
					</h2>
					<p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-400">
						{" "}
						Ingresa tu nueva contraseña para continuar.{" "}
					</p>

					<form onSubmit={handleSubmit} className="mt-6 space-y-4">
						<input
							type="password"
							placeholder="Nueva contraseña"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							className="w-full px-3 py-2 rounded-md bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-400 
                dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600"
						/>

						<input
							type="password"
							placeholder="Confirmar contraseña"
							value={passwordConfirm}
							onChange={(e) => setPasswordConfirm(e.target.value)}
							className="w-full px-3 py-2 rounded-md bg-white dark:bg-slate-800
                border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600"
						/>

						{error && <p className="text-red-500 text-center">{error}</p>}
						{message && <p className="text-green-500 text-center">{message}</p>}

						<button
							type="submit"
							disabled={loading}
							className="w-full py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm"
						>
							{loading ? "Actualizando..." : "Actualizar contraseña"}
						</button>
					</form>
				</div>
			</div>
		</div>
	);
}
