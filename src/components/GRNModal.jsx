import { useState } from "react";

const ConditionBadge = ({ condition }) => {
  const styles = {
    OK: "bg-emerald-50 border-emerald-300 text-emerald-700",
    DAMAGED: "bg-amber-50 border-amber-300 text-amber-700",
    MISSING: "bg-red-50 border-red-300 text-red-700",
    RETURN_BACK: "bg-blue-50 border-blue-300 text-blue-700",
  };
  
  return (
    <span className={`px-2 py-0.5 rounded border text-xs font-bold font-mono ${styles[condition] || ""}`}>
      {condition === "RETURN_BACK" ? "↵ RETURN" : condition}
    </span>
  );
};

export default function GRNModal({ request, onClose, onSubmit, submitting }) {
  const [grnNote, setGrnNote] = useState("");
  const [items, setItems] = useState(
    (request.items || []).map((i) => ({
      request_item_id: i.request_item_id,
      item_no: i.item_no,
      item_name: i.item_name,
      item_uom: i.item_uom,
      fulfilled_qty: i.fulfilled_qty ?? i.approved_qty ?? i.requested_qty,
      received_qty: i.fulfilled_qty ?? i.approved_qty ?? i.requested_qty,
      item_condition: "OK",
    })),
  );

  const hasInvalidDamage = items.some(
    (i) =>
      Number(i.received_qty) === Number(i.fulfilled_qty) &&
      (i.item_condition === "DAMAGED" || i.item_condition === "MISSING")
  );

  const updateItem = (idx, field, value) =>
    setItems((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });

  // Derive overall GRN status from item states
  // Only RECEIVED or DISPUTED — never REJECTED from the confirm button
  const deriveStatus = () => {
    const hasReturn = items.some(i => i.item_condition === "RETURN_BACK");

    const hasDispute = items.some(
      (i) =>
        i.item_condition === "DAMAGED" ||
        i.item_condition === "MISSING" ||
        Number(i.received_qty) < Number(i.fulfilled_qty)
    );
    if (hasReturn) return "RETURN_BACK";
    if (hasDispute) return "DISPUTED";
    return "RECEIVED";
  };

  // Confirm receipt (RECEIVED or DISPUTED based on what user entered)
  const handleConfirm = () => {
    const grn_status = deriveStatus();
    onSubmit({
      grn_status,
      grn_note: grnNote.trim() || null,
      received_items: items.map(({ request_item_id, received_qty, item_condition }) => ({
        request_item_id,
        received_qty: Number(received_qty),
        item_condition,
      })),
    });
  };

  // Reject entire delivery — sub store receives NOTHING, no inventory added
  const handleRejectAll = () => {
    onSubmit({
      grn_status: "REJECTED",
      grn_note: grnNote.trim() || "Delivery rejected by sub store.",
      received_items: items.map(({ request_item_id }) => ({
        request_item_id,
        received_qty: 0,
        item_condition: "MISSING",
      })),
    });
  };


  const currentStatus = deriveStatus();
  const hasAnyIssue = ["RETURN_BACK", "DISPUTED"].includes(currentStatus);


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white border border-gray-200 rounded-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-lg font-black text-gray-900 tracking-tight">
                Goods Receiving Note
              </span>
              <span className="font-mono text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                {request.request_no}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Dispatched by{" "}
              <span className="text-gray-600 font-medium">
                {request.to_store_name}
              </span>
              {" · "}Verify each item and enter what was actually received
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-2xl leading-none font-light"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 flex-1">
          {/* Live status pill */}
          <div
            className={`flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl border ${hasAnyIssue
              ? currentStatus === "RETURN_BACK"
                ? "bg-blue-50 border-blue-200 text-blue-700"
                : "bg-amber-50 border-amber-200 text-amber-700"
              : "bg-emerald-50 border-emerald-200 text-emerald-700"
              }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${currentStatus === "RETURN_BACK" ? "bg-blue-400" : hasAnyIssue ? "bg-amber-400" : "bg-emerald-400"
                }`}
            />
            {currentStatus === "RETURN_BACK"
              ? "Return detected — this will be marked RETURN"
              : currentStatus === "DISPUTED"
                ? "Issues detected — this will be marked DISPUTED"
                : "All items look good — this will be marked RECEIVED"}
          </div>

          {/* Items table */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {["Item No", "Item Name", "UOM", "Dispatched", "Received Qty", "Condition"].map((h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 text-gray-500 font-semibold text-xs uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr
                    key={item.request_item_id}
                    className="border-b border-gray-100 last:border-0 hover:bg-gray-50"
                  >
                    <td className="px-4 py-3 font-mono text-emerald-600 text-xs font-bold">
                      {item.item_no}
                    </td>
                    <td className="px-4 py-3 text-gray-800">{item.item_name}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{item.item_uom}</td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-gray-700 font-semibold">
                        {item.fulfilled_qty}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min="0"
                        max={item.fulfilled_qty}
                        value={item.received_qty}
                        onChange={(e) => {
                          const val = Math.min(
                            Number(item.fulfilled_qty),
                            Math.max(0, Number(e.target.value)),
                          );
                          updateItem(idx, "received_qty", val);
                          if (val === 0) {
                            updateItem(idx, "item_condition", "MISSING");
                          } else if (val < item.fulfilled_qty) {
                            if (item.item_condition === "OK") {
                              updateItem(idx, "item_condition", "MISSING");
                            }
                          } else if (val === item.fulfilled_qty) {
                            updateItem(idx, "item_condition", "OK");
                          }
                        }}
                        className={`w-20 border rounded px-2 py-1 text-sm font-mono focus:outline-none ${currentStatus === "RETURN_BACK"
                          ? "border-blue-300 text-blue-700 bg-blue-50"
                          : currentStatus === "DISPUTED"
                          ? "border-amber-300 text-amber-700 bg-amber-50"
                          : currentStatus === "DISPUTED"
                          ? "border-amber-300 text-amber-700 bg-amber-50"
                          : "border-gray-300 text-gray-800"
                          }`}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={item.item_condition}
                        onChange={(e) => {
                          updateItem(idx, "item_condition", e.target.value);
                          if (e.target.value === "MISSING") updateItem(idx, "received_qty", 0);
                        }}
                        className={`border rounded px-2 py-1 text-xs font-semibold focus:outline-none ${item.item_condition === "OK"
                          ? "border-emerald-300 text-emerald-700 bg-emerald-50"
                          : item.item_condition === "RETURN_BACK"
                            ? "border-blue-300 text-blue-700 bg-blue-50"
                            : item.item_condition === "DAMAGED"
                              ? "border-amber-300 text-amber-700 bg-amber-50"
                              : "border-red-300 text-red-700 bg-red-50"
                          }`}
                      >
                        <option value="OK">✓ OK</option>
                        <option value="DAMAGED">⚠ Damaged</option>
                        <option value="MISSING">✕ Missing</option>
                        <option value="RETURN_BACK">↵ Return</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Issue summary */}
          {hasAnyIssue && (
            <div className={`${currentStatus === "RETURN_BACK" ? "bg-blue-50 border-blue-200" : "bg-amber-50 border-amber-200"} border rounded-xl p-4`}>
              <div className={`${currentStatus === "RETURN_BACK" ? "text-blue-700" : "text-amber-700"} text-xs font-bold uppercase tracking-wider mb-2`}>
                Issues Detected
              </div>
              <ul className="space-y-1">
                {items
                  .filter(
                    (i) =>
                      i.item_condition !== "OK" ||
                      Number(i.received_qty) < Number(i.fulfilled_qty),
                  )
                  .map((i) => (
                    <li
                      key={i.request_item_id}
                      className={`${currentStatus === "RETURN_BACK" ? "text-blue-700" : "text-amber-700"} text-xs flex items-center gap-2`}
                    >
                      <span className="font-mono font-bold">{i.item_no}</span>
                      <span>{i.item_name}</span>
                      {Number(i.received_qty) < Number(i.fulfilled_qty) && (
                        <span className={`${currentStatus === "RETURN_BACK" ? "text-blue-700" : "text-amber-600"}`}>
                          — received {i.received_qty} of {i.fulfilled_qty}
                        </span>
                      )}
                      {i.item_condition !== "OK" && (
                        <ConditionBadge condition={i.item_condition} />
                      )}
                    </li>
                  ))}
              </ul>
            </div>
          )}

          {/* Note */}
          <div>
            <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider block mb-1.5">
              Message to Main Store{" "}
              <span className="text-gray-300 font-normal normal-case">(optional)</span>
            </label>
            <textarea
              value={grnNote}
              onChange={(e) => setGrnNote(e.target.value)}
              rows={3}
              placeholder={
                hasAnyIssue
                  ? "Describe the issue in detail…"
                  : "Any remarks about the delivery…"
              }
              className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2.5 text-gray-800 text-sm resize-none placeholder-gray-300 focus:outline-none focus:border-emerald-400"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-between rounded-b-2xl gap-3">
          <button
            onClick={handleRejectAll}
            disabled={submitting}
            className="text-sm font-semibold text-red-500 hover:text-red-600 border border-red-200 hover:border-red-300 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg transition-colors disabled:opacity-40"
          >
            Reject Entire Delivery
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              disabled={submitting}
              className="text-sm font-semibold text-gray-600 hover:text-gray-800 border border-gray-200 bg-gray-50 px-4 py-2 rounded-lg transition-colors disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={submitting || hasInvalidDamage}
              className={`text-sm font-semibold text-white px-5 py-2 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${currentStatus === "RETURN_BACK"
                ? "bg-blue-500 hover:bg-blue-400"
                : currentStatus === "DISPUTED" ? "bg-amber-500 hover:bg-amber-400" : "bg-emerald-600 hover:bg-emerald-500"
                }`}
            >
              {submitting
                ? "Submitting…"
                : currentStatus === "RETURN_BACK"
                  ? "Submit Return"
                  : currentStatus === "DISPUTED" 
                  ? "Submit with issue" 
                  : "✓ Confirm Receipt"}
            </button>
          </div>
        </div>
      </div>
    </div >
  );
}