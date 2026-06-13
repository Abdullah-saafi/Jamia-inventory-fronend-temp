import { useState, useEffect } from "react";
import { getUsers, userStatus } from "../../services/api";
import { ROLES, ROLE_LABELS } from "../../services/constants";
import useErrorHandler from "../useErrorHandler";
import { useNavigate, useOutletContext } from "react-router-dom";
import Pagination from "../Pagination";
import Toast from "../Toast"
import { ChevronDown, ChevronUp } from "lucide-react";
import CheckLoadingAndError from "../CheckLoadingAndError";

export default function AllUsersTab() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [storeFilter, setStoreFilter] = useState("");
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [showStoreTypeDropdown, setShowStoreTypeDropdown] = useState(false);
  const [showStoreDropdown, setShowStoreDropdown] = useState(false);
  const [pageSize, setPageSize] = useState(10);

  const handleError = useErrorHandler();
  const navigate = useNavigate();

  const { loadStores: refreshAdminStores, showToast } = useOutletContext();

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await getUsers({
        page,
        limit: pageSize,
        search,
        role: roleFilter,
        store: storeFilter,
      });
      setUsers(response.data.data);
      setTotalUsers(response.data.total);
    } catch (error) {
      const msg = handleError(error, "Failed to get users");
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [page, pageSize, search, roleFilter, storeFilter]);

  useEffect(() => {
    setPage(1);
  }, [search, roleFilter, storeFilter]);

  const handleAction = async (id, currentStatus) => {
    try {
      setLoading(true);
      const toggledStatus = !currentStatus;
      const response = await userStatus({ id, status: toggledStatus });
      showToast(response.data.message, "success");
      if (response.status === 200) {
        await loadUsers();
      }
    } catch (error) {
      const msg = handleError(error, "Failed to update user");
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const uniqueStoreNames = [
    ...new Set(users.map((u) => u.store_name).filter(Boolean)),
  ].sort();

  const hasFilters = search || roleFilter || storeFilter;

  return (
    <div>
      {/* Filter Bar */}
      <div className="flex flex-wrap gap-2 mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="نام یا ای میل سے تلاش کریں..."
          className="bg-white border border-gray-300 rounded px-3 py-2 text-gray-800 text-sm focus:outline-none focus:border-emerald-500 placeholder-gray-400 w-56 shadow-sm"
        />


        {/* Store Type Filter */}

        {showStoreTypeDropdown && (
          <div className="absolute inset-0" onClick={() => setShowStoreTypeDropdown((prev) => !prev)} />
        )}
        <div className="relative min-w-45">
          <button
            type="button"
            onClick={() => {
              setShowStoreTypeDropdown((prev) => !prev)
              setShowStoreDropdown(false)
            }}
            className=" w-full h-10 px-3 flex items-center justify-between bg-white border border-gray-300 rounded-lg shadow-sm hover:border-emerald-400 focus:border-emerald-500 transition-all text-sm text-gray-700">
            <span>
              {roleFilter
                ? ROLES.find((r) => r.value === roleFilter)?.label
                : "تمام کردار"}
            </span>

            {showStoreTypeDropdown ? (
              <ChevronUp size={16} className="text-gray-400" />
            ) : (
              <ChevronDown size={16} className="text-gray-400" />
            )}
          </button>

          {showStoreTypeDropdown && (
            <div
              className=" absolute z-50 mt-2 w-full max-h-48 bg-white border border-gray-200 rounded-xl shadow-xl overflow-y-auto">
              <button
                className=" w-full text-left px-4 py-2.5 hover:bg-emerald-50 text-sm"
                onClick={() => {
                  setRoleFilter("");
                  setShowStoreTypeDropdown(false);
                }}
              >
                تمام کردار
              </button>

              {ROLES.map((r) => (
                <button
                  key={r.value}
                  onClick={() => {
                    setRoleFilter(r.value);
                    setShowStoreTypeDropdown(false);
                  }}
                  className={` w-full text-left px-4 py-2.5 text-sm hover:bg-emerald-50 transition-colors ${roleFilter === r.value
                    ? "bg-emerald-100 text-emerald-700 font-semibold"
                    : "text-gray-700"
                    }
          `}
                >
                  {r.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Store Type filter ends here */}


        {/* Store filter */}

        {showStoreDropdown && (
          <div className="absolute inset-0" onClick={() => setShowStoreDropdown((prev) => !prev)} />
        )}

        <div className="relative min-w-50">
          <button
            type="button"
            onClick={() => {
              setShowStoreDropdown((prev) => !prev)
              setShowStoreTypeDropdown(false)
            }}
            className=" w-full h-10 px-3 flex items-center justify-between bg-white border border-gray-300 rounded-lg shadow-sm hover:border-emerald-400 focus:border-emerald-500 transition-all text-sm text-gray-700">
            <span>{storeFilter || "تمام اسٹورز"}</span>

            {showStoreDropdown ? (
              <ChevronUp size={16} className="text-gray-400" />
            ) : (
              <ChevronDown size={16} className="text-gray-400" />
            )}
          </button>

          {showStoreDropdown && (
            <div
              className=" absolute max-h-48 z-50 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden overflow-y-auto">
              <button
                className=" w-full text-left px-4 py-2.5 hover:bg-emerald-50 text-sm"
                onClick={() => {
                  setStoreFilter("");
                  setShowStoreDropdown(false);
                }}
              >
                تمام اسٹورز
              </button>
              {uniqueStoreNames.map((n) => (
                <button
                  key={n}
                  onClick={() => {
                    setStoreFilter(n);
                    setShowStoreDropdown(false);
                  }}
                  className={` w-full text-left px-4 py-2.5 text-sm hover:bg-emerald-50 transition-colors ${storeFilter === n
                    ? "bg-emerald-100 text-emerald-700 font-semibold"
                    : "text-gray-700"
                    }
          `}
                >
                  {n}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Store filter ends here */}

        {hasFilters && (
          <button
            onClick={() => {
              setSearch("");
              setRoleFilter("");
              setStoreFilter("");
            }}
            className="text-gray-500 hover:text-gray-800 text-sm px-3 py-2 border border-gray-300 rounded hover:bg-gray-50"
          >
            Clear
          </button>
        )}
        <button
          onClick={loadUsers}
          className="text-gray-500 hover:text-gray-800 text-sm px-3 py-2 border border-gray-300 rounded ml-auto hover:bg-gray-50 shadow-sm"
        >
          ↻ Refresh
        </button>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm ">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {[
                "نام",
                "ای میل",
                "کردار",
                "اسٹور",
                "حالت",
                "تخلیق شدہ",
                "عمل",
              ].map((h) => (
                <th
                  key={h}
                  className=" px-4 py-3 text-gray-500 font-semibold text-xs uppercase tracking-wider"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(loading || error || users.length === 0) ? (
              <CheckLoadingAndError
                loading={loading}
                error={error}
                requests={users}
              />
            ) : (
              users.map((u) => (
                <tr
                  key={u.id}
                  className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${!u.is_active ? "opacity-60" : ""}`}
                >
                  <td className="px-4 py-3 text-gray-800 font-semibold">
                    {u.name}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className="bg-gray-100 border border-gray-200 text-gray-600 text-[10px] font-bold uppercase px-2 py-0.5 rounded">
                      {ROLE_LABELS[u.role] || u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700 text-xs">
                    {u.store_name || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-bold ${u.is_active ? "text-emerald-600" : "text-red-600"}`}
                    >
                      {u.is_active ? "فعال" : "غیر فعال"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-[10px]">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAction(u.id, u.is_active)}
                        disabled={loading}
                        className={`text-[10px] uppercase font-bold px-3 py-1 rounded border transition-colors
                          ${u.is_active
                            ? "bg-red-50 border-red-200 text-red-600 hover:bg-red-100"
                            : "bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100"
                          }`}
                      >
                        {u.is_active ? "غیر فعال کریں" : "فعال کریں"}
                      </button>
                      <button
                        className="text-[10px] uppercase font-bold text-gray-600 border border-gray-300 bg-gray-200 rounded px-3 py-1 hover:bg-gray-300"
                        onClick={() => {
                          navigate(`/admin/user/${u.id}`);
                        }}
                      >
                        ترمیم کریں
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <Pagination
          currentPage={page}
          totalItems={totalUsers}
          pageSize={pageSize}
          onPageChange={setPage}
          pageSizeOptions={[10, 25, 50]}
          onPageSizeChange={setPageSize}
        />
      </div>
    </div>
  );
}
