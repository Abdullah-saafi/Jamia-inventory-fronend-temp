import { useState } from "react";
import ExcelDownloaderWithDates from "../Exceldownloaderwithdates";
import Pagination from "../Pagination";
import { useAuth } from "../../context/authContext";
import CheckLoadingAndError from "../CheckLoadingAndError";
import { ChevronDown, ChevronUp } from "lucide-react";
import TableHead from "../TableHead";
import { ITEM_CONDITIONS } from "../../services/constants";
import { useNavigate } from "react-router-dom";

export default function MainAllItems({
  allItems,
  onRefresh,
  loading,
  mainStoreError,
  pagination = { currentPage: 1, totalItems: 0, pageLimit: 10 },
  setCurrentPage,
  setPageLimit,
  search,
  setSearch,
  filterCategory,
  setFilterCategory,
  filterType,
  setFilterType,
  categories,
  setDebouncedSearch,
  pageTypeProp // Prop from admin
}) {
  const [showCategory, setShowCategory] = useState(false);
  const [showItemTypeDropdown, setShowItemTypeDropdown] = useState(false);

  const { auth } = useAuth();
  const navigate = useNavigate();

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
                    ? categories.find((c) => c.category_id === filterCategory).category_name
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
                      key={c.category_id}
                      type="button"
                      onClick={() => {
                        setFilterCategory(c.category_id);
                        setShowCategory(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                    >
                      {c.category_name}
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
                  setDebouncedSearch("")
                }}
                className="text-gray-500 hover:text-gray-800 text-sm px-3 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
          <button
            onClick={() => {
              onRefresh();
              setCurrentPage(1);
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
              { key: "item_no", label: "آئٹم نمبر", format: (v) => (v ? v : "—") },
              { key: "item_name", label: "نام", format: (v) => (v ? v : "—") },
              { key: "category", label: "زمرہ", format: (v) => (v ? v : "—") },
              { key: "item_uom", label: "اکائی / UOM", format: (v) => (v ? v : "—") },
              { key: "item_quantity", label: "مرکزی اسٹور کا اسٹاک", format: (v) => (v ? v : "—") },
              { key: "sub_qty", label: "ذیلی اسٹورز کو بھیجا گیا", format: (v) => (v ? v : "—") },
              { key: "transit_qty", label: "ذیلی اسٹورزکوبھیجی جارہی", format: (v) => (v ? v : "—") },
              { key: "mainstore_transit_qty", label: "مین اسٹور کو بھیجی جارہی", format: (v) => (v ? v : "—") },
              { key: "total_qty", label: "باقی اسٹاک", format: (v) => (v ? v : "—") },
              { key: "min_quantity", label: "کم از کم اسٹاک", format: (v) => (v ? v : "—") },
              { key: "returned_qty", label: "واپس آئٹمز", format: (v) => (v ? v : "—") },
              { key: "scrapped_qty", label: "اسکریپ", format: (v) => (v ? v : "—") },
              {
                key: "condition",
                label: "حالت",
                format: (_, row) =>
                  row.current_quantity <= row.minimum_quantity
                    ? "Low"
                    : "OK",
              },
            ]}
            pageLoading={loading}
          />
        </div>
      </div>

      {/* Table Section */}
      <div className="overflow-x-auto text-center rounded-lg border border-gray-200 shadow-sm mt-1">
        <table className="w-full text-sm">
          <thead>
            <TableHead
              pageType={pageType}
              pageTypeProp={pageTypeProp}
            />
          </thead>
          <tbody>
            {loading || mainStoreError || allItems.length === 0 ? (
              <CheckLoadingAndError
                loading={loading}
                error={mainStoreError}
                requests={allItems}
                pageType={pageType}
              />
            ) : (
              allItems.map((i) => {
                const isLow = i.is_low_stock
                return (
                  <tr
                    key={i.item_id}
                    className={`border-b border-gray-100 hover:bg-gray-100 transition-colors whitespace-nowrap ${isLow ? "bg-red-200/50 hover:bg-red-200" : ""}`}
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
                        className="font-mono font-bold text-emerald-600"
                      >
                        {Number(i.item_quantity) || "―"}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-blue-600 font-bold">
                      {(
                        Number(i.sub_qty)
                      ).toFixed(0)}
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
                        className={`font-mono text-xs font-bold ${isLow ? "text-red-500" : "text-gray-700"}`}
                      >
                        {
                          Number(i.available_qty).toFixed(0)
                        }
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-gray-400 text-xs">
                      {Number(i.min_quantity) ?? "0"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-bold text-orange-500">
                        {Number(i.returned_stock) || "0"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-bold text-red-500">
                        {Number(i.scrapped_qty) || "0"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs ${isLow ? "text-red-500 font-extrabold" : "text-emerald-600 font-semibold"}`}
                      >
                        {isLow ? "Low" : "OK"}
                      </span>
                    </td>
                    {pageTypeProp && (
                      <td className="px-4 py-3">
                        <button
                          className="text-[10px] uppercase font-bold text-gray-600 border border-gray-300 bg-gray-200 rounded px-3 py-1 hover:bg-gray-300"
                          onClick={() => {
                            navigate(`/admin/item/${i.item_id}`);
                          }}
                        >
                          ترمیم کریں
                        </button>
                      </td>
                    )}
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