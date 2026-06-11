import { useEffect, useState } from "react";
import {
  getRequests,
  getRequestById,
  acceptReturn,
  resendItems,
  fulfillRequest,
} from "../services/api";
import { useAuth } from "../context/authContext";
import Toast from "../components/Toast";
import BlockedUI from "../components/BlockedUI";
import useErrorHandler from "../components/useErrorHandler";
import ExcelDownloaderWithDates from "../components/Exceldownloaderwithdates";
import Pagination from "../components/Pagination";
import StatusBadge from "../components/StatusBadge";
import DateTimeCell from "../components/DateTimeCell";
import { useToast } from "../context/ToastContext";
import DisputeResolutionPanel from "../components/DisputeResolutionPanel"
import RequestDashboard from "../components/RequestDashboard";
import StoreFilters from "../components/StoreFilters";
import TableHead from "../components/TableHead";
import CheckLoadingAndError from "../components/CheckLoadingAndError";
import RequestRow from "../components/RequestRow";
import FulfillModal from "../components/FulfillModal";

const
  EMPTY_FULFILL_FORM = {
    driver_name: "",
    driver_no: "",
    vehicle_no: "",
  }

// ── Main Component ────────────────────────────────────────────────────────────
export default function HeadOffice() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("");
  const [detail, setDetail] = useState(null);
  const [detailLoad, setDL] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [fulfillModal, setFulfillModal] = useState(null);
  const [fulfillMode, setFulfillMode] = useState("fulfill");
  const [fulfilledItems, setFulfilledItems] = useState([]);
  const [fulfillerName, setFulfillerName] = useState("");
  const [fulfillNotes, setFulfillNotes] = useState("");
  const [fulfilling, setFulfilling] = useState(false);
  const [requestNo, setRequestNo] = useState(null);
  const [fulfillForm, setFulfillForm] = useState({ ...EMPTY_FULFILL_FORM })
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
  const pageType = "headOffice"

  const load = async () => {
    setLoading(true);
    try {
      const params = {
        direction: "MAIN_TO_HO",
        page,
        limit: pageSize,
      };
      if (filter) params.status = filter;
      const r = await getRequests(params);

      setRequests(r.data.data);
      setPagination(
        r.data.pagination || {
          currentPage: 1,
          pageLimit: pageSize,
          totalItems: r.data.data.length,
        }
      );
    } catch (error) {
      const msg = handleError(error, "Failed to load requests");
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [filter, page, pageSize]);

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
      const msg = handleError(error, "Failed to load data", "error");
      showToast(msg, "error");
    } finally {
      setDL(false);
    }
  };

  const handleFulfill = async (id) => {
    setFulfilling(id);
    try {
      await fulfillRequest(id, fulfillForm);
      showToast(fulfillMode === "refulfill"
        ? "Re-dispatched — Main Store will verify the corrected delivery"
        : "Request fulfilled — Main Store will verify delivery", "success");
      setFulfillModal(false)
      setFulfillForm({ ...EMPTY_FULFILL_FORM })
      load();
    } catch (e) {
      const msg = handleError(e, "Error fulfilling request");
      showToast(msg, "error");
    } finally {
      setFulfilling(null);
    }
  };

  const handleResolved = () => {
    setDetail(null);
    load();
  };

  const pendingFulfill = requests.filter((r) => r.status === "APPROVED").length;
  const disputedCount = requests.filter((r) => r.status === "DISPUTED").length;

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
            ہیڈ آفس — مین اسٹور کی منظور شدہ درخواست کو پورا کریں
          </p>
        </div>
      </div>

      <RequestDashboard
        pageType={pageType}
        setFilterStatus={setFilter}
        filterStatus={filter}
        counts={{
          pending: pendingFulfill,
          returnBack: 0,
          emergency: 0,
          disputed: disputedCount
        }}
      />

      {/* ── Filter ── */}
      <div className="flex h-full py-2 items-end justify-between">
        <div>
          <StoreFilters
            filterStatus={filter}
            setFilterStatus={(v) => {
              setFilter(v);
              setPage(1);
            }}
            pageType={pageType}
          />
          <button
            onClick={() => {
              setFilter("");
              setPage(1);
              load();
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
      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
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
                  pageType={pageType}
                  handleFulfill={handleFulfill}
                  fulfilling={fulfilling}
                  handleResolved={handleResolved}
                  showToast={showToast}
                  setFulfillModal={setFulfillModal}
                  setRequestNo={setRequestNo}
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
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
        />
      </div>

      {fulfillModal && (
        <FulfillModal
          pageType={pageType}
          setFulfillForm={setFulfillForm}
          setFulfillModal={setFulfillModal}
          fulfillForm={fulfillForm}
          requestNo={requestNo}
          fulfilling={fulfilling}
          handleFulfill={handleFulfill}
          EMPTY_FULFILL_FORM={EMPTY_FULFILL_FORM}
        />
      )}
    </div>
  );
}
