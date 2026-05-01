import { useEffect, useState, useCallback } from "react";
import { getRequests, getStores, getItems } from "../services/api";
import MainAllItems from "../components/MainStore/MainAllItems";
import MainSubStoreReqs from "../components/MainStore/MainSubStoreReqs";
import MainReqToHO from "../components/MainStore/MainReqToHO";
import { useAuth } from "../context/authContext";
import useErrorHandler from "../components/useErrorHandler";
import BlockedUI from "../components/BlockedUI";
import Toast from "../components/Toast";
import Scrap from "../components/MainStore/Scrap";

const TABS = [
  { id: "items", label: "تمام اشیاء" },
  { id: "requests", label: "زیلی اسٹورز کی درخواستیں" },
  { id: "ho-create", label: "نئی مرکزی دفتر کی درخواست" },
  // { id: "scrap", label: "Scrap" },
];

export default function MainStore() {
  const [tab, setTab] = useState("items");

  // ── Data ──────────────────────────────────────────────────────────────────
  const [requests, setRequests] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [mainStores, setMainStores] = useState([]);
  const [headOffices, setHeadOffices] = useState([]);
  const [hoRequests, setHoRequests] = useState([]);

  // ── UI ────────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [mainStoreError, setMainStoreError] = useState("");
  const [toast, setToast] = useState(null);

  // ── Auth And Error ──────────────────────────────────────────────────────────

  const { auth } = useAuth();

  const handleError = useErrorHandler();

  // ── Fetch data (silent = no spinner, used for refreshes) ──────────────────

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [rRes, sRes, iRes, hoReqRes] = await Promise.all([
        getRequests({ direction: "SUB_TO_MAIN" }),
        getStores(),
        getItems(),
        getRequests({ direction: "MAIN_TO_HO" }),
      ]);

      setRequests(rRes.data.data);
      setHoRequests(hoReqRes.data.data);
      setAllItems(iRes.data.data);

      const allStores = sRes.data.data;
      setMainStores(allStores.filter((s) => s.store_type === "MAIN_STORE"));
      setHeadOffices(allStores.filter((s) => s.store_type === "HEAD_OFFICE"));
    } catch (error) {
      const msg = handleError(error, "Failed to load data");
      setMainStoreError(msg);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(false);
  }, [fetchData]);

  useEffect(() => {
      setTimeout(() => {
        setToast(null);
      }, 3000); 
  }, [toast]);

  const refresh = useCallback(() => fetchData(false), [fetchData]);

  // ── Badge counts ──────────────────────────────────────────────────────────
  const pendingApproved = requests.filter(
    (r) => r.status === "APPROVED",
  ).length;
  const pendingHo = hoRequests.filter((r) => r.status === "PENDING").length;

  if (auth.isBlocked) {
    return <BlockedUI message={auth.message} />;
  }

  return (
    <div>
      {/* Page header */}
      <div className="mb-4">
        <h1 className="text-xl font-black text-gray-900">{auth.username}</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Manage sub store requests, track inventory flow, and request from Head
          Office
        </p>
      </div>

      {/* Tab navigation */}
      <nav className="bg-white border border-gray-200 rounded-lg mb-6 px-2 py-1.5 flex items-center shadow-sm">
        {/* Left tabs */}
        <div className="flex items-center gap-1 flex-wrap">
          {TABS.filter((t) => t.id !== "ho-create").map((t) => {
            const badge =
              t.id === "requests" && pendingApproved > 0
                ? pendingApproved
                : t.id === "ho-status" && pendingHo > 0
                  ? pendingHo
                  : null;

            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors
            ${
              tab === t.id
                ? "bg-emerald-600 text-white"
                : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"
            }`}
              >
                {t.label}
                {badge && (
                  <span
                    className={`text-xs font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center leading-none
                ${
                  tab === t.id
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

        {/* Right tab (ho-create) */}
        <div>
          {TABS.filter((t) => t.id === "ho-create").map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors
          ${
            tab === t.id
              ? "bg-emerald-600 text-white"
              : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"
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
          mainStores={mainStores}
          onRefresh={refresh}
          setToast={setToast}
          loading={loading}
          mainStoreError={mainStoreError}
        />
      )}

      {tab === "scrap" && (
        <Scrap
          
        />
      )}

      {tab === "requests" && (
        <MainSubStoreReqs
          requests={requests}
          onRefresh={refresh}
          setToast={setToast}
          loading={loading}
          mainStoreError={mainStoreError}
        />
      )}

      {tab === "ho-create" && (
        <MainReqToHO
          mainStores={mainStores}
          headOffices={headOffices}
          hoRequests={hoRequests}
          refresh={refresh}
          setToast={setToast}
          loading={loading}
          mainStoreError={mainStoreError}
        />
      )}

      {/* Toast */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
