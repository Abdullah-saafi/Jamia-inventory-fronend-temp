import { useState } from "react";
import { createItem, scrapByMain } from "../../services/api";
import ExcelDownloaderWithDates from "../Exceldownloaderwithdates";
import Pagination from "../Pagination";
import { useAuth } from "../../context/authContext";
import useErrorHandler from "../useErrorHandler";
import CheckLoadingAndError from "../CheckLoadingAndError";
import AddItemModal from "../AddItemModal";
import ScrapModal from "../ScrapModal";

const EMPTY_NEW_ITEM = {
  item_no: "",
  item_name: "",
  item_uom: "",
  category: "",
  item_quantity: "",
  min_quantity: "",
  store_id: "",
};

const generateRandomItemNo = () =>
  `ITM-${Math.floor(Math.random() * 900) + 100}`;

export default function MainAllItems({
  allItems,
  mainStores,
  onRefresh,
  setToast,
  loading,
  mainStoreError,
}) {
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterType, setFilterType] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItem, setNewItem] = useState(EMPTY_NEW_ITEM);
  const [savingItem, setSavingItem] = useState(false);
  const [scrapModal, setScrapModal] = useState(false);
  const [scrapModalLoading, setScrapModalLoading] = useState(false);
  const [scrapData, setScrapData] = useState([])
  const [scrapForm, setScrapForm] = useState({
    removed_by: "",
    note: "",
    main_store_id: "",
    items: []
  })

  const { auth } = useAuth();
  const handleError = useErrorHandler();

  const openAddItem = () => {
    setNewItem({ ...EMPTY_NEW_ITEM, item_no: generateRandomItemNo() });
    setShowAddItem(true);
  };

  const regenerateItemNo = () =>
    setNewItem((f) => ({ ...f, item_no: generateRandomItemNo() }));

  const handleSaveItem = async () => {
    if (
      !newItem.item_no ||
      !newItem.item_name ||
      !newItem.item_uom ||
      !newItem.store_id
    )
      return setToast({
        message: "Item No, Name, UOM and Store are required",
        type: "error",
      });
    setSavingItem(true);
    try {
      await createItem(newItem);
      setToast({ message: "Item added successfully", type: "success" });
      setShowAddItem(false);
      onRefresh();
    } catch (e) {
      const msg = handleError(e, "Failed to add item");
      setToast({ message: msg, type: "error" });
    } finally {
      setSavingItem(false);
    }
  };

  const scrap = async () => {
    try {
      setScrapModalLoading(true)
      setScrapData((f) => ({ ...f, removed_by: auth.username, main_store_id: auth.store_id }))
      setScrapModal(true)
    } catch (error) {
      const msg = handleError(error, "Failed to open scrap modal")
      setToast({ message: msg, type: "error" })
    } finally {
      setScrapModalLoading(false)
    }
  }

  const handleScrap = async (data) => {
    try {
      setScrapModalLoading(true)
      const payload = {
        ...data,
        main_store_id: auth.store_id,
        removed_by: auth.username
      }
      console.log("Final Payload being sent to backend:", payload);
      await scrapByMain(payload)
      setScrapModal(false)
      setToast({message: "Scrap the items successfully", type:"success"})
      onRefresh()
    } catch (error) {
      const msg = handleError(error, "Failed to scrap")
      setToast({ message: msg, type: "error" })
    } finally {
      setScrapModalLoading(false)
    }
  }

  const groupedItems = Object.values(
    allItems.reduce((acc, row) => {
      const qty = parseFloat(row.item_quantity || 0);
      const isMain = row.store_type === "MAIN_STORE";
      const isSub = row.store_type === "SUB_STORE";
      if (!acc[row.item_no]) {
        acc[row.item_no] = {
          ...row,
          total_qty: qty,
          main_qty: isMain ? qty : 0,
          scrapped_qty: Number(row.scrapped_qty || 0),
          sub_qty: isSub ? qty : 0,
        };
      } else {
        acc[row.item_no].total_qty += qty;
        if (isMain) acc[row.item_no].main_qty += qty;
        if (isSub) acc[row.item_no].sub_qty += qty;
      }
      return acc;
    }, {}),
  );

  const categories = [
    ...new Set(allItems.map((i) => i.category).filter(Boolean)),
  ];

  const filteredItems = groupedItems.filter((i) => {
    const q = search.toLowerCase();
    return (
      (!search ||
        i.item_name.toLowerCase().includes(q) ||
        i.item_no.toLowerCase().includes(q)) &&
      (!filterCategory || i.category === filterCategory) &&
      (!filterType || i.item_type === filterType)
    );
  });

  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  return (
    <div>
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
            data={paginatedItems}
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
                "Transit Qty",
                "باقی اسٹاک",
                // "اسکریپ شدہ مقدار",
                "کم از کم اسٹاک",
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
            {loading || mainStoreError || paginatedItems.length === 0 ? (
              <CheckLoadingAndError
                loading={loading}
                error={mainStoreError}
                requests={paginatedItems}
              />
            ) : (
              paginatedItems.map((i) => {
                const isLow = i.main_qty <= parseFloat(i.min_quantity || 0);
                return (
                  <tr
                    key={i.item_no}
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
                        {i.item_quantity || "―"}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-blue-600 font-bold">
                      {Number(i.sub_qty).toFixed(0)}
                    </td>


                      {/* <button onClick={() => {
                        console.log("paginated of main all items", paginatedItems);
                        
                      }}> log</button> */}
                      <td className="px-4 py-3">
                      <span
                        className="font-mono text-xs font-bold text-gray-700"
                      >
                        {i.transit_qty || "—"}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`font-mono text-xs font-bold ${i.main_qty - i.sub_qty <= 0 ? "text-red-500" : "text-gray-700"}`}
                      >
                        {Number(i.main_qty - i.sub_qty).toFixed(0)}
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
                      {i.min_quantity ?? "—"}
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

        {scrapModal && (<ScrapModal
          handleScrap={handleScrap}
          scrapModalLoading={scrapModalLoading}
          setScrapModal={setScrapModal}
          scrapData={scrapData}
          setScrapForm={setScrapForm}
          scrapForm={scrapForm}
        />)}

        <Pagination
          currentPage={currentPage}
          totalItems={filteredItems.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          pageSizeOptions={[10, 25, 50]}
          onPageSizeChange={(s) => {
            setPageSize(s);
            setCurrentPage(1);
          }}
        />
      </div>

      {showAddItem && (
        <AddItemModal
          setShowAddItem={setShowAddItem}
          setNewItem={setNewItem}
          regenerateItemNo={regenerateItemNo}
          newItem={newItem}
          mainStores={mainStores}
          handleSaveItem={handleSaveItem}
          savingItem={savingItem}
        />
      )}
    </div>
  );
}