import { useState, useEffect } from "react";
import { useAuth } from "../context/authContext";
import { useToast } from "../context/ToastContext";
import { useStores } from "../hooks/useStores";
import useErrorHandler from "./useErrorHandler";
import CheckLoadingAndError from "./CheckLoadingAndError";
import {
  createReturnRequest,
  getItems,
  getReturnRequests,
  getReturnRequestById,
} from "../services/api";
import TableHead from "./TableHead";
import ExcelDownloaderWithDates from "./Exceldownloaderwithdates";
import Pagination from "./Pagination";
import ReturnModal from "./ReturnModal";
import { RETURN_STATUSES } from "../services/constants";
import { ChevronDown, ChevronUp } from "lucide-react";

const PRIORITY_STATUS = "PENDING";

const STATUS_COLORS = {
  PENDING: "bg-yellow-100 text-yellow-700 border-yellow-200",
  ADDED_TO_STOCK: "bg-emerald-100 text-emerald-700 border-emerald-200",
  SCRAPPED: "bg-red-100 text-red-700 border-red-200",
  SCRAPPED_AND_STOCKED: "bg-orange-100 text-orange-700 border-orange-200",
};

export default function ReturnRequestList() {
  const { auth } = useAuth();
  const { showToast } = useToast();
  const handleError = useErrorHandler();
  const { mainStores } = useStores();
  const pageType = "returnRequestList";

  const [returns, setReturns] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selected, setSelected] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [returnItemsPageSize, setReturnItemsPageSize] = useState(10);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageLimit: 10,
    totalItems: 0,
    totalPages: 1,
  });
  const [returnBackModal, setReturnBackModal] = useState(false);
  const [returnBackLoading, setReturnBackLoading] = useState(false);
  const [itemLoading, setItemLoading] = useState(false);
  const [returnBackSubmitting, setReturnBackSubmitting] = useState(false);
  const [returnBackNote, setReturnBackNote] = useState("");
  const [allItems, setAllItems] = useState([]);
  const [pageLimit, setPageLimit] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPagination, setItemsPagination] = useState({
    currentPage: 1,
    pageLimit: 10,
    totalItems: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [itemSearch, setItemSearch] = useState("");
  const [itemDebouncedSearch, setItemDebouncedSearch] = useState("");

  // ── Debounce search ───────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => setItemDebouncedSearch(itemSearch), 500);
    return () => clearTimeout(timer);
  }, [itemSearch]);


  // ─── Load ─────────────────────────────────────────────────────────────────
  const load = async () => {
    setPageLoading(true);
    try {
      const params = {
        page,
        limit: pageSize,
        search: debouncedSearch,
        priority_status: PRIORITY_STATUS,
        from_store_id: auth.store_id
      };

      if (filterStatus) params.status = filterStatus;
      // if (auth.role !== "super admin") {
      //   params.from_store_id = auth.store_id;
      // } else if (filterStore) {
      //   params.from_store_id = filterStore;
      // }

      const res = await getReturnRequests(params);
      setReturns(res.data.data || []);
      setPagination(res.data.pagination);
    } catch (error) {
      const msg = handleError(error, "Failed to load return requests");
      showToast(msg, "error");
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    if (auth.store_id || auth.role === "super admin") {
      load();
    }
  }, [filterStatus, auth.store_id, page, pageSize, debouncedSearch]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  // ─── Detail ───────────────────────────────────────────────────────────────
  const openDetail = async (returnId) => {
    try {
      setModalLoading(true);
      const res = await getReturnRequestById(returnId);
      setSelected(res.data.data);
    } catch (err) {
      const msg = handleError(err, "Failed to load return details");
      showToast(msg, "error");
    } finally {
      setModalLoading(false);
    }
  };

  const closeModal = () => setSelected(null);

  // ─── Return back (create) ──────────────────────────────────────────────────

  const getStoreItems = async () => {
    try {
      setItemLoading(true)
      const res = await getItems({
        to_store_id: auth.store_id,
        page: currentPage,
        limit: pageLimit,
        search: itemDebouncedSearch,
      });
      setItemsPagination(res.data.pagination);
      const items = (res.data.data || []).filter(
        (i) => Number(i.item_quantity) > 0
      );
      setAllItems(items.map((i) => ({
        ...i,
        return_qty: 0,
      })));
    } catch (error) {
      const msg = handleError(error, "Failed to load return details");
      showToast(msg, "error");
    } finally{
      setItemLoading(false)
    }
  }

  const openReturnBack = async () => {
    try {
      setReturnBackLoading(true);
      await getStoreItems()
      setReturnBackModal(true);
    } finally {
      setReturnBackLoading(false);
    }
  };

  useEffect(() => {
    getStoreItems()
  }, [currentPage, pageLimit, itemDebouncedSearch])

  const handleReturnBack = async () => {
    const selectedItems = allItems.filter((i) => Number(i.return_qty) > 0);
    if (selectedItems.length === 0) {
      showToast("کم از کم ایک آئٹم منتخب کریں", "error");
      return;
    }
    const mainStore = mainStores[0]; // or let user pick
    if (!mainStore) {
      showToast("Main store not found", "error");
      return;
    }
    try {
      setReturnBackSubmitting(true);
      await createReturnRequest({
        from_store_id: auth.store_id,
        to_store_id: mainStore.store_id,
        sent_by_name: auth.username,
        note: returnBackNote || null,
        items: selectedItems.map((i) => ({
          item_id: i.item_id,
          return_qty: Number(i.return_qty),
        })),
      });
      showToast("آئٹمز واپس بھیج دیے گئے", "success");
      setReturnBackModal(false);
      setAllItems([]);
      setReturnBackNote("");
      load();
    } catch (err) {
      const msg = handleError(err, "Failed to send items back");
      showToast(msg, "error");
    } finally {
      setReturnBackSubmitting(false);
    }
  };

  return (
    <div>
      <div className="flex gap-2 my-4">
        <button
          onClick={openReturnBack}
          disabled={returnBackLoading}
          className="bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white text-sm font-semibold px-4 py-2 rounded transition-colors"
        >
          {returnBackLoading ? "Loading..." : "آئٹم واپس کریں "}
        </button>
      </div>

      {/* ── Filters ── */}
      {showDropdown && (
        <div
          className="absolute inset-0"
          onClick={() => setShowDropdown(false)}
        />
      )}
      <div className="flex py-2 items-end justify-between">
        <div className="Filter">
          <div className="flex gap-2">
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="مکمل ریکویسٹ نمبر یا آخری 4 نمبر سے تلاش کریں..."
              title="مکمل ریکویسٹ نمبر یا آخری 4 نمبر سے تلاش کریں..."
              className="bg-white border mb-3 leading-none border-gray-300 rounded-lg px-3 h-10 text-gray-800 text-sm focus:outline-none focus:border-emerald-500 w-52 shadow-sm"
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
                      setPage(1);
                      setShowDropdown(false);
                    }}
                  >
                    تمام اسٹیٹس
                  </button>

                  {RETURN_STATUSES.map((n) => (
                    <button
                      key={n.value}
                      onClick={() => {
                        setPage(1);
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
            {(search || filterStatus) && (
              <button
                onClick={() => {
                  setSearch("");
                  setFilterStatus("");
                  setPage(1);
                  setDebouncedSearch("");
                }}
                className="h-10 px-3 text-gray-500 hover:text-gray-800 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
          <button
            onClick={() => {
              load();
              setPage(1);
            }}
            className="text-gray-500 hover:text-gray-800 text-sm px-3 py-2 border border-gray-300 rounded ml-auto hover:bg-gray-50 shadow-sm"
          >
            ↻ Refresh
          </button>
        </div>

        <div className="Temp-downloader flex justify-center items-center gap-4">
          <div>
            <ExcelDownloaderWithDates
              data={returns}
              dateKey="created_at"
              fileName={auth.username}
              columns={[
                { key: "return_no", label: "واپسی نمبر", format: (v) => (v ? v : "—") },
                { key: "to_store_name", label: "وصول کنندہ اسٹور", format: (v) => (v ? v : "—") },
                { key: "sent_by_name", label: "بھیجنے والا", format: (v) => (v ? v : "—") },
                { key: "item_count", label: "آئٹمز", format: (v) => (v ? v : "—") },
                { key: "created_at", label: "تاریخ", format: (v) => (v ? new Date(v).toLocaleDateString() : "—") },
                { key: "status", label: "اسٹیٹس", format: (v) => (v ? v : "—") },
              ]}
              pageLoading={pageLoading}
            />
          </div>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="overflow-x-auto text-center rounded-lg border border-gray-200 shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <TableHead pageType={pageType} />
          </thead>
          <tbody>
            {pageLoading || returns.length === 0 ? (
              <CheckLoadingAndError loading={pageLoading} requests={returns} />
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
                    {r.to_store_name}
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
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${STATUS_COLORS[r.status] || "bg-gray-100 text-gray-600 border-gray-200"
                        }`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => openDetail(r.return_id)}
                      className="text-gray-400 hover:text-gray-600 text-xs px-3 py-1.5 border border-gray-200 rounded transition-colors"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <Pagination
          currentPage={pagination.currentPage}
          totalItems={pagination.totalItems}
          pageSize={pagination.pageLimit}
          onPageChange={setPage}
          pageSizeOptions={[10, 25, 50]}
          onPageSizeChange={(s) => {
            setPageSize(s);
            setPage(1);
          }}
        />
      </div>

      {/* Detail Modal — read only, sub store can't process its own returns */}
      {(selected || modalLoading) && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={closeModal}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
          >
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

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {modalLoading ? (
                <div className="text-center py-12 text-gray-400 text-sm">لوڈ ہو رہا ہے...</div>
              ) : (
                <>
                  {selected?.note && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2 mb-4 text-xs text-yellow-700">
                      <span>نوٹ: </span>
                      <bdi>{selected.note}</bdi>
                    </div>
                  )}

                  <div className="flex items-center gap-2 mb-4">
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${STATUS_COLORS[selected?.status] || "bg-gray-100 text-gray-600 border-gray-200"
                        }`}
                    >
                      {selected?.status}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {selected?.items?.map((item) => (
                      <div
                        key={item.return_item_id}
                        className="border border-gray-200 rounded-lg p-4"
                      >
                        <p className="font-semibold text-gray-800 text-sm">{item.item_name}</p>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          <span className="font-mono text-xs text-gray-400">{item.item_no}</span>
                          <span className="text-xs text-gray-400">{item.item_type}</span>
                          <span className="font-mono font-bold text-sm text-gray-700">
                            مقدار: {item.return_qty} {item.item_uom}
                          </span>
                          {item.action_type && (
                            <span
                              className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${STATUS_COLORS[item.action_type] ||
                                "bg-gray-100 text-gray-600 border-gray-200"
                                }`}
                            >
                              {item.action_type}
                            </span>
                          )}
                        </div>
                        {item.note && (
                          <p className="text-xs text-gray-400 mt-2">
                            نوٹ: <bdi>{item.note}</bdi>
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {returnBackModal && (
        <ReturnModal
          setReturnBackModal={setReturnBackModal}
          returnBackNote={returnBackNote}
          setReturnBackNote={setReturnBackNote}
          handleReturnBack={handleReturnBack}
          returnBackSubmitting={returnBackSubmitting}
          itemLoading={itemLoading}
          currentPage={currentPage}
          pageSize={returnItemsPageSize}
          setCurrentPage={setCurrentPage}
          setPageSize={setReturnItemsPageSize}
          allItems={allItems}
          pagination={itemsPagination}
          setPageLimit={setPageLimit}
          setItemSearch={setItemSearch}
          setAllItems={setAllItems}
        />
      )}
    </div>
  );
}