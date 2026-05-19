import { useState, useEffect } from "react";
import { useAuth } from "../../context/authContext";
import useErrorHandler from "../useErrorHandler";
import CheckLoadingAndError from "../CheckLoadingAndError";
import {
  getReturnRequests,
  getReturnRequestById,
  processReturnRequest,
} from "../../services/api";
import TableHead from "../TableHead";

const STATUS_COLORS = {
  PENDING: "bg-yellow-100 text-yellow-700 border-yellow-200",
  ADDED_TO_STOCK: "bg-emerald-100 text-emerald-700 border-emerald-200",
  SCRAPPED: "bg-red-100 text-red-700 border-red-200",
  PARTIALLY_SCRAPPED: "bg-orange-100 text-orange-700 border-orange-200",
};

export default function MainStoreProcessReturns({ showToast }) {
  const { auth } = useAuth();
  const handleError = useErrorHandler();
  const pageType = "mainStoreProcessReturns"

  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [selected, setSelected] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [itemActions, setItemActions] = useState({});

  useEffect(() => {
    fetchReturns();
  }, [filterStatus]);

  const fetchReturns = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getReturnRequests({
        to_store_id: auth.store_id,
        ...(filterStatus ? { status: filterStatus } : {}),
      });
      setReturns(res.data.data || []);
    } catch (err) {
      const msg = handleError(err, "Failed to load return requests");
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const openModal = async (returnId) => {
    try {
      setModalLoading(true);
      const res = await getReturnRequestById(returnId);
      const data = res.data.data;
      setSelected(data);
      // Default all items to ADD_TO_STOCK
      const defaults = {};
      data.items.forEach((i) => {
        defaults[i.return_item_id] = { action: "ADD_TO_STOCK", note: "" };
      });
      setItemActions(defaults);
    } catch (err) {
      const msg = handleError(err, "Failed to load return details");
      showToast( msg,"error");
    } finally {
      setModalLoading(false);
    }
  };

  const closeModal = () => {
    setSelected(null);
    setItemActions({});
  };

  const setAction = (return_item_id, action) => {
    setItemActions((prev) => ({
      ...prev,
      [return_item_id]: { ...prev[return_item_id], action },
    }));
  };

  const setNote = (return_item_id, note) => {
    setItemActions((prev) => ({
      ...prev,
      [return_item_id]: { ...prev[return_item_id], note },
    }));
  };

  const handleProcess = async () => {
    try {
      setSubmitting(true);
      const payload = {
        received_by_name: auth.username,
        items: Object.entries(itemActions).map(([return_item_id, v]) => ({
          return_item_id: Number(return_item_id),
          action: v.action,
          note: v.note || null,
        })),
      };
      await processReturnRequest(selected.return_id, payload);
      showToast("Return request processed successfully","success",);
      closeModal();
      fetchReturns();
    } catch (err) {
      const msg = handleError(err, "Failed to process return");
      showToast(msg,"error");
    } finally {
      setSubmitting(false);
    }
  };

  const scrapCount = Object.values(itemActions).filter(
    (v) => v.action === "SCRAP",
  ).length;
  const stockCount = Object.values(itemActions).filter(
    (v) => v.action === "ADD_TO_STOCK",
  ).length;

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-gray-800">
            واپس آئٹمز — ذیلی اسٹور سے موصول
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            واپس آئٹمز کو اسٹاک میں شامل کریں یا اسکریپ کریں
          </p>
        </div>
        <button
          onClick={fetchReturns}
          className="text-gray-500 hover:text-gray-800 text-sm px-3 py-2 border border-gray-300 rounded hover:bg-gray-50 shadow-sm"
        >
          ↻ Refresh
        </button>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3 mb-4">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-white border border-gray-300 rounded px-3 py-2 text-gray-700 text-sm focus:outline-none focus:border-emerald-500 shadow-sm"
        >
          <option value="">تمام اسٹیٹس</option>
          <option value="PENDING">زیر التواء</option>
          <option value="ADDED_TO_STOCK">اسٹاک میں شامل کر دیا گیا</option>
          <option value="SCRAPPED">اسکریپ کر دیا گیا</option>
          <option value="PARTIALLY_SCRAPPED">جزوی طور پر اسکریپ کیا گیا</option>
        </select>
        {filterStatus && (
          <button
            onClick={() => setFilterStatus("")}
            className="text-gray-500 hover:text-gray-800 text-sm px-3 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <TableHead
              pageType={pageType}
            />
          </thead>
          <tbody>
            {loading || error || returns.length === 0 ? (
              <CheckLoadingAndError
                loading={loading}
                error={error}
                requests={returns}
              />
            ) : (
              returns.map((r) => (
                <tr
                  key={r.return_id}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <span className="font-mono text-emerald-600 text-xs font-bold">
                      {r.return_no}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700 font-semibold text-xs">
                    {r.from_store_name}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {r.sent_by_name || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className="bg-gray-100 text-gray-600 text-xs font-mono font-bold px-2 py-0.5 rounded-full">
                      {r.item_count}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs font-mono">
                    {new Date(r.created_at).toLocaleDateString("en-PK")}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                        STATUS_COLORS[r.status] ||
                        "bg-gray-100 text-gray-600 border-gray-200"
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {r.status === "PENDING" ? (
                      <button
                        onClick={() => openModal(r.return_id)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5 rounded transition-colors"
                      >
                        Process
                      </button>
                    ) : (
                      <button
                        onClick={() => openModal(r.return_id)}
                        className="text-gray-400 hover:text-gray-600 text-xs px-3 py-1.5 border border-gray-200 rounded transition-colors"
                      >
                        View
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Process Modal */}
      {(selected || modalLoading) && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div>
                <h3 className="font-bold text-gray-800">
                  واپسی درخواست — {selected?.return_no}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {selected?.from_store_name} → {selected?.to_store_name}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-700 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {modalLoading ? (
                <div className="text-center py-12 text-gray-400 text-sm">
                  لوڈ ہو رہا ہے...
                </div>
              ) : (
                <>
                  {/* Note */}
                  {selected?.note && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2 mb-4 text-xs text-yellow-700">
                      نوٹ: {selected.note}
                    </div>
                  )}

                  {/* Items */}
                  <div className="space-y-3">
                    {selected?.items?.map((item) => {
                      const action = itemActions[item.return_item_id]?.action;
                      const isScrap = action === "SCRAP";
                      return (
                        <div
                          key={item.return_item_id}
                          className={`border rounded-lg p-4 transition-colors ${
                            isScrap
                              ? "border-red-200 bg-red-50"
                              : "border-emerald-200 bg-emerald-50"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-800 text-sm">
                                {item.item_name}
                              </p>
                              <div className="flex items-center gap-3 mt-1">
                                <span className="font-mono text-xs text-gray-400">
                                  {item.item_no}
                                </span>
                                <span className="text-xs text-gray-400">
                                  {item.item_type}
                                </span>
                                <span className="font-mono font-bold text-sm text-gray-700">
                                  مقدار: {item.return_qty} {item.item_uom}
                                </span>
                              </div>
                            </div>

                            {/* Only show action buttons if PENDING */}
                            {selected.status === "PENDING" && (
                              <div className="flex gap-2 shrink-0">
                                <button
                                  onClick={() =>
                                    setAction(
                                      item.return_item_id,
                                      "ADD_TO_STOCK",
                                    )
                                  }
                                  className={`text-xs font-semibold px-3 py-1.5 rounded border transition-colors ${
                                    action === "ADD_TO_STOCK"
                                      ? "bg-emerald-600 text-white border-emerald-600"
                                      : "bg-white text-emerald-600 border-emerald-300 hover:bg-emerald-50"
                                  }`}
                                >
                                  ✓ اسٹاک میں
                                </button>
                                <button
                                  onClick={() =>
                                    setAction(item.return_item_id, "SCRAP")
                                  }
                                  className={`text-xs font-semibold px-3 py-1.5 rounded border transition-colors ${
                                    action === "SCRAP"
                                      ? "bg-red-600 text-white border-red-600"
                                      : "bg-white text-red-500 border-red-300 hover:bg-red-50"
                                  }`}
                                >
                                  ✕ اسکریپ
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Scrap note */}
                          {selected.status === "PENDING" && isScrap && (
                            <input
                              value={
                                itemActions[item.return_item_id]?.note || ""
                              }
                              onChange={(e) =>
                                setNote(item.return_item_id, e.target.value)
                              }
                              placeholder="اسکریپ کی وجہ (اختیاری)"
                              className="mt-2 w-full border border-red-200 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-red-400 bg-white"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            {selected?.status === "PENDING" && (
              <div className="border-t px-6 py-4 flex items-center justify-between">
                <div className="text-xs text-gray-500 flex gap-4">
                  <span className="text-emerald-600 font-semibold">
                    ✓ اسٹاک: {stockCount}
                  </span>
                  <span className="text-red-500 font-semibold">
                    ✕ اسکریپ: {scrapCount}
                  </span>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={closeModal}
                    className="text-gray-500 text-sm px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                  >
                    منسوخ
                  </button>
                  <button
                    onClick={handleProcess}
                    disabled={submitting}
                    className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white text-sm font-semibold px-5 py-2 rounded transition-colors"
                  >
                    {submitting ? "محفوظ ہو رہا ہے..." : "تصدیق کریں ✓"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
