import { useEffect, useMemo, useState } from "react";
import { IconCreate, IconDelete } from "../../components/icons/Crud/exportCrud";
import SearchInputLong from "../../components/UI/Search/SearchLong";
import ToggleUserStatusButton from "../../components/UI/Active/BtnActive";
import { privateInstance } from "../../api/axios";
import { useAuthMe } from "../../hooks/Auth/AuthMe";
import PermissionDenied from "../Errors/PermissionDenied";
import useOptimisticToggle from "../../hooks/useStatus";

export default function ListAreas() {
    const [areas, setAreas] = useState([]);
    const [search, setSearch] = useState("");
    const { isAdmin, loading: loadingMe } = useAuthMe();


    useEffect(() => {
        if (loadingMe) return;
        if (!isAdmin) return;
        const loadAreas = async () => {
            try {
                const res = await privateInstance.get("/areas");
                setAreas(res.data);   
            }catch(error) {
                console.error("Erro al cargar areas",error)
            }
        };
        loadAreas();
    }, [loadingMe, isAdmin]);

    const { toggle: toggleAreaStatus, loadingId: loadingAreaId } =
    useOptimisticToggle({
      setItems: setAreas,
      client: privateInstance,

      getId: (a) => a.id,
      getBool: (a) => a.activo,
      setBool: (a, next) => ({ ...a, activo: next }),

      buildUrl: (a) => `/areas/${a.id}/status`,
      buildBody: (next) => ({ activo: next }),

      // opcional: si tu API responde { area: { activo: ... } }
      readBoolFromResponse: (res, fallback) =>
        res.data?.area?.activo ?? res.data?.data?.activo ?? fallback,
    });

    const filterdAreas = useMemo(() => {
        return areas.filter((a) =>
            a.name.toLowerCase().includes(search.toLowerCase())
        );
    },[areas,search]);

    

    if (loadingMe) {
        return (
        <div className="p-6 text-center text-slate-500 dark:text-slate-300">
            Cargando...
        </div>
        );
    }


    if (!isAdmin) return <PermissionDenied />;

    return (
        <div className="min-h-screen w-full bg-slate-100 dark:bg-slate-950 px-6 py-6 text-slate-800 dark:text-slate-200">
            <header className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold flex items-center gap-2 px-2"> AREAS DE TRABAJO </h1> 
                <IconCreate to="/admin/areas/create" label="Area" />
            </header>

            <section className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
                    <div className="relative w-full md:max-w-sm">
                        <SearchInputLong value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar permisos..."/>
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400">  </span>
                </div>

                <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800">
                    <table className="min-w-full text-sm">
                        <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase text-xs">
                        <tr>
                            <th className="px-4 py-3 text-left">Nombre</th>
                            <th className="px-4 py-3 text-left">Activo</th>
                            <th className="px-4 py-3 text-center w-[150px]">Acciones</th>
                        </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                            {filterdAreas.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="px-4 py-6 text-center text-slate-500 dark:text-slate-400"> Cargando Areas... </td>
                                </tr>
                            ):(
                                filterdAreas.map((area) => (
                                    <tr key={area.id} className="hover:bg-slate-100 dark:hover:bg-slate-800/70 transition">
                                        <td className="px-4 py-3 font-semibold">{area.name}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-3 py-1 rounded-full text-xs ${area.activo ? "bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-300": "bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-300"}`}>
                                                {area.activo ? "Activo" : "Inactivo"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex justify-center gap-2">
                                                <ToggleUserStatusButton active={!!area.activo} loading={loadingAreaId === area.id} label={area.activo ? "Desactivar" : "Activar"} onToggle={() => toggleAreaStatus(area)}/>
                                                <IconDelete/>
                                            </div>
                                        </td>
                                    </tr>

                                ))
                            )}

                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    )
}