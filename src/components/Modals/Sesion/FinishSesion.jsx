import { useCallback, useEffect, useMemo, useState } from "react";
export default function SessionExpiredModal({ onConfirm }) {
	const TOTAL_MS = 60000;

	const reason = localStorage.getItem("session_reason");
	const isInactive = reason === "inactive";

	const getSecondsLeft = useCallback(() => {
		const expiredAt = parseInt(localStorage.getItem("expired_at") || "0", 10);
		if (!expiredAt) return 0;

		const remainingMs = Math.max(TOTAL_MS - (Date.now() - expiredAt), 0);
		return Math.ceil(remainingMs / 1000);
	}, []);

	const [counter, setCounter] = useState(() => getSecondsLeft());

	const title = useMemo(() => {
		return isInactive ? "Tu cuenta está desactivada" : "Tu sesión ha expirado";
	}, [isInactive]);

	const description = useMemo(() => {
		return isInactive
			? "Tu usuario fue desactivado por un administrador.\nPor seguridad, se cerró tu sesión."
			: "Por seguridad, tu sesión se ha cerrado.";
	}, [isInactive]);

	useEffect(() => {
		// actualiza inmediato al montar
		const first = getSecondsLeft();
		setCounter(first);

		if (first <= 0) {
			onConfirm();
			return;
		}

		const interval = setInterval(() => {
			const s = getSecondsLeft();
			setCounter(s);

			if (s <= 0) {
				clearInterval(interval);
				onConfirm();
			}
		}, 500);

		return () => clearInterval(interval);
	}, [getSecondsLeft, onConfirm]);

	return (
		<div className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm flex justify-center items-center animate-fadeIn">
			<div className="bg-white dark:bg-slate-900 shadow-2xl backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl p-8 w-[90%] max-w-[420px] animate-scaleIn">
				<div className="flex justify-center mb-4">
					<div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							aria-hidden="true"
							focusable="false"
							className="w-10 h-10 text-red-600 dark:text-red-400"
							fill="none"
							viewBox="0 0 24 24"
							strokeWidth="1.5"
							stroke="currentColor"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M12 9v4m0 4h.01m7.938-2a9 9 0 10-15.876 0 9 9 0 0015.876 0z"
							/>
						</svg>
					</div>
				</div>

				<h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2 text-center">
					{title}
				</h2>

				<p className="text-gray-600 dark:text-gray-300 text-center mb-6 whitespace-pre-line">
					{description}
					<br />
					Serás redirigido en{" "}
					<b className="text-red-600 dark:text-red-400">{counter}s</b>.
				</p>

				<button
					type="button"
					onClick={onConfirm}
					className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md transition-all duration-200"
				>
					Ir al login ahora
				</button>
			</div>

			<style>
				{`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes scaleIn {
            from { transform: scale(0.85); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
          .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
          .animate-scaleIn { animation: scaleIn 0.3s ease-out; }
        `}
			</style>
		</div>
	);
}
