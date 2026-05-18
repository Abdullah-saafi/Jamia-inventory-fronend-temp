import { useState } from "react";
import {
  getRequestById,
  fulfillRequest,
  acceptReturnFromSub,
} from "../../services/api";
import StatusBadge from "../StatusBadge";
import { useAuth } from "../../context/authContext";
import useErrorHandler from "../useErrorHandler";
import React from "react";
import ExcelDownloaderWithDates from "../Exceldownloaderwithdates";
import Pagination from "../Pagination";
import DateTimeCell from "../DateTimeCell";
import RenderInlineDetail from "../RenderInlineDetail";
import PendingRequestIndicator from "../PendingRequestIndicator";
import StoreFilters from "../StoreFilters";
import CheckLoadingAndError from "../CheckLoadingAndError";
import RequestDashboard from "../RequestDashboard";
import RequestRow from "../RequestRow";

// ── Main component ────────────────────────────────────────────────────────────
export default function MainSubStoreReqs({
  requests,
  pagination,
  setCurrentPage,
  setPageLimit,
  currentPage,
  onRefresh,
  showToast,
  onFilterChange,
  loading,
  mainStoreError,
}) {
  const [reqFilter, setReqFilter] = useState("APPROVED");
  const [detail, setDetail] = useState(null);
  const [detailLoad, setDL] = useState(false);
  const [fulfilling, setFulfilling] = useState(null);
  const [returnLoading, setReturnLoading] = useState(false);

  const { auth } = useAuth();
  const handleError = useErrorHandler();
  const pageType = "mainSubStoreReqs";

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
      console.log("detail", res.data.data);
      console.log("r", r);
    } catch (error) {
      const msg = handleError(error, "Failed to load data");
      showToast(msg, "error");
    } finally {
      setDL(false);
    }
  };

  const handleFulfill = async (requestId, status) => {
    setFulfilling(requestId);
    try {
      if (status === "DISPUTED") {
        showToast("Cannot fulfill — dispute resolution required", "error");
        return;
      }
      await fulfillRequest(requestId);
      showToast("Request fulfilled and inventory updated", "success");
      setDetail(null);
      onRefresh();
    } catch (e) {
      const msg = handleError(e, "Failed to fulfill");
      showToast(msg, "error");
    } finally {
      setFulfilling(null);
    }
  };

  const handleAcceptReturn = async (id) => {
    try {
      setReturnLoading(true);
      const response = await getRequestById(id);
      const accepted_by_name = auth.username;
      const requestId = response.data.data.request_id;
      console.log("requesid", requestId);
      await acceptReturnFromSub(requestId, accepted_by_name);
      showToast("Return accepted successfully", "success");
      onRefresh();
    } catch (error) {
      const msg = handleError(error, "Failed to fulfill");
      showToast(msg, "error");
    } finally {
      setReturnLoading(false);
    }
  };

  const handleResolved = () => {
    setDetail(null);
    onRefresh();
  };
  const disputedCount = requests.filter((r) => r.status === "DISPUTED").length;
  const approvedCount = requests.filter((r) => r.status === "APPROVED").length;
  const returnBack = requests.filter((r) => r.status === "RETURN_BACK").length;

  return (
    <div>
      <RequestDashboard
        pageType={pageType}
        setFilterStatus={(v) => {
          setReqFilter(v);
          setCurrentPage(1);
          onFilterChange(v);
        }}
        filterStatus={reqFilter}
        data={requests}
        counts={{
          pending: approvedCount,
          disputed: disputedCount,
          returnBack: returnBack,
        }}
      />

      <div className="flex h-full py-2 items-end justify-between">
        <div>
          <StoreFilters
            filterStatus={reqFilter}
            setFilterStatus={(v) => {
              setReqFilter(v);
              setCurrentPage(1);
              onFilterChange(v);
            }}
            pageType={pageType}
          />
          <button
            onClick={() => {
              setCurrentPage(1);
              onRefresh();
            }}
            className="text-gray-500 hover:text-gray-800 text-sm px-3 py-2 border border-gray-300 rounded hover:bg-gray-50 shadow-sm flex items-center mt-3"
          >
            ↻ Refresh
          </button>
        </div>

        <div className="Temp-downloader">
          <div className="downloader">
            <ExcelDownloaderWithDates
              data={requests}
              dateKey="created_at"
              fileName={auth.username}
              columns={[
                { key: "request_id", label: "درخواست نمبر" },
                { key: "i.item_no", label: "test" },
                // {}
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
            <tr className="bg-gray-50 border-b border-gray-200">
              {[
                "درخواست نمبر",
                "اسٹور سے",
                " مرکزی اسٹور کو   ",
                "درخواست کنندہ",
                "منظور کنندہ",
                "مکمل کرنے والا",
                "درخواست کی تاریخ",
                "تکمیل کی تاریخ",
                "حالت",
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
            {loading || mainStoreError || requests.length === 0 ? (
              <CheckLoadingAndError
                loading={loading}
                error={mainStoreError}
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
                  handleAcceptReturn={handleAcceptReturn}
                  returnLoading={returnLoading}
                  handleResolved={handleResolved}
                  showToast={showToast}
                  username={auth.username}
                />
              ))
              // requests.map((r) => {
              //   const isExpanded = detail && detail.request_id === r.request_id; // Check
              //   const isDisputed = r.status === "DISPUTED"; // Check
              //   const isReceived = r.status === "RECEIVED"; // issue
              //   const isClosed = r.status === "CLOSED"; // dont know
              //   const isEmergency = r.is_emergency; // check

              //   return (
              //     <React.Fragment key={r.request_id}>
              //       <tr
              //         className={`border-b border-gray-100 cursor-pointer transition-colors ${
              //           isEmergency && r.status === "APPROVED"
              //             ? "bg-red-50/60 hover:bg-red-50"
              //             : isDisputed
              //               ? "bg-amber-50/50 hover:bg-amber-50"
              //               : isReceived
              //                 ? "bg-teal-50/30 hover:bg-teal-50"
              //                 : isClosed
              //                   ? "bg-gray-50/50 hover:bg-gray-100"
              //                   : "hover:bg-gray-50"
              //         } ${isExpanded ? "bg-gray-50" : ""}`}
              //         onClick={() => openDetail(r)}
              //       >
              //         <td className="px-4 py-3">
              //           <div className="flex items-center gap-2 flex-wrap">
              //             <span className="font-mono text-emerald-600 text-xs font-bold">
              //               {r.request_no}
              //             </span>
              //             {/* Emergency badge */}
              //             {isEmergency && (
              //               <span className="bg-red-100 text-red-600 text-xs font-bold rounded px-1.5 py-0.5 border border-red-200">
              //                 URGENT
              //               </span>
              //             )}
              //           </div>
              //         </td>
              //         <td className="px-4 py-3 text-gray-700">
              //           {r.from_store_name}
              //         </td>
              //         <td className="px-4 py-3 text-gray-700">
              //           {r.to_store_name}
              //         </td>
              //         <td className="px-4 py-3 text-gray-500">
              //           {r.requested_by_name || "—"}
              //         </td>
              //         <td className="px-4 py-3 text-gray-500">
              //           {r.approved_by_name || "—"}
              //         </td>
              //         <td className="px-4 py-3 text-gray-500">
              //           {r.fulfilled_by_name || "—"}
              //         </td>
              //         <td className="px-4 py-3 text-gray-500">
              //           <DateTimeCell ts={r.created_at} />
              //         </td>
              //         <td className="px-4 py-3 text-gray-700">
              //           <DateTimeCell ts={r.fulfilled_at} />
              //         </td>
              //         <td className="px-4 py-3">
              //           <StatusBadge status={r.status} />
              //         </td>
              //         <td className="px-4 py-3">
              //           <div className="flex gap-1 items-center">
              //             <span
              //               className={`text-xs ${isExpanded ? "text-emerald-600" : "text-gray-400"}`}
              //             >
              //               {isExpanded ? "▲ Hide" : "▼ View"}
              //             </span>
              //             {r.status === "APPROVED" && (
              //               <button
              //                 onClick={(e) => {
              //                   e.stopPropagation();
              //                   handleFulfill(r.request_id);
              //                 }}
              //                 className={`text-white text-sm font-semibold px-2.5 ml-2 py-1.5 rounded disabled:opacity-40 ${
              //                   isEmergency
              //                     ? "bg-red-500 hover:bg-red-600"
              //                     : "bg-blue-600 hover:bg-blue-500"
              //                 }`}
              //                 disabled={fulfilling === r.request_id}
              //               >
              //                 {fulfilling === r.request_id ? "..." : "Fulfill"}
              //               </button>
              //             )}
              //             {r.item_type === "REUSABLE" &&
              //               r.status === "RETURN_BACK" && (
              //                 <button
              //                   onClick={(e) => {
              //                     e.stopPropagation();
              //                     handleAcceptReturn(r.request_id);
              //                   }}
              //                   className="text-xs bg-orange-400 hover:bg-orange-300 text-white rounded-lg px-3 py-1.5 font-semibold transition-colors disabled:opacity-40 whitespace-nowrap"
              //                   disabled={returnLoading}
              //                 >
              //                   {fulfilling === r.request_id
              //                     ? "..."
              //                     : "Accept Return"}
              //                 </button>
              //               )}
              //           </div>
              //         </td>
              //       </tr>
              //       {isExpanded && (
              //         <tr
              //           className={`border-b-2 ${
              //             isEmergency && r.status === "APPROVED"
              //               ? "bg-red-50/20 border-red-300"
              //               : isDisputed
              //                 ? "bg-amber-50/20 border-amber-300"
              //                 : isReceived
              //                   ? "bg-teal-50/20 border-teal-300"
              //                   : isClosed
              //                     ? "bg-gray-50 border-gray-300"
              //                     : "bg-gray-50 border-emerald-200"
              //           }`}
              //         >
              //           <td colSpan={10} className="px-6 py-4">
              //             {detailLoad ? (
              //               <div className="flex justify-center py-6">
              //                 <div className="w-6 h-6 border-2 border-gray-200 border-t-emerald-500 rounded-full animate-spin" />
              //               </div>
              //             ) : (
              //               detail &&
              //               RenderInlineDetail(
              //                 detail,
              //                 detailLoad,
              //                 handleFulfill,
              //                 fulfilling,
              //                 handleResolved,
              //                 showToast,
              //                 auth.username,
              //               )
              //             )}
              //           </td>
              //         </tr>
              //       )}
              //     </React.Fragment>
              //   );
              // })
            )}
          </tbody>
        </table>
      </div>

      {/* Main Pagination */}
      <div className="mt-4">
        <Pagination
          currentPage={pagination.currentPage}
          totalItems={pagination.totalItems}
          pageSize={pagination.pageLimit}
          onPageChange={setCurrentPage}
          pageSizeOptions={[10, 25, 50]}
          onPageSizeChange={(s) => {
            setPageLimit(s);
            setCurrentPage(1);
          }}
        />
      </div>
    </div>
  );
}
