import { FiPlus } from "react-icons/fi";
import { NavLink } from "react-router-dom"
import useCrudPermission from "../../../hooks/Auth/CrudPermissions"

export default function IconCreate({ label, to  }) {
  const { canDo } = useCrudPermission();
  const canEdit = canDo("create");
  if (!canEdit) return null;
  return (
    <NavLink to={to} className="flex items-center gap-2 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg shadow hover:bg-blue-700 active:bg-blue-800 transition select-none">
      <FiPlus />
      <span> Nuevo {label}</span>
    </NavLink>
  );
}
