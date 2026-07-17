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
import { RETURN_STATUSES } from "../../services/constants";
import { ChevronDown, ChevronUp } from "lucide-react";
import ExcelDownloaderWithDates from "../Exceldownloaderwithdates"
import Pagination from "../Pagination";

const STATUS_COLORS = {
  PENDING: "bg-yellow-100 text-yellow-700 border-yellow-200",
  ADDED_TO_STOCK: "bg-emerald-100 text-emerald-700 border-emerald-200",
  SCRAPPED: "bg-red-100 text-red-700 border-red-200",
  SCRAPPED_AND_STOCKED: "bg-orange-100 text-orange-700 border-orange-200",
  SCRAP: "bg-red-100 text-red-700 border-red-200",
};

function clampQty(value, max) {
  return Math.min(max, Math.max(0, Number(value) || 0));
}

function QuantityInput({ label, value, max, onChange, colorClass }) {
  return (
    <div className="flex flex-col gap-1">
      <span className={`text-xs font-semibold ${colorClass}`}>{label}</span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onChange(clampQty(value - 1, max))}
          className="w-7 h-7 rounded border border-gray-300 text-gray-600 hover:bg-gray-100 font-bold flex items-center justify-center"
        >
          −
        </button>
        <input
          type="number"
          min={0}
          max={max}
          value={value}
          onChange={(e) => onChange(clampQty(e.target.value, max))}
          className="w-16 border border-gray-300 rounded px-2 py-1 text-center font-mono text-sm focus:outline-none focus:border-emerald-500 bg-white"
        />
        <button
          type="button"
          onClick={() => onChange(clampQty(value + 1, max))}
          className="w-7 h-7 rounded border border-gray-300 text-gray-600 hover:bg-gray-100 font-bold flex items-center justify-center"
        >
          +
        </button>
      </div>
    </div>
  );
}

function getItemCardStyle(stockQty, scrapQty) {
  if (scrapQty > 0 && stockQty > 0) {
    return "border-orange-200 bg-orange-50";
  }
  if (scrapQty > 0) {
    return "border-red-200 bg-red-50";
  }
  return "border-emerald-200 bg-emerald-50";
}

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
  const [showDropdown, setShowDropdown] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [pageLimit, setPageLimit] = useState(10);

  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalItems: 0,
    pageLimit: 10,
    totalPages: 1,
  });


  useEffect(() => {
    fetchReturns();
  }, [filterStatus, currentPage, pageLimit, debouncedSearch]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchReturns = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await getReturnRequests({
        to_store_id: auth.store_id,
        ...(filterStatus ? { status: filterStatus } : {}),
        page: currentPage,
        limit: pageLimit,
        search: debouncedSearch,
        priority_status: "PENDING",
      });

      setReturns(res.data.data || []);

      setPagination(
        res.data.pagination || {
          currentPage,
          totalItems: 0,
          pageLimit,
          totalPages: 1,
        }
      );
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
      const defaults = {};
      data.items.forEach((i) => {
        const returnQty = Number(i.return_qty);
        defaults[i.return_item_id] = {
          stock_qty: i.stock_qty != null ? Number(i.stock_qty) : returnQty,
          scrap_qty: i.scrap_qty != null ? Number(i.scrap_qty) : 0,
          note: "",
        };
      });
      setItemActions(defaults);
    } catch (err) {
      const msg = handleError(err, "Failed to load return details");
      showToast(msg, "error");
    } finally {
      setModalLoading(false);
    }
  };

  const closeModal = () => {
    setSelected(null);
    setItemActions({});
  };

  const setStockQty = (return_item_id, stockQty, returnQty) => {
    const stock = clampQty(stockQty, returnQty);
    setItemActions((prev) => ({
      ...prev,
      [return_item_id]: {
        ...prev[return_item_id],
        stock_qty: stock,
        scrap_qty: returnQty - stock,
      },
    }));
  };

  const setScrapQty = (return_item_id, scrapQty, returnQty) => {
    const scrap = clampQty(scrapQty, returnQty);
    setItemActions((prev) => ({
      ...prev,
      [return_item_id]: {
        ...prev[return_item_id],
        scrap_qty: scrap,
        stock_qty: returnQty - scrap,
      },
    }));
  };

  const setNote = (return_item_id, note) => {
    setItemActions((prev) => ({
      ...prev,
      [return_item_id]: { ...prev[return_item_id], note },
    }));
  };

  const handleProcess = async () => {
    const invalidItem = selected?.items?.find((item) => {
      const action = itemActions[item.return_item_id];
      if (!action) return true;
      const total =
        Number(action.stock_qty) + Number(action.scrap_qty);
      return total !== Number(item.return_qty);
    });

    if (invalidItem) {
      showToast(
        "ہر آئٹم کی اسٹاک اور اسکریپ مقدار کل واپسی مقدار کے برابر ہونی چاہیے",
        "error",
      );
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        received_by_name: auth.username,
        items: Object.entries(itemActions).map(([return_item_id, v]) => ({
          return_item_id: Number(return_item_id),
          stock_qty: Number(v.stock_qty),
          scrap_qty: Number(v.scrap_qty),
          note: v.note || null,
        })),
      };
      await processReturnRequest(selected.return_id, payload);
      showToast("واپسی کی درخواست کامیابی سے مکمل ہو گئی ہے", "success",);
      closeModal();
      fetchReturns();
    } catch (err) {
      const msg = handleError(err, "Failed to process return");
      showToast(msg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const totalStockQty = Object.values(itemActions).reduce(
    (sum, v) => sum + Number(v.stock_qty || 0),
    0,
  );
  const totalScrapQty = Object.values(itemActions).reduce(
    (sum, v) => sum + Number(v.scrap_qty || 0),
    0,
  );

  return (
    <div>
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
      </div>
      {/* Header finished */}


      {/* Filter */}
      <div className="flex items-end justify-between py-2">
        <div>
          {showDropdown && (
            <div
              className="absolute inset-0"
              onClick={() => setShowDropdown(false)}
            />
          )}

          {/* Search + Filter + Clear */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="مکمل ریکویسٹ نمبر یا آخری 4 نمبر سے تلاش کریں..."
              title="مکمل ریکویسٹ نمبر یا آخری 4 نمبر سے تلاش کریں..."
              className="bg-white border border-gray-300 rounded px-3 h-10 text-gray-800 text-sm focus:outline-none focus:border-emerald-500 w-52 shadow-sm"
            />

            {/* Filter */}
            <div className="relative min-w-50">
              <button
                type="button"
                onClick={() => setShowDropdown((prev) => !prev)}
                className="w-full h-10 px-3 flex items-center justify-between bg-white border border-gray-300 rounded-lg shadow-sm hover:border-emerald-400 focus:border-emerald-500 transition-all text-sm text-gray-700"
              >
                <span>
                  {RETURN_STATUSES.find((s) => s.value === filterStatus)?.label ||
                    "تمام اسٹیٹس"}
                </span>

                {showDropdown ? (
                  <ChevronUp size={16} className="text-gray-400" />
                ) : (
                  <ChevronDown size={16} className="text-gray-400" />
                )}
              </button>

              {showDropdown && (
                <div className="absolute z-50 mt-2 w-full max-h-48 bg-white border border-gray-200 rounded-xl shadow-xl overflow-y-auto">
                  <button
                    className="w-full text-left px-4 py-2.5 hover:bg-emerald-50 text-sm"
                    onClick={() => {
                      setFilterStatus("");
                      setCurrentPage(1);
                      setShowDropdown(false);
                    }}
                  >
                    تمام اسٹیٹس
                  </button>

                  {RETURN_STATUSES.map((n) => (
                    <button
                      key={n.value}
                      onClick={() => {
                        setCurrentPage(1);
                        setFilterStatus(n.value);
                        setShowDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-emerald-50 transition-colors ${filterStatus === n.value
                        ? "bg-emerald-100 text-emerald-700 font-semibold"
                        : "text-gray-700"
                        }`}
                    >
                      {n.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Clear */}
            {(filterStatus || search) && (
              <button
                onClick={() => {
                  setSearch("");
                  setFilterStatus("");
                  setCurrentPage(1);
                  setDebouncedSearch("")
                }}
                className="h-10 px-3 text-gray-500 hover:text-gray-800 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          {/* Refresh stays below */}
          <button
            onClick={() => {
              fetchReturns()
              setCurrentPage(1);
            }}
            className="text-gray-500 hover:text-gray-800 text-sm px-3 py-2 border border-gray-300 rounded hover:bg-gray-50 shadow-sm flex items-center mt-3"
          >
            ↻ Refresh
          </button>
        </div>

        {/* Excel Export */}
        <div className="Temp-downloader">
          <div className="downloader">
            <ExcelDownloaderWithDates
              data={returns}
              dateKey="created_at"
              fileName={auth.username}
              pageLoading={loading}
              columns={[
                {
                  key: "return_no",
                  label: "واپسی نمبر",
                  format: (v) => (v ? v : "—"),
                },
                {
                  key: "from_store_name",
                  label: "بھیجنے والا اسٹور",
                  format: (v) => (v ? v : "—"),
                },
                {
                  key: "sent_by_name",
                  label: "بھیجنے والا",
                  format: (v) => (v ? v : "—"),
                },
                {
                  key: "item_count",
                  label: "آئٹمز",
                  format: (v) => (v ? v : "—"),
                },
                {
                  key: "created_at",
                  label: "تاریخ",
                  format: (v) =>
                    v ? new Date(v).toLocaleDateString() : "—",
                },
                {
                  key: "status",
                  label: "اسٹیٹس",
                  format: (v) => (v ? v : "—"),
                },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto text-center rounded-lg border border-gray-200 shadow-sm">
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
                  className="border-b border-zinc-200 hover:bg-gray-100 transition-colors"
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
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${STATUS_COLORS[r.status] ||
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
                        عمل کریں
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
      <div className="mt-4">
        <Pagination
          currentPage={pagination.currentPage}
          totalItems={pagination.totalItems}
          pageSize={pagination.pageLimit}
          onPageChange={setCurrentPage}
          pageSizeOptions={[10, 25, 50]}
          onPageSizeChange={(size) => {
            setPageLimit(size);
            setCurrentPage(1);
          }}
        />
      </div>

      {/* Process Modal */}
      {(selected || modalLoading) && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={closeModal}>
          {/* <div className="absolute inset-0 z-40 bg-black/30" onClick={closeModal} /> */}
          <div onClick={(e) => { e.stopPropagation() }}
            className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
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
                      <span>نوٹ: </span>
                      <bdi>{selected.note}</bdi>
                    </div>
                  )}

                  {selected?.status === "PENDING" && (
                    <p className="text-xs text-gray-500 mb-4">
                      ہر آئٹم کے لیے اسٹاک اور اسکریپ مقدار الگ الگ منتخب کریں۔ دونوں کا مجموعہ کل واپسی مقدار کے برابر ہونا چاہیے۔
                    </p>
                  )}

                  {/* Items */}
                  <div className="space-y-3">
                    {selected?.items?.map((item) => {
                      const returnQty = Number(item.return_qty);
                      const isPending = selected.status === "PENDING";
                      const action = itemActions[item.return_item_id];
                      const stockQty = isPending
                        ? Number(action?.stock_qty ?? returnQty)
                        : Number(item.stock_qty ?? 67);
                      const scrapQty = isPending
                        ? Number(action?.scrap_qty ?? 0)
                        : Number(item.scrap_qty ?? 0);
                      const hasScrap = scrapQty > 0;

                      return (
                        <div
                          key={item.return_item_id}
                          className={`border rounded-lg p-4 transition-colors ${getItemCardStyle(stockQty, scrapQty)}`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex">
                                <p className="font-semibold text-gray-800 text-sm">
                                  {item.item_name}
                                </p>
                                <p className="font-semibold text-gray-800 text-sm ml-1">
                                  ( {item.item_name_urdu} )
                                </p>
                              </div>
                              <div className="flex items-center gap-3 mt-1 flex-wrap">
                                <span className="font-mono text-xs text-gray-400">
                                  {item.item_no}
                                </span>
                                <span className="text-xs text-gray-400">
                                  {item.item_type}
                                </span>
                                <span className="font-mono font-bold text-sm text-gray-700">
                                  کل مقدار: <bdi className="text-emerald-600">{returnQty}</bdi> 
                                </span>
                                <span className="font-mono font-bold text-sm text-gray-700">
                                اکائی: <span className="text-emerald-600">{item.item_uom}</span>
                                </span>
                              </div>
                              {!isPending && item.action_type && (
                                <div className="flex items-center gap-2 mt-2 flex-wrap">
                                  <span
                                    className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${STATUS_COLORS[item.action_type] ||
                                      "bg-gray-100 text-gray-600 border-gray-200"
                                      }`}
                                  >
                                    {item.action_type}
                                  </span>
                                  <span className="text-xs text-emerald-700 font-semibold">
                                    اسٹاک: {item.added_to_stock_qty}
                                  </span>
                                  <span className="text-xs text-red-600 font-semibold">
                                    اسکریپ: {item.scrap_qty}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {isPending && (
                            <div className="mt-3 flex flex-wrap items-end gap-6">
                              <QuantityInput
                                label="✓ اسٹاک میں"
                                value={stockQty}
                                max={returnQty}
                                onChange={(val) =>
                                  setStockQty(item.return_item_id, val, returnQty)
                                }
                                colorClass="text-emerald-600"
                              />
                              <QuantityInput
                                label="✕ اسکریپ"
                                value={scrapQty}
                                max={returnQty}
                                onChange={(val) =>
                                  setScrapQty(item.return_item_id, val, returnQty)
                                }
                                colorClass="text-red-500"
                              />
                              <span className="text-xs text-gray-500 pb-1">
                                باقی: {returnQty - stockQty - scrapQty} {item.item_uom}
                              </span>
                            </div>
                          )}

                          {/* Scrap note */}
                          {isPending && hasScrap && (
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
              <div className="border-t border-zinc-200 px-6 py-4 flex items-center justify-between">
                <div className="text-xs text-gray-500 flex gap-4">
                  <span className="text-emerald-600 font-semibold">
                    ✓ کل اسٹاک: {totalStockQty}
                  </span>
                  <span className="text-red-500 font-semibold">
                    ✕ کل اسکریپ: {totalScrapQty}
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
