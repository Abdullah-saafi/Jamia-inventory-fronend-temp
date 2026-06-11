import { useState } from "react";
import ExcelDownloaderWithDates from "../Exceldownloaderwithdates";
import Pagination from "../Pagination";
import { useAuth } from "../../context/authContext";
import useErrorHandler from "../useErrorHandler";
import CheckLoadingAndError from "../CheckLoadingAndError";
import AddItemModal from "../AddItemModal";
import { ChevronDown, ChevronUp } from "lucide-react";
import TableHead from "../TableHead";
import { ITEM_CONDITIONS } from "../../services/constants";

export default function MainAllItems({
  allItems,
  mainStores,
  onRefresh,
  showToast,
  loading,
  mainStoreError,
  pagination = { currentPage: 1, totalItems: 0, pageLimit: 10 },
  currentPage,
  setCurrentPage,
  pageLimit,
  setPageLimit,
  search,
  setSearch,
  filterCategory,
  setFilterCategory,
  filterType,
  setFilterType,
  categories,
}) {
  const [showAddItem, setShowAddItem] = useState(false);
  const [showCategory, setShowCategory] = useState(false);
  const [showItemTypeDropdown, setShowItemTypeDropdown] = useState(false);

  const { auth } = useAuth();
  const handleError = useErrorHandler();

  const pageType = "mainAllItems"


  return (
    <div>
      <div className="flex items-end justify-between py-2">
        <div>
          <div className="flex gap-2">
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="آئٹم کے نام یا نمبر سے تلاش کریں..."
              className="bg-white border leading-none border-gray-300 rounded px-3 py-3 text-gray-800 text-sm focus:outline-none focus:border-emerald-500 w-52 shadow-sm"
            />

            {/* Category drop down */}

            {showCategory && (
              <div className="absolute inset-0" onClick={() => setShowCategory((prev) => !prev)} />
            )}
            <div className="relative w-48">
              {showCategory && (
                <div
                  className="absolute inset-0 z-40"
                  onClick={() => setShowCategory(false)}
                />
              )}

              {/* Input */}
              <input
                readOnly
                value={
                  filterCategory
                    ? filterCategory
                    : "تمام زمرے"
                }
                onClick={() => setShowCategory((prev) => !prev)}
                className="bg-white leading-none rounded-lg border w-full border-gray-300 pl-3 pr-10 py-3 text-gray-700 text-sm focus:outline-none focus:border-emerald-500 cursor-pointer shadow-sm"
              />

              {/* Arrow */}
              <div className="absolute top-1/2 -translate-y-1/2 right-3 pointer-events-none">
                {showCategory ? (
                  <ChevronUp size={16} className="text-gray-400" />
                ) : (
                  <ChevronDown size={16} className="text-gray-400" />
                )}
              </div>

              {/* Dropdown */}
              {showCategory && (
                <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">

                  {/* Default option */}
                  <button
                    type="button"
                    onClick={() => {
                      setFilterCategory("");
                      setShowCategory(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                  >
                    تمام زمرے
                  </button>

                  {/* Category list */}
                  {categories.map((c) => (
                    <button
                      key={c.category}
                      type="button"
                      onClick={() => {
                        setFilterCategory(c.category);
                        setShowCategory(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                    >
                      {c.category}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Category drop down end  */}


            {/* Item type drop down */}

            {showItemTypeDropdown && (
              <div className="absolute inset-0" onClick={() => setShowItemTypeDropdown((prev) => !prev)} />
            )}
            <div className="relative min-w-45">
              <button
                type="button"
                onClick={() => {
                  setShowItemTypeDropdown((prev) => !prev)
                  setShowCategory(false);
                }}
                className=" w-full h-10.5 px-3 flex items-center justify-between bg-white border border-gray-300 rounded-lg shadow-sm hover:border-emerald-400 focus:border-emerald-500 transition-all text-sm text-gray-700">
                <span>
                  {filterType
                    ? ITEM_CONDITIONS.find((r) => r.value === filterType)?.label
                    : "آئٹم کی قسم"}
                </span>

                {showItemTypeDropdown ? (
                  <ChevronUp size={16} className="text-gray-400" />
                ) : (
                  <ChevronDown size={16} className="text-gray-400" />
                )}
              </button>

              {showItemTypeDropdown && (
                <div
                  className=" absolute z-50 mt-2 w-full max-h-48 bg-white border border-gray-200 rounded-xl shadow-xl overflow-y-auto">
                  <button
                    className=" w-full text-left px-4 py-2.5 hover:bg-emerald-50 text-sm"
                    onClick={() => {
                      setFilterType("");
                      setShowItemTypeDropdown(false);
                      setShowCategory(false);
                    }}
                  >
                    آئٹم کی قسم
                  </button>

                  {ITEM_CONDITIONS.map((r) => (
                    <button
                      key={r.value}
                      onClick={() => {
                        setFilterType(r.value);
                        setShowItemTypeDropdown(false);
                      }}
                      className={` w-full text-left px-4 py-2.5 text-sm hover:bg-emerald-50 transition-colors ${filterType === r.value
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

            {/* Item type drop down end */}

            {(search || filterCategory || filterType) && (
              <button
                onClick={() => {
                  setSearch("");
                  setFilterType("");
                  setFilterCategory("");
                  setCurrentPage(1);
                }}
                className="text-gray-500 hover:text-gray-800 text-sm px-3 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
          <button
            onClick={() => {
              setSearch("");
              setFilterCategory("");
              setCurrentPage(1);
              onRefresh();
            }}
            className="text-gray-500 hover:text-gray-800 text-sm px-3 py-2 border border-gray-300 rounded hover:bg-gray-50 shadow-sm flex items-center mt-3"
          >
            ↻ Refresh
          </button>
        </div>

        <div className="downloader">
          <ExcelDownloaderWithDates
            data={allItems}
            dateKey="created_at"
            fileName={auth.username}
            columns={[
              { key: "item_id", label: "آئٹم نمبر" },
              { key: "item_name", label: "نام" },
              { key: "category", label: "زمرہ" },
              { key: "item_uom", label: "اکائی / UOM" },
              { key: "item_quantity", label: "مرکزی اسٹور کا اسٹاک" },
              { key: "sub_qty", label: "ذیلی اسٹورز کو بھیجا گیا" },
              { key: "total_qty", label: "باقی اسٹاک" },
              { key: "min_quantity", label: "کم از کم اسٹاک" },
            ]}
          />
        </div>
      </div>

      {/* Table Section */}
      <div className="overflow-x-auto text-center rounded-lg border border-gray-200 shadow-sm mt-1">
        <table className="w-full text-sm">
          <thead>
            <TableHead
              pageType={pageType}
            />
          </thead>
          <tbody>
            {loading || mainStoreError || allItems.length === 0 ? (
              <CheckLoadingAndError
                loading={loading}
                error={mainStoreError}
                requests={allItems}
              />
            ) : (
              allItems.map((i) => {
                const isLow = i.main_qty <= parseFloat(i.min_quantity || 0);
                return (
                  <tr
                    key={i.item_id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono text-emerald-600 text-xs">
                        {i.item_no}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-800">{i.item_name}</div>
                      <div className="font-semibold text-xs text-gray-800 dir-rtl" dir="rtl">
                        {i.item_name_urdu}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {i.category || "—"}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">
                      {i.item_uom || "―"}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">
                      {i.item_type || "―"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`font-mono font-bold ${isLow ? "text-red-500" : "text-emerald-600"}`}
                      >
                        {Number(i.item_quantity) || "―"}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-blue-600 font-bold">
                      {Number(i.sub_qty - i.returned_qty - i.scrapped_qty).toFixed(0)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-bold text-gray-700">
                        {i.transit_qty}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-bold text-gray-700">
                        {i.mainstore_transit_qty}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`font-mono text-xs font-bold ${i.main_qty - i.sub_qty <= 0 ? "text-red-500" : "text-gray-700"}`}
                      >
                        {Number(
                          i.item_quantity - i.sub_qty - i.transit_qty,
                        ).toFixed(0)}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-gray-400 text-xs">
                      {Number(i.min_quantity) ?? "0"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-bold text-orange-500">
                        {Number(i.returned_qty) || "0"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-bold text-red-500">
                        {Number(i.scrapped_qty) || "0"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs font-semibold ${isLow ? "text-red-500" : "text-emerald-600"}`}
                      >
                        {isLow ? "Low" : "OK"}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        <Pagination
          currentPage={pagination.currentPage}
          totalItems={pagination.totalItems}
          pageSize={pagination.pageLimit}
          onPageChange={setCurrentPage}
          pageSizeOptions={[10, 25, 50]}
          onPageSizeChange={(s) => {
            setPageLimit(s);
            setCurrentPage(1);
          }}
        />
      </div>
    </div>
  );
}
