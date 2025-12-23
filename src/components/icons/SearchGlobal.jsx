export default function SearchGlobal() {
	return (
		<div className="hidden md:flex flex-1 max-w-xl mx-4 relative">
			<input
				type="text"
				placeholder="Buscar..."
				className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800
					text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 rounded-lg shadow-sm 
					focus:ring-2 focus:ring-blue-600 focus:outline-none transition-colors"
			/>

			<svg
				aria-hidden="true"
				className=" absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500  transition-colors"
				width="20"
				height="20"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				viewBox="0 0 24 24"
			>
				<path d="M21 21l-4.35-4.35m1.35-5.15a7 7 0 11-14 0 7 7 0 0114 0z" />
			</svg>
		</div>
	);
}
