import React, { useState } from "react";
import { publicInstance } from "../api/axios";

export default function Cotizador() {
  const [form, setForm] = useState({
    zip_origen: "",
    zip_destino: "",
    peso: "",
    largo: "",
    ancho: "",
    alto: "",
    valor: "",
    tipo_bulto: "2", // default: caja
  });

  const [resultado, setResultado] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const cotizar = async () => {
    setLoading(true);
    setMsg("Cotizando...");

    try {
      // ✅ No necesitamos `?env=qa`, ya el backend usa el entorno QA por defecto
      const { data } = await publicInstance.post("/paquetexpress/cotizar", form);

      // ✅ El backend ya devuelve { success: true/false, data: {...respuestaPaquetexpress...} }
      const quotations = data?.data?.body?.response?.data?.quotations || [];
      const messages = data?.data?.body?.response?.messages || [];

      if (quotations.length > 0) {
        setResultado(quotations);
        setMsg("✅ Cotización obtenida con éxito");
      } else {
        const errorMsg =
          messages?.[0]?.description ||
          data?.data?.body?.response?.messages?.[0]?.description ||
          "⚠️ No se recibieron cotizaciones válidas.";
        setMsg(errorMsg);
        setResultado([]);
      }
    } catch (error) {
      console.error("❌ Error al solicitar cotización:", error);
      setMsg("❌ Error al conectar con el servicio de cotización.");
      setResultado([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 bg-white p-6 rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-4">Cotizador Paquetexpress</h2>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <input
          name="zip_origen"
          placeholder="CP Origen"
          value={form.zip_origen}
          onChange={handleChange}
          className="border p-2 rounded"
        />
        <input
          name="zip_destino"
          placeholder="CP Destino"
          value={form.zip_destino}
          onChange={handleChange}
          className="border p-2 rounded"
        />
        <input
          name="peso"
          placeholder="Peso (kg)"
          value={form.peso}
          onChange={handleChange}
          className="border p-2 rounded"
        />
        <input
          name="valor"
          placeholder="Valor declarado"
          value={form.valor}
          onChange={handleChange}
          className="border p-2 rounded"
        />
        <input
          name="largo"
          placeholder="Largo (cm)"
          value={form.largo}
          onChange={handleChange}
          className="border p-2 rounded"
        />
        <input
          name="ancho"
          placeholder="Ancho (cm)"
          value={form.ancho}
          onChange={handleChange}
          className="border p-2 rounded"
        />
        <input
          name="alto"
          placeholder="Alto (cm)"
          value={form.alto}
          onChange={handleChange}
          className="border p-2 rounded"
        />
        <select
          name="tipo_bulto"
          value={form.tipo_bulto}
          onChange={handleChange}
          className="border p-2 rounded"
        >
          <option value="1">Sobre</option>
          <option value="2">Caja</option>
          <option value="3">Paquete</option>
          <option value="4">Bolsa</option>
          <option value="27">Bulto</option>
        </select>
      </div>

      <button
        disabled={loading}
        onClick={cotizar}
        className={`w-full py-2 rounded text-white ${
          loading ? "bg-gray-500" : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        {loading ? "Cotizando..." : "Cotizar"}
      </button>

      {msg && <p className="mt-4 text-sm">{msg}</p>}

      {resultado.length > 0 && (
        <div className="mt-6">
          <h3 className="font-semibold mb-2">Resultados:</h3>
          <table className="w-full border text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2">Servicio</th>
                <th className="border p-2">Entrega Estimada</th>
                <th className="border p-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {resultado.map((r, i) => (
                <tr key={i}>
                  <td className="border p-2">{r.serviceName}</td>
                  <td className="border p-2">
                    {r.serviceInfoDescr || r.promiseDate || "N/D"}
                  </td>
                  <td className="border p-2 text-right">
                    $
                    {r.amount?.totalAmnt
                      ? r.amount.totalAmnt.toFixed(2)
                      : "N/A"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
