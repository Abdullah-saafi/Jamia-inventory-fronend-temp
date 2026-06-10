import React from "react";
import StatusBadge from "./StatusBadge";

export default function ItemHistoryModal({ open, onClose, itemNo, history }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 z-9998" onClick={onClose} />
      <div className="relative z-10000 bg-white border border-gray-200 rounded-xl w-full max-w-[72vh] max-h-[80vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h2 className="text-gray-900 font-bold">ہسٹری — {itemNo}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl">✕</button>
        </div>
        <div className="overflow-x-auto  rounded-lg border border-gray-200">
          {(!history || history.length === 0) ? (
            <div className="text-l text-gray-500 m-5">حالیہ ہسٹری نہیں ملی۔</div>
          ) : (
            <table className="w-full border-collapse overflow-hidden rounded-lg">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">
                    درخواست
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">
                    تاریخ
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">
                    مقدار
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">
                    حالت
                  </th>
                </tr>
              </thead>

              <tbody>
                {history.map((h, index) => (
                  <tr
                    key={h.request_id}
                    className={`
                    border-b border-gray-100
                    hover:bg-emerald-50
                    transition-colors
                    ${index % 2 === 0 ? "bg-white" : "bg-gray-50/50"}
                  `}
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-gray-700 bg-gray-100 px-2 py-1 rounded">
                        {h.request_no || h.request_id}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">
                      {h.fulfilled_at
                        ? new Date(h.fulfilled_at).toLocaleString()
                        : "—"}
                    </td>

                    <td className="px-4 py-3 text-sm">
                      <span className="font-bold text-emerald-600">
                        {Number(h.qty)}
                      </span>
                    </td>

                    <td className="px-2 py-3 text-xs text-gray-600 whitespace-nowrap">
                      {h.status
                        ? <StatusBadge status={h.status}/>
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}