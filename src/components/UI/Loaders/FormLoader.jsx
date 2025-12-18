export default function FormLoader({ text = "Cargando formulario..." }) {
  return (
    <div className="p-6 text-center text-slate-500 dark:text-slate-300">
      {text}
    </div>
  );
}
