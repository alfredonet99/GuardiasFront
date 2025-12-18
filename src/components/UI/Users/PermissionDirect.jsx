import { useEffect, useMemo, useState } from "react";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";
import { privateInstance } from "../../../api/axios";

/**
 * Carga:
 * - available_permissions (catálogo ya filtrado por backend: NO vienen por rol)
 * - direct_permissions (los que el usuario tiene directos)
 * - role_permissions (solo informativo)
 *
 * Selección:
 * - NO guarda aquí
 * - manda la selección al padre con onChange()
 */
export default function UserPermissionsUI({
  userId,
  showMessage,
  value = [],          // direct perms seleccionados (state del padre)
  onChange,            // setDirectPerms del padre
  disabled = false,    // si no es admin, solo lectura
}) {
  const [loading, setLoading] = useState(true);

  const [catalog, setCatalog] = useState([]);     // available_permissions
  const [rolePerms, setRolePerms] = useState([]); // role_permissions
  const [openModules, setOpenModules] = useState({});

  useEffect(() => {
    if (!userId) return;

    const load = async () => {
      try {
        setLoading(true);

        const { data } = await privateInstance.get(`/users/${userId}/vpermission`);

        const available = Array.isArray(data?.available_permissions)
          ? data.available_permissions
          : [];

        const direct = Array.isArray(data?.direct_permissions)
          ? data.direct_permissions
          : [];

        const roleP = Array.isArray(data?.role_permissions)
          ? data.role_permissions
          : [];

        setCatalog(available);
        setRolePerms(roleP);

        onChange?.(direct);
      } catch (err) {
        console.error("[UserPermissionsUI] load error:", err);
        showMessage?.("No se pudieron cargar permisos del usuario.", "error");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [userId, showMessage, onChange]);

  const grouped = useMemo(() => {
    const groups = {};
    catalog.forEach((perm) => {
      const [module] = (perm?.name || "").split(".");
      if (!module) return;
      if (!groups[module]) groups[module] = [];
      groups[module].push(perm);
    });

    Object.keys(groups).forEach((m) => {
      groups[m] = groups[m].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    });

    return groups;
  }, [catalog]);

  useEffect(() => {
    const initial = {};
    Object.keys(grouped).forEach((m) => (initial[m] = false)); // ✅ cerrados por defecto
    setOpenModules(initial);
  }, [grouped]);

  const toggleModule = (module) =>
    setOpenModules((prev) => ({ ...prev, [module]: !prev[module] }));

  const toggleDirect = (permName) => {
    if (disabled) return;
    const current = Array.isArray(value) ? value : [];
    const next = current.includes(permName)
      ? current.filter((p) => p !== permName)
      : [...current, permName];

    onChange?.(next);
  };

  if (loading) {
    return (
      <div className="mt-6 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 px-4 py-3 text-sm text-slate-500 dark:text-slate-300">
        Cargando permisos...
      </div>
    );
  }

  return (
    <div className={`mt-6 ${disabled ? "opacity-70" : ""}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Permisos directos</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Estos permisos se guardan junto con “Guardar cambios”.
          </p>

          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            <b>Del rol:</b> {rolePerms.length} &nbsp;|&nbsp; <b>Directos seleccionados:</b>{" "}
            {(value || []).length} &nbsp;|&nbsp; <b>Disponibles:</b> {catalog.length}
          </p>
        </div>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <div className="mt-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 px-4 py-3 text-sm text-slate-500 dark:text-slate-300">
          No hay permisos disponibles para mostrar.
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {Object.entries(grouped).map(([module, perms]) => {
            const isOpen = openModules[module] ?? false; // ✅ por defecto cerrado

            return (
              <div
                key={module}
                className="border border-slate-200 dark:border-slate-800 rounded-lg p-4 bg-slate-50/60 dark:bg-slate-900/60"
              >
                <button
                  type="button"
                  onClick={() => toggleModule(module)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-md border border-slate-300/70 dark:border-slate-700
                  bg-slate-200 text-slate-800 dark:bg-slate-900/80 dark:text-slate-50 text-left font-semibold text-sm md:text-base capitalize hover:bg-slate-300 dark:hover:bg-slate-800/80 transition"
                >
                  <span>
                    {module}{" "}
                    <span className="text-xs font-normal opacity-70">({perms.length})</span>
                  </span>
                  {isOpen ? <FiChevronUp className="text-sm" /> : <FiChevronDown className="text-sm" />}
                </button>

                {isOpen && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                    {perms.map((perm) => (
                      <label
                        key={perm.id}
                        className={`flex items-start gap-2 bg-white dark:bg-slate-800 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700
                        ${disabled ? "cursor-not-allowed" : "cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700"}`}
                      >
                        <input
                          type="checkbox"
                          checked={(value || []).includes(perm.name)}
                          disabled={disabled}
                          onChange={() => toggleDirect(perm.name)}
                        />

                        <div>
                          <div className="text-sm font-semibold">{perm.name}</div>
                          {!!perm.description && (
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              {perm.description}
                            </div>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
