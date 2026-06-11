import { useEffect, useState } from "react";
import {
  getRequests,
  getRequestById,
  approveRequest,
  rejectRequest,
  rejectItemById,
  getItemHistory,
  getStores,
} from "../services/api";
import { useAuth } from "../context/authContext";
import Toast from "../components/Toast";
import BlockedUI from "../components/BlockedUI";
import useErrorHandler from "../components/useErrorHandler";
import ExcelDownloaderWithDates from "../components/Exceldownloaderwithdates";
import Pagination from "../components/Pagination";
import StoreFilters from "../components/StoreFilters";
import RequestRow from "../components/RequestRow";
import ApproveRejectModal from "../components/ApproveRejectModal";
import TableHead from "../components/TableHead";
import CheckLoadingAndError from "../components/CheckLoadingAndError";
import RequestDashboard from "../components/RequestDashboard";
import { useToast } from "../context/ToastContext";
import ItemHistoryModal from "../components/ItemHistoryModal";

export default function SubStoreManager() {
  const [requests, setRequests] = useState([]);
  const [allRequests, setAllRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterStore, setFilterStore] = useState("");
  const [subStores, setSubStores] = useState([]);
  const [currentStore, setCurrentStore] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoad, setDL] = useState(false);
  const [approveModal, setApproveModal] = useState(null);
  const [approverName, setApproverName] = useState("");
  const [editedItems, setEditedItems] = useState([]);
  const [actioning, setActioning] = useState(null);
  const [rejectSpecificItem, setRejectSpecificItem] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejecterName, setRejecterName] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [itemHistory, setItemHistory] = useState({ itemNo: null, rows: [] });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageLimit: 10,
    totalItems: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const { auth } = useAuth();
  const { showToast } = useToast()
  const handleError = useErrorHandler();

  const pageType = "subStoreManager";

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const load = async () => {
    setLoading(true);
    try {
      const params = {
        direction: "SUB_TO_MAIN",
        page,
        limit: pageSize,
      };
      if (filterStatus) params.status = filterStatus;
      if (auth.role !== "super admin" && auth.store_id)
        params.store_id = auth.store_id;
      if (auth.role === "super admin" && filterStore)
        params.store_id = filterStore;
      const r = await getRequests(params);
      if (!filterStatus) {
        setAllRequests(r.data.data)
      }
      setRequests(r.data.data || []);
      setPagination(r.data.pagination);
    } catch (error) {
      const msg = handleError(error, "Failed to load requests");
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [filterStatus, filterStore, auth.store_id, page, pageSize,]);

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const response = await getStores()
        setSubStores(response.data.data.filter((s) => s.store_type === "SUB_STORE"))
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
      showToast("درخواست منظور کر دی گئی ہے — مین اسٹور کا انتظار کریں", "success");
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
      showToast("درخواست مسترد کر دی گئی ہے", "success");
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
    } finally{
      setHistoryLoading(null)
    }
  }

  const pendingCount = allRequests.filter((r) => r.status === "PENDING").length;

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
            اسٹاف کی آئٹم درخواستوں کا جائزہ لیں اور انہیں منظور یا مسترد کریں
          </p>
        </div>
      </div>

      <RequestDashboard
        pageType={pageType}
        setFilterStatus={setFilterStatus}
        filterStatus={filterStatus}
        counts={{
          pending: pendingCount,
          returnBack: 0,
          emergency: 0,
          disputed: 0
        }}
      />

      <div className="flex h-full py-2  items-end justify-between">
        <div className="Filter">
          <StoreFilters
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            pageType={pageType}
            filterStore={filterStore}
            setFilterStore={setFilterStore}
            role={auth.role}
            subStores={subStores}
          />
          <button
            onClick={load}
            className="text-gray-500 hover:text-gray-800 text-sm px-3 py-2 border border-gray-300 rounded ml-auto hover:bg-gray-50 shadow-sm"
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
        <ItemHistoryModal
          open={historyModalOpen}
          onClose={() => setHistoryModalOpen(false)}
          itemNo={itemHistory.itemNo}
          history={itemHistory.rows}
        />
      </div>

      {/* Approve Modal */}
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
