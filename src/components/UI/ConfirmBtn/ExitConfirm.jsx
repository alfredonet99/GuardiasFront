// ExitConfirm.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import ConfirmModal from "../../Modals/Confirm/ModalConfirm";

export default function ExitConfirm({
  to = "/",
  label = "Volver",
  title = "¿Salir sin guardar?",
  message = "Tienes cambios sin guardar. Si sales ahora, se perderán los cambios no guardados.",
  confirmText = "Sí, salir sin guardar",
  cancelText = "Seguir editando",
  className = "",
}) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const baseClasses =
    "px-4 py-2 flex items-center gap-2 rounded-lg " +
    "bg-slate-200 dark:bg-slate-800 " +
    "hover:bg-slate-300 dark:hover:bg-slate-700 " +
    "transition";

  const btnClasses = `${baseClasses} ${className}`.trim();

  const handleConfirm = () => { setOpen(false); navigate(to); };

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={btnClasses}>
        <FiArrowLeft />
        {label}
      </button>

      {open && (
        <ConfirmModal
          title={title}
          message={message}
          confirmText={confirmText}
          cancelText={cancelText}
          onCancel={() => setOpen(false)}
          onConfirm={handleConfirm}
        />
      )}
    </>
  );
}
