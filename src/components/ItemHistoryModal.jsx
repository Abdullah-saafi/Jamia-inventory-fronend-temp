import React from "react";

export default function ItemHistoryModal({ open, onClose, itemNo, history }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 z-[9998]" onClick={onClose} />
      <div className="relative z-[10000] bg-white border border-gray-200 rounded-xl w-full max-w-md max-h-[80vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h2 className="text-gray-900 font-bold">History — {itemNo}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl">✕</button>
        </div>
        <div className="p-4 ">
          {(!history || history.length === 0) ? (
            <div className="text-sm text-gray-500">No recent history found.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 text-xs border-b pb-2">
                  <th>Request</th>
                  <th>Date</th>
                  <th className="text-right">Qty</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.request_id} className="border-b border-gray-100">
                    <td className="py-2 font-mono text-xs">{h.request_no || h.request_id}</td>
                    <td className="py-2 text-xs text-gray-600">{h.fulfilled_at ? new Date(h.fulfilled_at).toLocaleString() : "—"}</td>
                    <td className="py-2 text-right font-mono">{Number(h.qty)}</td>
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
