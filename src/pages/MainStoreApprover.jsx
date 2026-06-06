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
import ApproveRejectModal from "../components/ApproveRejectModal";

const EMPTY_LINE = {
  selected_item_no: "",
  item_search: "",
  _showDropdown: false,
  item_id: 0,
  item_no: "",
  item_name: "",
  item_uom: "",
  requested_qty: 1,
  item_type: "abc",
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
  const [filterStatus, setFilterStatus] = useState("");
  const [filterStore, setFilterStore] = useState("");
  const [detail, setDetail] = useState(null);
  const [detailLoad, setDL] = useState(false);
  const [approveModal, setApproveModal] = useState(null);
  const [approverName, setApproverName] = useState("");
  const [editedItems, setEditedItems] = useState([]);
  const [actioning, setActioning] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejecterName, setRejecterName] = useState("");
  const [rejectReason, setRejectReason] = useState("");
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
  const { showToast } = useToast();
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
      console.log("FROM STORE:", auth.store_id);
      console.log("TO STORE:", mainStore.store_id);
      console.log("USER:", auth.username);
      console.log("NOTE:", returnBackNote);

      console.log(
        "ITEMS:",
        selected.map((i) => ({
          item_id: i.item_id,
          return_qty: Number(i.return_qty),
        })),
      );
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

  const openApprove = async (request_id, request_no) => {
    try {
      setActioning(request_id);
      const res = await getRequestById(request_id);
      setEditedItems(
        (res.data.data.items || []).map((i) => ({
          ...i,
          approved_qty: i.requested_qty,
        })),
      );
      setApproveModal({
        id: request_id,
        no: request_no
      });
      setApproverName(auth.username || "");
    } catch (error) {
      const msg = handleError(error, "Failed to load request details");
      showToast(msg, "error");
    } finally {
      setActioning(null);
    }
  };

  const handleGRNSubmit = async (payload) => {
    setGrnSubmitting(true);
    try {
      setActioning(r.request_id);
      const res = await getRequestById(r.request_id);
      setRejectModal(res.data.data);
      setRejecterName(auth.username || "");
      setRejectReason("");
    } catch (error) {
      const msg = handleError(error, "Failed to load request");
      showToast(msg, "error");
    } finally {
      setActioning(null);
    }
  };

  const handleApprove = async () => {
    if (!approverName.trim()) return;
    setActioning(true);
    try {
      await approveRequest(approveModal.id, {
        approved_by_name: approverName,
        approved_items: editedItems.map((i) => ({
          request_item_id: i.request_item_id,
          approved_qty: i.approved_qty,
        })),
      });
      showToast("Request approved — Head Office will now fulfill it", "success");
      setApproveModal(null);
      setApproverName("");
      setEditedItems([]);
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
        requested_assets: requested_assets.map((a) => a.asset_id),
      };

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
      <div className="flex gap-2 my-4">
        <button
          onClick={openReturnBack}
          disabled={returnBackLoading}
          className="bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white text-sm font-semibold px-4 py-2 rounded transition-colors"
        >
          {returnBackLoading ? "لوڈ ہو رہا ہے..." : "آئٹم واپس کریں "}
        </button>
        <button
          onClick={() => {
            // const nextItemNo = getNextItemNo(storeItems);
            setItemForm({
              from_store_id: auth.store_id || "",
              to_store_id:
                mainStores.length === 1 ? mainStores[0].store_id : "",
              requested_by_name: auth.username || "",
              notes: "",
              items: [{ ...EMPTY_LINE }],
              requested_assets: [],
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
      <div className="overflow-x-auto text-center rounded-lg border border-gray-200 shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <TableHead />
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
                  actioning={actioning}
                  openApprove={openApprove}
                  openReject={openReject}
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

      {/* ── Approve Modal ── */}

      {approveModal && (
        <ApproveRejectModal
          setApproveModal={setApproveModal}
          approveModal={approveModal}
          approverName={approverName}
          setApproverName={setApproverName}
          editedItems={editedItems}
          setEditedItems={setEditedItems}
          actioning={actioning}
          handleApprove={handleApprove}
          handleReject={handleReject}
          action={"Approve"}
        />
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <ApproveRejectModal
          setRejectModal={setRejectModal}
          rejectModal={rejectModal}
          rejecterName={rejecterName}
          setRejecterName={setRejecterName}
          rejectReason={rejectReason}
          setRejectReason={setRejectReason}
          actioning={actioning}
          handleReject={handleReject}
          action={"Reject"}
        />
      )
      }
    </div >
  );
}