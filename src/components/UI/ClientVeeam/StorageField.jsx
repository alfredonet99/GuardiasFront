export default function StorageJobsFields({
	storageValue = "",
	onStorageChange = () => {},
	unitValue = "GB",
	onUnitChange = () => {},
	jobsValue = 0,
	onJobsChange = () => {},
}) {
	const handleJobsChange = (raw) => {
		if (raw === "") {
			onJobsChange(0);
			return;
		}

		let n = Number(raw);
		if (Number.isNaN(n)) n = 0;

		if (n < 0) n = 0;
		if (n > 300) n = 300;

		onJobsChange(n);
	};

	return (
		<div className="flex flex-row gap-x-5">
			<div className="w-1/2 flex flex-col">
				<label htmlFor="" className="font-semibold text-sm">
					Almacenamiento
				</label>

				<div className="mt-1 flex items-center w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus-within:ring-2 focus-within:ring-blue-600 overflow-hidden">
					<input
						type="text"
						placeholder="256.5"
						value={storageValue}
						onChange={(e) => onStorageChange(e.target.value)}
						className="w-full px-4 py-2 bg-transparent outline-none"
					/>

					<select
						value={unitValue}
						onChange={(e) => onUnitChange(e.target.value)}
						className="px-4 py-2 bg-transparent outline-none border-l border-slate-300 dark:border-slate-700"
					>
						<option
							value="GB"
							className="bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100"
						>
							GB
						</option>
						<option
							value="TB"
							className="bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100"
						>
							TB
						</option>
					</select>
				</div>
			</div>

			{/* CANTIDAD DE JOBS */}
			<div className="w-1/2 flex flex-col">
				<label htmlFor="" className="font-semibold text-sm">
					Cantidad de Jobs
				</label>
				<input
					type="number"
					min="0"
					max="300"
					// ✅ UI: si es 0, que se vea vacío
					value={jobsValue === 0 ? "" : String(jobsValue)}
					onChange={(e) => handleJobsChange(e.target.value)}
					className="mt-1 w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-600 outline-none"
				/>
			</div>
		</div>
	);
}
