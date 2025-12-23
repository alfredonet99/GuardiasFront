export default function Paginator({ page, lastPage, setPage }) {
	if (!lastPage || lastPage <= 1) return null;

	const go = (p) => {
		if (p >= 1 && p <= lastPage) setPage(p);
	};

	const window = 4;
	const pages = [];

	const start = Math.max(1, page - window);
	const end = Math.min(lastPage, page + window);

	for (let i = start; i <= end; i++) {
		pages.push(i);
	}

	return (
		<div className="flex justify-end py-4 gap-2 items-center select-none pr-5">
			<button
				type="button"
				onClick={() => go(page - 1)}
				disabled={page === 1}
				className="px-3 py-1 border rounded-md bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-none"
			>
				Anterior
			</button>

			{start > 1 && (
				<>
					<button
						type="button"
						onClick={() => go(1)}
						className="px-3 py-1 border rounded-md bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700"
					>
						{" "}
						1{" "}
					</button>

					{start > 2 && (
						<span className="px-2 text-slate-500 dark:text-slate-400">…</span>
					)}
				</>
			)}

			{pages.map((p) => (
				<button
					type="button"
					key={p}
					onClick={() => go(p)}
					className={`px-3 py-1 border rounded-md ${p === page ? "bg-blue-600 text-white border-blue-600" : "bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700"}`}
				>
					{p}
				</button>
			))}

			{end < lastPage && (
				<>
					{end < lastPage - 1 && (
						<span className="px-2 text-slate-500 dark:text-slate-400">…</span>
					)}

					<button
						type="button"
						onClick={() => go(lastPage)}
						className="px-3 py-1 border rounded-md bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700"
					>
						{lastPage}
					</button>
				</>
			)}

			<button
				type="button"
				onClick={() => go(page + 1)}
				disabled={page === lastPage}
				className="px-3 py-1 border rounded-md bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-none"
			>
				Siguiente
			</button>
		</div>
	);
}
