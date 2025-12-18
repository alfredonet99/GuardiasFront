import { useState } from "react";
import { publicInstance } from "../api/axios";

export default function CartaPorteForm() {
  const [form, setForm] = useState({
    // ORIGEN
    origen_nombre: "",
    origen_email: "",
    origen_contacto: "",
    origen_cp: "",
    origen_estado: "",
    origen_municipio: "",
    origen_colonia: "",
    origen_calle: "",
    origen_numero: "",
    origen_telefono: "",
    // DESTINO
    destino_nombre: "",
    destino_email: "",
    destino_contacto: "",
    destino_cp: "",
    destino_estado: "",
    destino_municipio: "",
    destino_colonia: "",
    destino_calle: "",
    destino_numero: "",
    destino_telefono: "",
    // PAQUETE
    contenido: "",
    peso: "",
    largo: "",
    ancho: "",
    alto: "",
    comentario: "",
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const { data } = await publicInstance.post("/paquetexpress/carta-porte", form);
      setResult(data);

      // 🧾 Si el PDF ya está disponible, abrirlo automáticamente
      if (data?.pdf_status === "ok" && data?.pdf_url) {
        window.open(data.pdf_url, "_blank");
      } else if (data?.pdf_status === "pending") {
        alert("⚠️ La guía se generó correctamente, pero el PDF aún no está disponible. Intenta nuevamente en unos segundos.");
      }
    } catch (error) {
      console.error(error);
      setResult({
        success: false,
        message:
          error.response?.data?.message ||
          "❌ Error al generar la Carta Porte. Verifica los datos ingresados.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto mt-10 bg-white shadow-lg rounded-xl p-6">
      <h2 className="text-xl font-semibold mb-4 text-center">Generar Carta Porte 📦</h2>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* ORIGEN */}
        <fieldset className="border p-3 rounded-md">
          <legend className="font-semibold text-sm">Origen</legend>
          <input name="origen_nombre" placeholder="Nombre" onChange={handleChange} required className="input" />
          <input name="origen_email" placeholder="Correo" onChange={handleChange} required className="input" />
          <input name="origen_contacto" placeholder="Contacto" onChange={handleChange} required className="input" />
          <input name="origen_estado" placeholder="Estado" onChange={handleChange} required className="input" />
          <input name="origen_municipio" placeholder="Municipio" onChange={handleChange} required className="input" />
          <input name="origen_colonia" placeholder="Colonia" onChange={handleChange} required className="input" />
          <input name="origen_calle" placeholder="Calle" onChange={handleChange} required className="input" />
          <input name="origen_numero" placeholder="Número" onChange={handleChange} required className="input" />
          <input name="origen_cp" placeholder="Código Postal" onChange={handleChange} required className="input" />
          <input name="origen_telefono" placeholder="Teléfono" onChange={handleChange} required className="input" />
        </fieldset>

        {/* DESTINO */}
        <fieldset className="border p-3 rounded-md">
          <legend className="font-semibold text-sm">Destino</legend>
          <input name="destino_nombre" placeholder="Nombre" onChange={handleChange} required className="input" />
          <input name="destino_email" placeholder="Correo" onChange={handleChange} required className="input" />
          <input name="destino_contacto" placeholder="Contacto" onChange={handleChange} required className="input" />
          <input name="destino_estado" placeholder="Estado" onChange={handleChange} required className="input" />
          <input name="destino_municipio" placeholder="Municipio" onChange={handleChange} required className="input" />
          <input name="destino_colonia" placeholder="Colonia" onChange={handleChange} required className="input" />
          <input name="destino_calle" placeholder="Calle" onChange={handleChange} required className="input" />
          <input name="destino_numero" placeholder="Número" onChange={handleChange} required className="input" />
          <input name="destino_cp" placeholder="Código Postal" onChange={handleChange} required className="input" />
          <input name="destino_telefono" placeholder="Teléfono" onChange={handleChange} required className="input" />
        </fieldset>

        {/* PAQUETE */}
        <fieldset className="col-span-2 border p-3 rounded-md">
          <legend className="font-semibold text-sm">Datos del paquete</legend>
          <input
            name="contenido"
            placeholder="Contenido del paquete"
            onChange={handleChange}
            required
            className="input"
          />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
            <input name="peso" placeholder="Peso (kg)" onChange={handleChange} required className="input" />
            <input name="largo" placeholder="Largo (cm)" onChange={handleChange} required className="input" />
            <input name="ancho" placeholder="Ancho (cm)" onChange={handleChange} required className="input" />
            <input name="alto" placeholder="Alto (cm)" onChange={handleChange} required className="input" />
          </div>
          <textarea
            name="comentario"
            placeholder="Comentarios adicionales"
            onChange={handleChange}
            className="input mt-2"
          />
        </fieldset>

        {/* BOTÓN */}
        <button
          type="submit"
          disabled={loading}
          className="col-span-2 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
        >
          {loading ? "Generando..." : "Generar Envío"}
        </button>
      </form>

      {/* RESULTADO */}
      {result && (
        <div className="mt-6 text-center">
          {result.success ? (
            <>
              <p className="text-green-600 font-semibold">✅ Envío generado correctamente</p>
              <p><strong>Rastreo:</strong> {result.rastreo}</p>
              <p><strong>Guía:</strong> {result.guia}</p>
              <p><strong>Total:</strong> ${result.costo?.totalAmnt}</p>

              {result.pdf_url ? (
                <a
                  href={result.pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-3 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
                >
                  📄 Ver PDF de la Guía
                </a>
              ) : (
                <p className="text-yellow-600 mt-2">⚠️ El PDF aún no está disponible.</p>
              )}
            </>
          ) : (
            <p className="text-red-600 font-semibold">{result.message}</p>
          )}
        </div>
      )}
    </div>
  );
}
