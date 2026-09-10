import { useState, useEffect } from "react";
import { useAuth } from "../../context/authContext";
import { useToast } from "../../context/ToastContext";
import { useStores } from "../../hooks/useStores";
import useErrorHandler from "../useErrorHandler";
import CheckLoadingAndError from "../CheckLoadingAndError";
import {
  createReturnRequest,
  getItems,
  getReturnRequests,
  getReturnRequestById,
} from "../../services/api";
import TableHead from "../TableHead";
import ExcelDownloaderWithDates from "../Exceldownloaderwithdates";
import Pagination from "../Pagination";
import ReturnModal from "../Modals/ReturnModal";
import { RETURN_STATUSES } from "../../services/constants";
import { ChevronDown, ChevronUp } from "lucide-react";
import { returnRequestListColumns } from "../../services/columnsForExcel";

const PRIORITY_STATUS = "PENDING";

const STATUS_COLORS = {
  PENDING: "bg-yellow-100 text-yellow-700 border-yellow-200",
  ADDED_TO_STOCK: "bg-emerald-100 text-emerald-700 border-emerald-200",
  SCRAPPED: "bg-red-100 text-red-700 border-red-200",
  SCRAPPED_AND_STOCKED:
    "bg-orange-100 text-orange-700 border-orange-200",
};

export default function ReturnRequestList({ fetchRequestsForExport, handleExportAllRequests, exportLoading, setFilterStatusForSubStore }) {
  const { auth } = useAuth();
  const { showToast } = useToast();
  const handleError = useErrorHandler();
  const { mainStores } = useStores();

  const pageType = "returnRequestList";

  // Main return requests
  const [returns, setReturns] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState("");

  const [filterStatus, setFilterStatus] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageLimit: 10,
    totalItems: 0,
    totalPages: 1,
  });

  // Detail modal
  const [selected, setSelected] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Return-back modal
  const [returnBackModal, setReturnBackModal] = useState(false);
  const [returnBackSubmitting, setReturnBackSubmitting] = useState(false);
  const [returnBackNote, setReturnBackNote] = useState("");

  // Items inside return-back modal
  const [allItems, setAllItems] = useState([]);
  const [itemLoading, setItemLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemPageSize, setItemPageSize] = useState(10);

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

  // ─────────────────────────────────────────────
  // Debounce main request search
  // ─────────────────────────────────────────────

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  // ─────────────────────────────────────────────
  // Debounce item search
  // ─────────────────────────────────────────────

  useEffect(() => {
    const timer = setTimeout(() => {
      setItemDebouncedSearch(itemSearch);
    }, 500);

    return () => clearTimeout(timer);
  }, [itemSearch]);

  // ─────────────────────────────────────────────
  // Load return requests
  // ─────────────────────────────────────────────

  const load = async () => {
    setPageLoading(true);
    setError("");

    try {
      const params = {
        page,
        limit: pageSize,
        search: debouncedSearch,
        priority_status: PRIORITY_STATUS,
        from_store_id: auth.store_id,
      };

      if (filterStatus) {
        params.status = filterStatus;
      }

      const res = await getReturnRequests(params);

      setReturns(res.data.data || []);
      setPagination(res.data.pagination);
    } catch (error) {
      const msg = handleError(
        error,
        "Failed to load return requests"
      );

      setError(msg);
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    if (auth.store_id || auth.role === "super admin") {
      load();
    }
  }, [
    filterStatus,
    auth.store_id,
    page,
    pageSize,
    debouncedSearch,
  ]);

  // ─────────────────────────────────────────────
  // Load items for return-back modal
  // ─────────────────────────────────────────────

  const getStoreItems = async () => {
    try {
      setItemLoading(true);

      const res = await getItems({
        to_store_id: auth.store_id,
        page: currentPage,
        limit: itemPageSize,
        search: itemDebouncedSearch,
      });

      setItemsPagination(res.data.pagination);

      const items = (res.data.data || [])
        .filter((item) => Number(item.item_quantity) > 0)
        .map((item) => ({
          ...item,
          return_qty: 0,
        }));

      setAllItems(items);
    } catch (error) {
      const msg = handleError(
        error,
        "Failed to load store items"
      );

      showToast(msg, "error");
    } finally {
      setItemLoading(false);
    }
  };

  useEffect(() => {
    if (returnBackModal) {
      getStoreItems();
    }
  }, [
    returnBackModal,
    currentPage,
    itemPageSize,
    itemDebouncedSearch,
  ]);

  // ─────────────────────────────────────────────
  // Open detail modal
  // ─────────────────────────────────────────────

  const openDetail = async (returnId) => {
    try {
      setModalLoading(true);

      const res = await getReturnRequestById(returnId);

      setSelected(res.data.data);
    } catch (error) {
      const msg = handleError(
        error,
        "Failed to load return details"
      );

      showToast(msg, "error");
    } finally {
      setModalLoading(false);
    }
  };

  const closeModal = () => {
    setSelected(null);
  };

  // ─────────────────────────────────────────────
  // Open return-back modal
  // ─────────────────────────────────────────────

  const openReturnBack = () => {
    setReturnBackModal(true);
  };

  // ─────────────────────────────────────────────
  // Submit return-back request
  // ─────────────────────────────────────────────

  const handleReturnBack = async () => {
    const selectedItems = allItems.filter(
      (item) => Number(item.return_qty) > 0
    );

    if (selectedItems.length === 0) {
      showToast("کم از کم ایک آئٹم منتخب کریں", "error");
      return;
    }

    const mainStore = mainStores[0];

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
        items: selectedItems.map((item) => ({
          item_id: item.item_id,
          return_qty: Number(item.return_qty),
        })),
      });

      showToast(
        "آئٹمز واپس بھیج دیے گئے",
        "success"
      );

      setReturnBackModal(false);
      setAllItems([]);
      setReturnBackNote("");

      load();
    } catch (error) {
      const msg = handleError(
        error,
        "Failed to send items back"
      );

      showToast(msg, "error");
    } finally {
      setReturnBackSubmitting(false);
    }
  };

  return (
    <div>
      {/* Open return modal */}
      <div className="flex gap-2 my-4">
        <button
          onClick={openReturnBack}
          className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2 rounded transition-colors"
        >
          آئٹم واپس کریں
        </button>
      </div>

      {/* Filters */}
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
            dir="ltr"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="مکمل ریکویسٹ نمبر یا آخری 4 نمبر سے تلاش کریں..."
              className="bg-white border mb-3 leading-none border-gray-300 rounded-lg px-3 h-10 text-gray-800 text-sm focus:outline-none focus:border-emerald-500 w-52 shadow-sm"
            />

            {/* Status filter */}
            <div className="relative min-w-50">
              <button
                type="button"
                onClick={() =>
                  setShowDropdown((prev) => !prev)
                }
                className="w-full h-10 px-3 flex items-center justify-between bg-white border border-gray-300 rounded-lg shadow-sm hover:border-emerald-400 focus:border-emerald-500 transition-all text-sm text-gray-700"
              >
                <span>
                  {RETURN_STATUSES.find(
                    (status) =>
                      status.value === filterStatus
                  )?.label || "تمام اسٹیٹس"}
                </span>

                {showDropdown ? (
                  <ChevronUp
                    size={16}
                    className="text-gray-400"
                  />
                ) : (
                  <ChevronDown
                    size={16}
                    className="text-gray-400"
                  />
                )}
              </button>

              {showDropdown && (
                <div className="absolute z-50 mt-2 w-full max-h-48 bg-white border border-gray-200 rounded-xl shadow-xl overflow-y-auto">
                  <button
                    className="w-full text-left px-4 py-2.5 hover:bg-emerald-50 text-sm"
                    onClick={() => {
                      setFilterStatus("");
                      setFilterStatusForSubStore("")
                      setPage(1);
                      setShowDropdown(false);
                    }}
                  >
                    تمام اسٹیٹس
                  </button>

                  {RETURN_STATUSES.map((status) => (
                    <button
                      key={status.value}
                      onClick={() => {
                        setPage(1);
                        setFilterStatus(status.value);
                        setFilterStatusForSubStore(status.value)
                        setShowDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-emerald-50 transition-colors ${filterStatus === status.value
                        ? "bg-emerald-100 text-emerald-700 font-semibold"
                        : "text-gray-700"
                        }`}
                    >
                      {status.label}
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
                  setFilterStatusForSubStore("")
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
          dir="ltr"
            onClick={() => {
              setPage(1);
              load();
            }}
            className="text-gray-500 hover:text-gray-800 text-sm px-3 py-2 border border-gray-300 rounded ml-auto hover:bg-gray-50 shadow-sm"
          >
            ↻ Refresh
          </button>
        </div>

        <ExcelDownloaderWithDates
          pageType={pageType}
          onFetch={fetchRequestsForExport}
          handleExportAll={handleExportAllRequests}
          exportLoading={exportLoading}
          dateKey="created_at"
          fileName={`${auth.username} Return Requests`}
          columns={returnRequestListColumns}
          pageLoading={pageLoading}
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto text-center rounded-lg border border-gray-200 shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <TableHead pageType={pageType} />
          </thead>

          <tbody className="bg-white">
            {pageLoading ||
              error ||
              returns.length === 0 ? (
              <CheckLoadingAndError
                loading={pageLoading}
                error={error}
                requests={returns}
              />
            ) : (
              returns.map((request) => (
                <tr
                  key={request.return_id}
                  className="border-b border-zinc-200 hover:bg-gray-100 transition-colors"
                >
                  <td className="px-4 py-3">
                    <span className="font-mono text-emerald-600 text-xs font-bold">
                      {request.return_no}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-gray-700 font-semibold text-xs">
                    {request.to_store_name}
                  </td>

                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {request.sent_by_name || "—"}
                  </td>

                  <td className="px-4 py-3">
                    <span className="bg-gray-100 text-gray-600 text-xs font-mono font-bold px-2 py-0.5 rounded-full">
                      {request.item_count}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-gray-400 text-xs font-mono">
                    {new Date(
                      request.created_at
                    ).toLocaleDateString("en-PK")}
                  </td>

                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${STATUS_COLORS[request.status] ||
                        "bg-gray-100 text-gray-600 border-gray-200"
                        }`}
                    >
                      {request.status}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <button
                      onClick={() =>
                        openDetail(request.return_id)
                      }
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
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
        />
      </div>

      {/* Detail modal */}
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
                  {selected?.from_store_name} →{" "}
                  {selected?.to_store_name}
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
                <div className="text-center py-12 text-gray-400 text-sm">
                  لوڈ ہو رہا ہے...
                </div>
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
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${STATUS_COLORS[selected?.status] ||
                        "bg-gray-100 text-gray-600 border-gray-200"
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
                        <div className="flex">
                          <p className="font-semibold text-gray-800 text-sm">
                            {item.item_name}
                          </p>

                          <p className="font-semibold text-gray-800 text-sm ml-1">
                            ({item.item_name_urdu})
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
                            کل مقدار:{" "}
                            <bdi className="text-emerald-600">
                              {item.return_qty}
                            </bdi>
                          </span>

                          <span className="font-mono font-bold text-sm text-gray-700">
                            اکائی:{" "}
                            <span className="text-emerald-600">
                              {item.item_uom}
                            </span>
                          </span>

                          {item.action_type && (
                            <span
                              className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${STATUS_COLORS[
                                item.action_type
                              ] ||
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

      {/* Return-back modal */}
      {returnBackModal && (
        <ReturnModal
          setReturnBackModal={setReturnBackModal}
          returnBackNote={returnBackNote}
          setReturnBackNote={setReturnBackNote}
          handleReturnBack={handleReturnBack}
          returnBackSubmitting={returnBackSubmitting}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          setPageSize={setItemPageSize}
          allItems={allItems}
          pagination={itemsPagination}
          setItemSearch={setItemSearch}
          setAllItems={setAllItems}
          itemLoading={itemLoading}
        />
      )}
    </div>
  );
}