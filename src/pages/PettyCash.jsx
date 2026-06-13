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
import CheckLoadingAndError from "../components/CheckLoadingAndError";
import DisputeResolutionPanel from "../components/DisputeResolutionPanel";
import { useToast } from "../context/ToastContext";
import FulfillModal from "../components/FulfillModal";
import RequestDashboard from "../components/RequestDashboard";
import StoreFilters from "../components/StoreFilters";
import TableHead from "../components/TableHead";
import RequestRow from "../components/RequestRow";

// ── Main Component ────────────────────────────────────────────────────────────
export default function PettyCash() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [filter, setFilter] = useState("");
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
    const [fulfillMode, setFulfillMode] = useState("fulfill");
    const [fulfilledItems, setFulfilledItems] = useState([]);
    const [fulfillerName, setFulfillerName] = useState("");
    const [fulfillNotes, setFulfillNotes] = useState("");
    const [fulfilling, setFulfilling] = useState(false);
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

    const handleFulfill = async (id, ref_no) => {
        setFulfilling(id);
        try {
            await fulfillRequest(id, { ref_no, fulfilled_by_name: auth.username });
            showToast(fulfillMode === "refulfill"
                ? "دوبارہ روانہ کر دیا گیا ہے — مین اسٹور درست شدہ ڈیلیوری کی تصدیق کرے گا"
                : "درخواست پوری کر دی گئی ہے — مین اسٹور ڈیلیوری کی تصدیق کرے گا", "success");
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

    const pendingFulfill = requests.filter((r) => r.status === "APPROVED").length;
    const disputedCount = requests.filter((r) => r.status === "DISPUTED").length;
    const emergencyRequest = requests.filter((r) => r.is_emergency === true).length

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
            <div className="flex h-full py-2 items-end justify-between">
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
                            className="bg-white border leading-none border-gray-300 rounded px-3 h-7.5 text-gray-800 text-sm focus:outline-none focus:border-emerald-500 w-52 shadow-sm"
                        />
                        <StoreFilters
                            filterStatus={filter}
                            setFilterStatus={(v) => {
                                setFilter(v)
                                setPage(1)
                            }}
                            pageType={pageType}
                        />
                        {(search || filter) || isEmergency && (
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

            {/* ── Fulfill / Re-dispatch Modal ── */}
            {fulfillModal && (
                <FulfillModal
                    pageType={pageType}
                    setRequestNo={setRequestNo}
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