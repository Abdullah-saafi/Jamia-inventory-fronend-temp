import { useEffect, useState } from "react";
import { createReturnRequest } from "../services/api";
import {
  getStores,
  getItems,
  createRequest,
  getRequests,
  getRequestById,
  submitGRN,
  sendReturnToMain,
} from "../services/api";
import { useAuth } from "../context/authContext";
import GRNModal from "../components/GRNModal";
import ExcelDownloaderWithDates from "../components/Exceldownloaderwithdates";
import Toast from "../components/Toast";
import StoreFilters from "../components/StoreFilters";
import Pagination from "../components/Pagination";
import CreateRequestModal from "../components/CreateRequestModal";
import RequestRow from "../components/RequestRow";
import TableHead from "../components/TableHead";
import CheckLoadingAndError from "../components/CheckLoadingAndError";
import ReturnItemsModal from "../components/ReturnItemsModal";
import useErrorHandler from "../components/useErrorHandler";
import RequestDashboard from "../components/RequestDashboard";
import ToastContainer from "../components/ToastContainer";
import { useToast } from "../context/ToastContext";
import ReturnModal from "../components/ReturnModal";

const EMPTY_LINE = {
  selected_item_no: "",
  item_search: "",
  _showDropdown: false,
  item_no: "",
  item_name: "",
  item_uom: "",
  requested_qty: 1,
};

const EMPTY_FORM = {
  from_store_id: "",
  to_store_id: "",
  requested_by_name: "",
  notes: "",
  images: [],
  items: [{ ...EMPTY_LINE }],
};

export default function SubStore() {
  const [subStores, setSubStores] = useState([]);
  const [mainStores, setMainStores] = useState([]);
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
  const [pageSize, setPageSize] = useState(10);
  const [grnRequest, setGrnRequest] = useState(null);
  const [grnLoading, setGrnLoading] = useState(false);
  const [grnSubmitting, setGrnSubmitting] = useState(false);
  const [returnModal, setReturnModal] = useState(false);
  const [returnModalLoading, setReturnModalLoading] = useState(false);
  const [itemForm, setItemForm] = useState({ ...EMPTY_FORM });
  const [username, setUsername] = useState("");
  const [returnItemData, setReturnItemData] = useState([]);
  const [returnBackModal, setReturnBackModal] = useState(false);
  const [returnBackItems, setReturnBackItems] = useState([]);
  const [returnBackLoading, setReturnBackLoading] = useState(false);
  const [returnBackSubmitting, setReturnBackSubmitting] = useState(false);
  const [returnBackNote, setReturnBackNote] = useState("");
  const [returnForm, setReturnForm] = useState({
    sendByName: "",
    returnData: [],
    note: "",
  });
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
  const pageType = "subStore";

  const openReturnBack = async () => {
    try {
      setReturnBackLoading(true);
      const res = await getItems({ store_id: auth.store_id });
      const items = (res.data.data || []).filter(
        (i) => Number(i.item_quantity) > 0,
      );
      setReturnBackItems(items.map((i) => ({ ...i, return_qty: 0 })));
      setReturnBackModal(true);
    } catch (err) {
      const msg = handleError(err, "Failed to load items");
      showToast(msg, "error");
    } finally {
      setReturnBackLoading(false);
    }
  };

  const handleReturnBack = async () => {
    const selected = returnBackItems.filter((i) => Number(i.return_qty) > 0);
    if (selected.length === 0) {
      showToast("کم از کم ایک آئٹم منتخب کریں", "error");
      return;
    }
    const mainStore = mainStores[0]; // or let user pick
    if (!mainStore) {
      showToast("Main store not found", "error");
      return;
    }
    try {
      setReturnBackSubmitting(true);
      await createReturnRequest({
        from_store_id: auth.store_id,
        to_store_id: mainStore.store_id,
        sent_by_name: auth.username,
        note: returnBackNote || null,
        items: selected.map((i) => ({
          item_id: i.item_id,
          return_qty: Number(i.return_qty),
        })),
      });
      showToast("آئٹمز واپس بھیج دیے گئے", "success");
      setReturnBackModal(false);
      setReturnBackItems([]);
      setReturnBackNote("");
      load();
    } catch (err) {
      const msg = handleError(err, "Failed to send items back");
      showToast(msg, "error");
    } finally {
      setReturnBackSubmitting(false);
    }
  };
  // ─── Load ─────────────────────────────────────────────────────────────────
  const load = async () => {
    setPageLoading(true);
    try {
      const params = {
        direction: "SUB_TO_MAIN",
        page,
        limit: pageSize,
      };

      if (filterStatus) params.status = filterStatus;
      if (auth.role !== "super admin") {
        params.store_id = auth.store_id;
      } else if (filterStore) {
        params.store_id = filterStore;
      }
      const [sRes, rRes] = await Promise.all([
        getStores(),
        getRequests(params),
      ]);
      const all = sRes.data.data;
      setSubStores(all.filter((s) => s.store_type === "SUB_STORE"));
      setMainStores(all.filter((s) => s.store_type === "MAIN_STORE"));
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
    try {
      const response = await getItems({ store_id: itemForm.to_store_id });
      if (response.data?.success) {
        const items = response.data.data || [];
        setStoreItems(items);
        const reusable = items.filter((i) => i.item_type === "REUSABLE");
        const usable = items.filter((i) => i.item_type === "USABLE");
        setReusableItems(reusable);
        setUsableItems(usable);
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
    }
  };

  useEffect(() => {
    if (auth.store_id || auth.role === "super admin") {
      load();
    }
  }, [filterStatus, filterStore, auth.store_id, page, pageSize]);

  useEffect(() => {
    fetchStoreData();
  }, [itemForm.to_store_id]);

  useEffect(() => {
    if (mainStores.length === 1 && !itemForm.to_store_id) {
      setItemForm((f) => ({ ...f, to_store_id: mainStores[0].store_id }));
    }
  }, [mainStores]);

  // ─── Detail ───────────────────────────────────────────────────────────────
  const openDetail = async (r) => {
    console.log("r is here", r);
    if (detail && detail.request_id === r.request_id) {
      setDetail(null);
      return;
    }
    setDL(true);
    setDetail({ ...r, items: [], assets: [] });
    try {
      const res = await getRequestById(r.request_id);
      setDetail(res.data.data);
      console.log("detail", res.data.data);
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
      console.log("payload", payload);
      console.log("paylod id", grnRequest.request_id);
      await submitGRN(grnRequest.request_id, payload);

      const label =
        payload.grn_status === "RECEIVED"
          ? "Delivery confirmed — marked as RECEIVED"
          : payload.grn_status === "DISPUTED"
            ? "Issues reported — request marked DISPUTED"
            : payload.grn_status === "RETURN_BACK"
              ? "Deliver Returned"
              : "Delivery rejected — main store notified";
      showToast(label, payload.grn_status === "RECEIVED" ? "success" : "warn",);
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

  // ─── Form helpers ─────────────────────────────────────────────────────────
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

  // Return Items ───────────────────────────────────────────────────────────────

  const returnItem = async (id) => {
    try {
      setReturnModalLoading(true);
      const response = await getRequestById(id);
      setReturnForm((f) => ({
        ...f,
        returnData: response.data.data,
        sendByName: auth.username,
      }));
      setReturnModal(true);
    } catch (error) {
      const msg = handleError(error, "Failed to open return modal");
      showToast(msg, "error");
    } finally {
      setReturnModalLoading(false);
    }
  };

  const handleReturn = async (id) => {
    try {
      setReturnModalLoading(true);

      const payload = {
        resolved_by_name: auth.username,
        note: returnForm.note,
        returned_items: returnForm.returnData.items
          .map((i) => ({
            request_item_id: i.request_item_id,
            returned_qty: Number(i.return_qty_input || i.received_qty),
          }))
          .filter((i) => i.returned_qty > 0),
      };

      console.log("payload", payload);

      await sendReturnToMain(id, payload);
      setReturnForm(() => ({
        sendByName: "",
        returnData: [],
        note: "",
      }));

      setReturnModal(false);
      showToast("Items returned successfully", "success");

      load();
    } catch (error) {
      const msg = handleError(error, "Failed to return");
      showToast(msg, "error");
    } finally {
      setReturnModalLoading(false);
    }
  };

  // ─── Submit ───────────────────────────────────────────────────────────────
  const handleCreate = async (e) => {
    e.preventDefault();
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
      const payload = {
        from_store_id,
        to_store_id,
        requested_by_name,
        notes: itemForm.notes,
        is_emergency: itemForm.is_emergency,
        direction: "SUB_TO_MAIN",
        items: itemLines.map(
          ({ selected_item_no, item_search, _showDropdown, ...rest }) => rest,
        ),
      };

      // const formData = new FormData();
      // formData.append("from_store_id", itemForm.from_store_id);
      // formData.append("to_store_id", itemForm.to_store_id);
      // formData.append("requested_by_name", itemForm.requested_by_name);
      // formData.append("notes", itemForm.notes);
      // formData.append("is_emergency", itemForm.is_emergency);
      // formData.append("direction", payload.direction);
      // formData.append("items", JSON.stringify(payload.items));
      // itemForm.images.forEach((img) => {
      //   formData.append("images", img);
      // });

      await createRequest(payload);
      showToast("Request submitted successfully", "success");
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
  const pendingGRN = allRequests.filter(
    (r) => r.status === "FULFILLED" && !r.grn_at,
  ).length;

  const pendingReturn = allRequests.filter(
    (r) => r.status === "RECEIVED" && r.item_type === "REUSABLE",
  ).length;

  if (auth.isBlocked) {
    return <BlockedUI message={auth.message} />;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-black text-gray-900">{auth.username}</h1>
          <span className="text-gray-500 text-xs mt-0.5 bg-gray-200 rounded p-1">{auth.storeName || "loading..."}</span>
          <p className="text-gray-500 text-sm mt-0.5">
            درخواست بنائیں اور اپنی ڈیلیوری کی تصدیق کریں
          </p>
        </div>
      </div>

      <div className="flex gap-2 my-4">
        <button
          onClick={openReturnBack}
          disabled={returnBackLoading}
          className="bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white text-sm font-semibold px-4 py-2 rounded transition-colors"
        >
          {returnBackLoading ? "Loading..." : "آئٹم واپس کریں "}
        </button>
        <button
          onClick={() => {
            setItemForm({
              from_store_id: auth.store_id || "",
              to_store_id:
                mainStores.length === 1 ? mainStores[0].store_id : "",
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
      {/* // */}
      <RequestDashboard
        pageType={pageType}
        setFilterStatus={setFilterStatus}
        filterStatus={filterStatus}
        counts={{
          pending: pendingGRN,
          returnBack: pendingReturn,
          emergency: 0,
          disputed: 0,
        }}
      />
      {/* ── Filters ── */}
      <div className="flex h-full py-2  items-end justify-between">
        <div className="Filter">
          <StoreFilters
            filterStatus={filterStatus}
            setFilterStatus={(v) => {
              setFilterStatus(v);
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
          <button
            onClick={() => {
              load();
              fetchStoreData();
            }}
            className="text-gray-500 hover:text-gray-800 text-sm px-3 py-2 border border-gray-300 rounded ml-auto hover:bg-gray-50 shadow-sm"
          >
            ↻ Refresh
          </button>
        </div>

        <div className="Temp-downloader flex justify-center items-center gap-4">
          <div className="">
            <ExcelDownloaderWithDates
              dateKey="created_at"
              fileName="requests"
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
            <TableHead pageType={pageType} />
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
                  openGRN={openGRN}
                  grnLoading={grnLoading}
                  pageType={pageType}
                  returnItem={returnItem}
                  returnModalLoading={returnModalLoading}
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
      {/* GRN Modal */}
      {grnRequest && (
        <GRNModal
          request={grnRequest}
          onClose={() => setGrnRequest(null)}
          onSubmit={handleGRNSubmit}
          submitting={grnSubmitting}
        />
      )}
      {returnModal && (
        <ReturnItemsModal
          setReturnModal={setReturnModal}
          handleReturn={handleReturn}
          returnModalLoading={returnModalLoading}
          returnForm={returnForm}
          setReturnForm={setReturnForm}
        />
      )}

      {/* Create Modal */}
      {showCreate && (
        <CreateRequestModal
          itemForm={itemForm}
          setItemForm={setItemForm}
          mainStores={mainStores}
          storeItems={storeItems}
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
        />
      )}
      {returnBackModal && (
        <ReturnModal
          setReturnBackModal={setReturnBackModal}
          setReturnBackItems={setReturnBackItems}
          returnBackItems={returnBackItems}
          returnBackNote={returnBackNote}
          setReturnBackNote={setReturnBackNote}
          handleReturnBack={handleReturnBack}
          returnBackSubmitting={returnBackSubmitting}
        />
      )}
    </div>
  );
}
