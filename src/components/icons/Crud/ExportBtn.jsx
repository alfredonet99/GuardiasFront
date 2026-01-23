import { FiDownload } from "react-icons/fi";
import { RiFileExcel2Line } from "react-icons/ri";
import { TbCsv } from "react-icons/tb";
import useCrudPermission from "../../../hooks/Auth/CrudPermissions";

export default function IconExport({
	onClick,
	disabled = false,
	label = "Exportar",
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			disabled={disabled}
			title="Exportar (Excel / CSV)"
			className={[
				"flex items-center gap-2",
				"bg-emerald-600 text-white px-4 py-2 rounded-lg shadow",
				"hover:bg-emerald-800 transition select-none",
				"disabled:opacity-50 disabled:cursor-not-allowed",
			].join(" ")}
		>
			{/* Indicador de acción (opcional, pero ayuda) */}
			<FiDownload className="text-[16px] opacity-90" />

			<span>{label}</span>
		</button>
	);
}
