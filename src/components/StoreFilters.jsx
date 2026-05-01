import { useState } from "react";
import { ChevronDown, ChevronUp, } from 'lucide-react';

const pages = {
  subStore: {
    page: "subStore",
    store: true,
  },

  subStoreManager: {
    page: "subStoreManager",
    store: true,
  },

  mainSubStoreReqs: {
    page: "mainSubStoreReqs",
    store: false,
  },
  mainReqToHO: {
    page: "mainReqToHO",
    store: false
  }
}

export default function StoreFilters({
  filterStatus,
  setFilterStatus,
  filterStore,
  setFilterStore,
  role,
  subStores,
  pageType,
  loading,
}) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showStoreDropdown, setShowStoreDropdown] = useState(false);
  const currentPage = pages[pageType]

  const categories = [
    { label: "تمام حالتیں", value: "" },
    { label: "زیرِ التواء", value: "PENDING" },
    { label: "منظور شدہ", value: "APPROVED" },
    { label: "مسترد شدہ", value: "REJECTED" },
    { label: "مکمل کیا گیا", value: "FULFILLED" },
    { label: "وصول ہو گیا", value: "RECEIVED" },
    { label: "متنازع", value: "DISPUTED" },
    ...(pageType === "mainSubStoreReqs"
      ? [{ label: "واپس کر دیا گیا", value: "RETURN_BACK" }]
      : [])
  ];

  const selectedLabel = categories.find((c) => c.value === filterStatus)?.label || "تمام حالتیں";
  const selectedStoreLabel = subStores?.find((c) => c.store_id === filterStore)?.store_name || "تمام اسٹورز";

  return (
    <>
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        {showDropdown && (
          <div className="absolute inset-0" onClick={() => setShowDropdown((prev) => !prev)} />
        )}
        <div className="relative w-30">
          <input
            readOnly
            value={selectedLabel}
            disabled={loading}
            onClick={() => {
              setShowDropdown((prev) => !prev)
              setShowStoreDropdown(false)
            }}
            className="bg-white border w-full border-gray-300 rounded pl-3 py-1 text-gray-700 text-sm focus:outline-none focus:border-emerald-500 cursor-pointer"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            {showDropdown ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
          </div>
          {showDropdown && (
            <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => {
                    setFilterStatus(cat.value)
                    setShowDropdown(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors cursor-pointer"
                >
                  {cat.label}
                </button>
              ))}
            </div>
          )}
        </div>


        {currentPage.store && role === "super admin" && (
          <>
            {showStoreDropdown && (
              <div className="absolute inset-0" onClick={() => setShowStoreDropdown((prev) => !prev)} />
            )}
            <div className="relative w-30">
              <input
                readOnly
                value={selectedStoreLabel}
                disabled={loading}
                onClick={() => {
                  setShowStoreDropdown((prev) => !prev)
                  setShowDropdown(false)
                }}
                className="bg-white border w-full border-gray-300 rounded pl-3 pr-10 py-1 text-gray-700 text-sm focus:outline-none focus:border-emerald-500 cursor-pointer"
              />

              {/* Arrow Icon */}
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                {showStoreDropdown ? (
                  <ChevronUp size={16} className="text-gray-400" />
                ) : (
                  <ChevronDown size={16} className="text-gray-400" />
                )}
              </div>

              {showStoreDropdown && (
                <>
                  <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    <button
                      type="button"
                      onClick={() => {
                        setFilterStore("");
                        setShowStoreDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 border-b border-gray-100"
                    >
                      تمام اسٹورز
                    </button>

                    {subStores.map((s) => (
                      <button
                        key={s.store_id}
                        type="button"
                        onClick={() => {
                          setFilterStore(s.store_id)
                          setShowStoreDropdown(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                      >
                        {s.store_name}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>

    </>
  );
}
