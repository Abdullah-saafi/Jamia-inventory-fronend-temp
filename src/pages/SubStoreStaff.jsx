import { useState } from "react";
import { useAuth } from "../context/authContext";
import NewRequestList from "../components/NewRequestList";
import ReturnRequestList from "../components/ReturnRequestList";

export default function SubStore() {
  const [activeTab, setActiveTab] = useState("new"); // "new" | "return"
  const { auth } = useAuth();

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
          className={`text-sm font-semibold px-4 py-2 w-[50%] rounded-t transition-colors ${
            activeTab === "new"
              ? "bg-emerald-600 text-white"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          نئی درخواستیں
        </button>
        <button
          onClick={() => setActiveTab("return")}
          className={`text-sm font-semibold px-4 py-2 w-[50%] rounded-t transition-colors ${
            activeTab === "return"
              ? "bg-orange-500 text-white"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          واپسی درخواستیں
        </button>
      </div>

      {activeTab === "new" ? <NewRequestList /> : <ReturnRequestList />}
    </div>
  );
}