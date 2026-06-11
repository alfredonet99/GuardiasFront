export default function BtnDisableSelectAll({
	onClick,
	disabled = false,
	loading = false,
	active = false,
	count = 0,
	label = "Deshabilitar clientes",
	selectingLabel = "Selecciona clientes",
}) {
	const buttonText = loading
		? "Deshabilitando..."
		: active && count === 0
			? selectingLabel
			: label;

	return (
		<button
			type="button"
			onClick={onClick}
			disabled={disabled || loading}
			className={`flex items-center gap-2 rounded-md px-4 py-2 text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
				active ? "bg-red-700 hover:bg-red-800" : "bg-red-600 hover:bg-red-700"
			}`}
		>
			<span>{buttonText}</span>

			{active && count > 0 && (
				<span className="ml-1 rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold">
					{count}
				</span>
			)}
		</button>
	);
}
