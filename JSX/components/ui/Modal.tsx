// ChatGPT
import {JSX,useEffect, useRef, type Signal} from "../deps.ts";

type Props = {
  open: boolean;
  onClose: () => void;
  children: JSX.Element | JSX.Element[];
};

export default function Modal({ open, onClose, children }: Props) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Escキーで閉じる
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    addEventListener("keydown", onKeyDown);
    return () => removeEventListener("keydown", onKeyDown);
  }, [open]);

  // モーダル外クリックで閉じる
  const handleBackdropClick = (e: MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  useEffect(() => {
    if (open) {
      document.addEventListener("mousedown", handleBackdropClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleBackdropClick);
    };
  }, [open]);

  if (!open) return null;

  return (
    <div class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 animate-fade-in">
      <div
        ref={modalRef}
        class="bg-white p-6 rounded-xl shadow-lg max-w-md w-full relative"
      >
        <button
          onClick={onClose}
          class="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
          aria-label="Close"
        >
          ✕
        </button>
        {children}
      </div>
    </div>
  );
}
