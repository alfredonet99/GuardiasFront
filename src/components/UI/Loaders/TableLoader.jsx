export default function TableLoadingMessage({
	title = "Cargando datos",
	subtitle = "Optimizando búsqueda y aplicando filtros…",
	minHeight = "220px",
}) {
	return (
		<div
			className="p-6 text-center text-slate-500 dark:text-slate-400"
			style={{ minHeight }}
		>
			<div className="flex items-center justify-center gap-2">
				<span className="inline-block w-4 h-4 rounded-full border-2 border-slate-400 border-t-transparent animate-spin" />
				<span className="font-medium">
					{title}{" "}
					<span className="inline-flex items-center">
						<span className="ml-2 animate-bounce">🚀</span>
						<span className="mx-1 animate-pulse">✨</span>
						<span className="animate-bounce [animation-delay:140ms]">📡</span>
					</span>
				</span>
			</div>

			<div className="mt-3 mx-auto w-56 max-w-[70vw] h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
				<div className="h-full w-1/3 bg-slate-400/70 dark:bg-slate-500/60 animate-[loaderbar_1.1s_ease-in-out_infinite]" />
			</div>

			{subtitle ? (
				<div className="mt-2 text-xs text-slate-400 dark:text-slate-500">
					{subtitle}
				</div>
			) : null}

			{/* keyframes para la bar (solo afecta a este componente) */}
			<style>{`
        @keyframes loaderbar {
          0% { transform: translateX(-120%); }
          50% { transform: translateX(120%); }
          100% { transform: translateX(320%); }
        }
      `}</style>
		</div>
	);
}
