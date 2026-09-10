import { useEffect, useMemo, useState } from "react";
import {
  getStores,
  getItems,
  createRequest,
  getRequests,
  getRequestById,
  submitGRN,
  uploadImg,
} from "../../services/api";
import { useAuth } from "../../context/authContext";
import useErrorHandler from "../useErrorHandler";
import ExcelDownloaderWithDates from "../Exceldownloaderwithdates";
import Pagination from "../Pagination";
import StoreFilters from "../StoreFilters";
import RequestDashboard from "../RequestDashboard";
import TableHead from "../TableHead";
import CheckLoadingAndError from "../CheckLoadingAndError";
import RequestRow from "../RequestRow";
import GRNModal from "../Modals/GRNModal"
import CreateRequestModal from "../Modals/CreateRequestModal";
import { buildAndDownloadExcel } from "../../services/useExcelExport";
import { mainReqToHOColumns } from "../../services/columnsForExcel";

const EMPTY_LINE = {
  selected_item_no: "",
  item_search: "",
  _showDropdown: false,
  item_no: "",
  item_name: "",
  item_name_urdu: "",
  item_uom: "",
  requested_qty: 1,
};

const EMPTY_FORM = {
  from_store_id: "",
  to_store_id: "",
  requested_by_name: "",
  notes: "",
  is_emergency: false,
  items: [{ ...EMPTY_LINE }],
}

const mergeDuplicateLines = (lines) => {
  const map = new Map();
  const order = [];
  for (const item of lines) {
    const key = item.item_no;
    if (map.has(key)) {
      const existing = map.get(key);
      existing.requested_qty =
        (Number(existing.requested_qty) || 0) + (Number(item.requested_qty) || 0);
      existing.images = [...(existing.images || []), ...(item.images || [])];
    } else {
      map.set(key, { ...item, images: [...(item.images || [])] });
      order.push(key);
    }
  }
  return order.map((key) => map.get(key));
};

export default function MainReqToHO({ showToast }) {
  const [mainStores, setMainStores] = useState([]);
  const [toStore, setToStore] = useState([]);
  const [requests, setRequests] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [isEmergency, setIsEmergency] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [detail, setDetail] = useState(null);
  const [detailLoad, setDL] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [storeItems, setStoreItems] = useState([]);
  const [creating, setCreating] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [grnRequest, setGrnRequest] = useState(null);
  const [grnLoading, setGrnLoading] = useState(false);
  const [grnSubmitting, setGrnSubmitting] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [reusableItems, setReusableItems] = useState([]);
  const [usableItems, setUsableItems] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalItems: 0,
    pageLimit: 10,
  });
  const handleError = useErrorHandler();

  const [form, setForm] = useState({ ...EMPTY_FORM });

  const { auth } = useAuth();
  const pageType = "mainReqToHO";

  const duplicateItemIds = useMemo(() => {
    const counts = {};
    form.items.forEach((i) => {
      if (i.item_no) counts[i.item_no] = (counts[i.item_no] || 0) + 1;
    });
    return new Set(Object.keys(counts).filter((k) => counts[k] > 1));
  }, [form.items]);

  // ── Data loading ───────────────────────────────────────────────────────────
  const load = async () => {
    setPageLoading(true);
    try {
      const params = {
        direction: ["MAIN_TO_HO", "MAIN_TO_PCASH"],
        page,
        limit: pageSize,
        search: debouncedSearch,
        emergency: isEmergency || undefined,
        priority_status: "FULFILLED"
      };
      if (filterStatus) params.status = filterStatus;
      if (auth.role !== "super admin") {
        params.store_id = auth.store_id;
      }
      //  else if (filterStore) {
      //   params.store_id = filterStore;
      // }
      const [sRes, rRes, iRes] = await Promise.all([
        getStores(),
        getRequests(params),
        getItems({ to_store_id: auth.store_id }),
      ]);
      const all = sRes.data.data;
      const items = iRes.data.data || [];
      setMainStores(all.filter((s) => s.store_type === "MAIN_STORE"));
      setToStore(all.filter((s) => s.store_type === "PETTY_CASH" || s.store_type === "HEAD_OFFICE"))
      setRequests(rRes.data.data);
      if (rRes.data.pagination) {
        setPagination(rRes.data.pagination);
      }
      setStoreItems(items);
      setReusableItems(
        items.filter(i => i.item_type === "REUSABLE")
      );
      setUsableItems(
        items.filter(i => i.item_type === "USABLE")
      );
    } catch (error) {
      const msg = handleError(error, "Failed to load data");
      setError(msg);
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    if (auth.store_id || auth.role === "super admin") load();
  }, [
    filterStatus,
    // filterStore,
    auth.store_id,
    page,
    pageSize,
    debouncedSearch,
    isEmergency,
  ]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  // ── Inline detail ──────────────────────────────────────────────────────────
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
      const msg = handleError(error, "Failed to load request details");
      showToast(msg, "error");
    } finally {
      setDL(false);
    }
  };

  const openGRN = async (e, r) => {
    e.stopPropagation();
    setGrnLoading(true);
    try {
      const res = await getRequestById(r.request_id);
      setGrnRequest(res.data.data);
    } catch (error) {
      const msg = handleError(error, "Failed to load request details");
      showToast(msg, "error");
    } finally {
      setGrnLoading(false);
    }
  };

  const handleGRNSubmit = async (payload) => {
    setGrnSubmitting(true);
    try {
      const itemsWithImageUrls = [];
      for (const item of payload.received_items) {
        const { images, ...rest } = item;
        const payloadItem = { ...rest };

        if (images && images.length > 0) {
          const formData = new FormData();
          formData.append("image", images[0]);
          const uploadRes = await uploadImg(formData);
          payloadItem.image_url = uploadRes.data.image_url;
        }

        itemsWithImageUrls.push(payloadItem);
      }

      const finalPayload = {
        grn_status: payload.grn_status,
        grn_note: payload.grn_note,
        received_items: itemsWithImageUrls,
      };
      await submitGRN(grnRequest.request_id, finalPayload);
      const label =
        payload.grn_status === "RECEIVED"
          ? "ڈیلیوری کی تصدیق ہو گئی ہے — موصول مارک کر دیا گیا ہے"
          : payload.grn_status === "DISPUTED"
            ? "مسائل کی اطلاع کر دی گئی ہے"
            : payload.grn_status === "RETURN_BACK"
              ? "Deliver Returned"
              : "ڈیلیوری مسترد کر دی گئی ہے — مین اسٹور کو مطلع کر دیا گیا ہے";
      showToast(label, payload.grn_status === "RECEIVED" ? "success" : "warn");
      setGrnRequest(null);
      setDetail(null);
      load();
    } catch (e) {
      const msg = handleError(e, "Failed to submit GRN");
      showToast(msg, "error");
    } finally {
      setGrnSubmitting(false);
    }
  };

  // ── Form helpers ───────────────────────────────────────────────────────────
  const addLine = () =>
    setForm((f) => ({ ...f, items: [...f.items, { ...EMPTY_LINE }] }));
  const removeLine = (idx) =>
    setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));

  const updateLine = (idx, field, value) => {
    setForm((f) => {
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

  const handleCreate = async (e) => {
    e.preventDefault();
    const { from_store_id, to_store_id, requested_by_name, items } = form;
    const itemLines = items.filter((i) => i.item_no);
    const hasItems = itemLines.length > 0;

    const invalid = items.some(
      (i) => !i.item_no || !i.item_name || !i.item_uom || i.requested_qty < 1,
    );
    const isUOMMissing = itemLines.some(
      (i) => i.item_type === "USABLE" && !i.item_uom,
    );
    if (!from_store_id || !to_store_id || !requested_by_name || invalid)
      return showToast("براہ کرم تمام لازمی خانے پُر کریں۔", "error");
    if (!hasItems) return showToast("کم از کم ایک آئٹم شامل کریں۔", "error");
    if (
      itemLines.some((i) => !i.item_name || isUOMMissing || i.requested_qty < 1)
    )
      return showToast("آئٹم کی تفصیلات چیک کریں۔", "error");

    const mergedLines = mergeDuplicateLines(itemLines);

    setCreating(true);
    try {
      const selectedStore = toStore.find(
        (s) => s.store_id === form.to_store_id
      )

      const direction =
        selectedStore?.store_type === "PETTY_CASH"
          ? "MAIN_TO_PCASH"
          : "MAIN_TO_HO";

      const itemsWithImageUrls = [];
      for (const item of mergedLines) {
        const { selected_item_no, item_search, _showDropdown, images, ...rest } = item;
        const payloadItem = { ...rest };

        if (images && images.length > 0) {
          const formData = new FormData();
          formData.append("image", images[0]);
          const uploadRes = await uploadImg(formData)
          payloadItem.image_url = uploadRes.data.image_url;
        }

        itemsWithImageUrls.push(payloadItem);
      }
      const payload = {
        ...form,
        direction,
        items: itemsWithImageUrls,
      };
      await createRequest(payload);
      showToast("درخواست جمع کر دی گئی ہے", "success");
      setShowCreate(false);
      setForm({
        from_store_id: "",
        to_store_id: "",
        requested_by_name: "",
        notes: "",
        is_emergency: false,
        items: [{ ...EMPTY_LINE }],
      });
      load();
    } catch (e) {
      const msg = handleError(e, "Failed to submit");
      showToast(msg, "error");
    } finally {
      setCreating(false);
    }
  };

  const buildBaseParams = () => {
    const params = {
      direction: ["MAIN_TO_HO", "MAIN_TO_PCASH"],
      priority_status: "FULFILLED",
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
      buildAndDownloadExcel(rRes.data.data, mainReqToHOColumns, `${auth.username}'s All Requests`);
    } catch (err) {
      const msg = handleError(err, "Failed to export all requests");
      showToast(msg, "error");
      return [];
    } finally {
      setExportLoading(false);
    }
  };

  const pendingGRN = requests.filter(
    (r) => r.status === "FULFILLED" && !r.grn_at,
  ).length;

  const emergencyRequest = requests.filter((r) => r.is_emergency === true).length

  return (
    <div>
      {/* ── Header ── */}
      <RequestDashboard
        pageType={pageType}
        setFilterStatus={setFilterStatus}
        filterStatus={filterStatus}
        counts={{
          pending: pendingGRN,
          returnBack: 0,
          emergency: emergencyRequest,
          disputed: 0,
        }}
        setIsEmergency={setIsEmergency}
        isEmergency={isEmergency}
        setPage={setPage}
      />

      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => {
            setForm((prev) => ({
              ...prev,
              from_store_id: auth.store_id || "",
              requested_by_name: auth.username || "",
            }));

            setShowCreate(true);
          }}
          className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold px-4 py-2 rounded transition-colors ml-auto mt-2"
        >
          نئی درخواست
        </button>
      </div>

      {/* ── Filters ── */}
      <div className="flex  py-2  items-end justify-between">
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
                setFilterStatus(v);
                setPage(1);
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
              onFetch={fetchRequestsForExport}
              handleExportAll={handleExportAllRequests}
              exportLoading={exportLoading}
              dateKey="created_at"
              fileName={`${auth.username}'s Requests`}
              columns={mainReqToHOColumns}
              pageLoading={pageLoading}
            />
          </div>
        </div>
      </div>

      {/* ── Requests Table ── */}
      <div className="overflow-x-aut text-center rounded-lg border border-gray-200 shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <TableHead
              pageType={pageType}
            />
          </thead>
          <tbody>
            {pageLoading || error || requests.length === 0 ? (
              <CheckLoadingAndError
                loading={pageLoading}
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
                  showToast={showToast}
                  EMPTY_LINE={EMPTY_LINE}
                  openGRN={openGRN}
                  grnLoading={grnLoading}
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

      {/* ── GRN Modal ── */}
      {grnRequest && (
        <GRNModal
          request={grnRequest}
          onClose={() => setGrnRequest(null)}
          onSubmit={handleGRNSubmit}
          submitting={grnSubmitting}
        />
      )}

      {/* ── Create Request Modal ── */}
      {showCreate && (
        <CreateRequestModal
          itemForm={form}
          setItemForm={setForm}
          mainStores={mainStores}
          reusableItems={reusableItems}
          usableItems={usableItems}
          onClose={() => setShowCreate(false)}
          onSubmit={handleCreate}
          addLine={addLine}
          removeLine={removeLine}
          updateLine={updateLine}
          creating={creating}
          EMPTY_FORM={EMPTY_FORM}
          pageType={pageType}
          toStore={toStore}
          duplicateItemIds={duplicateItemIds}
        />
      )}
    </div>
  );
}