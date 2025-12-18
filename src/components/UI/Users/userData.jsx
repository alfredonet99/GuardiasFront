import { useEffect, useState } from "react";
import { privateInstance } from "../../../api/axios"; // ajusta la ruta si tu archivo está en otra carpeta
import { FiUsers, FiUserCheck, FiUserX, FiTrendingUp, FiClock, FiShield } from "react-icons/fi";

export default function UserDataEst() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    activos: 0,
    inactivos: 0,
    ingresaron_hoy: 0,
  });

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        const { data } = await privateInstance.get("/users/stats");

        // 👇 ajusta estas llaves a lo que tu backend esté devolviendo
        setStats({
          total: Number(data?.total ?? 0),
          activos: Number(data?.activos ?? 0),
          inactivos: Number(data?.inactivos ?? 0),
          ingresaron_hoy: Number(data?.ingresaron_hoy ?? 0),
        });
      } catch (e) {
        console.error("[UserDataEst] stats error:", e);
        setStats({ total: 0, activos: 0, inactivos: 0, ingresaron_hoy: 0 });
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  const v = (n) => (loading ? "—" : n);

  return (
    <>
      {/* TARJETAS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total usuarios */}
        <div className="bg-white dark:bg-slate-900 shadow-sm rounded-xl p-4 flex items-center gap-4 border border-slate-200 dark:border-slate-700">
          <div className="p-3 rounded-lg bg-blue-600 text-white">
            <FiUsers size={28} />
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Total de Usuarios</p>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">
              {v(stats.total)}
            </h2>
          </div>
        </div>

        {/* Activos */}
        <div className="bg-white dark:bg-slate-900 shadow-sm rounded-xl p-4 flex items-center gap-4 border border-slate-200 dark:border-slate-700">
          <div className="p-3 rounded-lg bg-green-600 text-white">
            <FiUserCheck size={28} />
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Activos</p>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">
              {v(stats.activos)}
            </h2>
          </div>
        </div>

        {/* Inactivos */}
        <div className="bg-white dark:bg-slate-900 shadow-sm rounded-xl p-4 flex items-center gap-4 border border-slate-200 dark:border-slate-700">
          <div className="p-3 rounded-lg bg-red-600 text-white">
            <FiUserX size={28} />
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Inactivos</p>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">
              {v(stats.inactivos)}
            </h2>
          </div>
        </div>

        {/* Ingresaron hoy */}
        <div className="bg-white dark:bg-slate-900 shadow-sm rounded-xl p-4 flex items-center gap-4 border border-slate-200 dark:border-slate-700">
          <div className="p-3 rounded-lg bg-purple-600 text-white">
            <FiTrendingUp size={28} />
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Ingresaron hoy</p>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">
              {v(stats.ingresaron_hoy)}
            </h2>
          </div>
        </div>
      </div>

      {/* GRAFICAS (después) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-3">
            <FiShield className="text-blue-600" />
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Roles más utilizados</h3>
          </div>
          <div className="h-48 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-400">
            (Gráfica Placeholder)
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-3">
            <FiClock className="text-green-600" />
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Actividad de Usuarios</h3>
          </div>
          <div className="h-48 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-400">
            (Gráfica Placeholder)
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-3">
            <FiTrendingUp className="text-purple-600" />
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Usuarios creados por mes</h3>
          </div>
          <div className="h-48 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-400">
            (Gráfica Placeholder)
          </div>
        </div>
      </div>
    </>
  );
}
