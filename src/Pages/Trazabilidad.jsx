import { useState } from "react";
import { publicInstance } from "../api/axios"; 

export default function Trazabilidad() {
  const [rastreo, setRastreo] = useState("");
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

 const consultarTrazabilidad = async () => {
  if (!rastreo.trim()) {
    setError("Por favor ingresa un número de guía válido");
    return;
  }

  setError("");
  setLoading(true);
  setEventos([]);

  try {
    const res = await publicInstance.get(`/trazabilidad/${rastreo}`);
    const data = res.data?.body?.response?.data || [];

    if (data.length === 0) {
      setError("No se encontraron eventos para esta guía");
    } else {
      setEventos(data);
    }
  } catch (err) {
    console.error(err);
    setError("Ocurrió un error al consultar la trazabilidad");
  } finally {
    // 👇 Esto asegura que el botón regrese a su estado normal
    setLoading(false);
  }
};


  return (
    <div className="max-w-3xl mx-auto bg-white shadow rounded p-6 mt-10">
      <h1 className="text-xl font-semibold mb-4 text-gray-800">
        Consulta de Trazabilidad Paquetexpress
      </h1>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Número de guía"
          value={rastreo}
          onChange={(e) => setRastreo(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 flex-grow focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={consultarTrazabilidad}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? "Buscando..." : "Buscar"}
        </button>
      </div>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      {eventos.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full border border-gray-300 text-sm text-left">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-3 py-2">Fecha</th>
                <th className="border px-3 py-2">Hora</th>
                <th className="border px-3 py-2">Sucursal</th>
                <th className="border px-3 py-2">Status</th>
                <th className="border px-3 py-2">Origen</th>
                <th className="border px-3 py-2">Destino</th>
              </tr>
            </thead>
            <tbody>
              {eventos.map((ev, i) => (
                <tr key={i} className="odd:bg-white even:bg-gray-50">
                  <td className="border px-3 py-2">{ev.fecha}</td>
                  <td className="border px-3 py-2">{ev.hora}</td>
                  <td className="border px-3 py-2">{ev.sucursal}</td>
                  <td className="border px-3 py-2">{ev.status}</td>
                  <td className="border px-3 py-2">{ev.origen}</td>
                  <td className="border px-3 py-2">{ev.destino}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
