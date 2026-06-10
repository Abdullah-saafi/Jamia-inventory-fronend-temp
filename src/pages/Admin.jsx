import { useEffect, useState } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom"
import { getStores } from "../services/api";
import { TABS } from "../services/constants.js";
import { useAuth } from "../context/authContext.jsx";
import BlockedUI from "../components/BlockedUI.jsx";
import { useToast } from "../context/ToastContext";

export default function Admin() {
  const navigate = useNavigate();
  const location = useLocation();
  const [stores, setStores] = useState([]);

  const { auth } = useAuth()
  const { showToast } = useToast()
  const currentTab = location.pathname.split("/").pop() || "user";

  const loadStores = () =>
    getStores({ all: true })
      .then((r) => setStores(r.data.data || []))
      .catch(() => { });

  useEffect(() => {
    loadStores();
    if (location.pathname === "/admin") {
      navigate("/admin/user", { replace: true });
    }
  }, [location.pathname, navigate]);

  if (auth.isBlocked) {
    return <BlockedUI message={auth.message} />
  }

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-xl font-black text-gray-900">Admin Panel</h1>
        <p className="text-gray-500 text-sm mt-0.5">صارفین، اسٹورز اور برانچز کا انتظام کریں</p>
      </div>

      <nav className="bg-white border border-gray-200 rounded-lg mb-6 px-2 py-1.5 flex items-center gap-1 shadow-sm w-fit">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => navigate(`/admin/${t.id}`)}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors
              ${currentTab === t.id
                ? "bg-emerald-600 text-white"
                : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"
              }`}
          >
            {t.label}
          </button>
        ))}
      </nav>
      <div className="mt-4">
        <Outlet context={{ stores, loadStores, showToast }} />
      </div>
    </div>
  );
}