import { useState, useEffect } from "react";
import { getItems, createReturnRequest } from "../../services/api";
import { useAuth } from "../../context/authContext";
import useErrorHandler from "../useErrorHandler";
import CheckLoadingAndError from "../CheckLoadingAndError";

export default function SubStoreReturnPage({ showToast, mainStores = [] }) {
  const { auth } = useAuth();
  const handleError = useErrorHandler();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedItems, setSelectedItems] = useState({}); // { item_id: qty }
  const [toStoreId, setToStoreId] = useState("");
  const [sentByName, setSentByName] = useState(auth?.username || "");
  const [note, setNote] = useState("");

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getItems({ store_id: auth.store_id });
      setItems(res.data.data || []);
    } catch (err) {
      const msg = handleError(err, "Failed to load items");
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter(
    (i) =>
      i.item_quantity > 0 &&
      (i.item_name.toLowerCase().includes(search.toLowerCase()) ||
        i.item_no.toLowerCase().includes(search.toLowerCase())),
  );

  const toggleItem = (item) => {
    setSelectedItems((prev) => {
      const updated = { ...prev };
      if (updated[item.item_id]) {
        delete updated[item.item_id];
      } else {
        updated[item.item_id] = { qty: 1, item };
      }
      return updated;
    });
  };

  const updateQty = (item_id, qty) => {
    const max = items.find((i) => i.item_id === item_id)?.item_quantity || 0;
    const clamped = Math.min(Math.max(1, Number(qty)), Number(max));
    setSelectedItems((prev) => ({
      ...prev,
      [item_id]: { ...prev[item_id], qty: clamped },
    }));
  };

  const selectedCount = Object.keys(selectedItems).length;
  const totalQty = Object.values(selectedItems).reduce(
    (sum, v) => sum + Number(v.qty),
    0,
  );

  const handleSubmit = async () => {
    if (!toStoreId) {
      showToast({ message: "Please select destination store", type: "error" });
      return;
    }
    if (selectedCount === 0) {
      showToast({ message: "Please select at least one item", type: "error" });
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        from_store_id: auth.store_id,
        to_store_id: toStoreId,
        sent_by_name: sentByName,
        note,
        items: Object.entries(selectedItems).map(([item_id, v]) => ({
          item_id: Number(item_id),
          return_qty: v.qty,
        })),
      };
      await createReturnRequest(payload);
      showToast({ message: "Items sent back successfully", type: "success" });
      setSelectedItems({});
      setNote("");
      fetchItems();
    } catch (err) {
      const msg = handleError(err, "Failed to send items back");
      showToast({ message: msg, type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-gray-800 ">
            واپس بھیجیں — اسٹور کو آئٹم واپس کریں
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            آئٹم منتخب کریں اور مرکزی اسٹور کو واپس بھیجیں
          </p>
        </div>
        <button
          onClick={fetchItems}
          className="text-gray-500 hover:text-gray-800 text-sm px-3 py-2 border border-gray-300 rounded hover:bg-gray-50 shadow-sm"
        >
          ↻ Refresh
        </button>
      </div>

      {/* Top Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="آئٹم تلاش کریں..."
          className="bg-white border border-gray-300 rounded px-3 py-2 text-gray-800 text-sm focus:outline-none focus:border-emerald-500 shadow-sm"
        />
        <select
          value={toStoreId}
          onChange={(e) => setToStoreId(e.target.value)}
          className="bg-white border border-gray-300 rounded px-3 py-2 text-gray-700 text-sm focus:outline-none focus:border-emerald-500 shadow-sm"
        >
          <option value="">منزل اسٹور منتخب کریں *</option>
          {mainStores.map((s) => (
            <option key={s.store_id} value={s.store_id}>
              {s.store_name}
            </option>
          ))}
        </select>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="نوٹ (اختیاری)"
          className="bg-white border border-gray-300 rounded px-3 py-2 text-gray-800 text-sm focus:outline-none focus:border-emerald-500 shadow-sm"
        />
      </div>

      <div className="flex gap-4">
        {/* Items Table */}
        <div className="flex-1 overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {[
                  "",
                  "آئٹم نمبر",
                  "نام",
                  "قسم",
                  "دستیاب مقدار",
                  "واپسی مقدار",
                ].map((h) => (
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
              {loading || error || filteredItems.length === 0 ? (
                <CheckLoadingAndError
                  loading={loading}
                  error={error}
                  requests={filteredItems}
                />
              ) : (
                filteredItems.map((item) => {
                  const isSelected = !!selectedItems[item.item_id];
                  return (
                    <tr
                      key={item.item_id}
                      onClick={() => toggleItem(item)}
                      className={`border-b border-gray-100 cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-emerald-50 hover:bg-emerald-100"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleItem(item)}
                          onClick={(e) => e.stopPropagation()}
                          className="accent-emerald-500"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-emerald-600 text-xs">
                          {item.item_no}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-800 font-semibold">
                        {item.item_name}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {item.item_type || "—"}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-emerald-600">
                        {Number(item.item_quantity)}
                      </td>
                      <td
                        className="px-4 py-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {isSelected ? (
                          <input
                            type="number"
                            min={1}
                            max={item.item_quantity}
                            value={selectedItems[item.item_id]?.qty || 1}
                            onChange={(e) =>
                              updateQty(item.item_id, e.target.value)
                            }
                            className="w-20 border border-emerald-300 rounded px-2 py-1 text-sm font-mono focus:outline-none focus:border-emerald-500"
                          />
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Summary Panel */}
        {selectedCount > 0 && (
          <div className="w-72 shrink-0">
            <div className="border border-gray-200 rounded-lg shadow-sm bg-white p-4 sticky top-4">
              <h3 className="font-bold text-gray-700 text-sm mb-3 border-b pb-2">
                منتخب آئٹمز — {selectedCount}
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto mb-3">
                {Object.entries(selectedItems).map(([item_id, v]) => (
                  <div
                    key={item_id}
                    className="flex items-center justify-between text-xs"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-700 truncate">
                        {v.item.item_name}
                      </p>
                      <p className="text-gray-400 font-mono">
                        {v.item.item_no}
                      </p>
                    </div>
                    <span className="font-mono font-bold text-emerald-600 ml-2">
                      ×{v.qty}
                    </span>
                    <button
                      onClick={() => toggleItem(v.item)}
                      className="ml-2 text-red-400 hover:text-red-600 text-lg leading-none"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <div className="border-t pt-2 mb-3">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>کل مقدار</span>
                  <span className="font-mono font-bold text-gray-700">
                    {totalQty}
                  </span>
                </div>
              </div>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white text-sm font-semibold py-2 rounded transition-colors"
              >
                {submitting ? "بھیج رہے ہیں..." : "واپس بھیجیں ✓"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
