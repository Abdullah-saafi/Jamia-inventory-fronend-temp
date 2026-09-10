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
import CheckLoadingAndError from "../components/CheckLoadingAndError";
import { useToast } from "../context/ToastContext";
import FulfillModal from "../components/Modals/FulfillModal";
import RequestDashboard from "../components/RequestDashboard";
import StoreFilters from "../components/StoreFilters";
import TableHead from "../components/TableHead";
import RequestRow from "../components/RequestRow";
import { pettyCashColumns } from "../services/columnsForExcel";
import { buildAndDownloadExcel } from "../services/useExcelExport";

// ── Main Component ────────────────────────────────────────────────────────────
export default function PettyCash() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [detail, setDetail] = useState(null);
  const [detailLoad, setDL] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isEmergency, setIsEmergency] = useState(false);
  const [fulfillModal, setFulfillModal] = useState(null);
  const [referenceNo, setReferenceNo] = useState("");
  const [requestNo, setRequestNo] = useState(null);
  const [fulfilling, setFulfilling] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
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
  const pageType = "pettyCash"

  const load = async () => {
    setLoading(true);
    try {
      const params = {
        direction: "MAIN_TO_PCASH",
        priority_status: "APPROVED",
        page,
        limit: pageSize,
        search: debouncedSearch,
        emergency: isEmergency || undefined,
      };
      if (filterStatus) params.status = filterStatus;
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
  }, [filterStatus, page, pageSize, debouncedSearch, isEmergency]);

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

  const handleFulfill = async (id, ref_no) => {
    setFulfilling(id);
    try {
      await fulfillRequesForHOAndPCash(id, { ref_no, fulfilled_by_name: auth.username });
      showToast("درخواست پوری کر دی گئی ہے — مین اسٹور ڈیلیوری کی تصدیق کرے گا", "success");
      setFulfillModal(false)
      load();
    } catch (e) {
      const msg = handleError(e, "Error fulfilling request");
      showToast(msg, "error");
    } finally {
      setFulfilling(null);
      setReferenceNo("")
    }
  };

  const handleResolved = () => {
    setDetail(null);
    load();
  };

  const buildBaseParams = () => {
    const params = {
      direction: "MAIN_TO_PCASH",
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
      buildAndDownloadExcel(rRes.data.data, pettyCashColumns, `${auth.username} All Requests`);
    } catch (err) {
      const msg = handleError(err, "Failed to export all requests");
      showToast(msg, "error");
      return [];
    } finally {
      setExportLoading(false);
    }
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
            پیٹی کیش — مین اسٹور کی منظور شدہ درخواست کو پورا کریں
          </p>
        </div>
      </div>

      {/* ── Alert banners ── */}
      <RequestDashboard
        pageType={pageType}
        setFilterStatus={setFilterStatus}
        filterStatus={filterStatus}
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
              setFilterStatus={(v) => {
                setFilterStatus(v)
                setPage(1)
              }}
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
              onFetch={fetchRequestsForExport}
              handleExportAll={handleExportAllRequests}
              exportLoading={exportLoading}
              dateKey="created_at"
              fileName={auth.username}
              columns={pettyCashColumns}
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
            {loading || error || requests.length === 0 ? (
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

      {/* ── Fulfill / Re-dispatch Modal ── */}
      {fulfillModal && (
        <FulfillModal
          pageType={pageType}
          setFulfillModal={setFulfillModal}
          requestNo={requestNo}
          referenceNo={referenceNo}
          handleFulfill={handleFulfill}
          fulfilling={fulfilling}
          setReferenceNo={setReferenceNo}
        />
      )}

    </div>
  );
}