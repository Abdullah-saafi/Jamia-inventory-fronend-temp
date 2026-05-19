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
import StoreFilters from "../StoreFilters";
import CheckLoadingAndError from "../CheckLoadingAndError";
import RequestDashboard from "../RequestDashboard";
import RequestRow from "../RequestRow";
import TableHead from "../TableHead";

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
            <TableHead pageType={pageType}/>
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
