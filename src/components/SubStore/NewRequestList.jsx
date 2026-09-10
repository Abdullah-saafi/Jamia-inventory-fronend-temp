import { useEffect, useMemo, useState } from "react";
import { uploadImg, getItems, createRequest, getRequests, getRequestById, submitGRN } from "../../services/api";
import { useAuth } from "../../context/authContext";
import { useToast } from "../../context/ToastContext";
import { useStores } from "../../hooks/useStores";
import useErrorHandler from "../useErrorHandler";
import GRNModal from "../Modals/GRNModal";
import ExcelDownloaderWithDates from "../Exceldownloaderwithdates";
import StoreFilters from "../StoreFilters";
import Pagination from "../Pagination";
import CreateRequestModal from "../Modals/CreateRequestModal";
import RequestRow from "../RequestRow";
import TableHead from "../TableHead";
import CheckLoadingAndError from "../CheckLoadingAndError";
import RequestDashboard from "../RequestDashboard";
import { newRequestListColumns } from "../../services/columnsForExcel";

const EMPTY_LINE = {
  selected_item_no: "",
  item_search: "",
  _showDropdown: false,
  item_no: "",
  item_name: "",
  item_name_urdu: "",
  item_uom: "",
  images: [],
  requested_qty: 1,
};

const EMPTY_FORM = {
  from_store_id: "",
  to_store_id: "",
  requested_by_name: "",
  auto_approve: false,
  notes: "",
  images: [],
  items: [{ ...EMPTY_LINE }],
};

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

export default function NewRequestList({ fetchRequestsForExport, handleExportAllRequests, exportLoading, setFilterStatusForSubStore }) {

  const [requests, setRequests] = useState([]);
  const [allRequests, setAllRequests] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterStore, setFilterStore] = useState("");
  const [detail, setDetail] = useState(null);
  const [detailLoad, setDL] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [storeItems, setStoreItems] = useState([]);
  const [reusableItems, setReusableItems] = useState([]);
  const [usableItems, setUsableItems] = useState([]);
  const [creating, setCreating] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [grnRequest, setGrnRequest] = useState(null);
  const [grnLoading, setGrnLoading] = useState(false);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [grnSubmitting, setGrnSubmitting] = useState(false);
  const [itemForm, setItemForm] = useState({ ...EMPTY_FORM });
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageLimit: 10,
    totalItems: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const { auth } = useAuth();
  const { showToast } = useToast();
  const handleError = useErrorHandler();
  const { subStores, mainStores } = useStores();
  const pageType = "subStore";

  const duplicateItemIds = useMemo(() => {
    const counts = {};
    itemForm.items.forEach((i) => {
      if (i.item_no) counts[i.item_no] = (counts[i.item_no] || 0) + 1;
    });
    return new Set(Object.keys(counts).filter((k) => counts[k] > 1));
  }, [itemForm.items]);

  // ─── Load ─────────────────────────────────────────────────────────────────
  const load = async () => {
    setPageLoading(true);
    try {
      const params = {
        direction: "SUB_TO_MAIN",
        page,
        limit: pageSize,
        search: debouncedSearch,
        priority_status: "FULFILLED",
      };

      if (filterStatus) params.status = filterStatus;
      if (auth.role !== "super admin") {
        params.store_id = auth.store_id;
      } else if (filterStore) {
        params.store_id = filterStore;
      }

      const rRes = await getRequests(params);
      if (!filterStatus) {
        setAllRequests(rRes.data.data);
      }
      setRequests(rRes.data.data || []);
      setPagination(rRes.data.pagination);
    } catch (error) {
      const msg = handleError(error, "Failed to load data");
      setError(msg);
    } finally {
      setPageLoading(false);
    }
  };

  const fetchStoreData = async () => {
    if (!itemForm.to_store_id) {
      setStoreItems([]);
      setReusableItems([]);
      setUsableItems([]);
      return;
    }
    setItemsLoading(true)
    try {
      const response = await getItems({ to_store_id: itemForm.to_store_id, store_id: auth.store_id });
      if (response.data?.success) {
        const items = response.data.data || [];
        setStoreItems(items);
        setReusableItems(items.filter((i) => i.item_type === "REUSABLE"));
        setUsableItems(items.filter((i) => i.item_type === "USABLE"));
      } else {
        setStoreItems([]);
        setReusableItems([]);
        setUsableItems([]);
      }
    } catch (error) {
      setStoreItems([]);
      setUsableItems([]);
      setReusableItems([]);
      const msg = handleError(error, "Failed to fetch items");
      showToast(msg, "error");
    } finally {
      setItemsLoading(false)
    }
  };

  useEffect(() => {
    if (auth.store_id || auth.role === "super admin") {
      load();
    }
  }, [filterStatus, filterStore, auth.store_id, page, pageSize, debouncedSearch]);

  useEffect(() => {
    fetchStoreData();
  }, [itemForm.to_store_id]);

  useEffect(() => {
    if (mainStores.length === 1 && !itemForm.to_store_id) {
      setItemForm((f) => ({ ...f, to_store_id: mainStores[0].store_id }));
    }
  }, [mainStores]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  // ─── Detail ───────────────────────────────────────────────────────────────
  const openDetail = async (r) => {
    if (detail && detail.request_id === r.request_id) {
      setDetail(null);
      return;
    }
    setDL(true);
    setDetail({ ...r, items: [], assets: [] });
    try {
      const res = await getRequestById(r.request_id);
      setDetail(res.data.data);
    } catch (error) {
      const msg = handleError(error, "Failed to open detail");
      showToast(msg, "error");
    } finally {
      setDL(false);
    }
  };

  // ─── GRN ──────────────────────────────────────────────────────────────────
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
            : payload.grn_status === "RETURN"
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

  const addLine = () =>
    setItemForm((f) => ({ ...f, items: [...f.items, { ...EMPTY_LINE }] }));

  const removeLine = (idx) =>
    setItemForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));

  const updateLine = (idx, field, value) => {
    setItemForm((f) => {
      const items = [...f.items];
      items[idx] = { ...items[idx], [field]: value };
      if (field === "selected_item_no") {
        const found = storeItems.find((i) => i.item_no === value);
        if (found) {
          items[idx].item_id = found.item_id;
          items[idx].item_no = found.item_no;
          items[idx].item_name = found.item_name;
          items[idx].item_name_urdu = found.item_name_urdu;
          items[idx].item_uom = found.item_uom;
          items[idx].item_type = found.item_type;
        } else {
          items[idx].item_id = 0;
          items[idx].item_no = "";
          items[idx].item_name = "";
          items[idx].item_uom = "";
          items[idx].item_type = "";
        }
      }
      return { ...f, items };
    });
  };

  // ─── Submit ───────────────────────────────────────────────────────────────
  const handleCreate = async (e) => {
    e.preventDefault();
    const { from_store_id, to_store_id, auto_approve, requested_by_name, items } = itemForm;

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

    setCreating(true);
    try {
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
        auto_approve,
        requested_by_name,
        notes: itemForm.notes,
        is_emergency: itemForm.is_emergency,
        direction: "SUB_TO_MAIN",
        items: itemsWithImageUrls,
      };

      await createRequest(payload);
      showToast("درخواست جمع کر دی گئی ہے", "success");
      setShowCreate(false);
      setItemForm({ ...EMPTY_FORM });
      load();
    } catch (e) {
      const msg = handleError(e, "Failed to load request details");
      showToast(msg, "error");
    } finally {
      setCreating(false);
    }
  };

  // ─── Computed ─────────────────────────────────────────────────────────────
  const pendingGRN = allRequests.filter((r) => r.status === "FULFILLED" && !r.grn_at).length;

  return (
    <div>
      <div className="flex gap-2 my-4">
        <button
          onClick={() => {
            setItemForm({
              from_store_id: auth.store_id || "",
              to_store_id: mainStores.length === 1 ? mainStores[0].store_id : "",
              requested_by_name: auth.username || "",
              notes: "",
              images: [],
              items: [{ ...EMPTY_LINE }],
            });
            setShowCreate(true);
          }}
          className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold px-4 py-2 rounded transition-colors"
        >
          نئی درخواست
        </button>
      </div>

      <RequestDashboard
        pageType={pageType}
        setFilterStatus={setFilterStatus}
        setFilterStatusForSubStore={setFilterStatusForSubStore}
        filterStatus={filterStatus}
        counts={{ pending: pendingGRN, returnBack: 0, emergency: 0, disputed: 0 }}
        setPage={setPage}
      />

      {/* ── Filters ── */}
      <div className="flex py-2 items-end justify-between">
        <div className="Filter">
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
              className="bg-white border leading-none border-gray-300 rounded px-3 h-7.5 text-gray-800 text-sm focus:outline-none focus:border-emerald-500 w-80 shadow-sm"
            />
            <StoreFilters
              filterStatus={filterStatus}
              setFilterStatus={(v) => {
                setFilterStatus(v);
                setFilterStatusForSubStore(v)
                setPage(1);
              }}
              pageType={pageType}
              filterStore={filterStore}
              setFilterStore={(v) => {
                setFilterStore(v);
                setPage(1);
              }}
              role={auth.role}
              subStores={subStores}
              loading={pageLoading}
            />
            {(search || filterStatus) && (
              <button
                onClick={() => {
                  setSearch("");
                  setFilterStatus("");
                  setFilterStatusForSubStore("")
                  setPage(1);
                  setDebouncedSearch("");
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
              fetchStoreData();
              setPage(1);
            }}
            className="text-gray-500 hover:text-gray-800 text-sm px-3 py-2 border border-gray-300 rounded ml-auto hover:bg-gray-50 shadow-sm"
          >
            ↻ Refresh
          </button>
        </div>

        <div className="Temp-downloader flex justify-center items-center gap-4">
          <div>
            <ExcelDownloaderWithDates
              pageType={pageType}
              onFetch={fetchRequestsForExport}
              handleExportAll={handleExportAllRequests}
              exportLoading={exportLoading}
              dateKey="created_at"
              fileName={auth.username}
              columns={newRequestListColumns}
              pageLoading={pageLoading}
            />
          </div>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="overflow-x-auto text-center rounded-lg border border-gray-200 shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <TableHead pageType={pageType} />
          </thead>
          <tbody>
            {pageLoading || error || requests.length === 0 ? (
              <CheckLoadingAndError loading={pageLoading} error={error} requests={requests} />
            ) : (
              requests.map((r) => (
                <RequestRow
                  r={r}
                  detail={detail}
                  detailLoad={detailLoad}
                  openDetail={openDetail}
                  openGRN={openGRN}
                  grnLoading={grnLoading}
                  pageType={pageType}
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
          onPageSizeChange={(s) => {
            setPageSize(s);
            setPage(1);
          }}
        />
      </div>

      {grnRequest && (
        <GRNModal
          request={grnRequest}
          onClose={() => setGrnRequest(null)}
          onSubmit={handleGRNSubmit}
          submitting={grnSubmitting}
          showToast={showToast}
        />
      )}

      {showCreate && (
        <CreateRequestModal
          itemForm={itemForm}
          setItemForm={setItemForm}
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
          showToast={showToast}
          itemsLoading={itemsLoading}
          duplicateItemIds={duplicateItemIds}
        />
      )}
    </div>
  );
}