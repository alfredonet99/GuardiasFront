import { NavLink } from "react-router-dom";

export default function ExpiredTokenPage() {
	return (
		<div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-950 transition px-4">
			<div className="w-full max-w-md bg-white/70 dark:bg-slate-900/50  border border-slate-300 dark:border-slate-700 rounded-xl shadow-xl backdrop-blur-sm overflow-hidden">
				<div className="p-8 text-center">
					<div className="flex justify-center mb-6">
						<div className="w-16 h-16 flex items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40 border border-red-300 dark:border-red-700">
							<span className="text-4xl text-red-600 dark:text-red-400">
								⛔
							</span>
						</div>
					</div>

					<h2 className="text-xl font-bold text-slate-800 dark:text-white">
						{" "}
						El enlace ha expirado
					</h2>

					<p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
						Tu solicitud de recuperación de contraseña caducó. <br />
						Por seguridad, debes solicitar un nuevo enlace.
					</p>

					<div className="mt-6 space-y-3">
						<NavLink
							to="/restaurar-password"
							className="block w-full py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium shadow transition"
						>
							Solicitar un nuevo enlace
						</NavLink>

						<NavLink
							to="/login"
							className="block w-full py-2 rounded-md bg-slate-300 hover:bg-slate-400 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-medium transition"
						>
							Volver al inicio de sesión
						</NavLink>
					</div>
				</div>
			</div>
		</div>
	);
}
