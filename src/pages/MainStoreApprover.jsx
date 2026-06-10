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
import StatusBadge from "../components/StatusBadge"
import DateTimeCell from "../components/DateTimeCell"
import RequestDashboard from "../components/RequestDashboard";
import StoreFilters from "../components/StoreFilters";
import TableHead from "../components/TableHead";
import CheckLoadingAndError from "../components/CheckLoadingAndError";
import ApproveRejectModal from "../components/ApproveRejectModal";
import RequestRow from "../components/RequestRow";
import ItemHistoryModal from "../components/ItemHistoryModal";

// ── Main component ────────────────────────────────────────────────────────────
export default function MainStoreApprover() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("");
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
  const [pageSize, setPageSize] = useState(10);
  const [rejectSpecificItem, setRejectSpecificItem] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(null);
  const [itemHistory, setItemHistory] = useState({ itemNo: null, rows: [] });
  const [historyModalOpen, setHistoryModalOpen] = useState(false);

  const { auth } = useAuth();
  const { showToast } = useToast()

  const handleError = useErrorHandler();
  const pageType = "mainStoreApprover"

  const load = async () => {
    setLoading(true);
    try {
      const params = { direction: ["MAIN_TO_PCASH", "MAIN_TO_HO"] };
      if (filter) params.status = filter;
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
  }, [filter]);

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
      openApprove(id)
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

  const pendingCount = requests.filter((r) => r.status === "PENDING").length;

  if (auth.isBlocked) {
    return <BlockedUI message={auth.message} />;
  }

  return (
    <div>
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-black text-gray-900">{auth.username}</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            مین اسٹور کی طرف سے ہیڈ آفس یا پیٹی کیش کو بھیجی گئی درخواستوں کو منظور یا مسترد کریں
          </p>
        </div>
      </div>

      {/* ── Pending alert ── */}
      <RequestDashboard
        pageType={pageType}
        setFilterStatus={setFilter}
        filterStatus={filter}
        counts={{
          pending: pendingCount,
          returnBack: 0,
          emergency: 0,
          disputed: 0
        }}
      />

      {/* ── Filter ── */}
      <div className="flex h-full py-2 items-end justify-between">
        <div>
          <StoreFilters
            filterStatus={filter}
            setFilterStatus={setFilter}
            pageType={pageType}
          />

          <button
            onClick={() => {
              setFilter("")
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
              data={requests}
              dateKey="created_at"
              fileName={auth.username}
              columns={[
                { key: "request_id", label: "درخواست نمبر" },
                { key: "requested_by_name", label: "درخواست کنندہ" },
                {
                  key: "created_at",
                  label: "درخواست کی تاریخ",
                  format: (v) => (v ? new Date(v).toLocaleDateString() : "—"),
                },
                { key: "status", label: "حالت" },
                {
                  key: "approved_at",
                  label: "منظوری کی تاریخ",
                  format: (v) => (v ? new Date(v).toLocaleDateString() : "—"),
                },
                {
                  key: "fulfilled_at",
                  label: "تکمیل کی تاریخ",
                  format: (v) => (v ? new Date(v).toLocaleDateString() : "—"),
                },
              ]}
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
                  key={r.request_id}
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
          rejectItem={rejectItem}
          rejectSpecificItem={rejectSpecificItem}
          handleApprove={handleApprove}
          handleReject={handleReject}
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
