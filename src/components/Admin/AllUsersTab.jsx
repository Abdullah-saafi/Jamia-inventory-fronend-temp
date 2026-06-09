import { useState, useEffect } from "react";
import { getUsers, userStatus } from "../../services/api";
import { ROLES, ROLE_LABELS } from "../../services/constants";
import useErrorHandler from "../useErrorHandler";
import { useNavigate, useOutletContext } from "react-router-dom";
import Pagination from "../Pagination";
import Toast from "../Toast"

export default function AllUsersTab() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [storeFilter, setStoreFilter] = useState("");
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const handleError = useErrorHandler();
  const navigate = useNavigate();

  const { loadStores: refreshAdminStores, showToast } = useOutletContext();

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await getUsers();
      const userData = response.data?.data || response.data || [];
      setUsers(userData);
    } catch (error) {
      const msg = handleError(error, "Failed to get users");
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleAction = async (id, currentStatus) => {
    try {
      setLoading(true);
      const toggledStatus = !currentStatus;
      const response = await userStatus({ id, status: toggledStatus });
      showToast(response.data.message,"success");
      if (response.status === 200) {
        await loadUsers();
      }
    } catch (error) {
      const msg = handleError(error, "Failed to update user");
      showToast(msg, "error" );
    } finally {
      setLoading(false);
    }
  };

  const uniqueStoreNames = [
    ...new Set(users.map((u) => u.store_name).filter(Boolean)),
  ].sort();

  const displayed = users.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q);
    const matchRole = !roleFilter || u.role === roleFilter;
    const matchStore = !storeFilter || u.store_name === storeFilter;
    return matchSearch && matchRole && matchStore;
  });

  const hasFilters = search || roleFilter || storeFilter;

  const paginatedRequests = displayed.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );

  return (
    <div>
      {/* Filter Bar */}
      <div className="flex flex-wrap gap-2 mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="bg-white border border-gray-300 rounded px-3 py-2 text-gray-800 text-sm focus:outline-none focus:border-emerald-500 placeholder-gray-400 w-56 shadow-sm"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="bg-white border border-gray-300 rounded px-3 py-2 text-gray-700 text-sm focus:outline-none focus:border-emerald-500 shadow-sm"
        >
          <option value="">تمام شعبہ جات</option>
          {ROLES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
        <select
          value={storeFilter}
          onChange={(e) => setStoreFilter(e.target.value)}
          className="bg-white border border-gray-300 rounded px-3 py-2 text-gray-700 text-sm focus:outline-none focus:border-emerald-500 shadow-sm"
        >
          <option value="">تمام اسٹورز</option>
          {uniqueStoreNames.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
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
        <table className="w-full text-sm">
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
                  className="text-left px-4 py-3 text-gray-500 font-semibold text-xs uppercase tracking-wider"
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
                  No users found.
                </td>
              </tr>
            ) : (
              paginatedRequests.map((u) => (
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
          totalItems={displayed.length}
          pageSize={pageSize}
          onPageChange={setPage}
          pageSizeOptions={[10, 25, 50]}
          onPageSizeChange={setPageSize}
        />
      </div>
      <div className="mt-2 text-gray-400 text-[10px] uppercase font-bold px-1">
        {displayed.length} user{displayed.length !== 1 ? "s" : ""} shown
      </div>
    </div>
  );
}
