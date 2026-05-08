import { useEffect, useState, useRef } from "react";
import {
  createItem,
  getStores,
  createCategory,
  getCategories,
  deleteCategory,
  generateRandomNumber,
  getUOM,
} from "../../services/api";
import useErrorHandler from "../useErrorHandler";
import Toast from "../Toast";

const EMPTY_NEW_ITEM = {
  item_no: "",
  item_name: "",
  item_uom: "",
  category: "",
  item_quantity: "",
  min_quantity: "",
  store_id: "",
  item_type: "",
};

const EMPTY_NEW_CATEGORY = {
  name: "",
  description: "",
};

const AddItemsAndCategories = () => {
  const [activeTab, setActiveTab] = useState("item");

  // ── Item state ──────────────────────────────────────────────────────────
  const [newItem, setNewItem] = useState(EMPTY_NEW_ITEM);
  const [mainStores, setMainStores] = useState([]);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [itemErrors, setItemErrors] = useState({});
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  // ── Category state ──────────────────────────────────────────────────────
  const [newCategory, setNewCategory] = useState(EMPTY_NEW_CATEGORY);
  const [categorySubmitLoading, setCategorySubmitLoading] = useState(false);
  const [categoryServerError, setCategoryServerError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [uom, setUOM] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [showUOMDropDown, setShowUOMDropDown] = useState(false);
  const [showInputs, setShowInputs] = useState(false);

  const handleError = useErrorHandler();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sRes, uRes, cRes] = await Promise.all([
        getStores(),
        getUOM(),
        getCategories()
      ]);
      const list = cRes.data.data || cRes.data;
      setCategories(Array.isArray(list) ? list : []);
      const stores = sRes.data.data || sRes.data;
      if (Array.isArray(stores)) {
        setMainStores(stores.filter((s) => s.store_type === "MAIN_STORE"));
      }
      setUOM(uRes.data.data)
    } catch (error) {
      const msg = handleError(error, "Failed to load data");
      setToast({ message: msg, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  // const fetchCategories = async () => {
  //   try {
  //     setCategoriesLoading(true);
  //     const res = await getCategories();
  //     const list = res.data.data || res.data;
  //     setCategories(Array.isArray(list) ? list : []);
  //   } catch (e) {
  //     const msg = handleError(e, "Failed to get categories")
  //     setToast({ message: msg, type: "error" })
  //   } finally {
  //     setCategoriesLoading(false);
  //   }
  // };

  let latestRequest = useRef(0)
  const generateRandomItemNo = async (type) => {
    const reqId = ++latestRequest.current
    const response = await generateRandomNumber({ type })
    if (reqId !== latestRequest.current) return;
    return response.data.data;
  };

  const regenerateItemNo = async () => {
    const itemNo = await generateRandomItemNo(newItem.item_type)
    if (!itemNo) return
    setNewItem((f) => ({ ...f, item_no: itemNo }));
  }

  useEffect(() => {
    fetchData();
    // fetchCategories();
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (!e.target.closest("#category-dropdown-wrapper")) {
        setShowCategoryDropdown(false);
      }
      if (!e.target.closest("#uom-dropdown-wrapper")) {
        setShowUOMDropDown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSaveItem = async () => {
    const { item_uom, item_type } = newItem;
    const missingFields =
      !newItem.item_no ||
      !newItem.item_name ||
      !newItem.store_id ||
      !newItem.item_type;
    const isUOMMissing = item_type === "USABLE" && !item_uom;

    if (missingFields || isUOMMissing) {
      const errs = {};
      if (!newItem.item_no) errs.item_no = "Item No is required";
      if (!newItem.item_name) errs.item_name = "Item Name is required";
      if (!newItem.item_type) errs.item_type = "Item Type is required";
      if (!newItem.store_id) errs.store_id = "Store is required";
      if (isUOMMissing) errs.item_uom = "UOM is required for Consumable items";
      setItemErrors(errs);
      return;
    }

    setItemErrors({});
    setSubmitLoading(true);
    try {
      await createItem(newItem);
      setToast({ message: "Item added successfully", type: "success" });
      const itemNo = await generateRandomItemNo(item_type)
      if (!itemNo) return
      setNewItem({
        ...EMPTY_NEW_ITEM,
        item_no: itemNo,
      });
      fetchData();
    } catch (e) {
      const msg = handleError(e, "Failed to add item");
      setToast({ message: msg, type: "error" });
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleSaveCategory = async () => {
    setCategoryServerError(null);
    if (!newCategory.name.trim()) {
      setCategoryServerError("Category name is required");
      return;
    }
    setCategorySubmitLoading(true);
    try {
      await createCategory(newCategory);
      setToast({ message: "Category added successfully", type: "success" });
      setNewCategory(EMPTY_NEW_CATEGORY);
      // fetchCategories();
      fetchData()
    } catch (e) {
      setCategoryServerError(
        e.response?.data?.message || e.message || "Failed to add category",
      );
    } finally {
      setCategorySubmitLoading(false);
    }
  };

  const handleDeleteCategory = async (id) => {
    setDeletingId(id);
    try {
      await deleteCategory(id);
      setToast({ message: "Category deleted", type: "success" });
      // fetchCategories();
      fetchData()
    } catch (e) {
      const msg = handleError(e, "Failed to delete category");
      setToast({ message: msg, type: "error" });
    } finally {
      setDeletingId(null);
    }
  };

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(categorySearch.toLowerCase()),
  );

  const fieldError = (key) =>
    itemErrors[key] ? (
      <p className="text-red-500 text-l mt-1">{itemErrors[key]}</p>
    ) : null;

  const inputCls = (key) =>
    `w-full bg-white border rounded px-3 py-2 text-gray-800 text-sm focus:outline-none focus:border-emerald-500 ${itemErrors[key] ? "border-red-400" : "border-gray-300"
    }`;

  return (
    <div className=" animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* ── Tabs ─────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 mb-4">
        <button
          onClick={() => setActiveTab("item")}
          className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === "item"
            ? "bg-emerald-600 text-white shadow-sm"
            : "bg-white border border-gray-200 text-gray-500 hover:text-gray-700"
            }`}
        >
          Add Item
        </button>
        <button
          onClick={() => setActiveTab("category")}
          className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === "category"
            ? "bg-emerald-600 text-white shadow-sm"
            : "bg-white border border-gray-200 text-gray-500 hover:text-gray-700"
            }`}
        >
          Add Category
        </button>
      </div>

      {activeTab === "item" && (
        <div className="flex gap-4">
          <div className="ITEMS bg-white border border-gray-200 rounded-xl shadow-sm">
            <div className="px-5 py-4 space-y-4">
              {loading ? (
                <div className="flex justify-center">
                  <div className="w-7 h-7 border-2 border-gray-200 border-t-emerald-500 rounded-full animate-spin" />
                </div>
              ) : (
                <>
                  <div>
                    <label className="text-gray-500 text-sm font-semibold uppercase tracking-wider block mb-1">
                      اشیاء نمبر{" "}
                    </label>
                    <div className="flex gap-2">
                      <input
                        value={newItem.item_no}
                        onChange={(e) => {
                          setNewItem((f) => ({
                            ...f,
                            item_no: e.target.value,
                          }));
                          setItemErrors((f) => ({ ...f, item_no: undefined }));
                        }}
                        className={`flex-1 bg-white border rounded px-3 py-2 text-emerald-600 font-mono font-bold text-sm focus:outline-none focus:border-emerald-500 ${itemErrors.item_no
                          ? "border-red-400"
                          : "border-gray-300"
                          }`}
                      />
                    </div>
                    {fieldError("item_no")}
                  </div>

                  <div>
                    <button onClick={() => {
                      console.log("Log", uom);

                    }}>Click</button>
                    <label className="text-gray-500 text-sm font-semibold uppercase tracking-wider block mb-1">
                      اشیاء کا نام
                    </label>
                    <input
                      value={newItem.item_name}
                      onChange={(e) => {
                        setNewItem((f) => ({
                          ...f,
                          item_name: e.target.value,
                        }));
                        setItemErrors((f) => ({ ...f, item_name: undefined }));
                      }}
                      placeholder="e.g. Surgical Gloves"
                      className={inputCls("item_name")}
                    />
                    {fieldError("item_name")}
                  </div>

                  <div>
                    <label className="text-gray-500 text-sm font-semibold uppercase tracking-wider block mb-1">
                      آئٹم کی قسم
                    </label>
                    <select
                      value={newItem.item_type}
                      onChange={async (e) => {
                        const selectedType = e.target.value;
                        const newItemNo = await generateRandomItemNo(selectedType)
                        if (!newItemNo) return
                        setNewItem((f) => ({
                          ...f,
                          item_type: selectedType,
                          item_uom:
                            selectedType === "REUSABLE" ? "" : f.item_uom,
                          item_no: newItemNo,
                        }));
                        setItemErrors((f) => ({ ...f, item_type: undefined }));
                      }}
                      className={inputCls("item_type")}
                    >
                      <option value="">آئٹم کی قسم</option>
                      <option value="USABLE">USABLE</option>
                      <option value="REUSABLE">REUSABLE</option>
                    </select>
                    {fieldError("item_type")}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div id="uom-dropdown-wrapper" className="relative">
                      <label className="text-gray-500 text-sm font-semibold uppercase tracking-wider block mb-1">
                        UOM *
                      </label>
                      <input
                        value={newItem.item_uom}
                        id="UOM"
                        disabled={newItem.item_type === "REUSABLE"}
                        onFocus={(e) => setShowUOMDropDown(true)}
                        onChange={(e) => {
                          setNewItem((f) => ({
                            ...f,
                            item_uom: e.target.value,
                          }));
                          setItemErrors((f) => ({ ...f, item_uom: undefined }));
                        }}
                        placeholder="pcs / kg / box…"
                        className={`w-full bg-white border rounded px-3 py-2 text-gray-800 text-sm focus:outline-none focus:border-emerald-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${itemErrors.item_uom
                          ? "border-red-400"
                          : "border-gray-300"
                          }`}
                      />
                      {/* WORKING ========================================================================================================================= */}

                      {showUOMDropDown && uom.length > 0 && (
                        <div className="absolute z-50 top-full mb-auto left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                          {uom.filter((c) =>
                            c.name
                              .toLowerCase()
                              .includes(newItem.item_uom.toLowerCase()),
                          ).map((u) => (
                            <button
                              key={u.id}
                              type="button"
                              onMouseDown={() => {
                                setNewItem((f) => ({
                                  ...f,
                                  item_uom: u.name,
                                }));
                                setShowUOMDropDown(false);
                              }}
                              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                            >
                              {u.name}
                            </button>
                          ))}
                          <p onClick={() => {
                            setShowInputs((prev) => !prev)
                          }}
                            className="w-full font-mono text-left px-3 py-2 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors">
                            Add custom
                          </p>
                          {uom.filter((c) =>
                            c.name
                              .toLowerCase()
                              .includes(newItem.item_uom.toLowerCase()),
                          ).length === 0 && (
                              <p className="px-3 py-2 text-sm text-gray-400 italic">
                                No matching categories
                              </p>
                            )}
                        </div>
                      )}
                    </div>

                    {showInputs && (
                      <>
                        <div className="space-y-1">
                          <label className="text-gray-500 text-sm font-semibold uppercase tracking-wider block mb-1">
                            UOM Name
                          </label>

                          <input
                            type="text"
                            placeholder="e.g. Packet"
                            className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-800 text-sm focus:outline-none focus:border-emerald-500"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-gray-500 text-sm font-semibold uppercase tracking-wider block mb-1">
                            UOM quantity
                          </label>

                          <input
                            type="text"
                            placeholder="e.g. pkt"
                            className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-800 text-sm focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      </>
                    )}

                    {/* CATEGORY STARTS FROM HERE ==================================================================================================== */}


                    <div id="category-dropdown-wrapper" className="relative">
                      <label className="text-gray-500 text-sm font-semibold uppercase tracking-wider block mb-1">
                        زمرہ
                      </label>
                      <input
                        value={newItem.category}
                        onChange={(e) =>
                          setNewItem((f) => ({
                            ...f,
                            category: e.target.value,
                          }))
                        }
                        onFocus={() => setShowCategoryDropdown(true)}
                        placeholder="Select Category"
                        className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-800 text-sm focus:outline-none focus:border-emerald-500"
                        autoComplete="off"
                      />
                      {showCategoryDropdown && categories.length > 0 && (
                        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                          {categories
                            .filter((c) =>
                              c.name
                                .toLowerCase()
                                .includes(newItem.category.toLowerCase()),
                            )
                            .map((cat) => (
                              <button
                                key={cat.id}
                                type="button"
                                onMouseDown={() => {
                                  setNewItem((f) => ({
                                    ...f,
                                    category: cat.name,
                                  }));
                                  setShowCategoryDropdown(false);
                                }}
                                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                              >
                                {cat.name}
                              </button>
                            ))}
                          {categories.filter((c) =>
                            c.name
                              .toLowerCase()
                              .includes(newItem.category.toLowerCase()),
                          ).length === 0 && (
                              <p className="px-3 py-2 text-sm text-gray-400 italic">
                                No matching categories
                              </p>
                            )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-gray-500 text-sm font-semibold uppercase tracking-wider block mb-1">
                        ابتدائی مقدار
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={newItem.item_quantity}
                        onChange={(e) =>
                          setNewItem((f) => ({
                            ...f,
                            item_quantity: e.target.value,
                          }))
                        }
                        placeholder="0"
                        className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-800 text-sm focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-gray-500 text-sm font-semibold uppercase tracking-wider block mb-1">
                        کم از کم اسٹاک
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={newItem.min_quantity}
                        onChange={(e) =>
                          setNewItem((f) => ({
                            ...f,
                            min_quantity: e.target.value,
                          }))
                        }
                        placeholder="0"
                        className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-800 text-sm focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-gray-500 text-sm font-semibold uppercase tracking-wider block mb-1">
                      اسٹور*
                    </label>
                    <select
                      value={newItem.store_id}
                      onChange={(e) => {
                        setNewItem((f) => ({ ...f, store_id: e.target.value }));
                        setItemErrors((f) => ({ ...f, store_id: undefined }));
                      }}
                      className={inputCls("store_id")}
                    >
                      <option value="">اسٹور منتخب کریں</option>
                      {mainStores.map((s) => (
                        <option key={s.store_id} value={s.store_id}>
                          {s.store_name}
                        </option>
                      ))}
                    </select>
                    {fieldError("store_id")}
                  </div>
                </>
              )}
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-200">
              <button
                onClick={handleSaveItem}
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold px-5 py-2 rounded disabled:opacity-40 transition-all"
              >
                {submitLoading ? "Adding..." : "Add Item"}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "category" && (
        <div className=" ">
          <div className="Categorey bg-white border border-gray-200 rounded-xl shadow-sm">
            <div className="flex justify-between  px-5 py-4 space-y-4">
              {categoryServerError && (
                <div className="flex gap-5  gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                  <svg
                    className="w-4 h-4 text-red-500 mt-0.5 shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                    />
                  </svg>
                  <p className="text-red-600 text-sm">{categoryServerError}</p>
                  <button
                    onClick={() => setCategoryServerError(null)}
                    className="ml-auto text-red-400 hover:text-red-600 text-lg leading-none"
                  >
                    ×
                  </button>
                </div>
              )}

              <div className="ADD_CATEGORY w-[40%] flex flex-col gap-4">
                <label className="text-gray-500 text-sm font-semibold uppercase tracking-wider block ">
                  زمرے کا نام *
                </label>
                <input
                  value={newCategory.name}
                  onChange={(e) => {
                    setNewCategory((f) => ({ ...f, name: e.target.value }));
                    setCategoryServerError(null);
                  }}
                  placeholder="e.g. Medical Supplies"
                  className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-800 text-sm focus:outline-none focus:border-emerald-500"
                />
                <div>
                  <label className="text-gray-500 text-sm font-semibold uppercase tracking-wider block ">
                    تفصیل
                  </label>
                  <textarea
                    value={newCategory.description}
                    onChange={(e) =>
                      setNewCategory((f) => ({
                        ...f,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Optional description…"
                    rows={3}
                    className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-800 text-sm focus:outline-none focus:border-emerald-500 resize-none"
                  />
                </div>
                <div className="flex items-center justify-end gap-2 px-5 py-4 ">
                  <button
                    onClick={handleSaveCategory}
                    disabled={categorySubmitLoading}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold px-5 py-2 rounded disabled:opacity-40 transition-all"
                  >
                    {categorySubmitLoading ? "Adding..." : "Add Category"}
                  </button>
                </div>
              </div>
              <div className="DELETE_CATEGORY w-[40%] flex flex-col gap-4">
                <div className="SEARCH">
                  <label className="text-gray-500 text-sm font-semibold uppercase tracking-wider block mb-1">
                    زمرے تلاش کریں
                    <span className="text-gray-400 font-normal normal-case ml-1">
                      (Search Categories)
                    </span>
                  </label>
                  <input
                    value={categorySearch}
                    onChange={(e) => setCategorySearch(e.target.value)}
                    placeholder="Search…"
                    className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-800 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="Delete_List border border-gray-200 rounded-lg overflow-hidden">
                  {categoriesLoading ? (
                    <div className="flex justify-center py-4">
                      <div className="w-5 h-5 border-2 border-gray-200 border-t-emerald-500 rounded-full animate-spin" />
                    </div>
                  ) : filteredCategories.length === 0 ? (
                    <p className="text-gray-400 text-sm italic px-4 py-3">
                      {categorySearch
                        ? "No matching categories"
                        : "No categories yet"}
                    </p>
                  ) : (
                    <ul className="divide-y divide-gray-100 max-h-48 overflow-y-auto">
                      {filteredCategories.map((cat) => (
                        <li
                          key={cat.id}
                          className="flex items-center justify-between px-4 py-2 hover:bg-gray-50"
                        >
                          <div>
                            <p className="text-sm font-medium text-gray-800">
                              {cat.name}
                            </p>
                            {cat.description && (
                              <p className="text-sm text-gray-400">
                                {cat.description}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => handleDeleteCategory(cat.id)}
                            disabled={deletingId === cat.id}
                            className="text-red-400 hover:text-red-600 text-sm font-semibold px-2 py-1 rounded hover:bg-red-50 transition-all disabled:opacity-40"
                          >
                            {deletingId === cat.id ? "…" : "Delete"}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};
export default AddItemsAndCategories;