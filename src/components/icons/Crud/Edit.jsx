import { FiEdit } from "react-icons/fi";
import { NavLink } from "react-router-dom";
import useCrudPermission from "../../../hooks/Auth/CrudPermissions";

export default function IconEdit({ to }) {
	const { canDo } = useCrudPermission();
	const canEdit = canDo("edit");
	if (!canEdit) return null;
	return (
		<NavLink
			to={to}
			className="flex items-center gap-2 bg-blue-500 text-white text-sm px-2 py-1 rounded-lg shadow hover:bg-blue-800 transition select-none"
		>
			<FiEdit />
			<span>Editar</span>
		</NavLink>
	);
}
