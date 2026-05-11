import { useState } from "react";
import { createItem, scrapByMain } from "../../services/api";
import ExcelDownloaderWithDates from "../Exceldownloaderwithdates";
import Pagination from "../Pagination";
import { useAuth } from "../../context/authContext";
import useErrorHandler from "../useErrorHandler";
import CheckLoadingAndError from "../CheckLoadingAndError";
import AddItemModal from "../AddItemModal";
import ScrapModal from "../ScrapModal";

export default function MainAllItems({
  allItems,
  mainStores,
  onRefresh,
  setToast,
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
  const [scrapModal, setScrapModal] = useState(false);
  const [scrapModalLoading, setScrapModalLoading] = useState(false);
  const [scrapData, setScrapData] = useState([]);
  const [scrapForm, setScrapForm] = useState({
    removed_by: "",
    note: "",
    main_store_id: "",
    items: [],
  });

  const { auth } = useAuth();
  const handleError = useErrorHandler();

  const scrap = async () => {
    try {
      setScrapModalLoading(true);
      setScrapData((f) => ({
        ...f,
        removed_by: auth.username,
        main_store_id: auth.store_id,
      }));
      setScrapModal(true);
    } catch (error) {
      const msg = handleError(error, "Failed to open scrap modal");
      setToast({ message: msg, type: "error" });
    } finally {
      setScrapModalLoading(false);
    }
  };

  const handleScrap = async (data) => {
    try {
      setScrapModalLoading(true);
      const payload = {
        ...data,
        main_store_id: auth.store_id,
        removed_by: auth.username,
      };
      console.log("Final Payload being sent to backend:", payload);
      await scrapByMain(payload);
      setScrapModal(false);
      setToast({ message: "Scrap the items successfully", type: "success" });
      onRefresh();
    } catch (error) {
      const msg = handleError(error, "Failed to scrap");
      setToast({ message: msg, type: "error" });
    } finally {
      setScrapModalLoading(false);
    }
  };

  const categories = [
    ...new Set(allItems.map((i) => i.category).filter(Boolean)),
  ];

  return (
    <div>
      <button
        onClick={() => {
          setToast({ message: "Checking Toast messages", type: "success" });
        }}
      >
        Toast
      </button>

      <button
        onClick={() => {
          setTimeout(() => {
            setToast(null);
          }, 3000);
        }}
      >
        Close Toast
      </button>
      <div className="flex items-end justify-between py-2">
        <div className="">
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by name or item number..."
            className="bg-white border border-gray-300 rounded px-3 py-2 text-gray-800 text-sm focus:outline-none focus:border-emerald-500 w-64 shadow-sm mr-2"
          />
          <select
            value={filterCategory}
            onChange={(e) => {
              setFilterCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-white border border-gray-300 rounded px-3 py-2 text-gray-700 text-sm focus:outline-none focus:border-emerald-500 shadow-sm mr-2"
          >
            <option value="">تمام زمروں</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            value={filterType}
            onChange={(e) => {
              setFilterType(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-white border border-gray-300 rounded px-3 py-2 text-gray-700 text-sm focus:outline-none focus:border-emerald-500 shadow-sm mr-2"
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
            <tr className="bg-gray-50 border-b border-gray-200">
              {[
                "آئٹم نمبر",
                "نام",
                "زمرہ",
                "اکائی",
                "آئٹم کی قسم",
                "مرکزی اسٹور کا اسٹاک",
                "ذیلی اسٹورز کو بھیجا گیا",
                "بھیجی جا رہی",
                "باقی اسٹاک",
                // "اسکریپ شدہ مقدار",
                "کم از کم اسٹاک",
                "واپس آئٹمز",
                "اسکریپ",
                "حالت",
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
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    key={`${i.item_no}_${i.store_id}`}
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

                    {/* Sent to sub stores */}
                    <td className="px-4 py-3 font-mono text-xs text-blue-600 font-bold">
                      {parseFloat(i.sub_qty || 0).toFixed(0)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-bold text-gray-700">
                        {i.transit_qty}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`font-mono text-xs font-bold ${i.remaining_qty <= 0 ? "text-red-500" : "text-gray-700"}`}
                      >
                        {Number(
                          parseFloat(i.item_quantity || 0) -
                            parseFloat(i.sub_qty || 0) -
                            parseFloat(i.transit_qty || 0),
                        ).toFixed(0)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-bold text-orange-500">
                        {Number(i.returned_qty) || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-bold text-red-500">
                        {Number(i.scrap_qty) || "—"}
                      </span>
                    </td>
                    {/* Scrapped qty */}
                    {/* <td className="px-4 py-3">
                      <span
                        className={`font-mono text-xs font-bold ${i.scrapped_qty > 0 ? "text-red-500" : "text-gray-400"}`}
                      >
                        {i.scrap_qty || "―"}
                      </span>
                    </td> */}

                    <td className="px-4 py-3 font-mono text-gray-400 text-xs">
                      {Number(i.min_quantity) ?? "—"}
                    </td>

                    {/* Min quantity */}
                    <td className="px-4 py-3 font-mono text-gray-400 text-xs">
                      {parseFloat(i.min_quantity || 0).toFixed(0)}
                    </td>

                    {/* Status */}
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

        {scrapModal && (
          <ScrapModal
            handleScrap={handleScrap}
            scrapModalLoading={scrapModalLoading}
            setScrapModal={setScrapModal}
            scrapData={scrapData}
            setScrapForm={setScrapForm}
            scrapForm={scrapForm}
          />
        )}

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
