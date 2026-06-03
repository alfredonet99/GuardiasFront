export default function BtnCancelSelectAll({
	onClick,
	disabled = false,
	label = "Cancelar",
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			disabled={disabled}
			className="flex items-center gap-2 rounded-md bg-slate-600 px-4 py-2 text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
		>
			<span>{label}</span>
		</button>
	);
}
