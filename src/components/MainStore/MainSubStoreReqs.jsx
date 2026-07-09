import { useState } from "react";
import {
  getRequestById,
  fulfillRequest,
  acceptReturnFromSub,
  createRequest,
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
import InstantRestockModal from "../InstantRestockModal";
import InstantRequestPopup from "../InstantRequestPopup";

const EMPTY_LINE = {
  selected_item_no: "",
  item_search: "",
  _showDropdown: false,
  item_no: "",
  item_name: "",
  item_uom: "",
  requested_qty: 1,
  images: [],
};

const EMPTY_FORM = {
  from_store_id: "",
  to_store_id: "",
  requested_by_name: "",
  notes: "",
  is_emergency: false,
  items: [{ ...EMPTY_LINE }],
};

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
  toStore,
  setSearch,
  search,
  setDebouncedSearch,
}) {
  const [reqFilter, setReqFilter] = useState("");
  const [detail, setDetail] = useState(null);
  const [detailLoad, setDL] = useState(false);
  const [fulfilling, setFulfilling] = useState(null);
  const [returnLoading, setReturnLoading] = useState(false);
  const [showInstantRequestModal, setShowInstantRequestModal] = useState(false);
  const [itemForm, setItemForm] = useState({ ...EMPTY_FORM });
  const [creating, setCreating] = useState(false);
  const [showInstantRequestPopup, setShowInstantRequestPopup] = useState(false);
  const [lowStockRequest, setLowStockRequest] = useState(null)

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
      showToast(msg, "error");
    } finally {
      setDL(false);
    }
  };

  const getDetail = async (requestId) => {
    try {
      const res = await getRequestById(requestId);
      setItemForm((prev) => ({
        ...prev,
        items: res.data.data.items.map(item => ({
          ...item,
          images: []
        }))
      }))
      setShowInstantRequestModal(true)
    } catch (error) {
      const msg = handleError(error, "Failed to load data");
      showToast(msg, "error");
    } finally {
      setDL(false);
    }
  };

  const handleFulfill = async (requestId, status,) => {
    setFulfilling(requestId);
    try {
      if (status === "DISPUTED") {
        showToast("Cannot fulfill — dispute resolution required", "error");
        return;
      }
      await fulfillRequest(requestId, { fulfilled_by_name: auth.username });
      showToast("درخواست پوری کر دی گئی اور انوینٹری اپڈیٹ ہو گئی ہے", "success");
      setDetail(null);
      onRefresh();
    } catch (e) {
      const msg = handleError(e, "Failed to fulfill");
      if (msg.includes("Cannot fulfill: stock is low for item")) {
        setLowStockRequest(requestId);
        setShowInstantRequestPopup(true)
        return
      }
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

  const handleCreate = async () => {
    const {
      from_store_id,
      to_store_id,
      requested_by_name,
      items,
    } = itemForm;

    const itemLines = items.filter((i) => i.item_no);
    const hasItems = itemLines.length > 0;

    const isUOMMissing = itemLines.some(
      (i) => i.item_type === "USABLE" && !i.item_uom,
    );
    if (!from_store_id || !to_store_id || !requested_by_name)
      return showToast("Please fill all required fields", "error");
    if (!hasItems && !hasAssets)
      return showToast("Add at least one item or one asset", "error");
    if (
      itemLines.some((i) => !i.item_name || isUOMMissing || i.requested_qty < 1)
    )
      return showToast("Check item details", "error");

    setCreating(true);
    try {
      const selectedStore = toStore.find(
        (s) => s.store_id === itemForm.to_store_id
      )

      const stype = (selectedStore?.store_type || "").toUpperCase();
      const sname = (selectedStore?.store_name || "").toLowerCase();
      const direction =
        stype === "PETTYCASH" || sname.includes("petty") || sname.includes("پٹی")
          ? "MAIN_TO_PCASH"
          : "MAIN_TO_HO";

      const payload = {
        from_store_id,
        to_store_id,
        requested_by_name,
        notes: itemForm.notes,
        is_emergency: itemForm.is_emergency,
        direction,
        items: itemLines.map(
          ({ selected_item_no, item_search, _showDropdown, ...rest }) => rest,
        ),
      };

      await createRequest(payload);
      showToast("درخواست کامیابی سے جمع کر دی گئی۔", "success");
      setShowInstantRequestModal(false)
      setItemForm({ ...EMPTY_FORM });
      onRefresh();
    } catch (e) {
      const msg = handleError(e, "Failed to load request details");
      showToast(msg, "error");
    } finally {
      setCreating(false);
    }
  };

  const removeLine = (idx) =>
    setItemForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));

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
        setPage={setCurrentPage}
      />

      <div className="flex py-2 items-end justify-between">
        <div>
          <div className="flex gap-2">
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="مکمل ریکویسٹ نمبر یا آخری 4 نمبر سے تلاش کریں..."
              title="مکمل ریکویسٹ نمبر یا آخری 4 نمبر سے تلاش کریں..."
              className="bg-white border leading-none border-gray-300 rounded px-3 h-7.5 text-gray-800 text-sm focus:outline-none focus:border-emerald-500 w-52 shadow-sm"
            />
            <StoreFilters
              filterStatus={reqFilter}
              setFilterStatus={(v) => {
                setReqFilter(v);
                setCurrentPage(1);
                onFilterChange(v);
              }}
              pageType={pageType}
            />
            {(search || reqFilter) && (
              <button
                onClick={() => {
                  setSearch("");
                  setReqFilter("");
                  setCurrentPage(1);
                  setDebouncedSearch("")

                }}
                className="text-gray-500 hover:text-gray-800 text-sm px-3 h-7.5 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
          <button
            onClick={() => {
              onRefresh();
              setCurrentPage(1);
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
                { key: "request_no", label: "درخواست نمبر", format: (v) => (v ? v : "—") },
                { key: "from_store_name", label: "اسٹور سے", format: (v) => (v ? v : "—") },
                { key: "to_store_name", label: "مرکزی اسٹور کو", format: (v) => (v ? v : "—") },
                { key: "requested_by_name", label: "درخواست کنندہ", format: (v) => (v ? v : "—") },
                { key: "approved_by_name", label: "منظور کنندہ", format: (v) => (v ? v : "—") },
                { key: "fulfilled_by_name", label: "مکمل کرنے والا", format: (v) => (v ? v : "—") },
                { key: "created_at", label: "درخواست کی تاریخ", format: (v) => (v ? new Date(v).toLocaleDateString() : "—"), },
                { key: "fulfilled_at", label: "تکمیل کی تاریخ", format: (v) => (v ? new Date(v).toLocaleDateString() : "—"), },
                { key: "status", label: "حالت", format: (v) => (v ? v : "—") },
              ]}
              pageLoading={loading}
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto text-center rounded-lg border border-gray-200 shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <TableHead pageType={pageType} />
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
                  setItemForm={setItemForm}
                  EMPTY_LINE={EMPTY_LINE}
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
      {showInstantRequestModal && (
        <InstantRestockModal
          setItemForm={setItemForm}
          itemForm={itemForm}
          onClose={() => setShowInstantRequestModal(false)}
          onSubmit={handleCreate}
          toStore={toStore}
          removeLine={removeLine}
          creating={creating}
          showToast={showToast}
        />
      )}

      {showInstantRequestPopup && (
        <InstantRequestPopup
          onClose={() => setShowInstantRequestPopup(false)}
          setItemForm={setItemForm}
          EMPTY_LINE={EMPTY_LINE}
          getDetail={getDetail}
          requestId={lowStockRequest}
        />
      )}
    </div>
  );
}