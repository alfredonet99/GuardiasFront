import { NavLink, Outlet } from 'react-router-dom';
import { IconHome, AdminPanel,IconLogout, SearchGlobal } from '../icons/exportIcon';
import { useState,useEffect, useCallback, useRef } from 'react';
import { logout } from '../../api/auth';
import Profile from './Profile';
import { PageTitleProvider } from '../context/TitlePage';
import PageHeader from './PageHeader';
import { useAuthCheck } from '../../hooks/Auth/AuthCheck';
import SessionExpiredModal from '../Modals/Sesion/FinishSesion';
import { useActivityDebug } from '../../hooks/Auth/RenovationToken';
import { useTabsDebug } from '../../hooks/Auth/TabsDuplicate';
import { useTokenRefresh } from '../../hooks/Auth/RefreshTok';
import RoutePageTitleManager from './RouteLayout';
import { refreshPermissions } from '../../services/auth';
import { useTabLeader } from '../../hooks/Auth/TabLeader';
import { LOGOUT_BROADCAST_KEY } from '../../services/auth';

export default function MainLayout() {
  const [isHovered, setIsHovered] = useState(false);

  const { isLeader } = useTabLeader(true);

  useActivityDebug();
  useTabsDebug();

  const { expired } = useAuthCheck({ isLeader });
  useTokenRefresh({ isLeader });

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key !== LOGOUT_BROADCAST_KEY) return;

      // limpio flags para que NO aparezca modal al recargar
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("permissions");
      localStorage.removeItem("token_expires_at");
      localStorage.removeItem("last_activity");
      localStorage.removeItem("activity_seen");

      localStorage.removeItem("sessionExpired");
      localStorage.removeItem("expired_at");
      localStorage.removeItem("session_reason");
      localStorage.removeItem("inactive_account");
      localStorage.removeItem("session_expired"); // compat vieja

      window.location.assign("/login");
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // ✅ logout sincronizado
  const handleLogout = () => {
    localStorage.setItem(LOGOUT_BROADCAST_KEY, Date.now().toString()); // 🔔 avisa a las demás
    logout(); // tu logout actual
    window.location.assign("/login");
  };

  const lastRunRef = useRef(0);

  const run = useCallback(async (from = "unknown") => {
    const token = localStorage.getItem("token");
    if (!token) return;
    if (!isLeader) return;
    if (localStorage.getItem("sessionExpired") === "1") return;

    // ✅ throttle anti doble-disparo (focus + visibility suelen caer juntos)
    const now = Date.now();
    if (now - lastRunRef.current < 1500) return; // 1.5s
    lastRunRef.current = now;

    console.log(`🟦[PERMS] refreshPermissions() from=${from}`);
    await refreshPermissions();
  }, [isLeader]);

  useEffect(() => {
    // 1) al montar
    run("mount");

    // 2) cuando regresa foco
    const onFocus = () => run("focus");

    // 3) cuando vuelve visible (tab)
    const onVisibility = () => {
      if (document.visibilityState === "visible") run("visibility");
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [run]);

  return (
    <div className="bg-white dark:bg-slate-900 min-h-screen">
      {expired && <SessionExpiredModal onConfirm={handleLogout} />}
      <aside className={`fixed top-0 left-0 h-full bg-blue-600 dark:bg-slate-800 text-white  z-50 overflow-hidden transition-[width] duration-300 ease-in-out`}
        style={{ width: isHovered ? '208px' : '64px', }} onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
        <div className="flex flex-col p-4 text-white space-y-2 transition-all duration-500 ease-in-out">
          <NavLink to="/inicio" className="flex items-center  p-2 mt-6 hover:bg-blue-700 dark:hover:bg-slate-700 rounded transition-all duration-500 ease-in-out">
            <IconHome label={isHovered ? 'Inicio' : ''} />
          </NavLink>

          <AdminPanel isExpanded={isHovered}/>
          {/*
            <NavLink to="/cotizador">
                <p>Cotizador</p>
            </NavLink>

            <NavLink to="/trazabilidad">
                <p>Trazabilidad</p>
            </NavLink>

            <NavLink to="/carta_porte">
                <p>Carta Porte</p>
            </NavLink>
          */}

          <button onClick={handleLogout} className="flex items-center p-1 mt-1 hover:bg-blue-700 dark:hover:bg-slate-700 rounded transition-all duration-500 ease-in-out">
            <IconLogout label={isHovered ? 'Cerrar Sesión' : ''} />
          </button>

        </div>
      </aside>

      <PageTitleProvider>
        <main className=" ml-16 p-4 transition-all duration-300 relative">
          <div
    className="
      fixed top-0 left-16 right-0 z-40
      bg-white dark:bg-slate-900
      border-b border-slate-200 dark:border-slate-700
      shadow-sm
      px-4 py-3
      flex items-center justify-between gap-4
      backdrop-blur-md
      transition-colors
    "
  >
    <RoutePageTitleManager />
            <PageHeader />
            <SearchGlobal/>
            <Profile />
          </div>
          <div className="h-[72px]"></div>
          <Outlet />
        </main>
      </PageTitleProvider>
    </div>
  );
}
