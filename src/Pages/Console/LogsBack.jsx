import { useState } from "react";
import React from "react";
import { FiTerminal, FiRefreshCw , FiArrowLeft, FiSearch, FiChevronDown, FiChevronUp} from "react-icons/fi";
import { HiOutlineExclamationCircle } from "react-icons/hi";
import usePageTitleLabel from "../../hooks/PageNames";
import usePagination from "../../hooks/Pagination";
import Paginator from "../../components/UI/Paginacion/PaginationUI";

export default function SystemConsoleTablePage() {
  usePageTitleLabel("CONSOLA", FiTerminal);

  const [expanded, setExpanded] = useState(null);

  const {data: logs, search, setSearch, page, setPage, lastPage, loading, reload } = usePagination("/system/logs", { perPage: 50 });

  const collapseAll = () => setExpanded(null);

  const getTagStyle = (type) => {
    switch (type) {
      case "INFO":
        return "text-green-600 dark:text-green-400 bg-green-400/10 border-green-600/30";
      case "DEBUG":
        return "text-blue-600 dark:text-blue-400 bg-blue-400/10 border-blue-600/30";
      case "WARNING":
        return "text-yellow-600 dark:text-yellow-400 bg-yellow-400/10 border-yellow-600/30";
      case "ERROR":
        return "text-red-600 dark:text-red-400 bg-red-400/10 border-red-600/30";
      default:
        return "text-slate-700 dark:text-slate-300 bg-slate-300/20 dark:bg-slate-700/30";
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-200 flex flex-col">
      <header className="px-6 py-4 border-b border-slate-300 dark:border-slate-800 bg-white/80 dark:bg-slate-900/70 backdrop-blur-md flex justify-end">
        <div className="flex items-center gap-4">

          <button onClick={() => { reload(); collapseAll(); }} className="flex items-center gap-2 px-3 py-1.5 bg-blue-200/40 text-blue-700 border border-blue-400/40 dark:bg-blue-700/20 dark:text-blue-300 rounded-md hover:bg-blue-300/50 dark:hover:bg-blue-700/30 transition">
            <FiRefreshCw /> Recargar
          </button>

          <button onClick={() => window.history.back()} className="flex items-center gap-2 px-3 py-1.5 bg-slate-200/60 border border-slate-400 dark:bg-slate-800/50 dark:border-slate-700 rounded-md hover:bg-slate-300 dark:hover:bg-slate-700 transition">
            <FiArrowLeft /> Volver
          </button>
        </div>
      </header>

      <div className="px-6 py-4 border-b border-slate-300 dark:border-slate-800 bg-white/70 dark:bg-slate-900/40">
        <div className="flex items-center gap-3 bg-slate-200 dark:bg-slate-800 px-4 py-2 rounded-lg border border-slate-400 dark:border-slate-700">
          <FiSearch className="text-slate-600 dark:text-slate-400" />
          <input type="text" placeholder="Buscar logs…" value={search} onChange={(e) => { setSearch(e.target.value);  setPage(1); collapseAll(); }} className="bg-transparent outline-none w-full text-sm"/>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        {loading ? (
          <p className="text-center text-slate-500 dark:text-slate-400">Cargando logs…</p>
        ) : logs.length === 0 ? (
          <p className="text-center text-slate-500 dark:text-slate-400 flex flex-col items-center py-10">
            <HiOutlineExclamationCircle size={26} />
            <span>Sin registros</span>
          </p>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-300 dark:border-slate-800 bg-slate-200/60 dark:bg-slate-900/40">
                <th className="py-2 px-2">Tipo</th>
                <th className="py-2 px-2">Mensaje</th>
                <th className="py-2 px-2">Hora</th>
              </tr>
            </thead>

            <tbody>
              {logs.map((log, i) => (
                <React.Fragment key={i}>
                  <tr key={i} onClick={() => setExpanded(expanded === i ? null : i)}
                    className="cursor-pointer select-none border-b border-slate-300 dark:border-slate-800/60 hover:bg-slate-200/40 dark:hover:bg-slate-800/40 transition"
                  >
                    <td className="py-2 px-2">
                      <span className={`px-2 py-1 rounded-md border text-xs font-semibold ${getTagStyle(log.type)}`}>
                        {log.type}
                      </span>
                    </td>

                    <td className="py-2 px-2 flex items-center justify-between max-w-[400px]"> <span className="truncate">{log.msg}</span> </td>

                    <td className="py-2 px-2 text-slate-600 dark:text-slate-400">{log.time}</td>
                  </tr>

                  {expanded === i && (
                    <tr key={`details-${i}`}>
                      <td colSpan="3" className="bg-slate-100 dark:bg-slate-900 px-4 py-3 border-b border-slate-300 dark:border-slate-800">
                        <pre className="whitespace-pre-wrap text-xs break-all  p-3 rounded-md bg-slate-200/60 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300">
                          {log.full}
                        </pre>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>
      
      <Paginator page={page} lastPage={lastPage} setPage={setPage} />
    </div>
  );
}
