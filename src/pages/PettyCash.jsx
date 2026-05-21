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

// ── Main Component ────────────────────────────────────────────────────────────
export default function PettyCash() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [filter, setFilter] = useState("");
    const [detail, setDetail] = useState(null);
    const [detailLoad, setDL] = useState(false);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Fulfill modal state
    const [fulfillModal, setFulfillModal] = useState(null);
    const [referenceNo, setReferenceNo] = useState("");
    const [requestNo, setRequestNo] = useState(null);
    const [fulfillMode, setFulfillMode] = useState("fulfill");
    const [fulfilledItems, setFulfilledItems] = useState([]);
    const [fulfillerName, setFulfillerName] = useState("");
    const [fulfillNotes, setFulfillNotes] = useState("");
    const [actioning, setActioning] = useState(false);

    const { auth } = useAuth();
    const {showToast} = useToast()
    const handleError = useErrorHandler();

    const load = async () => {
        setLoading(true);
        try {
            const params = { direction: "MAIN_TO_PCASH" };
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
            showToast(msg,"error");
        } finally {
            setDL(false);
        }
    };

    const handleFulfill = async (id, ref_no) => {
        setActioning(true);
        try {
            console.log("id",id);
            console.log("ref_no",ref_no);
            
            await fulfillRequest(id,{ref_no});
            showToast(fulfillMode === "refulfill"
                        ? "Re-dispatched — Main Store will verify the corrected delivery"
                        : "Request fulfilled — Main Store will verify delivery", "success");
            setFulfillModal(false)
            load();
        } catch (e) {
            const msg = handleError(e, "Error fulfilling request");
            showToast(msg,"error");
        } finally {
            setActioning(false);
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

    const paginatedRequests = requests.slice(
        (page - 1) * pageSize,
        page * pageSize,
    );

    return (
        <div>
            {/* ── Header ── */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl font-black text-gray-900">{auth.username}</h1>
                    <p className="text-gray-500 text-sm mt-0.5">
                        Petty Cash — fulfill approved Main Store requests
                    </p>
                </div>
            </div>

            {/* ── Alert banners ── */}
            {pendingFulfill > 0 && filter !== "APPROVED" && (
                <div className="mb-3 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 flex items-center justify-between">
                    <span className="text-emerald-700 text-sm font-semibold" dir="rtl">
                        {pendingFulfill} منظور شدہ{" "}
                        {pendingFulfill > 1 ? "درخواستیں مکمل کرنے" : "درخواست مکمل کرنے"}{" "}
                        کے لیے تیار {pendingFulfill > 1 ? "ہیں" : "ہے"}
                    </span>
                    <button
                        onClick={() => setFilter("APPROVED")}
                        className="text-xs border border-gray-300 text-gray-600 hover:text-gray-900 rounded px-3 py-1"
                    >
                        Show Approved
                    </button>
                </div>
            )}

            {disputedCount > 0 && (
                <div
                    className="mb-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-amber-100 transition-colors"
                    onClick={() => setFilter("DISPUTED")}
                >
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse inline-block" />
                        <span className="text-amber-700 text-sm font-semibold">
                            {disputedCount} disputed deliver{disputedCount > 1 ? "ies" : "y"}{" "}
                            — Main Store reported issues
                        </span>
                    </div>
                    <span className="text-amber-500 text-xs">View →</span>
                </div>
            )}

            {/* ── Filter ── */}
            <div className="flex h-full py-2 items-end justify-between">
                <div>
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="bg-white border border-gray-300 rounded px-3 py-2 text-gray-700 text-sm focus:outline-none focus:border-emerald-500"
                    >
                        <option value="">تمام حالتیں</option>
                        <option value="PENDING">زیر التواء</option>
                        <option value="APPROVED">منظور شدہ</option>
                        <option value="REJECTED">مسترد شدہ</option>
                        <option value="FULFILLED">مکمل شدہ</option>
                        <option value="RECEIVED">موصول شدہ</option>
                        <option value="DISPUTED">متنازع</option>
                        <option value="CLOSED">بند شدہ</option>
                    </select>
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
                        <tr className="bg-gray-50 border-b border-gray-200">
                            {[
                                "درخواست نمبر",
                                "درخواست کنندہ",
                                "درخواست کا وقت",
                                "حالت",
                                "منظوری کا وقت",
                                "مکمل ہونے کا وقت",
                                "عملیات",
                            ].map((h) => (
                                <th
                                    key={h}
                                    className="text-left px-4 py-3 text-gray-500 font-semibold text-xs uppercase tracking-wider"
                                >
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {loading || error || requests.length === 0 ? (
                            <CheckLoadingAndError
                                loading={loading}
                                error={error}
                                requests={requests}
                            />
                        ) : (
                            paginatedRequests.map((r) => {
                                const isExpanded = detail && detail.request_id === r.request_id;
                                const canFulfill = r.status === "APPROVED";
                                const isDisputed = r.status === "DISPUTED";
                                const isReceived = r.status === "RECEIVED";
                                const isClosed = r.status === "CLOSED";
                                const hasGRN = isDisputed || isReceived || isClosed;

                                return (
                                    <>
                                        <tr
                                            key={r.request_id}
                                            className={`border-b border-gray-100 cursor-pointer transition-colors ${canFulfill
                                                ? "bg-emerald-50/30 hover:bg-emerald-50"
                                                : isDisputed
                                                    ? "bg-amber-50/40 hover:bg-amber-50"
                                                    : isReceived
                                                        ? "bg-teal-50/30 hover:bg-teal-50"
                                                        : isClosed
                                                            ? "bg-gray-50/50 hover:bg-gray-100"
                                                            : "hover:bg-gray-50"
                                                } ${isExpanded ? "bg-gray-50" : ""}`}
                                            onClick={() => openDetail(r)}
                                        >
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="font-mono text-emerald-600 text-xs font-bold">
                                                        {r.request_no}
                                                    </span>
                                                    {r.item_count > 0 && (
                                                        <span className="bg-gray-100 text-gray-500 text-xs font-mono rounded px-1.5 py-0.5 border border-gray-200">
                                                            {r.item_count} item{r.item_count > 1 ? "s" : ""}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-gray-600">
                                                {r.requested_by_name || "—"}
                                            </td>
                                            <td className="px-4 py-3">
                                                <DateTimeCell ts={r.requested_at || r.created_at} />
                                            </td>
                                            <td className="px-4 py-3">
                                                <StatusBadge status={r.status} />
                                            </td>
                                            <td className="px-4 py-3">
                                                <DateTimeCell ts={r.approved_at} />
                                            </td>
                                            <td className="px-4 py-3">
                                                <DateTimeCell ts={r.fulfilled_at} />
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex gap-1 items-center">
                                                    <span
                                                        className={`text-xs ${isExpanded ? "text-emerald-600" : "text-gray-400"}`}
                                                    >
                                                        {isExpanded ? "▲ Hide" : "▼ تفصیلات"}
                                                    </span>
                                                    {canFulfill && (
                                                        <button
                                                            disabled={actioning}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setFulfillModal(true)
                                                                setRequestNo(r)
                                                            }}
                                                            className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-2.5 ml-2 py-1.5 rounded disabled:opacity-40"
                                                        >
                                                            {actioning ? "..." : "Fulfill"}
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>

                                        {/* ── Expanded detail ── */}
                                        {isExpanded && (
                                            <tr
                                                key={r.request_id + "-detail"}
                                                className={`border-b-2 ${isDisputed
                                                    ? "bg-amber-50/20 border-amber-300"
                                                    : isReceived
                                                        ? "bg-teal-50/20 border-teal-300"
                                                        : isClosed
                                                            ? "bg-gray-50 border-gray-300"
                                                            : "bg-gray-50 border-emerald-200"
                                                    }`}
                                            >
                                                <td colSpan={7} className="px-6 py-4">
                                                    {detailLoad ? (
                                                        <div className="flex justify-center py-6">
                                                            <div className="w-6 h-6 border-2 border-gray-200 border-t-emerald-500 rounded-full animate-spin" />
                                                        </div>
                                                    ) : (
                                                        detail && (
                                                            <div className="space-y-4">
                                                                {/* Receipt confirmed banner */}
                                                                {isReceived && (
                                                                    <div className="bg-teal-50 border border-teal-200 rounded-xl p-3">
                                                                        <div className="text-teal-600 text-xs font-bold uppercase tracking-wider mb-1">
                                                                            ✓ Main Store Confirmed Receipt
                                                                        </div>
                                                                        {detail.grn_note && (
                                                                            <div className="text-teal-700 text-sm">
                                                                                {detail.grn_note}
                                                                            </div>
                                                                        )}
                                                                        {detail.grn_at && (
                                                                            <div className="text-teal-400 text-xs mt-1">
                                                                                {new Date(
                                                                                    detail.grn_at,
                                                                                ).toLocaleString()}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}

                                                                {/* Closed banner */}
                                                                {isClosed && (
                                                                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                                                                        <div className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">
                                                                            Case Closed
                                                                        </div>
                                                                        <div className="text-gray-600 text-sm">
                                                                            Resolution:{" "}
                                                                            <span className="font-semibold">
                                                                                {detail.resolution === "RETURN_ACCEPTED"
                                                                                    ? "Return accepted — stock restored"
                                                                                    : detail.resolution === "RESENT"
                                                                                        ? "Fresh items resent via new request"
                                                                                        : detail.resolution}
                                                                            </span>
                                                                        </div>
                                                                        {detail.resolved_by_name && (
                                                                            <div className="text-gray-400 text-xs mt-1">
                                                                                By {detail.resolved_by_name}
                                                                            </div>
                                                                        )}
                                                                        {detail.resolved_at && (
                                                                            <div className="text-gray-400 text-xs">
                                                                                {new Date(
                                                                                    detail.resolved_at,
                                                                                ).toLocaleString()}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}

                                                                {detail.notes && (
                                                                    <div className="bg-white rounded p-3 border border-gray-200">
                                                                        <div className="text-gray-400 text-xs mb-1">
                                                                            NOTES
                                                                        </div>
                                                                        <div className="text-gray-700 text-sm">
                                                                            {detail.notes}
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {/* Items table */}
                                                                <div>
                                                                    <table className="w-full text-sm">
                                                                        <thead>
                                                                            <tr className="border-b border-gray-200 text-gray-400 text-xs">
                                                                                <th className="text-left pb-2 pr-4">
                                                                                    چیز نمبر
                                                                                </th>
                                                                                <th className="text-left pb-2 pr-4">
                                                                                    چیز کا نام
                                                                                </th>
                                                                                <th className="text-left pb-2 pr-4">
                                                                                    پیمائش کی اکائی
                                                                                </th>
                                                                                <th className="text-center pb-2 pr-4">
                                                                                    درخواست کردہ
                                                                                </th>
                                                                                <th className="text-center pb-2 pr-4">
                                                                                    منظور شدہ
                                                                                </th>
                                                                                <th className="text-center pb-2 pr-4">
                                                                                    مکمل شدہ
                                                                                </th>
                                                                                {hasGRN && (
                                                                                    <>
                                                                                        <th className="text-center pb-2 pr-4">
                                                                                            موصول شدہ
                                                                                        </th>
                                                                                        <th className="text-center pb-2">
                                                                                            حالت
                                                                                        </th>
                                                                                    </>
                                                                                )}
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            {(detail.items || []).map((i) => {
                                                                                const hasItemIssue =
                                                                                    (i.item_condition &&
                                                                                        i.item_condition !== "OK") ||
                                                                                    (i.received_qty != null &&
                                                                                        Number(i.received_qty) <
                                                                                        Number(i.fulfilled_qty));
                                                                                return (
                                                                                    <tr
                                                                                        key={i.request_item_id}
                                                                                        className={`border-b border-gray-100 ${hasItemIssue ? "bg-amber-50/50" : ""}`}
                                                                                    >
                                                                                        <td className="py-2 pr-4 font-mono text-emerald-600 text-xs">
                                                                                            {i.item_no}
                                                                                        </td>
                                                                                        <td className="py-2 pr-4 text-gray-800">
                                                                                            {i.item_name}
                                                                                        </td>
                                                                                        <td className="py-2 pr-4 text-gray-400 text-xs">
                                                                                            {i.item_uom}
                                                                                        </td>
                                                                                        <td className="py-2 pr-4 font-mono text-gray-800 text-center">
                                                                                            {i.requested_qty}
                                                                                        </td>
                                                                                        <td className="py-2 pr-4 font-mono text-center">
                                                                                            <span
                                                                                                className={
                                                                                                    i.approved_qty != null
                                                                                                        ? "text-emerald-600"
                                                                                                        : "text-gray-300"
                                                                                                }
                                                                                            >
                                                                                                {i.approved_qty ?? "—"}
                                                                                            </span>
                                                                                        </td>
                                                                                        <td className="py-2 pr-4 font-mono text-center">
                                                                                            <span
                                                                                                className={
                                                                                                    i.fulfilled_qty != null
                                                                                                        ? "text-blue-600"
                                                                                                        : "text-gray-300"
                                                                                                }
                                                                                            >
                                                                                                {i.fulfilled_qty ?? "—"}
                                                                                            </span>
                                                                                        </td>
                                                                                        {hasGRN && (
                                                                                            <>
                                                                                                <td className="py-2 pr-4 font-mono text-center">
                                                                                                    <span
                                                                                                        className={
                                                                                                            i.received_qty != null
                                                                                                                ? Number(
                                                                                                                    i.received_qty,
                                                                                                                ) <
                                                                                                                    Number(
                                                                                                                        i.fulfilled_qty,
                                                                                                                    )
                                                                                                                    ? "text-amber-600 font-bold"
                                                                                                                    : "text-teal-600"
                                                                                                                : "text-gray-300"
                                                                                                        }
                                                                                                    >
                                                                                                        {i.received_qty ?? "—"}
                                                                                                    </span>
                                                                                                </td>
                                                                                                <td className="py-2 text-center">
                                                                                                    {i.item_condition ? (
                                                                                                        <span
                                                                                                            className={`px-2 py-0.5 rounded border text-xs font-bold font-mono ${i.item_condition ===
                                                                                                                "OK"
                                                                                                                ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                                                                                                                : i.item_condition ===
                                                                                                                    "DAMAGED"
                                                                                                                    ? "bg-amber-50 border-amber-300 text-amber-700"
                                                                                                                    : "bg-red-50 border-red-300 text-red-700"
                                                                                                                }`}
                                                                                                        >
                                                                                                            {i.item_condition}
                                                                                                        </span>
                                                                                                    ) : (
                                                                                                        <span className="text-gray-300">
                                                                                                            —
                                                                                                        </span>
                                                                                                    )}
                                                                                                </td>
                                                                                            </>
                                                                                        )}
                                                                                    </tr>
                                                                                );
                                                                            })}
                                                                        </tbody>
                                                                    </table>
                                                                </div>

                                                                {/* ── Dispute Resolution Panel (same as MainSubStoreReqs) ── */}
                                                                {isDisputed && (
                                                                    <DisputeResolutionPanel
                                                                        request={detail}
                                                                        onResolved={handleResolved}
                                                                        showToast={showToast}
                                                                        managerName={auth.username}
                                                                    />
                                                                )}

                                                                {detail.status === "FULFILLED" && (
                                                                    <div className="bg-blue-50 border border-blue-200 rounded p-3 text-blue-700 text-xs">
                                                                        ✓ Fulfilled — waiting for Main Store to
                                                                        verify delivery.
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )
                                                    )}
                                                </td>
                                            </tr>
                                        )}
                                    </>
                                );
                            })
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

            {/* ── Fulfill / Re-dispatch Modal ── */}
            {fulfillModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/30"
                        onClick={() => {
                            setFulfillModal(null)
                            setReferenceNo("")
                        }}
                    />
                    <div className="relative bg-white border border-gray-200 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
                            <h2 className="text-gray-900 font-bold">
                                Fulfill — {requestNo.request_no}
                            </h2>
                            <button
                                onClick={() => {
                                    setFulfillModal(null)
                                    setReferenceNo("")
                                }}
                                className="text-gray-400 hover:text-gray-700 text-xl"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div>
                                <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider block mb-1">
                                    Reference Number *
                                </label>
                                <input
                                    type="text"
                                    value={referenceNo}
                                    onChange={(e) => {
                                        setReferenceNo(e.target.value)
                                    }}
                                    className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm outline-none"
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
                                <button
                                    onClick={() => {
                                        setFulfillModal(null)
                                        setReferenceNo("")
                                    }}
                                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold px-4 py-2 rounded"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        handleFulfill(requestNo.request_id, referenceNo)
                                    }}
                                    disabled={
                                        actioning
                                    }
                                    className="text-white text-sm font-semibold px-4 py-2 rounded disabled:opacity-40 bg-emerald-600 hover:bg-emerald-500">
                                    {actioning
                                        ? "Processing..."
                                        : "Confirm Fulfill"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
