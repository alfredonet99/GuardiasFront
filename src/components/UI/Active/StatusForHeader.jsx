export default function StatusListForHeader({
	value = "",
	onChange,
	name = "status",
	id = "status",
	disabled = false,
}) {
	return (
		<div className="flex px-1 items-center h-[40px] w-[200px]  border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 focus-within:ring-2 focus-within:ring-blue-600">
			<span className="px-3 mt-0.5 text-[16px] text-slate-600 dark:text-slate-300 whitespace-nowrap">
				{" "}
				Estatus:{" "}
			</span>

			<select
				id={id}
				name={name}
				value={value}
				disabled={disabled}
				onChange={(e) => onChange?.(e.target.value, e)}
				className="h-full w-full px-1 bg-transparent outline-none pr-3 text-slate-700 dark:text-slate-200"
			>
				<option
					className="bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100"
					value=""
				>
					Todos
				</option>
				<option
					className="bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100"
					value="1"
				>
					Activos
				</option>
				<option
					className="bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100"
					value="2"
				>
					Concluidos
				</option>
				<option
					className="bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100"
					value="3"
				>
					Anulados
				</option>
			</select>
		</div>
	);
}
