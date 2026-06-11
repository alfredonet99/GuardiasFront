import { FiEye } from "react-icons/fi";
import { NavLink } from "react-router-dom";
import useCrudPermission from "../../../hooks/Auth/CrudPermissions";
export default function IconShow({ to }) {
	const { canDo } = useCrudPermission();
	const canEdit = canDo("show");
	if (!canEdit) return null;
	return (
		<NavLink
			to={to}
			className="flex items-center gap-2 bg-amber-500 text-white text-sm px-2 py-1 rounded-lg shadow hover:bg-amber-700 transition select-none"
		>
			<FiEye />
			<span>Ver</span>
		</NavLink>
	);
}
