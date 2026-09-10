import { useEffect, useState } from "react";
import {
  getRequests,
  getRequestById,
  approveRequest,
  rejectRequest,
  rejectItemById,
  getStores,
  getItemHistory,
} from "../services/api";
import ExcelDownloaderWithDates from "../components/Exceldownloaderwithdates";
import { useAuth } from "../context/authContext";
import { useToast } from "../context/ToastContext";
import BlockedUI from "../components/BlockedUI";
import useErrorHandler from "../components/useErrorHandler";
import Pagination from "../components/Pagination";
import RequestDashboard from "../components/RequestDashboard";
import StoreFilters from "../components/StoreFilters";
import TableHead from "../components/TableHead";
import CheckLoadingAndError from "../components/CheckLoadingAndError";
import ApproveRejectModal from "../components/Modals/ApproveRejectModal";
import RequestRow from "../components/RequestRow";
import ItemHistoryModal from "../components/Modals/ItemHistoryModal";
import { buildAndDownloadExcel } from "../services/useExcelExport";
import { mainStoreApproverColumns } from "../services/columnsForExcel";

// ── Main component ────────────────────────────────────────────────────────────
export default function MainStoreApprover() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [detail, setDetail] = useState(null);
  const [detailLoad, setDL] = useState(false);
  const [approveModal, setApproveModal] = useState(null);
  const [approverName, setApproverName] = useState("");
  const [editedItems, setEditedItems] = useState([]);
  const [actioning, setActioning] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejecterName, setRejecterName] = useState("");
  const [currentStore, setCurrentStore] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [page, setPage] = useState(1);
  const [isEmergency, setIsEmergency] = useState(false);
  const [pageSize, setPageSize] = useState(10);
  const [rejectSpecificItem, setRejectSpecificItem] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(null);
  const [itemHistory, setItemHistory] = useState({ itemNo: null, rows: [] });
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  const { auth } = useAuth();
  const { showToast } = useToast()

  const handleError = useErrorHandler();
  const pageType = "mainStoreApprover"

  const load = async () => {
    setLoading(true);
    try {
      const params = { direction: ["MAIN_TO_PCASH", "MAIN_TO_HO"], search: debouncedSearch, emergency: isEmergency || undefined, priority_status: "PENDING" };
      if (filterStatus) params.status = filterStatus;
      const r = await getRequests(params);
      setRequests(r.data.data);
    } catch (error) {
      const msg = handleError(error, "Failed to load requests");
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [filterStatus, debouncedSearch, isEmergency]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const response = await getStores()
        setCurrentStore(response.data.data.filter((s) => s.store_name === auth.storeName))
      } catch (e) {
        const msg = handleError(e, "Failed to get stores")
        showToast(msg, "error")
      }
    };

    fetchStores();
  }, []);

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const response = await getStores();
        setCurrentStore(response.data.data.filter((s) => s.store_name === auth.storeName));
      } catch (e) {
        const msg = handleError(e, "Failed to get stores");
        showToast(msg, "error");
      }
    };
    fetchStores();
  }, []);

  const openDetail = async (r) => {
    if (detail && detail.request_id === r.request_id) {
      setDetail(null);
      return;
    }
    setDL(true);
    setDetail({ ...r, items: [] });
    try {
      const res = await getRequestById(r.request_id);
      setDetail(res.data.data);
    } catch (error) {
      const msg = handleError(error, "Failed to load data");
      showToast(msg, "error");
    } finally {
      setDL(false);
    }
  };

  const openApprove = async (request_id, request_no) => {
    try {
      setActioning(request_id);
      const res = await getRequestById(request_id);
      setEditedItems(
        (res.data.data.items || []).map((i) => ({
          ...i,
          approved_qty: i.requested_qty,
        })),
      );
      setApproveModal({
        id: request_id,
        no: request_no
      });
      setApproverName(auth.username || "");
    } catch (error) {
      const msg = handleError(error, "Failed to load items");
      showToast(msg, "error");
    } finally {
      setActioning(null);
    }
  };

  const openReject = async (r) => {
    try {
      setActioning(r.request_id);
      const res = await getRequestById(r.request_id);
      setRejectModal(res.data.data);
      setRejecterName(auth.username || "");
      setRejectReason("");
    } catch (error) {
      const msg = handleError(error, "Failed to load request");
      showToast(msg, "error");
    } finally {
      setActioning(null);
    }
  };

  const handleApprove = async () => {
    if (!approverName.trim()) return;
    setActioning(true);
    try {
      await approveRequest(approveModal.id, {
        approved_by_name: approverName,
        approved_items: editedItems.map((i) => ({
          request_item_id: i.request_item_id,
          approved_qty: i.approved_qty,
        })),
      });
      showToast("درخواست منظور کر دی گئی ہے — ہیڈ آفس کا انتظار کریں", "success");
      setApproveModal(null);
      setApproverName("");
      setEditedItems([]);
      load();
    } catch (e) {
      const msg = handleError(e, "Error approving");
      showToast(msg, "error");
    } finally {
      setActioning(false);
    }
  };

  const rejectItem = async (id, rid) => {
    try {
      setRejectSpecificItem(rid)
      await rejectItemById(id, rid)
      openApprove(id, approveModal.no)
    } catch (error) {
      const msg = handleError(error, "Error approving");
      showToast(msg, "error");
    } finally {
      setRejectSpecificItem(null)
    }
  }

  const handleReject = async () => {
    if (!rejecterName.trim() || !rejectReason.trim()) return;
    setActioning(true);
    try {
      await rejectRequest(rejectModal.request_id, {
        approved_by_name: rejecterName,
        rejection_reason: rejectReason,
      });
      showToast("درخواست مسترد کر دی گئی ہے", "info");
      setRejectModal(null);
      setRejecterName("");
      setRejectReason("");
      load();
    } catch (e) {
      const msg = handleError(e, "Error rejecting");
      showToast(msg, "error");
    } finally {
      setActioning(false);
    }
  };

  const openHistory = async (item_no) => {
    try {
      setHistoryLoading(item_no)
      const storeId = (currentStore && currentStore[0] && currentStore[0].store_id) ? currentStore[0].store_id : auth.store_id;
      if (!storeId) {
        showToast("Store information unavailable", "error");
        return;
      }
      const response = await getItemHistory(storeId, item_no);
      if (!response || !response.data) {
        showToast("Server Error: empty response", "error");
        return;
      }
      if (response.data.success === false) {
        showToast(response.data.message || "Server Error", "error");
        return;
      }
      const data = response.data.data || {};
      setItemHistory({ itemNo: item_no, rows: data.history || [] });
      setHistoryModalOpen(true);
    } catch (e) {
      const msg = handleError(e, "Error fetching history");
      showToast(msg, "error");
    } finally {
      setHistoryLoading(null)
    }
  }

  const buildBaseParams = () => {
    const params = {
      direction: ["MAIN_TO_PCASH", "MAIN_TO_HO"],
      priority_status: "PENDING",
    };
    if (filterStatus) params.status = filterStatus;
    if (auth.role !== "super admin") {
      params.store_id = auth.store_id;
    } else if (filterStore) {
      params.store_id = filterStore;
    }
    return params;
  };

  const fetchRequestsForExport = async (fromDate, toDate) => {
    const rRes = await getRequests({
      ...buildBaseParams(),
      from_date: fromDate,
      to_date: toDate,
    });
    return rRes.data.data;

  };

  const handleExportAllRequests = async () => {
    setExportLoading(true);
    try {
      const rRes = await getRequests(buildBaseParams());
      buildAndDownloadExcel(rRes.data.data, mainStoreApproverColumns, `${auth.username}'s All Requests`);
    } catch (err) {
      const msg = handleError(err, "Failed to export all requests");
      showToast(msg, "error");
      return [];
    } finally {
      setExportLoading(false);
    }
  };

  const pendingCount = requests.filter((r) => r.status === "PENDING").length;
  const emergencyRequest = requests.filter((r) => r.is_emergency === true).length

  if (auth.isBlocked) {
    return <BlockedUI message={auth.message} />;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-black text-gray-900">{auth.username}</h1>
          <span className="text-gray-500 text-xs mt-0.5 bg-gray-200 rounded p-1">{auth.storeName || "loading..."}</span>
          <p className="text-gray-500 text-sm mt-0.5">
            مین اسٹور کی طرف سے ہیڈ آفس یا پیٹی کیش کو بھیجی گئی درخواستوں کو منظور یا مسترد کریں
          </p>
        </div>
      </div>

      {/* ── Pending alert ── */}
      <RequestDashboard
        pageType={pageType}
        setFilterStatus={setFilterStatus}
        filterStatus={filterStatus}
        counts={{
          pending: pendingCount,
          returnBack: 0,
          emergency: emergencyRequest,
          disputed: 0
        }}
        setPage={setPage}
        setIsEmergency={setIsEmergency}
        isEmergency={isEmergency}
      />

      {/* ── Filter ── */}
      <div className="flex h-full py-2 items-end justify-between">
        <div>
          <div className="flex gap-2">
            <input
              dir="ltr"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="مکمل ریکویسٹ نمبر یا آخری 4 نمبر سے تلاش کریں..."
              title="مکمل ریکویسٹ نمبر یا آخری 4 نمبر سے تلاش کریں..."
              className="bg-white border leading-none border-gray-300 rounded px-3 h-7.5 text-gray-800 text-sm focus:outline-none focus:border-emerald-500 w-52 shadow-sm"
            />
            <StoreFilters
              filterStatus={filterStatus}
              setFilterStatus={setFilterStatus}
              pageType={pageType}
            />
            {(search || filterStatus || isEmergency) && (
              <button
                onClick={() => {
                  setSearch("");
                  setFilterStatus("");
                  setPage(1);
                  setDebouncedSearch("")
                  setIsEmergency(false)
                }}
                className="text-gray-500 hover:text-gray-800 text-sm px-3 h-7.5 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          <button
            dir="ltr"
            onClick={() => {
              setPage(1)
              load()
            }}
            className="text-gray-500 hover:text-gray-800 text-sm px-3 py-2 border border-gray-300 rounded hover:bg-gray-50 shadow-sm flex items-center mt-3"
          >
            ↻ Refresh
          </button>
        </div>

        <div className="Temp-downloader">
          {/* Excel specific Date Downloader */}
          <div className="downloader">
            <ExcelDownloaderWithDates
              onFetch={fetchRequestsForExport}
              handleExportAll={handleExportAllRequests}
              exportLoading={exportLoading}
              dateKey="created_at"
              fileName={auth.username}
              columns={mainStoreApproverColumns}
              pageLoading={loading}
            />
          </div>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="overflow-x-auto text-center rounded-lg border border-gray-200 shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <TableHead
              pageType={pageType}
            />
          </thead>
          <tbody>
            {(loading || error || requests.length === 0) ? (
              <CheckLoadingAndError
                loading={loading}
                error={error}
                requests={requests}
              />
            ) : (
              requests.map((r) => (
                <RequestRow
                  r={r}
                  detail={detail}
                  detailLoad={detailLoad}
                  openDetail={openDetail}
                  actioning={actioning}
                  openApprove={openApprove}
                  openReject={openReject}
                  pageType={pageType}
                />
              ))
            )}
          </tbody>
        </table>
        <Pagination
          currentPage={page}
          totalItems={requests.length}
          pageSize={pageSize}
          onPageChange={setPage}
          pageSizeOptions={[10, 25, 50]}
          onPageSizeChange={setPageSize}
        />
        <ItemHistoryModal
          open={historyModalOpen}
          onClose={() => setHistoryModalOpen(false)}
          itemNo={itemHistory.itemNo}
          history={itemHistory.rows}
        />
      </div>

      {/* ── Approve Modal ── */}
      {approveModal && (
        <ApproveRejectModal
          setApproveModal={setApproveModal}
          approveModal={approveModal}
          approverName={approverName}
          setApproverName={setApproverName}
          editedItems={editedItems}
          setEditedItems={setEditedItems}
          actioning={actioning}
          handleApprove={handleApprove}
          handleReject={handleReject}
          rejectItem={rejectItem}
          rejectSpecificItem={rejectSpecificItem}
          action={"Approve"}
          openHistory={openHistory}
          historyLoading={historyLoading}
        />
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <ApproveRejectModal
          setRejectModal={setRejectModal}
          rejectModal={rejectModal}
          rejecterName={rejecterName}
          setRejecterName={setRejecterName}
          rejectReason={rejectReason}
          setRejectReason={setRejectReason}
          actioning={actioning}
          handleReject={handleReject}
          action={"Reject"}
        />
      )}
    </div>
  );
}
