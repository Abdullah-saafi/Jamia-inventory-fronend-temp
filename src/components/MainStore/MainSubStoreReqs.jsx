import { useState } from "react";
import {
  getRequestById,
  fulfillRequest,
  acceptReturnFromSub,
  scrapByMain,
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

// ── Main component ────────────────────────────────────────────────────────────
export default function MainSubStoreReqs({
  requests,
  onRefresh,
  setToast,
  loading,
  mainStoreError,
}) {
  const [reqFilter, setReqFilter] = useState("APPROVED");
  const [detail, setDetail] = useState(null);
  const [detailLoad, setDL] = useState(false);
  const [fulfilling, setFulfilling] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [returnLoading, setReturnLoading] = useState(false)
  const [scrapLoading, setScrapLoading] = useState(false)

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
    } catch (error) {
      const msg = handleError(error, "Failed to load data");
      setToast({ message: msg, type: "error" });
    } finally {
      setDL(false);
    }
  };

  const handleFulfill = async (requestId, status) => {
    setFulfilling(requestId);
    try {
      if (status === "DISPUTED") {
        setToast({
          message: "Cannot fulfill — dispute resolution required",
          type: "error",
        });
        return;
      }
      await fulfillRequest(requestId);
      setToast({
        message: "Request fulfilled and inventory updated",
        type: "success",
      });
      setDetail(null);
      onRefresh();
    } catch (e) {
      const msg = handleError(e, "Failed to fulfill");
      setToast({ message: msg, type: "error" });
    } finally {
      setFulfilling(null);
    }
  };

  const handleAcceptReturn = async (id) => {
    try {
      setReturnLoading(true)
      const response = await getRequestById(id)
      const accepted_by_name = auth.username
      const requestId = response.data.data.request_id;
      console.log("requesid", requestId);
      await acceptReturnFromSub(requestId, accepted_by_name)
      setToast({ message: "Return accepted successfully", type: "success" });
      onRefresh();
    } catch (error) {
      const msg = handleError(error, "Failed to fulfill");
      setToast({ message: msg, type: "error" });
    } finally {
      setReturnLoading(false)
    }
  }

  const handleScrap = async (data) => {
    try {
      setScrapLoading(true);
      const response = await getRequestById(data.request_id)
      const requestDetails = response.data.data;

      const formattedItems = requestDetails.items.map(item => ({
        item_no: item.item_no,
        quantity: item.requested_scrap_qty,
        store_id: requestDetails.from_store_id,
      }));

      console.log("response main sub store reqs", response);
      console.log("requestDetails main sub store reqs", requestDetails);
      console.log("formatted items main sub store reqs", formattedItems);
      console.log("formatted items items main sub store reqs", requestDetails.items);




      await scrapByMain({
        main_store_id: auth.store_id,
        removed_by: auth.username,
        items: formattedItems,
        id: requestDetails.request_id
      });

      // setScrapLoading(false);

      setToast({ message: "Items scrapped successfully", type: "success" });

      // setScrapForm({
      //   sendByName: "",
      //   requestData: null,
      //   note: "",
      //   scrap_items: [],
      // });

      // load();
      onRefresh()
    } catch (error) {
      const msg = handleError(error, "Failed to scrap items");
      setToast({ message: msg, type: "error" });
    } finally {
      setScrapLoading(false);
    }
  };

  const handleResolved = () => {
    setDetail(null);
    onRefresh();
  };

  const filtered = Array.isArray(requests)
    ? reqFilter
      ? requests.filter((r) => r.status === reqFilter)
      : requests
    : [];

  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = (filtered || []).slice(
    startIndex,
    startIndex + pageSize,
  );

  const disputedCount = requests.filter((r) => r.status === "DISPUTED").length;
  const approvedCount = requests.filter((r) => r.status === "APPROVED").length;
  const emergencyCount = requests.filter((r) => r.is_emergency && r.status === "APPROVED",).length;
  const returnBack = requests.filter((r) => r.status === "RETURN_BACK").length

  const COL_COUNT = 10;

  return (
    <div>
      <RequestDashboard
        pageType={pageType}
        setFilterStatus={setReqFilter}
        filterStatus={reqFilter}
        data={paginatedData}
        counts={{
          pending: approvedCount,
          emergency: emergencyCount,
          disputed: disputedCount,
          returnBack: returnBack
        }}
      />

      <div className="flex h-full py-2 items-end justify-between">
        <div>
          <StoreFilters
            filterStatus={reqFilter}
            setFilterStatus={(v) => {
              setReqFilter(v)
              setCurrentPage(1)
            }}
            pageType={pageType}
          />
          <button
            onClick={() => {
              setCurrentPage(1)
              onRefresh()
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
            {(loading || mainStoreError || filtered.length === 0) ? (
              <CheckLoadingAndError
                loading={loading}
                error={mainStoreError}
                requests={filtered}
              />
            ) : (
              paginatedData.map((r) => {
                const isExpanded = detail && detail.request_id === r.request_id;
                const isDisputed = r.status === "DISPUTED";
                const isReceived = r.status === "RECEIVED";
                const isClosed = r.status === "CLOSED";
                const isEmergency = r.is_emergency;

                return (
                  <React.Fragment key={r.request_id}>
                    <tr
                      className={`border-b border-gray-100 cursor-pointer transition-colors ${isEmergency && r.status === "APPROVED"
                        ? "bg-red-50/60 hover:bg-red-50"
                        : isDisputed
                          ? "bg-amber-50/50 hover:bg-amber-50"
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
                          {/* Emergency badge */}
                          {isEmergency && (
                            <span className="bg-red-100 text-red-600 text-xs font-bold rounded px-1.5 py-0.5 border border-red-200">
                              URGENT
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {r.from_store_name}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {r.to_store_name}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {r.requested_by_name || "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {r.approved_by_name || "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {r.fulfilled_by_name || "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        <DateTimeCell ts={r.created_at} />
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        <DateTimeCell ts={r.fulfilled_at} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 items-center">
                          <span
                            className={`text-xs ${isExpanded ? "text-emerald-600" : "text-gray-400"}`}
                          >
                            {isExpanded ? "▲ Hide" : "▼ View"}
                          </span>
                          {r.status === "APPROVED" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleFulfill(r.request_id);
                              }}
                              className={`text-white text-sm font-semibold px-2.5 ml-2 py-1.5 rounded disabled:opacity-40 ${isEmergency
                                ? "bg-red-500 hover:bg-red-600"
                                : "bg-blue-600 hover:bg-blue-500"
                                }`}
                              disabled={fulfilling === r.request_id}
                            >
                              {fulfilling === r.request_id ? "..." : "Fulfill"}
                            </button>
                          )}
                          {r.status === "RETURN_BACK" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAcceptReturn(r.request_id);
                              }}
                              className="text-xs bg-orange-400 hover:bg-orange-300 text-white rounded-lg px-3 py-1.5 font-semibold transition-colors disabled:opacity-40 whitespace-nowrap"
                              disabled={returnLoading}
                            >
                              {fulfilling === r.request_id ? "..." : "Accept Return"}
                            </button>
                          )}
                          {r.status === "SCRAPPED" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleScrap(r);
                                console.log("Requesti ddd", r);

                              }}
                              disabled={scrapLoading}
                              className="text-xs bg-orange-400 hover:bg-orange-300 text-white rounded-lg px-3 py-1.5 font-semibold transition-colors disabled:opacity-40 whitespace-nowrap"
                            >
                              {scrapLoading ? "..." : "Accept Scrap"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr
                        className={`border-b-2 ${isEmergency && r.status === "APPROVED"
                          ? "bg-red-50/20 border-red-300"
                          : isDisputed
                            ? "bg-amber-50/20 border-amber-300"
                            : isReceived
                              ? "bg-teal-50/20 border-teal-300"
                              : isClosed
                                ? "bg-gray-50 border-gray-300"
                                : "bg-gray-50 border-emerald-200"
                          }`}
                      >
                        <td colSpan={COL_COUNT} className="px-6 py-4">
                          {detailLoad ? (
                            <div className="flex justify-center py-6">
                              <div className="w-6 h-6 border-2 border-gray-200 border-t-emerald-500 rounded-full animate-spin" />
                            </div>
                          ) : (
                            detail &&
                            RenderInlineDetail(
                              detail,
                              detailLoad,
                              handleFulfill,
                              fulfilling,
                              handleResolved,
                              setToast,
                              auth.username,
                            )
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Main Pagination */}
      <div className="mt-4">
        <Pagination
          currentPage={currentPage}
          totalItems={filtered?.length || 0}
          pageSize={pageSize || 10}
          onPageChange={setCurrentPage}
          pageSizeOptions={[10, 25, 50]}
          onPageSizeChange={(s) => {
            setPageSize(s);
            setCurrentPage(1);
          }}
        />
      </div>
    </div>
  );
}
