import { useEffect, useState } from "react";
import {
  getRequests,
  getRequestById,
  fulfillRequesForHOAndPCash,
} from "../services/api";
import { useAuth } from "../context/authContext";
import BlockedUI from "../components/BlockedUI";
import useErrorHandler from "../components/useErrorHandler";
import ExcelDownloaderWithDates from "../components/Exceldownloaderwithdates";
import Pagination from "../components/Pagination";
import { useToast } from "../context/ToastContext";
import RequestDashboard from "../components/RequestDashboard";
import StoreFilters from "../components/StoreFilters";
import TableHead from "../components/TableHead";
import CheckLoadingAndError from "../components/CheckLoadingAndError";
import RequestRow from "../components/RequestRow";
import FulfillModal from "../components/Modals/FulfillModal";

const EMPTY_FULFILL_FORM = {
  driver_name: "",
  driver_no: "",
  vehicle_no: "",
  fulfilled_by_name: "",
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function HeadOffice() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [detail, setDetail] = useState(null);
  const [detailLoad, setDL] = useState(false);
  const [page, setPage] = useState(1);
  const [isEmergency, setIsEmergency] = useState(false);
  const [pageSize, setPageSize] = useState(10);
  const [fulfillModal, setFulfillModal] = useState(null);
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
        search: debouncedSearch,
        emergency: isEmergency || undefined,
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
  }, [filter, page, pageSize, debouncedSearch, isEmergency]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

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
      if (fulfillForm.driver_no.length < 10) {
        return showToast("فون نمبر درست نہیں ہے۔", "error")
      }
      setFulfillForm({ ...fulfillForm, fulfilled_by_name: auth.username })
      await fulfillRequesForHOAndPCash(id, fulfillForm);
      showToast("درخواست پوری کر دی گئی ہے — مین اسٹور ڈیلیوری کی تصدیق کرے گا", "success");
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
  const emergencyRequest = requests.filter((r) => r.is_emergency === true && r.status === "APPROVED").length

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
          emergency: emergencyRequest,
          disputed: disputedCount
        }}
        setIsEmergency={setIsEmergency}
        isEmergency={isEmergency}
        setPage={setPage}
      />

      {/* ── Filter ── */}
      <div className="flex py-2 items-end justify-between">
        <div>
          <div className="flex gap-2">
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="مکمل ریکویسٹ نمبر یا آخری 4 نمبر سے تلاش کریں..."
              title="مکمل ریکویسٹ نمبر یا آخری 4 نمبر سے تلاش کریں..."
              className="bg-white border leading-none border-gray-300 rounded px-3 h-7.5 text-gray-800 text-sm focus:outline-none focus:border-emerald-500 w-80 shadow-sm"
            />
            <StoreFilters
              filterStatus={filter}
              setFilterStatus={(v) => {
                setFilter(v);
                setPage(1);
              }}
              pageType={pageType}
            />
            {(search || filter || isEmergency) && (
              <button
                onClick={() => {
                  setSearch("");
                  setFilter("");
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
            onClick={() => {
              load();
              setPage(1);
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
                { key: "request_no", label: "درخواست نمبر", format: (v) => (v ? v : "—") },
                { key: "requested_by_name", label: "درخواست کنندہ", format: (v) => (v ? v : "—") },
                { key: "fulfilled_by_name", label: "مکمل کرنے والا", format: (v) => (v ? v : "—") },
                {
                  key: "created_at",
                  label: "درخواست کی تاریخ",
                  format: (v) => (v ? new Date(v).toLocaleDateString() : "—"),
                },
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
                { key: "status", label: "حالت", format: (v) => (v ? v : "—") },
              ]}
              pageLoading={loading}
            />
          </div>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
        <table className="w-full text-center text-sm">
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
