import { useState } from "react";
import { createItem } from "../../services/api";
import ExcelDownloaderWithDates from "../Exceldownloaderwithdates";
import Pagination from "../Pagination";
import { useAuth } from "../../context/authContext";
import useErrorHandler from "../useErrorHandler";
import CheckLoadingAndError from "../CheckLoadingAndError";
import AddItemModal from "../AddItemModal";
import { ChevronDown, ChevronUp } from "lucide-react";
import TableHead from "../TableHead";

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
}) {
  const [showAddItem, setShowAddItem] = useState(false);
  const [showCategory, setShowCategory] = useState(false);
  const [previewImg, setPreviewImg] = useState(null);
  const { auth } = useAuth();
  const handleError = useErrorHandler();

  const pageType = "mainAllItems"

  const categories = [
    ...new Set(allItems.map((i) => i.category).filter(Boolean)),
  ];

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
              className="bg-white border leading-none border-gray-300 rounded px-3 py-3 text-gray-800 text-sm focus:outline-none focus:border-emerald-500 w-64 shadow-sm"
            />

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
                className="bg-white leading-none border w-full border-gray-300 rounded pl-3 pr-10 py-3 text-gray-700 text-sm focus:outline-none focus:border-emerald-500 cursor-pointer shadow-sm"
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
                <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">

                  {/* Default option */}
                  <button
                    type="button"
                    onClick={() => {
                      setFilterCategory("");
                      setShowCategory(false);
                    }}
                    className=" text-left px-3 py-2 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 border-b border-gray-100"
                  >
                    تمام زمرے
                  </button>

                  {/* Category list */}
                  {categories.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => {
                        setFilterCategory(c);
                        setShowCategory(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                    >
                      {c}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <select
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-white border border-gray-300 rounded px-3 text-gray-700 text-sm focus:outline-none focus:border-emerald-500 shadow-sm mr-2"
            >
              <option value="">آئٹم کی قسم</option>
              <option value="USABLE">USABLE</option>
              <option value="REUSABLE">REUSABLE</option>
            </select>
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
      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm mt-1">
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
                    <td className="px-4 py-3 text-gray-800 font-semibold">
                      {i.item_name}
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
                      {Number(i.sub_qty).toFixed(0)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-bold text-gray-700">
                        {i.transit_qty}
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
                      <span
                        className={`text-xs font-semibold ${isLow ? "text-red-500" : "text-emerald-600"}`}
                      >
                        {isLow ? "Low" : "OK"}
                      </span>
                    </td>
     <td className="px-4 py-3 text-center">
  {i.image_url ? (
    <button
      onClick={() => setPreviewImg(i.image_url)}
      title="تصویر دیکھیں"
      className="text-xl hover:scale-125 transition-transform"
    >
      🖼️
    </button>
  ) : (
    <span className="text-gray-300 text-lg">—</span>
  )}
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
        {previewImg && (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
    onClick={() => setPreviewImg(null)}
  >
    <img
      src={previewImg}
      alt="preview"
      className="max-w-[90vw] max-h-[85vh] rounded-xl shadow-2xl border-4 border-white"
    />
  </div>
)}
      </div>
    </div>
    
  );
}