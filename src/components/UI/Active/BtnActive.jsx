import useCrudPermission from "../../../hooks/Auth/CrudPermissions";

export default function ToggleUserStatusButton({ active, onToggle, label, loading = false, className = "",}) {
   const { canDo } = useCrudPermission();
  const canEdit = canDo("edit");
  if (!canEdit) return null;

  const base = "px-3 py-1 text-white rounded-lg text-xs disabled:opacity-60 disabled:cursor-not-allowed";

  const variant = active
    ? "bg-slate-500 hover:bg-slate-700"
    : "bg-green-600 hover:bg-green-700";

  return (
    <button type="button" onClick={onToggle} disabled={loading} className={`${base} ${variant} ${className}`}>
      {loading ? "Procesando..." : label}
    </button>
  );
}
