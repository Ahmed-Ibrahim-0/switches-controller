// src/hooks/useModal.js
import { useState, useCallback } from "react";

export default function useModal() {
  const [modal, setModal] = useState({
    isOpen: false,
    type: "",
    title: "",
    message: "",
    onConfirm: null,
    confirmText: "",
  });

  const openModal = useCallback(
    (type, { title, message, onConfirm = null, confirmText = "" }) => {
      setModal({
        isOpen: true,
        type,
        title,
        message,
        onConfirm,
        confirmText,
      });
    },
    []
  );

  const closeModal = useCallback(() => {
    setModal((prev) => ({ ...prev, isOpen: false }));
  }, []);

  return { modal, openModal, closeModal, setModal };
}
