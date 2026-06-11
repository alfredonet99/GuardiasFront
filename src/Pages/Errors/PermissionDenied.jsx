import { FiArrowLeft, FiLock } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

export default function PermissionDenied() {
	const navigate = useNavigate();

	return (
		<div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 px-6 py-10">
			<div className="text-center mb-6 animate-fadeIn">
				<div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center mx-auto">
					<FiLock className="text-red-600 dark:text-red-400" size={40} />
				</div>

				<h1 className="text-3xl font-bold mt-4">Acceso Restringido</h1>
				<p className="text-slate-600 dark:text-slate-400 mt-2 max-w-none">
					No tienes permisos para acceder a esta sección del sistema. <br />
					Comunícate con un administrador si consideras que esto es un error.
				</p>
			</div>

			<button
				type="button"
				onClick={() => navigate("/inicio", { replace: true })}
				className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 text-white dark:bg-slate-700 dark:hover:bg-slate-600 hover:bg-slate-700 transition"
			>
				<FiArrowLeft />
				Volver
			</button>
		</div>
	);
}
