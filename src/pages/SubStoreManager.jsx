import { useEffect, useState } from "react";
import {
  getRequests,
  getRequestById,
  approveRequest,
  rejectRequest,
} from "../services/api";
import { useAuth } from "../context/authContext";
import Toast from "../components/Toast";
import BlockedUI from "../components/BlockedUI";
import useErrorHandler from "../components/useErrorHandler";
import ExcelDownloaderWithDates from "../components/Exceldownloaderwithdates";
import Pagination from "../components/Pagination";
import StoreFilters from "../components/StoreFilters";
import PendingRequestIndicator from "../components/PendingRequestIndicator";
import RequestRow from "../components/RequestRow";
import ApproveRejectModal from "../components/ApproveRejectModal";
import TableHead from "../components/TableHead";
import CheckLoadingAndError from "../components/CheckLoadingAndError";
import RequestDashboard from "../components/RequestDashboard";

export default function SubStoreManager() {
  const [requests, setRequests] = useState([]);
  const [allRequests, setAllRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterStore, setFilterStore] = useState("");
  const [subStores, setSubStores] = useState([]);
  const [detail, setDetail] = useState(null);
  const [detailLoad, setDL] = useState(false);
  const [approveModal, setApproveModal] = useState(null);
  const [approverName, setApproverName] = useState("");
  const [editedItems, setEditedItems] = useState([]);
  const [actioning, setActioning] = useState(false);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejecterName, setRejecterName] = useState("");
  const [rejectReason, setRejectReason] = useState("");

  const { auth } = useAuth();
  const handleError = useErrorHandler();

  const pageType = "subStoreManager";

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setTimeout(() => setToast(null), 7000);
  }, [toast]);

  const load = async () => {
    setLoading(true);
    try {
      const params = { direction: "SUB_TO_MAIN" };
      if (filterStatus) params.status = filterStatus;
      if (auth.role !== "super admin" && auth.store_id)
        params.store_id = auth.store_id;
      if (auth.role === "super admin" && filterStore)
        params.store_id = filterStore;
      const r = await getRequests(params);
      if (!filterStatus) {
        setAllRequests(r.data.data)
      }
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
  }, [filterStatus, filterStore, auth.store_id]);

  useEffect(() => {
    if (auth.role === "super admin") {
      import("../services/api").then(({ getStores }) => {
        getStores()
          .then((res) =>
            setSubStores(
              res.data.data.filter((s) => s.store_type === "SUB_STORE"),
            ),
          )
          .catch(() => { });
      });
    }
  }, [auth.role]);

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
      setToast({ message: msg, type: "error" });
    } finally {
      setDL(false);
    }
  };

  const openApprove = async (r) => {
    try {
      setActioning(true);
      const res = await getRequestById(r.request_id);
      setEditedItems(
        (res.data.data.items || []).map((i) => ({
          ...i,
          approved_qty: i.requested_qty,
        })),
      );
      setApproveModal(r);
      setApproverName(auth.username || "");
    } catch (error) {
      const msg = handleError(error, "Failed to load items");
      setToast({ message: msg, type: "error" });
    } finally {
      setActioning(false);
    }
  };

  const openReject = async (r) => {
    try {
      setActioning(true);
      const res = await getRequestById(r.request_id);
      setRejectModal(res.data.data);
      setRejecterName(auth.username || "");
      setRejectReason("");
    } catch (error) {
      const msg = handleError(error, "Failed to load request");
      setToast({ message: msg, type: "error" });
    } finally {
      setActioning(false);
    }
  };

  const handleApprove = async () => {
    if (!approverName.trim()) return;
    setActioning(true);
    try {
      console.log("Approver modal", approveModal);
      console.log("edited items", editedItems);

      await approveRequest(approveModal.request_id, {
        approved_by_name: approverName,
        approved_items: editedItems.map((i) => ({
          request_item_id: i.request_item_id,
          approved_qty: i.approved_qty,
        })),
      });
      setToast({
        message: "Request approved — waiting for Main Store Manager",
        type: "success",
      });
      setApproveModal(null);
      setApproverName("");
      setEditedItems([]);
      load();
    } catch (e) {
      const msg = handleError(e, "Error approving");
      setToast({ message: msg, type: "error" });
    } finally {
      setActioning(false);
    }
  };

  const handleReject = async () => {
    if (!rejecterName.trim() || !rejectReason.trim()) return;
    setActioning(true);
    try {
      await rejectRequest(rejectModal.request_id, {
        approved_by_name: rejecterName,
        rejection_reason: rejectReason,
      });
      setToast({ message: "Request rejected" });
      setRejectModal(null);
      setRejecterName("");
      setRejectReason("");
      load();
    } catch (e) {
      const msg = handleError(e, "Error rejecting");
      setToast({ message: msg, type: "error" });
    } finally {
      setActioning(false);
    }
  };

  const paginatedRequests = requests.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );

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
            Review and approve or reject staff item requests
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

      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <TableHead />
          </thead>
          <tbody>
            {(loading || error || paginatedRequests.length === 0) ? (
              <CheckLoadingAndError
                loading={loading}
                error={error}
                requests={paginatedRequests}
              />
            ) : (
              paginatedRequests.map((r) => (
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
          action={"Approve"}
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

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
