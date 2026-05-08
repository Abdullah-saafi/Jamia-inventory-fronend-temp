import { useEffect, useState } from "react";
import {
  getStores,
  getItems,
  createRequest,
  getRequests,
  getRequestById,
  submitGRN,
  sendReturnToMain
} from "../services/api";
import { useAuth } from "../context/authContext";
import GRNModal from "../components/GRNModal";
import ExcelDownloaderWithDates from "../components/Exceldownloaderwithdates";
import Toast from "../components/Toast";
import StoreFilters from "../components/StoreFilters";
import Pagination from "../components/Pagination";
import CreateRequestModal from "../components/CreateRequestModal";
import PendingRequestIndicator from "../components/PendingRequestIndicator";
import RequestRow from "../components/RequestRow";
import TableHead from "../components/TableHead";
import CheckLoadingAndError from "../components/CheckLoadingAndError";
import ReturnItemsModal from "../components/ReturnItemsModal";
import useErrorHandler from "../components/useErrorHandler";
import RequestDashboard from "../components/RequestDashboard";
import SubStoreScrapModal from "../components/SubStoreScrapModal";
import { sendScrapToMain } from "../services/api";

const EMPTY_LINE = {
  selected_item_no: "",
  item_search: "",
  _showDropdown: false,
  item_id: 0,
  item_no: "",
  item_name: "",
  item_uom: "",
  requested_qty: 1,
  item_type: "abc"
};

const EMPTY_FORM = {
  from_store_id: "",
  to_store_id: "",
  requested_by_name: "",
  notes: "",
  is_emergency: false,
  items: [{ ...EMPTY_LINE }],
  requested_assets: [],
};

export default function SubStore() {
  const [subStores, setSubStores] = useState([]);
  const [mainStores, setMainStores] = useState([]);
  const [requests, setRequests] = useState([]);
  const [allRequests, setAllRequests] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
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
  const [returnModalLoading, setReturnModalLoading] = useState(false)
  const [itemForm, setItemForm] = useState({ ...EMPTY_FORM });
  const [username, setUsername] = useState("");
  const [returnItemData, setReturnItemData] = useState([]);
  const [scrapModal, setScrapModal] = useState(false);
  const [scrapModalLoading, setScrapModalLoading] = useState(false);
  const [scrapForm, setScrapForm] = useState({
    sendByName: "",
    requestData: null,
    note: "",
    scrap_items: [],
  });
  const [returnForm, setReturnForm] = useState({
    sendByName: "",
    returnData: [],
    note: "",
  });

  const { auth } = useAuth();
  const handleError = useErrorHandler()
  const pageType = "subStore"

  // ─── Load ─────────────────────────────────────────────────────────────────
  const load = async () => {
    setPageLoading(true);
    try {
      const params = { direction: "SUB_TO_MAIN" };
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
        setAllRequests(rRes.data.data)
      }
      setRequests(rRes.data.data);
    } catch (error) {
      const msg = handleError(error, "Failed to load data")
      setError(msg);
    } finally {
      setPageLoading(false);
    }
  };

  const fetchStoreData = async () => {
    if (!itemForm.to_store_id) {
      setStoreItems([]);
      setReusableItems([]);
      setUsableItems([])
      return;
    }
    try {
      const response = await getItems({ store_id: itemForm.to_store_id });
      if (response.data?.success) {
        const items = response.data.data || [];
        setStoreItems(items);
        const reusable = items.filter((i) => i.item_type === "REUSABLE");
        const usable = items.filter(i => i.item_type === "USABLE")
        setReusableItems(reusable);
        setUsableItems(usable)
      } else {
        setStoreItems([]);
        setReusableItems([]);
        setUsableItems([])
      }
    } catch (error) {
      setStoreItems([]);
      setUsableItems([])
      setReusableItems([]);
      const msg = handleError(error, "Failed to fetch items")
      setToast({ message: msg, type: "error" })
    }

  }

  const scrapItem = async (id) => {
    try {
      setScrapModalLoading(true);

      const response = await getRequestById(id);
      const requestData = response.data.data;

      const scrappableItems = (requestData.items || []).filter(
        (i) => i.item_type === "USABLE" || i.item_type === "REUSABLE"
      );

      setScrapForm({
        sendByName: auth.username,
        requestData,
        note: "",
        from_sub_store: auth.store_id,
        scrap_items: scrappableItems.map((i) => ({
          request_item_id: i.request_item_id,
          scrap_qty: 0,
          max_qty:
            Number(i.received_qty) ||
            Number(i.fulfilled_qty) ||
            Number(i.requested_qty) ||
            0,
        })),
      });

      setScrapModal(true);
    } catch (error) {
      const msg = handleError(error, "Failed to open scrap modal");
      setToast({ message: msg, type: "error" });
    } finally {
      setScrapModalLoading(false);
    }
  };

  const handleScrap = async (id, data) => {
    try {
      setScrapModalLoading(true);

      await sendScrapToMain(id, {
        ...data,
        from_sub_store: auth.store_id,
        to_main_store: scrapForm.requestData.to_store_id,
      });

      setScrapModal(false);

      setToast({ message: "Items scrapped successfully", type: "success" });

      setScrapForm({
        sendByName: "",
        requestData: null,
        note: "",
        scrap_items: [],
      });

      load();
      fetchStoreData()
    } catch (error) {
      const msg = handleError(error, "Failed to scrap items");
      setToast({ message: msg, type: "error" });
    } finally {
      setScrapModalLoading(false);
    }
  };

  useEffect(() => {
    setTimeout(() => setToast(null), 7000);
  }, [toast]);

  useEffect(() => {
    if (auth.store_id || auth.role === "super admin") load();
  }, [filterStatus, filterStore, auth.store_id]);

  useEffect(() => {
    fetchStoreData()
  }, [itemForm.to_store_id]);

  useEffect(() => {
    if (mainStores.length === 1 && !itemForm.to_store_id) {
      setItemForm((f) => ({ ...f, to_store_id: mainStores[0].store_id }));
    }
  }, [mainStores]);

  // ─── Detail ───────────────────────────────────────────────────────────────
  const openDetail = async (r) => {
    console.log("r is here", r)
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
      const msg = handleError(error, "Failed to open detail")
      setToast({ message: msg, type: "error" })
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
      const msg = handleError(error, "Failed to load request details")
      setToast({ message: msg, type: "error" });
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
            : payload.grn_status === "RETURN_BACK" ? "Deliver Returned" : "Delivery rejected — main store notified";
      setToast({ message: label, type: payload.grn_status === "RECEIVED" ? "success" : "warn", });
      setGrnRequest(null);
      setDetail(null);
      load();
    } catch (e) {
      const msg = handleError(e, "Failed to submit GRN")
      setToast({ message: msg, type: "error" });
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
          items[idx].item_type = found.item_type
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

  const getNextItemNo = (items = []) => {
    if (!items.length) return "ITM-001";
    let max = 0;
    let prefix = "ITM-";
    items.forEach((item) => {
      const match = item.item_no?.match(/(\D+)(\d+)$/);
      if (match) {
        prefix = match[1];
        const num = parseInt(match[2], 10);
        if (num > max) max = num;
      }
    });
    return `${prefix}${String(max + 1).padStart(3, "0")}`;
  };

  // Return Items ───────────────────────────────────────────────────────────────

  const returnItem = async (id) => {
    try {
      setReturnModalLoading(true)
      const response = await getRequestById(id)
      setReturnForm((f) => ({ ...f, returnData: response.data.data, sendByName: auth.username }))
      setReturnModal(true)
    } catch (error) {
      const msg = handleError(error, "Failed to open return modal");
      setToast({ message: msg, type: "error" });
    } finally {
      setReturnModalLoading(false)
    }
  }

  const handleReturn = async (id) => {
    try {
      setReturnModalLoading(true);

      const payload = {
        resolved_by_name: auth.username,
        note: returnForm.note,
        returned_items: returnForm.returnData.items
          .map((i) => ({
            request_item_id: i.request_item_id,
            returned_qty: Number(i.return_qty_input || 0),
          }))
          .filter((i) => i.returned_qty > 0),
      };

      console.log("payload", payload);


      await sendReturnToMain(id, payload);
      setReturnForm(() => ({
        sendByName: "",
        returnData: [],
        note: "",
      }))

      setReturnModal(false);
      setToast({ message: "Items returned successfully", type: "success" });

      load();
    } catch (error) {
      const msg = handleError(error, "Failed to return");
      setToast({ message: msg, type: "error" });
    } finally {
      setReturnModalLoading(false);
    }
  };

  // ─── Submit ───────────────────────────────────────────────────────────────
  const handleCreate = async (e) => {
    e?.preventDefault();
    const {
      from_store_id,
      to_store_id,
      requested_by_name,
      items,
      requested_assets = [],
    } = itemForm;

    const itemLines = items.filter((i) => i.item_no);
    const hasItems = itemLines.length > 0;

    const isUOMMissing = itemLines.some(
      (i) => i.item_type === "USABLE" && !i.item_uom
    );
    if (!from_store_id || !to_store_id || !requested_by_name)
      return setToast({ message: "Please fill all required fields", type: "error" });
    if (!hasItems && !hasAssets)
      return setToast({ message: "Add at least one item or one asset", type: "error" });
    if (
      itemLines.some((i) => !i.item_name || isUOMMissing || i.requested_qty < 1)
    )
      return setToast({ message: "Check item details", type: "error" });

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
        requested_assets: requested_assets.map((a) => a.asset_id),
      };
      await createRequest(payload);
      setToast({ message: "Request submitted successfully", type: "success" });
      setShowCreate(false);
      setItemForm({ ...EMPTY_FORM });
      load();
    } catch (e) {
      const msg = handleError(e, "Failed to load request details")
      setToast({ message: msg, type: "error" });
    } finally {
      setCreating(false);
    }
  };

  // ─── Computed ─────────────────────────────────────────────────────────────
  const pendingGRN = allRequests.filter((r) => r.status === "FULFILLED" && !r.grn_at,).length;

  const pendingReturn = allRequests.filter((r) => r.status === "RECEIVED" && r.item_type === "REUSABLE").length

  const paginated = requests.slice((page - 1) * pageSize, page * pageSize);

  if (auth.isBlocked) {
    return <BlockedUI message={auth.message} />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-black text-gray-900">{auth.username}</h1>
          <span className="text-gray-500 text-xs mt-0.5 bg-gray-200 rounded p-1">{auth.storeName || "loading..."}</span>
          <p className="text-gray-500 text-sm mt-0.5">
            Manage requests, track inventory, and Request from Main Store.
          </p>
        </div>
        <button
          onClick={() => {
            const nextItemNo = getNextItemNo(storeItems);
            setItemForm({
              from_store_id: auth.store_id || "",
              to_store_id: mainStores.length === 1 ? mainStores[0].store_id : "",
              requested_by_name: auth.username || "",
              notes: "",
              items: [{ ...EMPTY_LINE, }],
              requested_assets: [],
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
        filterStatus={filterStatus}
        counts={{
          pending: pendingGRN,
          returnBack: pendingReturn,
          emergency: 0,
          disputed: 0
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
              load()
              fetchStoreData()
            }}
            className="text-gray-500 hover:text-gray-800 text-sm px-3 py-2 border border-gray-300 rounded ml-auto hover:bg-gray-50 shadow-sm"
          >
            ↻ Refresh
          </button>
        </div>

        <div className="Temp-downloader">
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

      {/* ── Table ── */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <TableHead />
          </thead>
          <tbody>
            {(pageLoading || error || requests.length === 0) ? (
              <CheckLoadingAndError
                loading={pageLoading}
                error={error}
                requests={requests}
              />
            ) : (
              paginated.map((r) => (
                <RequestRow
                  key={r.request_id}
                  r={r}
                  detail={detail}
                  detailLoad={detailLoad}
                  openDetail={openDetail}
                  openGRN={openGRN}
                  scrapItem={scrapItem}
                  scrapModalLoading={scrapModalLoading}
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
          currentPage={page}
          totalItems={requests.length}
          pageSize={pageSize}
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

      {/* {scrapModal && (
        <SubStoreScrapModal
          scrapForm={scrapForm}
          setScrapForm={setScrapForm}
          handleScrap={handleScrap}
          scrapModalLoading={scrapModalLoading}
          setScrapModal={setScrapModal}
        />
      )} */}

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
        />
      )}

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}

