export default function StatusBadge({ status }) {
  if (!status || status === "OK") return null;
  const s = {
    PENDING: "bg-yellow-50 text-yellow-600 border border-yellow-300",
    APPROVED: "bg-emerald-50 text-emerald-600 border border-emerald-300",
    REJECTED: "bg-red-50 text-red-600 border border-red-300",
    FULFILLED: "bg-blue-50 text-blue-600 border border-blue-300",
    RECEIVED: "bg-teal-50 text-teal-600 border border-teal-300",
    DISPUTED: "bg-amber-50 text-amber-600 border border-amber-300",
    CLOSED: "bg-gray-100 text-gray-500 border border-gray-300",
    DAMAGED: "bg-amber-50 border-amber-300 text-amber-700",
    MISSING: "bg-red-50 border-red-300 text-red-700",
    RETURN: "bg-blue-50 border-blue-300 text-blue-700",
    OK: "bg-emerald-50 border-emerald-300 text-emerald-700",
    PARTIALLY_RECEIVED: "bg-teal-50 text-teal-600 border border-teal-300"
  };
  return (
    <span
      className={`px-2 py-0.5 rounded text-xs font-bold font-mono border ${s[status] || ""}`}
    >
      {status}
    </span>
  );
}

