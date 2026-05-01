import { useState } from "react";

export default function SubStoreScrapModal({
  scrapForm,
  setScrapForm,
  handleScrap,
  scrapModalLoading,
  setScrapModal,
}) {
  const { requestData, scrap_items, note, sendByName } = scrapForm;

  const updateQty = (index, value) => {
    setScrapForm((f) => {
      const updated = [...f.scrap_items];
      updated[index] = { ...updated[index], scrap_qty: Number(value) };
      return { ...f, scrap_items: updated };
    });
  };

  const onSubmit = () => {
    if (!note || note.trim() === "") {
      alert("A note/reason is required.");
      return;
    }
    const itemsToScrap = scrap_items.filter((i) => i.scrap_qty > 0);
    if (itemsToScrap.length === 0) {
      alert("Enter a scrap quantity for at least one item.");
      return;
    }
    const over = itemsToScrap.find((i) => i.scrap_qty > i.max_qty);
    if (over) {
      alert(`Quantity exceeds available stock for one or more items.`);
      return;
    }
    handleScrap(requestData.request_id, {
      note,
      scrapped_by: sendByName,
      items: itemsToScrap.map((i) => {
        const detail = itemDetails[i.request_item_id] || {};
        return {
          request_item_id: i.request_item_id, // ← for scrap_qty update in request_items
          item_no: detail.item_no, // ← for items table lookup
          quantity: i.scrap_qty,
        };
      }),
    });
  };

  // Build a lookup: request_item_id → item details from requestData.items
  const itemDetails = {};
  (requestData?.items || []).forEach((i) => {
    itemDetails[i.request_item_id] = i;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">
            Scrap items — {requestData?.request_no || ""}
          </h2>
          <button
            onClick={() => setScrapModal(false)}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Note field */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Note / reason <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) =>
                setScrapForm((f) => ({ ...f, note: e.target.value }))
              }
              placeholder="e.g. damaged in transit"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Items table */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-3 py-2 text-xs text-gray-500 font-semibold">
                    Item
                  </th>
                  <th className="text-left px-3 py-2 text-xs text-gray-500 font-semibold">
                    Type
                  </th>
                  <th className="text-right px-3 py-2 text-xs text-gray-500 font-semibold">
                    Max
                  </th>
                  <th className="text-right px-3 py-2 text-xs text-gray-500 font-semibold">
                    Scrap qty
                  </th>
                </tr>
              </thead>
              <tbody>
                {scrap_items.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="text-center py-4 text-gray-400 text-xs"
                    >
                      No scrappable items in this request.
                    </td>
                  </tr>
                ) : (
                  scrap_items.map((entry, idx) => {
                    const detail = itemDetails[entry.request_item_id] || {};
                    return (
                      <tr
                        key={entry.request_item_id}
                        className="border-t border-gray-100"
                      >
                        <td className="px-3 py-2 text-gray-800">
                          {detail.item_name || detail.item_no || "—"}
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={`text-xs font-semibold px-2 py-0.5 rounded ${
                              detail.item_type === "REUSABLE"
                                ? "bg-green-100 text-green-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {detail.item_type || "—"}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right text-gray-500 font-mono text-xs">
                          {entry.max_qty}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <input
                            type="number"
                            min={0}
                            max={entry.max_qty}
                            value={entry.scrap_qty}
                            onChange={(e) => updateQty(idx, e.target.value)}
                            className="w-16 text-right border border-gray-300 rounded px-2 py-1 text-sm font-mono focus:outline-none focus:border-red-400"
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-200">
          <button
            onClick={() => setScrapModal(false)}
            className="px-4 py-2 text-sm border border-gray-300 rounded text-gray-600 hover:bg-gray-50"
            disabled={scrapModalLoading}
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={scrapModalLoading}
            className="px-4 py-2 text-sm bg-red-600 hover:bg-red-500 text-white font-semibold rounded disabled:opacity-40"
          >
            {scrapModalLoading ? "Scrapping..." : "Confirm scrap"}
          </button>
        </div>
      </div>
    </div>
  );
}