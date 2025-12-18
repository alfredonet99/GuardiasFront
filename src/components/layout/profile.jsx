import { useState, useEffect, useRef } from "react";
import { getUser,logout } from "../../api/auth";
import { NavLink } from "react-router-dom";
import { useUser } from "../context/userContext";

export default function Profile() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const { user } = useUser();

  const avatar = user?.avatar
    ? user.avatar
    : `https://ui-avatars.com/api/?background=0D8ABC&color=fff&name=${encodeURIComponent(
        user?.name || "User"
      )}`;

  const role = user?.roles?.[0]?.name || user?.role || "Sin Rol";    

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div ref={menuRef} className="relative flex justify-end items-center">
      <button type="button" onClick={() => setOpen(!open)} className="flex rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-800 transition"
            id="user-menu-button" aria-expanded={open}>
        <span className="sr-only">Open user menu</span>
        <img src={avatar} className="w-10 h-10 rounded-full ring-2 ring-white dark:ring-slate-900" alt="user profile"/>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 min-w-60 max-w-xs z-50 bg-white divide-y divide-gray-100 rounded-lg shadow-sm dark:bg-gray-700 dark:divide-gray-600">
          <div className="px-4 py-3">
            <span className="block text-sm text-gray-900 dark:text-white">{user?.name}</span>
            <span className="block text-sm text-gray-500 truncate dark:text-gray-400">{user.email}</span>
             <span className="block text-xs font-medium text-gray-500 mt-1 dark:text-gray-400">
              <strong>{role}</strong>
            </span>
          </div>
          <ul className="py-2">
            <li>
              <NavLink to="/profile/editar" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200 dark:hover:text-white">
                Editar Pefil
              </NavLink>
            </li>      
            <li>
              <button onClick={logout} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200 dark:hover:text-white">
                Cerrar sesión
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
