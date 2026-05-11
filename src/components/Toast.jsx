export default function Toast({ toast, onClose }) {
  if (!toast) return null;

  return (
    <div
      className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-lg border shadow-xl text-sm font-medium
        ${
          toast.type === "success"
            ? "bg-emerald-50 border-emerald-200 text-emerald-700"
            : toast.type === "warn" 
            ? "bg-amber-50 border-amber-200 text-amber-700"
            : toast.type === "error" ? "bg-red-50 border-red-200 text-red-700" : "bg-emerald-50 border-emerald-200 text-emerald-700"
        }
      `}
    >
      <span>{toast.message}</span>
      <button
        onClick={onClose}
        className="opacity-60 hover:opacity-100 text-lg leading-none"
      >
        ×
      </button>
    </div>
  );
}