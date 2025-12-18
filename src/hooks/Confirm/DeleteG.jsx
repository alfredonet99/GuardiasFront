
import { useState } from "react";

export default function useGlobalDelete() {
  const [modal, setModal] = useState({
    isOpen: false,
    message: "",
    onConfirm: null,
  });

  const openModal = ({ message, onConfirm }) => {
    setModal({
      isOpen: true,
      message:
        message ||
        "¿Estás seguro que deseas eliminar este elemento?",
      onConfirm,
    });
  };

  const closeModal = () => {
    setModal({ isOpen: false, message: "", onConfirm: null });
  };

  const confirm = () => {
    if (modal.onConfirm) modal.onConfirm();
    closeModal();
  };

  return { modal, openModal, closeModal, confirm };
}
