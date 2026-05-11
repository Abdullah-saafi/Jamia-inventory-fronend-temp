import { useEffect, useState } from "react";
import { STORE_TYPE_LABELS } from "../../services/constants";
import useErrorHandler from "../useErrorHandler";
import { getStores, storeStatus } from "../../services/api";
import { useNavigate, useOutletContext } from "react-router-dom";
import Pagination from "../Pagination";
import Toast from "../Toast";
import { useAuth } from "../../context/authContext";

export default function AllStoresTab() {

  const { loadStores: refreshAdminStores } = useOutletContext();

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [stores, setStores] = useState([]);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("")
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [emergency,setEmergency] = useState(false);
  const [pageSize, setPageSize] = useState(10);

  const handleError = useErrorHandler();
  const {auth, setAuth} = useAuth()
  const navigate = useNavigate();

  const loadStores = async () => {
    try {
      setLoading(true);
      const response = await getStores({ all: true });
      setStores(response.data.data || []);
    } catch (error) {
      const msg = handleError(error, "Failed to load stores");
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setTimeout(() => setToast(null), 7000);
  }, [toast]);

  useEffect(() => {
    loadStores();
  }, []);

  const handleAction = async (id, currentStatus) => {
    try {
      setLoading(true);
      const status = !currentStatus;
      const response = await storeStatus(id, { status });

      if (response.status === 200) {
        await loadStores();
        if (refreshAdminStores) refreshAdminStores();
        setToast({
          message: `Store ${status ? "activated" : "deactivated"} successfully`, type: "success"
        });
      }
    } catch (error) {
      const msg = handleError(error, "Failed to update store status");
      setToast({ message: msg, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const displayed = stores.filter((s) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      s.store_name.toLowerCase().includes(q) ||
      s.store_code.toLowerCase().includes(q);
    const matchType = !typeFilter || s.store_type === typeFilter;
    return matchSearch && matchType;
  });

  const hasFilters = search || typeFilter;

  const paginatedRequests = displayed.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-wrap gap-2 mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or code..."
          className="bg-white border border-gray-300 rounded px-3 py-2 text-gray-800 text-sm focus:outline-none focus:border-emerald-500 placeholder-gray-400 w-56 shadow-sm"
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="bg-white border border-gray-300 rounded px-3 py-2 text-gray-700 text-sm focus:outline-none focus:border-emerald-500 shadow-sm"
        >
          <option value="">تمام اسٹورز</option>
          <option value="HEAD_OFFICE">ہیڈ آفس</option>
          <option value="MAIN_STORE">مین اسٹور</option>
          <option value="SUB_STORE">سب اسٹور</option>
        </select>
        {hasFilters && (
          <button
            onClick={() => {
              setSearch("");
              setTypeFilter("");
            }}
            className="text-gray-500 hover:text-gray-800 text-sm px-3 py-2 border border-gray-300 rounded hover:bg-gray-50"
          >
            Clear
          </button>
        )}
        <button
          onClick={loadStores}
          className="text-gray-500 hover:text-gray-800 text-sm px-3 py-2 border border-gray-300 rounded ml-auto hover:bg-gray-50 shadow-sm"
        >
          ↻ Refresh
        </button>
      </div>

      {/* <div>
        <p>Emergency Request:</p>
        <button>
          <div className={`w-16 h-8 flex items-center rounded-2xl ${emergency ? "bg-emerald-400" : "bg-gray-300"}`}
            onClick={() => {
              const newValue = !emergency
              setEmergency(newValue)
              setAuth((prev) => ({...prev, toggleEmergency: newValue}))
              console.log("emergency!!!",auth);
              
            }}
          >
            <div className={`w-6 h-6 ml-1 mr-1 bg-white  rounded-3xl transform ease-in-out ${emergency ? "ml-auto" : "mr-auto"}`} />
          </div>
        </button>
      </div> */}

      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {[
                "اسٹور کوڈ",
                "اسٹور کا نام",
                "قسم",
                "پتہ",
                "فون نمبر",
                "حالت",
                "عمل",
              ].map((h) => (
                <th
                  key={h}
                  className="text-left px-4 py-3 text-gray-500 font-bold text-xs uppercase tracking-wider font-sans"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-12">
                  <div className="flex justify-center">
                    <div className="w-7 h-7 border-2 border-gray-200 border-t-emerald-500 rounded-full animate-spin" />
                  </div>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={9} className="text-center py-12">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 m-4 text-red-600 text-sm">
                    {error}
                  </div>
                </td>
              </tr>
            ) : displayed.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-gray-400">
                  No stores found.
                </td>
              </tr>
            ) : (
              paginatedRequests.map((s) => (
                <tr
                  key={s.store_id}
                  className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${!s.is_active ? "opacity-60" : ""}`}
                >
                  <td className="px-4 py-3">
                    <span className="font-mono text-emerald-600 font-bold text-xs">
                      {s.store_code}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-800 font-semibold text-xs">
                    {s.store_name}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded border uppercase
                        ${s.store_type === "HEAD_OFFICE"
                          ? "bg-purple-50 border-purple-200 text-purple-600"
                          : s.store_type === "MAIN_STORE"
                            ? "bg-blue-50 border-blue-200 text-blue-600"
                            : "bg-emerald-50 border-emerald-200 text-emerald-600"
                        }`}
                    >
                      {STORE_TYPE_LABELS[s.store_type] || s.store_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {s.address || "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {s.phone || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-black uppercase ${s.is_active ? "text-emerald-600" : "text-red-500"}`}
                    >
                      {s.is_active ? "فعال" : "غیر فعال"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleAction(s.store_id, s.is_active)}
                      disabled={loading}
                      className={`text-[10px] uppercase mr-2 font-black px-3 py-1 rounded border transition-colors disabled:opacity-40
                        ${s.is_active ? "bg-red-50 border-red-200 text-red-600 hover:bg-red-100" : "bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100"}`}
                    >
                      {s.is_active ? "غیر فعال کریں" : "فعال کریں"}
                    </button>
                    <button
                      className="text-[10px] uppercase font-bold text-gray-600 border border-gray-300 bg-gray-200 rounded px-3 py-1 hover:bg-gray-300"
                      onClick={() => {
                        navigate(`/admin/store/${s.store_id}`);
                      }}
                    >
                      ترمیم کریں
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <Pagination
          currentPage={page}
          totalItems={displayed.length}
          pageSize={pageSize}
          onPageChange={setPage}
          pageSizeOptions={[10, 25, 50]}
          onPageSizeChange={setPageSize}
        />
      </div>
      <div className="mt-2 text-gray-400 text-[10px] uppercase font-bold px-1">
        {displayed.length} store{displayed.length !== 1 ? "s" : ""} shown
      </div>
      <Toast
        toast={toast}
        onClose={() => setToast(null)}
      />
    </div>
  );
}
