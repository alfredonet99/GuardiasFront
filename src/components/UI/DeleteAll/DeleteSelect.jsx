export default function BtnDeleteSelectAll({
    onClick,
    disabled = false,
    loading = false,
    active = false,
    count = 0,
    label = "Eliminar clientes",
    selectingLabel = "Selecciona clientes",
}) {
    let buttonText = label;

    if (loading) {
        buttonText = "Eliminando...";
    } else if (active && count === 0) {
        buttonText = selectingLabel;
    }

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled || loading}
            className={`flex items-center gap-2 rounded-md px-4 py-1.5 text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${active ? "bg-red-800 hover:bg-red-900" : "bg-red-600 hover:bg-red-700"
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