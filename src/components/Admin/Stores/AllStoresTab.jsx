import { useEffect, useRef, useState } from "react";
import { STORE_TYPE_LABELS, STORES } from "../../../services/constants";
import useErrorHandler from "../../useErrorHandler";
import { deleteStore, getStores, storeStatus } from "../../../services/api";
import { useNavigate, useOutletContext } from "react-router-dom";
import Pagination from "../../Pagination";
import { ChevronDown, ChevronUp } from "lucide-react";
import CheckLoadingAndError from "../../CheckLoadingAndError";
import ConfirmDeleteModal from "../../Modals/ConfirmDeleteModal";

export default function AllStoresTab() {

  const { loadStores: refreshAdminStores, showToast } = useOutletContext();

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [stores, setStores] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showStoreDropdown, setShowStoreDropdown] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [deleteStoreLoading, setDeleteStoreLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const deleteResolveRef = useRef(null);
  const handleError = useErrorHandler();
  const navigate = useNavigate();

  const loadStores = async () => {
    try {
      setLoading(true);

      const response = await getStores({
        all: true,
        search: debouncedSearch,
        type: typeFilter,
        page,
        limit: pageSize,
      });

      setStores(response.data.data || []);
      setTotalItems(response.data.total || 0);

    } catch (error) {
      const msg = handleError(error, "اسٹورز لوڈ نہیں ہو سکے۔");
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStore = async (id) => {
    setDeleteStoreLoading(true)
    setShowDeleteModal(true)
    const confirmed = await new Promise((resolve) => {
      deleteResolveRef.current = resolve
    })
    setShowDeleteModal(false)
    if (!confirmed) {
      setDeleteStoreLoading(false)
      deleteResolveRef.current = null
      return
    }
    try {
      const res = await deleteStore({ store_id: id })
      showToast(res.data.message, "success")
      loadStores()
    } catch (error) {
      const msg = handleError(error, "اسٹور ڈیلیٹ نہیں ہو سکا۔");
      showToast(msg, "error");
    } finally {
      setDeleteStoreLoading(false)
      deleteResolveRef.current = null

    }
  }

  useEffect(() => {
    loadStores();
  }, [page, pageSize, debouncedSearch, typeFilter]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, typeFilter]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);


  const handleAction = async (id, currentStatus) => {
    try {
      setLoading(true);
      const status = !currentStatus;
      const response = await storeStatus(id, { status });

      if (response.status === 200) {
        await loadStores();
        if (refreshAdminStores) refreshAdminStores();
        showToast(`اسٹور کامیابی سے ${status ? "بحال" : "غیر فعال"} کر دیا گیا ہے`, "success");
      }
    } catch (error) {
      const msg = handleError(error, "Failed to update store status");
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const hasFilters = search || typeFilter;

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-wrap gap-2 mb-4">
        <input
          dir="ltr"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="نام یا کوڈ سے تلاش کریں..."
          className="bg-white border border-gray-300 rounded px-3 py-2 text-gray-800 text-sm focus:outline-none focus:border-emerald-500 placeholder-gray-400 w-56 shadow-sm"
        />
        {showStoreDropdown && (
          <div className="absolute inset-0" onClick={() => setShowStoreDropdown((prev) => !prev)} />
        )}

        <div className="relative min-w-50">
          <button
            type="button"
            onClick={() => {
              setShowStoreDropdown((prev) => !prev)
            }}
            className=" w-full h-10 px-3 flex items-center justify-between bg-white border border-gray-300 rounded-lg shadow-sm hover:border-emerald-400 focus:border-emerald-500 transition-all text-sm text-gray-700">
            <span>
              {STORES.find((s) => s.value === typeFilter)?.label || "تمام اسٹورز"}
            </span>

            {showStoreDropdown ? (
              <ChevronUp size={16} className="text-gray-400" />
            ) : (
              <ChevronDown size={16} className="text-gray-400" />
            )}
          </button>

          {showStoreDropdown && (
            <div
              className=" absolute z-50 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden max-h-48 overflow-y-auto">
              <button
                className=" w-full text-left px-4 py-2.5 hover:bg-emerald-50 text-sm"
                onClick={() => {
                  setTypeFilter("");
                  setShowStoreDropdown(false);
                }}
              >
                تمام اسٹورز
              </button>
              {STORES.map((n) => (
                <button
                  key={n.value}
                  onClick={() => {
                    setTypeFilter(n.value);
                    setShowStoreDropdown(false);
                  }}
                  className={` w-full text-left px-4 py-2.5 text-sm hover:bg-emerald-50 transition-colors ${typeFilter === n.value
                    ? "bg-emerald-100 text-emerald-700 font-semibold"
                    : "text-gray-700"
                    }
          `}
                >
                  {n.label}
                </button>
              ))}
            </div>
          )}
        </div>
        {hasFilters && (
          <button
            onClick={() => {
              setSearch("");
              setTypeFilter("");
              setDebouncedSearch("");
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

      <div className="overflow-x-auto text-center rounded-lg border border-gray-200 shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {[
                "اسٹور کا نام",
                "شعبہ",
                "پتہ",
                "زمرہ",
                "حالت",
                "عمل",
              ].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-gray-500 font-bold text-xs uppercase tracking-wider font-sans"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white">
            {(loading || error || stores.length === 0) ? (
              <CheckLoadingAndError
                loading={loading}
                error={error}
                requests={stores}
              />
            ) : (
              stores.map((s) => (
                <tr
                  key={s.store_id}
                  className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${!s.is_active ? "opacity-60" : ""}`}
                >
                  <td className="px-4 py-3 text-left text-gray-800 font-semibold text-xs">
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
                    {s.category || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-black uppercase ${s.is_active ? "text-emerald-600" : "text-red-500"}`}
                    >
                      {s.is_active ? "فعال" : "غیر فعال"}
                    </span>
                  </td>
                  <td className="px-4 py-3 flex justify-center items-center gap-2">
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
                    <button
                      className="text-[10px] uppercase font-bold text-black/80  border border-red-300 bg-red-500/80 rounded px-3 py-1 hover:bg-red-500"
                      onClick={() => {
                        handleDeleteStore(s.store_id)
                      }}
                      disabled={deleteStoreLoading}
                    >
                      ڈیلیٹ
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <Pagination
          currentPage={page}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setPage}
          pageSizeOptions={[10, 25, 50]}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
        />
        {showDeleteModal && (
          <ConfirmDeleteModal
            onConfirm={() => deleteResolveRef.current?.(true)}
            onCancel={() => deleteResolveRef.current?.(false)}
          />
        )}
      </div>
    </div>
  );
}
