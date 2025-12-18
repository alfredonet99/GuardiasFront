import { useEffect, useMemo, useState } from "react";
import PermissionDenied from "../Pages/Errors/PermissionDenied";
import usePageTitleLabel from "../hooks/PageNames";
import { FiLock } from "react-icons/fi";
import { PERMISSIONS_BROADCAST_KEY } from "../services/auth";

// Componente pequeño para poder usar el hook correctamente
function GuardDenied() {
  usePageTitleLabel("ERROR", FiLock);
  return <PermissionDenied />;
}

function readPerms() {
  const raw = localStorage.getItem("permissions");
  try {
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export default function RouteGuard({ children, module, required = [] }) {
  // 1️⃣ Siempre se declara el state
  const [userPermissions, setUserPermissions] = useState(() => readPerms());

  // 2️⃣ Efecto para escuchar cambios (nunca condicional)
  useEffect(() => {
    const sync = () => setUserPermissions(readPerms());

    // misma pestaña
    window.addEventListener("permissions:changed", sync);
    // otras pestañas
    const onStorage = (e) => {
      if (e.key === "permissions" || e.key === PERMISSIONS_BROADCAST_KEY) sync();
    };
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("permissions:changed", sync);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  // 3️⃣ useMemo seguro (no condicional)
  const hasPermission = useMemo(() => {
    if (!module || required.length === 0) return true;

    const actionsToCheck = ["browse", "create", "edit"].filter((a) =>
      required.includes(a)
    );

    if (actionsToCheck.length === 0) return true;

    return actionsToCheck.some((action) =>
      userPermissions.includes(`${module}.${action}`)
    );
  }, [module, required, userPermissions]);

  // 4️⃣ Render siempre consistente
  if (!hasPermission) {
    return <GuardDenied />;
  }

  return children;
}