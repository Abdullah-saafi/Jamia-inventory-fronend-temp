import { useEffect, useState, useCallback } from "react";
import {
  getRequests,
  getStores,
  getItems,
  getReturnRequests,
  getItemCategories,
} from "../services/api";
import MainAllItems from "../components/MainStore/MainAllItems";
import MainSubStoreReqs from "../components/MainStore/MainSubStoreReqs";
import MainReqToHO from "../components/MainStore/MainReqToHO";
import MainStoreProcessReturns from "../components/MainStore/MainStoreProcessReturns";
import { useAuth } from "../context/authContext";
import useErrorHandler from "../components/useErrorHandler";
import BlockedUI from "../components/BlockedUI";
import { useToast } from "../context/ToastContext";

const TABS = [
  { id: "items", label: "تمام اشیاء" },
  { id: "requests", label: "زیلی اسٹورز کی درخواستیں" },
  { id: "returns", label: "واپس آئٹمز" },
  { id: "ho-create", label: "نئی مرکزی دفتر کی درخواست" },
];

export default function MainStore() {
  const [tab, setTab] = useState("items");

  // ── Data ──────────────────────────────────────────────────────────────────
  const [requests, setRequests] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [headOffices, setHeadOffices] = useState([]);
  const [pendingReturns, setPendingReturns] = useState(0);
  const [mainStoreError, setMainStoreError] = useState("");
  const [toStore, setToStore] = useState([]);
  const [categories, setCategories] = useState([]);

  // ── UI ────────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  // ── Pagination ────────────────────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(1);
  const [pageLimit, setPageLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [requestSearch, setRequestSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [requestDebouncedSearch, setRequestDebouncedSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterType, setFilterType] = useState("");

  const [itemsPagination, setItemsPagination] = useState({
    currentPage: 1,
    pageLimit: 10,
    totalItems: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const [requestsPagination, setRequestsPagination] = useState({
    currentPage: 1,
    pageLimit: 10,
    totalItems: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const [requestStatusFilter, setRequestStatusFilter] = useState("");

  // ── Auth ──────────────────────────────────────────────────────────────────
  const { auth } = useAuth();
  const { showToast } = useToast()
  const handleError = useErrorHandler();

  // ── Debounce search ───────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => setRequestDebouncedSearch(requestSearch), 500);
    return () => clearTimeout(timer);
  }, [requestSearch]);

  // ── Fetch data ────────────────────────────────────────────────────────────
  const fetchData = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        const [rRes, sRes, iRes, retRes, catRes] = await Promise.all([
          getRequests({
            direction: "SUB_TO_MAIN",
            page: currentPage,
            limit: pageLimit,
            status: requestStatusFilter || undefined,
            search: requestDebouncedSearch
          }),
          getStores({ all: true }),
          getItems({
            store_id: auth.store_id, // ← add this
            page: currentPage,
            limit: pageLimit,
            search: debouncedSearch,
            category: filterCategory || undefined,
            item_type: filterType || undefined,
          }),
          getReturnRequests({ to_store_id: auth.store_id, status: "PENDING" }),
          getItemCategories(auth.store_id),
        ]);
        setCategories(catRes.data.data);
        setRequests(rRes.data.data);
        setRequestsPagination(rRes.data.pagination);
        setAllItems(iRes.data.data);
        setItemsPagination(iRes.data.pagination);
        setPendingReturns(retRes.data.data?.length || 0);

        const allStores = sRes.data.data;
        setToStore(allStores.filter((s) => s.store_type === "PETTY_CASH" || s.store_type === "HEAD_OFFICE"))
        setHeadOffices(allStores.filter((s) => s.store_type === "HEAD_OFFICE"));
      } catch (error) {
        const msg = handleError(error, "Failed to load data");
        setMainStoreError(msg);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [
      currentPage,
      pageLimit,
      requestStatusFilter,
      debouncedSearch,
      requestDebouncedSearch,
      filterCategory,
      filterType,
      auth.store_id,
    ],
  );

  useEffect(() => {
    fetchData(false);
  }, [fetchData]);

  const refresh = useCallback(() => fetchData(false), [fetchData]);

  // ── Badge counts ──────────────────────────────────────────────────────────
  const pendingApproved = requests.filter(
    (r) => r.status === "APPROVED",
  ).length;
  const pendingHo = requests.filter((r) => r.status === "PENDING").length;

  if (auth.isBlocked) {
    return <BlockedUI message={auth.message} />;
  }

  return (
    <div>
      {/* Page header */}
      <div className="mb-4">
        <h1 className="text-xl font-black text-gray-900">{auth.username}</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          سب اسٹور کی درخواستوں کا انتظام کریں، انوینٹری کے بہاؤ کو ٹریک کریں، اور ہیڈ آفس سے درخواست کریں
        </p>
      </div>

      {/* Tab navigation */}
      <nav className="bg-white border border-gray-200 rounded-lg mb-6 px-2 py-1.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-1 flex-wrap">
          {TABS.filter((t) => t.id !== "ho-create").map((t) => {
            const badge =
              t.id === "requests" && pendingApproved > 0
                ? pendingApproved
                : t.id === "returns" && pendingReturns > 0
                  ? pendingReturns
                  : t.id === "ho-status" && pendingHo > 0
                    ? pendingHo
                    : null;

            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-all duration-200
                  ${tab === t.id
                    ? "bg-emerald-600 text-white shadow-sm "
                    : "text-gray-700 bg-gray-50 hover:bg-gray-100 hover:text-gray-900 border border-gray-200"
                  }`}
              >
                {t.label}
                {badge && (
                  <span
                    className={`text-xs font-bold rounded-full px-1.5 py-0.5 min-w-4.5 text-center leading-none
                      ${tab === t.id
                        ? "bg-white/20 text-white"
                        : "bg-emerald-600 text-white"
                      }`}
                  >
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div>
          {TABS.filter((t) => t.id === "ho-create").map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-all duration-200
                  ${tab === t.id
                  ? "bg-emerald-600 text-white shadow-sm "
                  : "text-gray-700 bg-gray-50 hover:bg-gray-100 hover:text-gray-900 border border-gray-200"
                }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </nav>

      {/* ── TAB CONTENT ──────────────────────────────────────────────────── */}
      {tab === "items" && (
        <MainAllItems
          allItems={allItems}
          onRefresh={refresh}
          showToast={showToast}
          loading={loading}
          mainStoreError={mainStoreError}
          pagination={itemsPagination}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          pageLimit={pageLimit}
          setPageLimit={setPageLimit}
          search={search}
          setSearch={setSearch}
          filterCategory={filterCategory}
          setFilterCategory={setFilterCategory}
          filterType={filterType}
          categories={categories}
          setFilterType={setFilterType}
          setDebouncedSearch={setDebouncedSearch}
        />
      )}

      {tab === "requests" && (
        <MainSubStoreReqs
          requests={requests}
          pagination={requestsPagination}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          setPageLimit={setPageLimit}
          onFilterChange={setRequestStatusFilter}
          onRefresh={refresh}
          showToast={showToast}
          loading={loading}
          mainStoreError={mainStoreError}
          toStore={toStore}
          setDebouncedSearch={setRequestDebouncedSearch}
          setSearch={setRequestSearch}
          search={requestSearch}
        />
      )}

      {tab === "returns" && (
        <MainStoreProcessReturns showToast={showToast} />
      )}

      {tab === "ho-create" && (
        <MainReqToHO
          showToast={showToast}
        />
      )}
    </div>
  );
}
