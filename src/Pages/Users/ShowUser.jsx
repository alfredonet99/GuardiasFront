// Pages/Users/ShowUser.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { privateInstance } from "../../api/axios";
import BackButton from "../../components/UI/ConfirmBtn/ExitConfirmShow";
import IconEditShow from "../../components/icons/Crud/EditShow";
import FormLoader from "../../components/UI/Loaders/FormLoader";
import { useAuthMe } from "../../hooks/Auth/AuthMe";
import PermissionDenied from "../Errors/PermissionDenied";

function getInitials(name = "") {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "U";
  const first = parts[0]?.[0] || "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] || "") : "";
  return (first + last).toUpperCase();
}

export default function ShowUser() {
  const { id } = useParams();
  const navigate = useNavigate(); 

  const { isAdmin, loading: loadingMe } = useAuthMe(); 
  const [targetIsAdmin, setTargetIsAdmin] = useState(null);
  const [denied, setDenied] = useState(false); 

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [roles, setRoles] = useState([]);
  const [directPerms, setDirectPerms] = useState([]);
  const [area, setArea] = useState(null);

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      try {
        setLoading(true);

        const { data } = await privateInstance.get(`/users/${id}/ver`);
        console.log("🟦[SHOWUSER] response:", data);

        setUser(data?.user ?? null);
        setArea(data?.area ?? null);

        const r =
          Array.isArray(data?.roles) ? data.roles :
          Array.isArray(data?.user?.roles) ? data.user.roles :
          [];
        setRoles(r);

        // ✅ detectar si el TARGET es admin
        const roleNames = (r || [])
          .map((x) => (typeof x === "string" ? x : x?.name))
          .filter(Boolean);

        setTargetIsAdmin(roleNames.includes("Administrador"));

        const dp =
          Array.isArray(data?.direct_permissions) ? data.direct_permissions :
          Array.isArray(data?.user?.direct_permissions) ? data.user.direct_permissions :
          [];
        setDirectPerms(dp);
      } catch (e) {
        const status = e?.response?.status;
        if (status === 403) {
          setDenied(true);
          return;
        }
        console.error("[ShowUser] load error:", e);
        setUser(null);
        setRoles([]);
        setDirectPerms([]);
        setArea(null);
        setTargetIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);


  const roleText = useMemo(() => {
    if (!Array.isArray(roles)) return "";
    return roles
      .map((x) => (typeof x === "string" ? x : x?.name))
      .filter(Boolean)
      .join(", ");
  }, [roles]);

  const activoVal = user?.activo ?? user?.Activo;

  const groupedDirect = useMemo(() => {
    const groups = {};
    (directPerms || []).forEach((p) => {
      const [mod] = String(p).split(".");
      const key = mod || "otros";
      (groups[key] ||= []).push(p);
    });

    Object.keys(groups).forEach((k) => {
      groups[k] = groups[k].sort((a, b) => String(a).localeCompare(String(b)));
    });

    return groups;
  }, [directPerms]);

  const avatarUrl = user?.avatar || null;

  if (denied) return <PermissionDenied />;
  if (loadingMe || loading) return <FormLoader />;

  return (
    <div className="min-h-screen w-full px-6 py-6 bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-200">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold mx-1">Detalle de Usuario</h1>

        <div className="flex items-center gap-2">
          <IconEditShow to={`/admin/users/${user.id}/editar`} />
          <BackButton to="/admin/users" />
        </div>
      </header>

      <section className="bg-white dark:bg-slate-900 rounded-xl shadow border border-slate-200 dark:border-slate-800 p-6 max-w-3xl mx-auto">
        <div className="space-y-5">
          <div className="flex flex-col items-center text-center gap-3 pb-5 border-b border-slate-200 dark:border-slate-800">
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full border-2 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <span className="text-3xl sm:text-4xl font-bold text-slate-600 dark:text-slate-200">
                  {getInitials(user?.name || "")}
                </span>
              )}
            </div>
          </div>


          <div>
            <label className="font-semibold text-sm">Nombre</label>
            <div className="mt-1 w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {user?.name || "—"}
            </div>
          </div>

          <div>
            <label className="font-semibold text-sm">Correo</label>
            <div className="mt-1 w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {user?.email || "—"}
            </div>
          </div>

          <div>
            <label className="font-semibold text-sm">Rol</label>
            <div className="mt-1 w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {roleText || "Sin Rol"}
            </div>
          </div>

           <div>
            <label className="font-semibold text-sm">Área</label>
            <div className="mt-1 w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {area?.name ?? "Administrador"}
            </div>
          </div>

          <div>
            <label className="font-semibold text-sm">Estatus</label>
            <div
              className={`mt-1 w-full px-4 py-2 rounded-lg border ${
                Number(activoVal) === 1
                  ? "border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300"
                  : "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300"
              }`}
            >
              {Number(activoVal) === 1 ? "Activo" : "Inactivo"}
            </div>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-800 pt-5">
            <label className="font-semibold text-sm">Permisos directos</label>

            {!directPerms?.length ? (
              <div className="mt-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 px-4 py-3 text-sm text-slate-500 dark:text-slate-300">
                Este usuario no tiene permisos directos.
              </div>
            ) : (
              <div className="mt-3 space-y-3">
                {Object.entries(groupedDirect).map(([module, perms]) => (
                  <div
                    key={module}
                    className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 px-4 py-3"
                  >
                    <div className="text-xs font-semibold uppercase text-slate-600 dark:text-slate-300">
                      {module} <span className="opacity-70">({perms.length})</span>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-2">
                      {perms.map((p) => (
                        <span
                          key={p}
                          className="px-3 py-1 rounded-full text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </section>
    </div>
  );
}
