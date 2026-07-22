import { useState } from "react";
import StatusBadge from "../StatusBadge";
import React from "react";

export default function GRNModal({ request, onClose, onSubmit, submitting, showToast }) {
  const [grnNote, setGrnNote] = useState("");
  const [items, setItems] = useState(
    (request.items || []).map((i) => ({
      request_item_id: i.request_item_id,
      item_no: i.item_no,
      item_name: i.item_name,
      item_name_urdu: i.item_name_urdu,
      item_uom: i.item_uom,
      fulfilled_qty: i.fulfilled_qty ?? i.approved_qty ?? i.requested_qty,
      received_qty: i.fulfilled_qty ?? i.approved_qty ?? i.requested_qty,
      returned_qty: i.returned_qty,
      item_condition: "OK",
      images: []
    })),
  );

  const hasInvalidDamage = items.some(
    (i) =>
      (Number(i.received_qty) === Number(i.fulfilled_qty) &&
        (i.item_condition === "DAMAGED" || i.item_condition === "MISSING")) ||
      (i.item_condition === "OK" && Number(i.received_qty) === 0)
  );

  const updateItem = (idx, field, value) =>
    setItems((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });

  const deriveStatus = () => {

    const hasDispute = items.some(
      (i) =>
        i.item_condition === "DAMAGED" ||
        i.item_condition === "MISSING" ||
        i.item_condition === "RETURN" ||
        Number(i.received_qty) < Number(i.fulfilled_qty)
    );
    if (hasDispute) return "DISPUTED";
    return "RECEIVED";
  };

  const handleConfirm = () => {
    const grn_status = deriveStatus();
    onSubmit({
      grn_status,
      grn_note: grnNote.trim() || null,
      received_items: items.map(
        ({ request_item_id, received_qty, item_condition, returned_qty, images }) => ({
          request_item_id,
          received_qty: Number(received_qty),
          item_condition,
          returned_qty: Number(returned_qty),
          images: images || [],
        })
      ),
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
  const hasAnyIssue = ["DISPUTED"].includes(currentStatus);


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
                سامان کی وصولی کا نوٹ (GRN)
              </span>
              <span className="font-mono text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                {request.request_no}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5" dir="rtl">
              {" · "}ہر آئٹم کی تصدیق کریں اور درج کریں کہ اصل میں کتنا سامان موصول ہوا ہے۔
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
              ? "bg-amber-50 border-amber-200 text-amber-700"
              : "bg-emerald-50 border-emerald-200 text-emerald-700"
              }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${hasAnyIssue ? "bg-amber-400" : "bg-emerald-400"
                }`}
            />
            {currentStatus === "DISPUTED"
              ? " یہ ڈلیوری مارک ہو جائے گی متنازعہ"
              : "  یہ ڈلیوری مارک ہو جائے گی"}
          </div>

          {/* Items table */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm text-center">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {["آئٹم نمبر", "آئٹم کا نام", "اکائی", "بھیجی گئی مقدار", "موصول شدہ مقدار", "حالت"].map((h) => (
                    <th
                      key={h}
                      className=" px-4 py-3 text-gray-500 font-semibold text-xs uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="w-full">
                {items.map((item, idx) => (
                  <React.Fragment key={item.request_item_id}>
                    {/* 1. Main Row for Item Details */}
                    <tr className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-emerald-600 text-xs font-bold">
                        {item.item_no}
                      </td>
                      <div className="flex flex-col">
                        <td className="px-4 pt-3 text-gray-800">{item.item_name}</td>
                        <td className="px-4 pb-3 text-gray-800">( {item.item_name_urdu} )</td>
                      </div>
                      <td className="px-4 py-3 text-gray-400 text-xs">{item.item_uom}</td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-gray-700 font-semibold">
                          {Number(item.fulfilled_qty)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min="0"
                          max={Number(item.fulfilled_qty)}
                          value={Number(item.received_qty)}
                          onChange={(e) => {
                            const val = Math.min(
                              Number(Number(item.fulfilled_qty)),
                              Math.max(0, Number(e.target.value))
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
                          className="w-20 border rounded px-2 py-1 text-sm font-mono focus:outline-none border-gray-300 text-gray-800"
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
                            : item.item_condition === "RETURN"
                              ? "border-blue-300 text-blue-700 bg-blue-50"
                              : item.item_condition === "DAMAGED"
                                ? "border-amber-300 text-amber-700 bg-amber-50"
                                : "border-red-300 text-red-700 bg-red-50"
                            }`}
                        >
                          <option value="OK">✓ ٹھیک ہے (OK)</option>
                          <option value="DAMAGED">⚠ خراب / متاثرہ (Damaged)</option>
                          <option value="MISSING">✕ کم مقدار(Missing)</option>
                          <option value="RETURN">↵ واپسی (Return)</option>
                        </select>
                      </td>
                    </tr>

                    {/* 2. Full-Width Sub-row Dedicated exclusively to this specific Item's Image */}
                    {item.item_condition !== "OK" && (
                      <tr className="border-b border-gray-100 last:border-0 bg-gray-50/40">
                        <td colSpan={6} className="px-4 py-1">
                          <div className="w-full max-w-full">
                            <label className="text-[10px] text-gray-400 uppercase font-bold mb-1 block">
                              تصاویر شامل کریں (اختیاری)
                            </label>

                            {/* Reduced h-24 down to a sleek h-14 box layout to prevent long stretching layout blocks */}
                            <label className="flex flex-row items-center justify-center gap-3 w-full h-9 border border-dashed border-gray-300 rounded-lg cursor-pointer bg-white hover:bg-gray-100 hover:border-gray-400 transition-colors group px-4">
                              <div className="flex items-center gap-2">
                                <svg
                                  className="w-5 h-5 text-gray-400 group-hover:text-gray-500 transition-colors"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 002-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <p className="text-xs text-gray-500 font-medium">
                                  تصویر منتخب کرنے کے لیے یہاں کلک کریں
                                </p>
                              </div>
                              <div className="text-[10px] text-gray-400 border-l border-gray-200 pl-3">
                                (زیادہ سے زیادہ 1 تصویر)
                              </div>

                              <input
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={(e) => {
                                  const files = Array.from(e.target.files);
                                  const currentImages = items[idx].images || [];

                                  const newFiles = files.filter(
                                    (file) =>
                                      !currentImages.some(
                                        (img) =>
                                          img.name === file.name &&
                                          img.size === file.size &&
                                          img.lastModified === file.lastModified
                                      )
                                  );

                                  const total = currentImages.length + newFiles.length;
                                  if (total > 1) {
                                    showToast?.("ہر آئٹم کے لیے صرف ایک تصویر کی اجازت ہے۔", "warn");
                                    e.target.value = null;
                                    return;
                                  }

                                  updateItem(idx, "images", [...currentImages, ...newFiles]);
                                  e.target.value = null;
                                }}
                                className="hidden"
                              />
                            </label>

                            {/* Image Preview List rendering right inside the container */}
                            {items[idx]?.images?.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-1.5">
                                {items[idx].images.map((img, imgIdx) => (
                                  <div
                                    key={imgIdx}
                                    className="relative flex items-center bg-gray-100 border border-gray-200 px-2 py-0.5 rounded text-xs text-gray-600 font-mono gap-1.5"
                                  >
                                    <span className="truncate max-w-[200px]">{img.name}</span>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        updateItem(idx, "images", items[idx].images.filter((_, i) => i !== imgIdx))
                                      }
                                      className="text-red-500 hover:text-red-700 font-bold ml-1"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* Issue summary */}
          {hasAnyIssue && (
            <div className={`${hasAnyIssue ? "bg-amber-50 border-amber-200" : ""} border rounded-xl p-4`}>
              <div className={`${hasAnyIssue && "text-amber-700"} text-xs font-bold uppercase tracking-wider mb-2`}>
                مسائل سامنے آئے ہیں
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
                      className={`${hasAnyIssue ? "text-amber-700" : ""} text-xs flex items-center gap-2`}
                    >
                      <span className="font-mono font-bold">{i.item_no}</span>
                        <span>{i.item_name}</span>
                        <span>( {i.item_name_urdu} )</span>
                      {Number(i.received_qty) < Number(i.fulfilled_qty) && (
                        <span className={hasAnyIssue ? "text-amber-600" : ""}>
                          — میں سے{" "} <bdi>{i.received_qty}</bdi> موصول ہوئے
                          <bdi>{i.fulfilled_qty}</bdi>
                        </span>
                      )}
                      {i.item_condition !== "OK" && (
                        <StatusBadge status={i.item_condition} />
                      )}
                    </li>
                  ))}
              </ul>
            </div>
          )}

          {/* Note */}
          <div>
            <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider block mb-1.5">
              مین اسٹور کے نام پیغام{" "}
              <span className="text-gray-400 font-normal normal-case">(اختیاری)</span>
            </label>
            <textarea
              value={grnNote}
              onChange={(e) => setGrnNote(e.target.value)}
              rows={3}
              placeholder={
                hasAnyIssue
                  ? "مسئلے کی تفصیلات یہاں لکھیں..."
                  : "ڈلیوری کے بارے میں کوئی بھی ریمارکس لکھیں..."
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
            پوری ڈلیوری مسترد کریں
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              disabled={submitting}
              className="text-sm font-semibold text-gray-600 hover:text-gray-800 border border-gray-200 bg-gray-50 px-4 py-2 rounded-lg transition-colors disabled:opacity-40"
            >
              منسوخ کریں
            </button>
            <button
              onClick={handleConfirm}
              disabled={submitting || hasInvalidDamage}
              className={`text-sm font-semibold text-white px-5 py-2 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${hasAnyIssue ? "bg-amber-500 hover:bg-amber-400" : "bg-emerald-600 hover:bg-emerald-500"
                }`}
            >
              {submitting
                ? "جمع ہو رہا ہے..."
                : currentStatus === "DISPUTED"
                  ? "مسئلے کے ساتھ جمع کریں"
                  : "✓ وصولی کی تصدیق کریں"}
            </button>
          </div>
        </div>
      </div>
    </div >
  );
}