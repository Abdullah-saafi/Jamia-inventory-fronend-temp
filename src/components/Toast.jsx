import { useEffect, useState } from "react";

export default function Toast({ toast, onClose }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);

    const timer = setTimeout(() => {
      setVisible(false);

      setTimeout(() => {
        onClose();
      }, 300);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={`
        transform transition-all duration-300 ease-in-out
        px-4 py-3 rounded-lg border shadow-xl text-sm font-medium
        flex items-center gap-3 min-w-75

        ${
          visible
            ? "translate-y-0 opacity-100"
            : "-translate-y-4 opacity-0"
        }

        ${
          toast.type === "success"
            ? "bg-emerald-50 border-emerald-200 text-emerald-700"
            : toast.type === "warn"
            ? "bg-amber-50 border-amber-200 text-amber-700"
            : "bg-red-50 border-red-200 text-red-700"
        }
      `}
    >
      <span className="flex-1">{toast.message}</span>

      <button
        onClick={() => {
          setVisible(false);

          setTimeout(() => {
            onClose();
          }, 300);
        }}
        className="opacity-60 hover:opacity-100 text-lg leading-none"
      >
        ×
      </button>
    </div>
  );
}