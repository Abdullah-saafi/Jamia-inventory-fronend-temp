import { useEffect, useState } from "react";
import {
  getStores,
  getItems,
  createRequest,
  getRequests,
  getRequestById,
  submitGRN,
} from "../../services/api";
import { useAuth } from "../../context/authContext";
import useErrorHandler from "../useErrorHandler";
import GRNModal from "../GRNModal";
import ExcelDownloaderWithDates from "../Exceldownloaderwithdates";
import Pagination from "../Pagination";
import StatusBadge from "../StatusBadge";
import DateTimeCell from "../DateTimeCell";
import StoreFilters from "../StoreFilters";
import RequestDashboard from "../RequestDashboard";
import TableHead from "../TableHead";
import CreateRequestModal from "../CreateRequestModal";

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
  is_emergency: false,
  items: [{ ...EMPTY_LINE }],
}

export default function MainReqToHO({ loading, mainStoreError, showToast }) {
  const [subStores, setSubStores] = useState([]);
  const [mainStores, setMainStores] = useState([]);
  const [toStore, setToStore] = useState([]);
  const [requests, setRequests] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterStore, setFilterStore] = useState("");
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
  const [reusableItems, setReusableItems] = useState([]);
  const [usableItems, setUsableItems] = useState([]);
  const handleError = useErrorHandler();

  const [form, setForm] = useState({...EMPTY_FORM});

  const { auth } = useAuth();
  const pageType = "mainReqToHO";

  // ── Data loading ───────────────────────────────────────────────────────────
  const load = async () => {
    setPageLoading(true);
    try {
      const params = { direction: "MAIN_TO_HO" };
      if (filterStatus) params.status = filterStatus;
      if (auth.role !== "super admin") {
        params.store_id = auth.store_id;
      } else if (filterStore) {
        params.store_id = filterStore;
      }
      const [sRes, rRes, iRes] = await Promise.all([
        getStores(),
        getRequests(params),
        getItems({ store_id: mainStores })
      ]);
      const items = iRes.data.data || []
      const all = sRes.data.data;
      setSubStores(all.filter((s) => s.store_type === "SUB_STORE"));
      setMainStores(all.filter((s) => s.store_type === "MAIN_STORE"));
      setStoreItems(items)
      const reusable = items.filter((i) => i.item_type === "REUSABLE");
      const usable = items.filter((i) => i.item_type === "USABLE");
      setReusableItems(reusable);
      setUsableItems(usable);
      setToStore(all.filter((s) => s.store_type === "PETTY_CASH" || s.store_type === "HEAD_OFFICE"))
      setRequests(rRes.data.data);
    } catch (error) {
      const msg = handleError(error, "Failed to load data");
      setError(msg);
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    if (auth.store_id || auth.role === "super admin") load();
  }, [filterStatus, filterStore, auth.store_id]);

  // ── FIX 2: Auto-fill main store when only one exists ──────────────────────
  // useEffect(() => {
  //   if (mainStores.length === 1 && !form.to_store_id) {
  //     setForm((f) => ({ ...f, to_store_id: mainStores[0].store_id }));
  //   }
  // }, [mainStores]);

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
      await submitGRN(grnRequest.request_id, payload);
      const label =
        payload.grn_status === "RECEIVED"
          ? "Delivery confirmed — marked as RECEIVED"
          : payload.grn_status === "DISPUTED"
            ? "Issues reported — request marked DISPUTED"
            : "Delivery rejected — main store notified";
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
    const invalid = items.some(
      (i) => !i.item_no || !i.item_name || !i.item_uom || i.requested_qty < 1,
    );
    if (!from_store_id || !to_store_id || !requested_by_name || invalid)
      return showToast("Please fill all required fields", "error");

    setCreating(true);
    try {
      const selectedStore = toStore.find(
        (s) => s.store_id === form.to_store_id
      )

      const direction =
        selectedStore?.store_type === "PETTY_CASH"
          ? "MAIN_TO_PCASH"
          : "MAIN_TO_HO";

      const payload = {
        ...form,
        direction,
        items: items.map(
          ({ selected_item_no, item_search, _showDropdown, ...rest }) => rest,
        ),
      };
      console.log("payload", payload);

      await createRequest(payload);
      showToast("Request submitted successfully", "success");
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

  const pendingGRN = requests.filter(
    (r) => r.status === "FULFILLED" && !r.grn_at,
  ).length;

  const paginatedRequests = requests.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );

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
          emergency: 0,
          disputed: 0,
        }}
      />

      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => {

            setForm({
              from_store_id: auth.store_id || "",
              to_store_id: "",
              requested_by_name: auth.username || "",
              notes: "",
              items: [
                {
                  ...EMPTY_LINE
                },
              ],
            });

            setShowCreate(true);
          }}
          className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold px-4 py-2 rounded transition-colors ml-auto mt-2"
        >
          نئی درخواست
        </button>
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-wrap gap-2 items-end h-full py-2 justify-between">
        <div>
          <StoreFilters
            filterStatus={filterStatus}
            setFilterStatus={(v) => {
              setFilterStatus(v);
              setPage(1);
            }}
            pageType={pageType}
          />

          <button
            onClick={() => {
              setFilterStatus("");
              setPage(1);
              load();
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
              data={requests}
              dateKey="created_at"
              fileName={auth.username}
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

      {/* ── Requests Table ── */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <TableHead
              pageType={pageType}
            />
          </thead>
          <tbody>
            {loading || pageLoading ? (
              <tr>
                <td colSpan={7} className="text-center py-12">
                  <div className="flex justify-center">
                    <div className="w-7 h-7 border-2 border-gray-200 border-t-emerald-500 rounded-full animate-spin" />
                  </div>
                </td>
              </tr>
            ) : error || mainStoreError ? (
              <tr>
                <td colSpan={7} className="text-center py-12">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 m-4 text-red-600 text-sm">
                    {error}
                  </div>
                </td>
              </tr>
            ) : requests.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-gray-400">
                  No requests found. Click New Request to place one.
                </td>
              </tr>
            ) : (
              paginatedRequests.map((r) => {
                const isExpanded = detail && detail.request_id === r.request_id;
                const needsGRN = r.status === "FULFILLED" && !r.grn_at;
                const isDisputed = r.status === "DISPUTED";
                const isReceived = r.status === "RECEIVED";

                return (
                  <>
                    <tr
                      key={r.request_id}
                      className={`border-b border-gray-100 cursor-pointer transition-colors ${needsGRN
                        ? "bg-blue-50/40 hover:bg-blue-50"
                        : isDisputed
                          ? "bg-amber-50/40 hover:bg-amber-50"
                          : "hover:bg-gray-50"
                        } ${isExpanded ? "bg-gray-50" : ""}`}
                      onClick={() => openDetail(r)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-emerald-600 text-xs font-bold">
                            {r.request_no}
                          </span>
                          {r.item_count > 0 && (
                            <span className="bg-gray-100 text-gray-500 text-xs font-mono rounded px-1.5 py-0.5 border border-gray-200">
                              {r.item_count} item{r.item_count > 1 ? "s" : ""}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {r.requested_by_name || "—"}
                      </td>

                      {/* FIX 3: requested_at with time */}
                      <td className="px-4 py-3">
                        <DateTimeCell ts={r.requested_at || r.created_at} />
                      </td>

                      <td className="px-4 py-3">
                        <StatusBadge status={r.status} />
                      </td>

                      {/* FIX 3: approved_at + fulfilled_at with time */}
                      <td className="px-4 py-3">
                        <DateTimeCell ts={r.approved_at} />
                      </td>
                      <td className="px-4 py-3">
                        <DateTimeCell ts={r.fulfilled_at} />
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {needsGRN && (
                            <button
                              onClick={(e) => openGRN(e, r)}
                              disabled={grnLoading}
                              className="text-xs bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-3 py-1.5 font-semibold transition-colors disabled:opacity-40 whitespace-nowrap"
                            >
                              {grnLoading ? "…" : "Verify Delivery"}
                            </button>
                          )}
                          <span
                            className={`text-xs ${isExpanded ? "text-emerald-600" : "text-gray-400"}`}
                          >
                            {isExpanded ? "▲ Hide" : "▼ View"}
                          </span>
                        </div>
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr
                        key={r.request_id + "-detail"}
                        className="bg-gray-50 border-b-2 border-emerald-200"
                      >
                        <td colSpan={7} className="px-6 py-4">
                          {detailLoad ? (
                            <div className="flex justify-center py-6">
                              <div className="w-6 h-6 border-2 border-gray-200 border-t-emerald-500 rounded-full animate-spin" />
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {(isDisputed || isReceived) &&
                                detail?.grn_note && (
                                  <div
                                    className={`rounded-xl p-3 border text-sm ${isDisputed
                                      ? "bg-amber-50 border-amber-200 text-amber-700"
                                      : "bg-teal-50 border-teal-200 text-teal-700"
                                      }`}
                                  >
                                    <div className="text-xs font-bold uppercase tracking-wider mb-1">
                                      {isDisputed
                                        ? "⚠ Sub Store Reported Issues"
                                        : "✓ Sub Store Confirmed Receipt"}
                                    </div>
                                    <div>{detail.grn_note}</div>
                                    {detail.grn_at && (
                                      <div className="text-xs opacity-60 mt-1">
                                        {new Date(
                                          detail.grn_at,
                                        ).toLocaleString()}
                                      </div>
                                    )}
                                  </div>
                                )}

                              {detail?.rejection_reason && (
                                <div className="bg-red-50 border border-red-200 rounded p-3">
                                  <div className="text-red-500 text-xs font-semibold mb-1">
                                    REJECTION REASON
                                  </div>
                                  <div className="text-red-600 text-sm">
                                    {detail.rejection_reason}
                                  </div>
                                </div>
                              )}

                              <div>
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="border-b border-gray-200 text-gray-400 text-xs">
                                      <th className="text-left pb-2 pr-4">
                                        چیز نمبر
                                      </th>
                                      <th className="text-left pb-2 pr-4">
                                        چیز کا نام
                                      </th>
                                      <th className="text-left pb-2 pr-4">
                                        پیمائش کی اکائی
                                      </th>
                                      <th className="text-center pb-2 pr-4">
                                        درخواست کردہ
                                      </th>
                                      <th className="text-center pb-2 pr-4">
                                        منظور شدہ
                                      </th>
                                      <th className="text-center pb-2 pr-4">
                                        مکمل شدہ
                                      </th>
                                      {(isDisputed || isReceived) && (
                                        <>
                                          <th className="text-center pb-2 pr-4">
                                            موصول شدہ
                                          </th>
                                          <th className="text-center pb-2">
                                            حالت
                                          </th>
                                        </>
                                      )}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {(detail?.items || []).map((i) => (
                                      <tr
                                        key={i.request_item_id}
                                        className="border-b border-gray-100"
                                      >
                                        <td className="py-2 pr-4 font-mono text-emerald-600 text-xs">
                                          {i.item_no}
                                        </td>
                                        <td className="py-2 pr-4 text-gray-800">
                                          {i.item_name}
                                        </td>
                                        <td className="py-2 pr-4 text-gray-400 text-xs">
                                          {i.item_uom}
                                        </td>
                                        <td className="py-2 pr-4 font-mono text-gray-800 text-center">
                                          {i.requested_qty}
                                        </td>
                                        <td className="py-2 pr-4 font-mono text-center">
                                          <span
                                            className={
                                              i.approved_qty != null
                                                ? "text-emerald-600"
                                                : "text-gray-300"
                                            }
                                          >
                                            {i.approved_qty ?? "—"}
                                          </span>
                                        </td>
                                        <td className="py-2 pr-4 font-mono text-center">
                                          <span
                                            className={
                                              i.fulfilled_qty != null
                                                ? "text-blue-600"
                                                : "text-gray-300"
                                            }
                                          >
                                            {i.fulfilled_qty ?? "—"}
                                          </span>
                                        </td>
                                        {(isDisputed || isReceived) && (
                                          <>
                                            <td className="py-2 pr-4 font-mono text-center">
                                              <span
                                                className={
                                                  i.received_qty != null
                                                    ? Number(i.received_qty) <
                                                      Number(i.fulfilled_qty)
                                                      ? "text-amber-600"
                                                      : "text-teal-600"
                                                    : "text-gray-300"
                                                }
                                              >
                                                {i.received_qty ?? "—"}
                                              </span>
                                            </td>
                                            <td className="py-2 text-center">
                                              {i.item_condition ? (
                                                <span
                                                  className={`px-2 py-0.5 rounded border text-xs font-bold font-mono ${i.item_condition === "OK"
                                                    ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                                                    : i.item_condition ===
                                                      "DAMAGED"
                                                      ? "bg-amber-50 border-amber-300 text-amber-700"
                                                      : "bg-red-50 border-red-300 text-red-700"
                                                    }`}
                                                >
                                                  {i.item_condition}
                                                </span>
                                              ) : (
                                                <span className="text-gray-300">
                                                  —
                                                </span>
                                              )}
                                            </td>
                                          </>
                                        )}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                );
              })
            )}
          </tbody>
        </table>
        <Pagination
          currentPage={page}
          totalItems={requests.length}
          pageSize={pageSize}
          onPageChange={setPage}
          pageSizeOptions={[10, 25, 50]}
          onPageSizeChange={setPageSize}
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
          toStore={toStore}
        />
      )}
    </div>
  );
}
