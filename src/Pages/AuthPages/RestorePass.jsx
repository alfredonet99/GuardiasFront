import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { publicInstance } from "../../api/axios";

export default function RecoverPassword() {
	const [email, setEmail] = useState("");
	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState("");
	const [error, setError] = useState("");
	const [cooldown, setCooldown] = useState(0);

	useEffect(() => {
		const lastSent = localStorage.getItem("recover_sent_at");

		if (lastSent) {
			const diff = 60 - Math.floor((Date.now() - lastSent) / 1000);
			if (diff > 0) setCooldown(diff);
		}
	}, []);

	useEffect(() => {
		if (cooldown <= 0) {
			setError("");
			return;
		}

		const timer = setInterval(() => {
			setCooldown((prev) => {
				const next = prev - 1;

				if (next <= 0) {
					setError("");
					return 0;
				}

				return next;
			});
		}, 1000);

		return () => clearInterval(timer);
	}, [cooldown]);

	const handleSubmit = async (e) => {
		e.preventDefault();
		setMessage("");
		setError("");

		if (!email) {
			setError("Debes ingresar un correo válido.");
			return;
		}

		if (cooldown > 0) {
			setError(
				"Ya hemos enviado una liga a tu correo <br> vuelve a intentarlo en 1 minuto.",
			);
			return;
		}

		setLoading(true);

		try {
			const res = await publicInstance.post("/password/forgot", { email });
			setMessage(res.data.message);
			localStorage.setItem("recover_sent_at", Date.now());
			setCooldown(60);
		} catch (err) {
			setError(err.response?.data?.message || "Ocurrió un error.");
		}

		setLoading(false);
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-950 transition-colors px-4">
			<div className="w-full max-w-md bg-white/70 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden backdrop-blur-sm transition-colors">
				<div className="p-8">
					<div className="flex justify-center mb-6">
						<div className="w-14 h-14 flex items-center justify-center rounded-full border border-slate-400 dark:border-slate-500 bg-slate-200/50 dark:bg-slate-800/40 transition-colors">
							<span className="text-3xl text-slate-600 dark:text-slate-300">
								{" "}
								🔒{" "}
							</span>
						</div>
					</div>

					<h2 className="text-center text-xl font-semibold text-slate-800 dark:text-white">
						{" "}
						¿Tienes problemas para iniciar sesión?{" "}
					</h2>

					<p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-400">
						{" "}
						Ingresa tu correo y te enviaremos un enlace para recuperar tu
						cuenta.{" "}
					</p>

					<form onSubmit={handleSubmit} className="mt-6 space-y-4">
						<input
							type="email"
							placeholder="Correo electrónico"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							className="w-full px-3 py-2 rounded-md bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors"
						/>

						{error && (
							<p className="text-center text-sm text-red-500">{error}</p>
						)}
						{message && (
							<p className="text-center text-sm text-green-500">{message}</p>
						)}

						<button
							type="submit"
							disabled={loading}
							className="w-full py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm transition"
						>
							{loading ? "Enviando..." : "Enviar enlace de recuperación"}
						</button>
					</form>
				</div>

				<div className="bg-slate-200 dark:bg-slate-900 px-6 py-4 text-center border-t border-slate-300 dark:border-slate-800 transition-colors">
					<NavLink
						to="/login"
						className="text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-white transition-colors"
					>
						Volver al inicio de sesión
					</NavLink>
				</div>
			</div>
		</div>
	);
}
