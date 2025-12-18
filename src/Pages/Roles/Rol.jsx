import { useState, useEffect, useMemo } from "react";
import {  FiSearch } from "react-icons/fi";
import { privateInstance } from "../../api/axios";
import { NavLink } from "react-router-dom";
import DeleteConfirm from "../../components/UI/ConfirmBtn/DeleteConfirm";
import useGlobalDelete from "../../hooks/Confirm/DeleteG";
import SearchInputLong from "../../components/UI/Search/SearchLong";
import { IconCreate, IconEdit, IconShow, IconDelete } from "../../components/icons/Crud/exportCrud";
import { useAuthMe } from "../../hooks/Auth/AuthMe";

export default function RolesPage() {

  const [search, setSearch] = useState("");
  const [roles, setRoles] = useState([]);
  const { modal, openModal, closeModal, confirm } = useGlobalDelete();
  const { isAdmin, loading: loadingMe } = useAuthMe();

  useEffect(() => {
    const loadRoles = async () => {
      try {
        const res = await privateInstance.get("/roles");
        setRoles(res.data);
      } catch (error) {
        console.error("Error al cargar roles:", error);
      }
    };
    loadRoles();
  }, []);


  const handleDelete = async (role) => {
    if (role.name === "Administrador") { return; }
    try {
      await privateInstance.delete(`/roles/delete/${role.id}`);
      setRoles((prev) => prev.filter((r) => r.id !== role.id));
    } catch (error) {
      console.error("Error al eliminar rol:", error);
    }
  };

  const filteredRoles = useMemo(() => {
    return roles.filter((r) =>
      r.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [roles, search]);

  return (
    <div className="min-h-screen w-full bg-slate-100 dark:bg-slate-950 px-6 py-6 text-slate-800 dark:text-slate-200">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2 px-2 text-slate-800 dark:text-slate-100"> Gestión de Roles </h1>
        {!loadingMe && isAdmin && <IconCreate to="/admin/roles/crear" label="Rol" />}
      </header>

      <section className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
          <div className="relative w-full md:max-w-sm">
            <SearchInputLong value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar rol..."/>
          </div>

          <span className="text-xs text-slate-500 dark:text-slate-400">Roles: {filteredRoles.length} </span>
        </div>

        <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left">Nombre</th>
                <th className="px-4 py-3 text-center w-[150px]">Acciones</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredRoles.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-slate-500 dark:text-slate-400"> Cargando Roles... </td>
                </tr>
              ) : (
                filteredRoles.map((role) => (
                  <tr key={role.id} className="hover:bg-slate-100 dark:hover:bg-slate-800/70 transition">

                    <td className="px-4 py-3 font-semibold">{role.name}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <IconEdit to={`/admin/roles/${role.id}/editar`}/>
                        <IconShow to={`/admin/roles/${role.id}/ver`} />
                         {!loadingMe && isAdmin && (
                            <IconDelete onClick={() => openModal({ message: `¿Quieres eliminar el rol "${role.name}"?, \nEsta acción no se podra revertir`, onConfirm: () => handleDelete(role)})} />
                         )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
      <DeleteConfirm isOpen={modal.isOpen} message={modal.message} onCancel={closeModal} onConfirm={confirm} />
    </div>
  );
}
