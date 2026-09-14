import { useEffect, useRef, useState } from "react";
import {
  getRequestById,
  fulfillRequest,
  acceptReturnFromSub,
  createRequest,
  getRequestByRequestItemId,
  getItems,
  sendItemsToSubStore,
} from "../../services/api";
import { useAuth } from "../../context/authContext";
import useErrorHandler from "../useErrorHandler";
import ExcelDownloaderWithDates from "../Exceldownloaderwithdates";
import Pagination from "../Pagination";
import StoreFilters from "../StoreFilters";
import CheckLoadingAndError from "../CheckLoadingAndError";
import RequestDashboard from "../RequestDashboard";
import RequestRow from "../RequestRow";
import TableHead from "../TableHead";
import InstantRestockModal from "../Modals/InstantRestockModal";
import InstantRequestPopup from "../InstantRequestPopup";
import { mainSubStoreReqsColumns } from "../../services/columnsForExcel";
import { useStores } from "../../hooks/useStores";
import CreateRequestModal from "../Modals/CreateRequestModal";
import { mergeDuplicateLines } from "../../services/mergeLines";

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
  auto_approve: false,
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
  onRefresh,
  showToast,
  onFilterChange,
  loading,
  mainStoreError,
  toStore,
  setSearch,
  search,
  setDebouncedSearch,
  fetchRequestsForExport,
  handleExportAllRequests,
  exportLoading
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
  const [customDates, setCustomDates] = useState({});
  const [showCreate, setShowCreate] = useState(false);
  const [reusableItems, setReusableItems] = useState([]);
  const [usableItems, setUsableItems] = useState([]);
  const [storeItems, setStoreItems] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(false);

  const { subStores } = useStores();
  const fulfillResolveRef = useRef(null);
  const { auth } = useAuth();
  const handleError = useErrorHandler();
  const pageType = "mainSubStoreReqs";

  const getAllItems = async () => {
    try {
      setItemsLoading(true)
      const res = await getItems({ to_store_id: auth.store_id })
      const items = res.data.data || [];
      setStoreItems(items)
      setReusableItems(
        items.filter(i => i.item_type === "REUSABLE")
      );
      setUsableItems(
        items.filter(i => i.item_type === "USABLE")
      );
    } catch (error) {

    } finally {
      setItemsLoading(false)
    }
  }

  useEffect(() => {
    getAllItems()
  }, [])

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
      const res = await getRequestByRequestItemId(requestId);
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

  const handleFulfill = async (requestId, customDate, status, auto_approve) => {
    setFulfilling(requestId);
    try {
      if (status === "DISPUTED") {
        showToast("Cannot fulfill — dispute resolution required", "error");
        return;
      }
      await fulfillRequest(requestId, { fulfilled_by_name: auth.username, customDate: customDate, auto_approve });
      showToast("درخواست پوری کر دی گئی اور انوینٹری اپڈیٹ ہو گئی ہے", "success");
      setDetail(null);
      setCustomDates({})
      onRefresh();
    } catch (e) {
      const msg = handleError(e, "Failed to fulfill");
      if (msg.includes("Cannot fulfill: stock is low for item")) {
        setLowStockRequest(e.response?.data?.request_item_id);
        setShowInstantRequestPopup(true)
        return
      }
      showToast(msg, "error");
    } finally {
      fulfillResolveRef.current = null
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
      auto_approve,
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
        auto_approve,
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

  const sendToSubStore = async (e) => {
    e.preventDefault()
    const { from_store_id, to_store_id, requested_by_name, items } = itemForm;

    const itemLines = items.filter((i) => i.item_no);
    const hasItems = itemLines.length > 0;

    const isUOMMissing = itemLines.some(
      (i) => i.item_type === "USABLE" && !i.item_uom,
    );
    if (!from_store_id || !to_store_id || !requested_by_name)
      return showToast("برائے مہربانی تمام لازمی خانے پُر کریں۔", "error");
    if (!hasItems) return showToast("کم از کم ایک آئٹم شامل کریں۔", "error");
    if (itemLines.some((i) => !i.item_name || isUOMMissing || i.requested_qty < 1))
      return showToast("آئٹم کی تفصیلات چیک کریں۔", "error");

    const mergedLines = mergeDuplicateLines(itemLines);

    try {
      setCreating(true)
      const itemsWithImageUrls = [];
      for (const item of mergedLines) {
        const { selected_item_no, item_search, _showDropdown, images, ...rest } = item;
        const payloadItem = { ...rest };

        if (images && images.length > 0) {
          const formData = new FormData();
          formData.append("image", images[0]);
          const uploadRes = await uploadImg(formData);
          payloadItem.image_url = uploadRes.data.image_url;
        }

        itemsWithImageUrls.push(payloadItem);
      }
      const payload = {
        from_store_id,
        to_store_id,
        requested_by_name,
        notes: itemForm.notes,
        direction: "SUB_TO_MAIN",
        items: itemsWithImageUrls,
      };
      await sendItemsToSubStore(payload)
      showToast("درخواست جمع کر دی گئی ہے", "success");
      setItemForm({ ...EMPTY_FORM });
      onRefresh()
    } catch (error) {
      const msg = handleError(error, "Failed to load request details");
      showToast(msg, "error");
    } finally {
      setCreating(false)
      setShowCreate(false)
    }
  }

  const addLine = () =>
    setForm((f) => ({ ...f, items: [...f.items, { ...EMPTY_LINE }] }));
  const removeLine = (idx) =>
    setItemForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));
  const updateLine = (idx, field, value) => {
    setItemForm((f) => {
      const items = [...f.items];
      items[idx] = { ...items[idx], [field]: value };
      if (field === "selected_item_no") {
        if (value) {
          const found = storeItems.find((i) => i.item_no === value);
          if (found) {
            items[idx].item_id = found.item_id;
            items[idx].item_no = found.item_no;
            items[idx].item_name = found.item_name;
            items[idx].item_name_urdu = found.item_name_urdu;
            items[idx].item_uom = found.item_uom;
            items[idx].item_type = found.item_type;
          }
        } else {
          items[idx].item_no = "";
          items[idx].item_name = "";
          items[idx].item_uom = "";
        }
      }
      return { ...f, items };
    });
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
        setPage={setCurrentPage}
      />

      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => {
            setItemForm((prev) => ({
              ...prev,
              from_store_id: auth.store_id || "",
              requested_by_name: auth.username || "",
              notes: "",
              images: [],
              items: [{ ...EMPTY_LINE }],
            }));
            setShowCreate(true);
          }}
          className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold px-4 py-2 rounded transition-colors ml-auto mt-2"
        >
          سب اسٹور کو آئٹمز بھیجیں
        </button>
      </div>

      <div className="flex py-2 items-end justify-between">
        <div>
          <div className="flex gap-2">
            <input
              dir="ltr"
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
            dir="ltr"
            onClick={() => {
              onRefresh();
              getAllItems()
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
              onFetch={fetchRequestsForExport}
              handleExportAll={handleExportAllRequests}
              exportLoading={exportLoading}
              dateKey="created_at"
              fileName={auth.username}
              columns={mainSubStoreReqsColumns}
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
                  setCustomDates={setCustomDates}
                  customDates={customDates}
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

      {showCreate && (
        <CreateRequestModal
          itemForm={itemForm}
          setItemForm={setItemForm}
          reusableItems={reusableItems}
          usableItems={usableItems}
          onClose={() => setShowCreate(false)}
          onSubmit={sendToSubStore}
          addLine={addLine}
          removeLine={removeLine}
          updateLine={updateLine}
          creating={creating}
          EMPTY_FORM={EMPTY_FORM}
          pageType={pageType}
          toStore={subStores}
          itemsLoading={itemsLoading}
        />
      )}
    </div>
  );
}