import { FiTrash } from "react-icons/fi";
import useCrudPermission from "../../../hooks/Auth/CrudPermissions";

export default function IconDelete({ onClick }) {
	const { canDo } = useCrudPermission();
	const canDelete = canDo("delete");
	if (!canDelete) return null;
	return (
		<button
			type="button"
			onClick={onClick}
			className="flex items-center gap-2 bg-red-600 text-white text-sm px-2 py-1 rounded-lg shadow hover:bg-red-800 transition select-none"
		>
			<FiTrash />
			<span>Eliminar</span>
		</button>
	);
}
