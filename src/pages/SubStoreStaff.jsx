import { useState } from "react";
import { useAuth } from "../context/authContext";
import NewRequestList from "../components/SubStore/NewRequestList";
import ReturnRequestList from "../components/SubStore/ReturnRequestList";
import BlockedUI from "../components/BlockedUI"
import useErrorHandler from "../components/useErrorHandler";
import { useToast } from "../context/ToastContext";
import { getRequests } from "../services/api";

export default function SubStore() {
  const [activeTab, setActiveTab] = useState("new");
  const [exportLoading, setExportLoading] = useState(false)
  const [filterStatusForSubStore, setFilterStatusForSubStore] = useState(false)

  const { auth } = useAuth();
  const handleError = useErrorHandler();
  const { showToast } = useToast();


  const buildBaseParams = () => {
    const params = {
      direction: "SUB_TO_MAIN",
      priority_status: "FULFILLED",
    };
    if (filterStatusForSubStore) params.status = filterStatusForSubStore;
    if (auth.role !== "super admin") {
      params.store_id = auth.store_id;
    } else if (filterStore) {
      params.store_id = filterStore;
    }
    return params;
  };

  const fetchRequestsForExport = async (fromDate, toDate) => {
    const rRes = await getRequests({
      ...buildBaseParams(),
      from_date: fromDate,
      to_date: toDate,
    });
    return rRes.data.data;
  };

  const handleExportAllRequests = async () => {
    setExportLoading(true);
    try {
      const rRes = await getRequests(buildBaseParams());
      return rRes.data.data;
    } catch (err) {
      const msg = handleError(err, "Failed to export all requests");
      showToast(msg, "error");
      return [];
    } finally {
      setExportLoading(false);
    }
  };

  if (auth.isBlocked) {
    return <BlockedUI message={auth.message} />;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-black text-gray-900">{auth.username}</h1>
          <span className="text-gray-500 text-xs mt-0.5 bg-gray-200 rounded p-1">
            {auth.storeName || "loading..."}
          </span>
          <p className="text-gray-500 text-sm mt-0.5">
            درخواست بنائیں اور اپنی ڈیلیوری کی تصدیق کریں
          </p>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2 my-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("new")}
          className={`text-sm font-semibold px-4 py-2 w-[50%] rounded-t transition-colors ${activeTab === "new"
            ? "bg-emerald-600 text-white"
            : "text-gray-600 hover:bg-gray-100"
            }`}
        >
          نئی درخواستیں
        </button>
        <button
          onClick={() => setActiveTab("return")}
          className={`text-sm font-semibold px-4 py-2 w-[50%] rounded-t transition-colors ${activeTab === "return"
            ? "bg-orange-500 text-white"
            : "text-gray-600 hover:bg-gray-100"
            }`}
        >
          واپسی درخواستیں
        </button>
      </div>

      {activeTab === "new" ?
        <NewRequestList
          fetchRequestsForExport={fetchRequestsForExport}
          handleExportAllRequests={handleExportAllRequests}
          exportLoading={exportLoading}
          setFilterStatusForSubStore={setFilterStatusForSubStore}
        />
        :
        <ReturnRequestList />}
    </div>
  );
}