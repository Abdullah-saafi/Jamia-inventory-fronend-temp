import { useEffect, useState, useCallback, useRef } from "react";
import {
  createItem,
  getStores,
  createCategory,
  getCategories,
  deleteCategory,
  getItems,
  searchExistingItems,
  deleteItem,
  getdefaultCategories,
  updateDefaultCategories,
} from "../../../services/api";
import useErrorHandler from "../../useErrorHandler";
import { useOutletContext } from "react-router-dom";
import { ITEM_CONDITIONS } from "../../../services/constants";
import { ChevronDown, ChevronUp, Heading1 } from "lucide-react";
import MainAllItems from "../../MainStore/MainAllItems";
import TableHead from "../../TableHead";
import CheckLoadingAndError from "../../CheckLoadingAndError";
import ConfirmDeleteModal from "../../Modals/ConfirmDeleteModal";

const EMPTY_NEW_ITEM = {
  item_name: "",
  item_name_urdu: "",
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  // ── Item state ──────────────────────────────────────────────────────────
  const [newItem, setNewItem] = useState(EMPTY_NEW_ITEM);
  const [mainStores, setMainStores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [itemErrors, setItemErrors] = useState({});
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [allItems, setAllItems] = useState([]);
  const [mainStoreError, setMainStoreError] = useState("");
  const [itemsPagination, setItemsPagination] = useState({
    currentPage: 1,
    pageLimit: 10,
    totalItems: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageLimit, setPageLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterType, setFilterType] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [debouncedSearchExistingItems, setDebouncedSearchExistingItems] = useState("");
  const [existingItemsLoading, setExistingItemsLoading] = useState(false)
  const [existingitems, setExistingitems] = useState([])
  const [existingItemsError, setExistingItemsError] = useState("")
  const [deleteItemLoading, setDeleteItemLoading] = useState(false)

  const deleteResolveRef = useRef(null);

  // ── Category state ──────────────────────────────────────────────────────
  const [newCategory, setNewCategory] = useState(EMPTY_NEW_CATEGORY);
  const [categorySubmitLoading, setCategorySubmitLoading] = useState(false);
  const [categoryServerError, setCategoryServerError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [categorySearch, setCategorySearch] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [showItemTypeDropdown, setShowItemTypeDropdown] = useState(false);
  const [showStoreDropdown, setShowStoreDropdown] = useState(false);
  const [selectedDefaultCategories, setSelectedDefaultCategories] = useState([]);
  const [showDefaultCategoryDropdown, setShowDefaultCategoryDropdown] = useState(false);
  const [defaultCategorySearch, setDefaultCategorySearch] = useState("");
  const [defaultCategoryLoading, setDefaultCategoryLoading] = useState(false);

  const { showToast } = useOutletContext();
  const handleError = useErrorHandler();
  const pageType = "AddItemsAndCategories"

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sRes, cRes] = await Promise.all([getStores(), getCategories()]);
      const list = cRes.data.data || cRes.data;
      setCategories(Array.isArray(list) ? list : []);
      const stores = sRes.data.data || sRes.data;
      if (Array.isArray(stores)) {
        setMainStores(stores.filter((s) => s.store_type === "MAIN_STORE"));
      }
    } catch (error) {
      const msg = handleError(error, "Failed to load data");
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (mainStores.length === 1 && !newItem.store_id) {
      setNewItem((prev) => ({
        ...prev,
        store_id: mainStores[0].store_id,
      }));
    }
  }, [mainStores, newItem.store_id]);

  useEffect(() => {
    const handler = (e) => {
      if (!e.target.closest("#category-dropdown-wrapper")) {
        setShowCategoryDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Debounce search ───────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchExistingItems(newItem.item_name), 500);
    return () => clearTimeout(timer);
  }, [newItem.item_name]);

  const handleSaveItem = async (e) => {
    e.preventDefault()
    const { item_uom, item_type } = newItem;
    const missingFields =
      !newItem.item_name ||
      !newItem.item_name_urdu ||
      !newItem.store_id ||
      !newItem.item_type ||
      !newItem.category ||
      !newItem.item_quantity ||
      !newItem.min_quantity
    const isUOMMissing = item_type === "USABLE" && !item_uom;

    if (missingFields || isUOMMissing) {
      const errs = {};
      if (!newItem.item_name) errs.item_name = "انگریزی میں آئٹم کا نام لازمی ہے۔";
      if (!newItem.item_name_urdu) errs.item_name_urdu = "اردو میں آئٹم کا نام لازمی ہے۔";
      if (!newItem.item_type) errs.item_type = "آئٹم کی قسم لازمی ہے۔";
      if (!newItem.store_id) errs.store_id = "اسٹور لازمی ہے۔";
      if (isUOMMissing) errs.item_uom = "اشیاء کے لیے یونٹ لازمی ہے۔";
      if (!newItem.category) errs.category = "کیٹیگری لازمی ہے۔";
      if (!newItem.item_quantity) errs.item_quantity = "آئٹم کی مقدار لازمی ہے۔";
      if (!newItem.min_quantity) errs.min_quantity = "کم از کم مقدار لازمی ہے۔";
      setItemErrors(errs);
      return;
    }

    setItemErrors({});
    setSubmitLoading(true);
    try {
      await createItem(newItem);
      setNewItem(EMPTY_NEW_ITEM);
      showToast("آئٹم شامل کر دیا گیا ہے", "success");
      fetchData();
    } catch (e) {
      const msg = handleError(e, "Failed to add item");
      showToast(msg, "error");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault()
    setCategoryServerError(null);
    if (!newCategory.name.trim()) {
      setCategoryServerError("Category name is required");
      return;
    }
    setCategorySubmitLoading(true);
    try {
      await createCategory(newCategory);
      showToast("کیٹیگری شامل کر دی گئی ہے", "success");
      setNewCategory(EMPTY_NEW_CATEGORY);
      fetchData();
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
      showToast("کیٹیگری ڈیلیٹ کر دی گئی ہے", "success");
      fetchData();
    } catch (e) {
      const msg = handleError(e, "Failed to delete category");
      showToast(msg, "error");
    } finally {
      setDeletingId(null);
    }
  };

  const handledeleteItem = async (id) => {
    setDeleteItemLoading(true)
    setShowDeleteModal(true)
    const confirmed = await new Promise((resolve) => {
      deleteResolveRef.current = resolve
    })
    setShowDeleteModal(false)
    if (!confirmed) {
      setDeleteItemLoading(false)
      deleteResolveRef.current = null
      return
    }
    try {
      const res = await deleteItem({ id })
      fetchItems()
      showToast(res.data.message, "success")
    } catch (error) {
      const msg = handleError(error, "Failed to delete item");
      showToast(msg, "error");
    } finally {
      setDeleteItemLoading(false)
      deleteResolveRef.current = null;
    }
  }

  const fetchItems = useCallback(
    async () => {
      setLoading(true);
      try {
        const iRes = await getItems({
          to_store_id: 1,
          page: currentPage,
          limit: pageLimit,
          search: debouncedSearch,
          category: filterCategory || undefined,
          item_type: filterType || undefined,
        })
        setAllItems(iRes.data.data);
        setItemsPagination(iRes.data.pagination);

      } catch (error) {
        const msg = handleError(error, "Failed to load data");
        setMainStoreError(msg);
      } finally {
        setLoading(false);
      }
    },
    [
      currentPage,
      pageLimit,
      debouncedSearch,
      filterCategory,
      filterType,
    ],
  );

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const refresh = useCallback(() => fetchItems(), [fetchItems]);

  const getExistingItems = async () => {

    const query = newItem.item_name

    if (!query || query.trim().length < 3) {
      setExistingitems([])
      return
    }
    try {
      setExistingItemsLoading(true)
      const res = await searchExistingItems({ query: newItem.item_name, store_id: newItem.store_id })
      setExistingitems(res.data.data)
    } catch (error) {
      const msg = handleError(error, "Failed to load existing items")
      setExistingItemsError(msg, "error")
    } finally {
      setExistingItemsLoading(false)
    }
  }

  useEffect(() => {
    getExistingItems();
  }, [debouncedSearchExistingItems]);

  const loadDefaultCategories = async () => {
    try {
      setDefaultCategoryLoading(true)
      const res = await getdefaultCategories()
      const ids = res.data.data.map(
        (category) => category.category_id
      )
      setSelectedDefaultCategories(ids)
    } catch (error) {
      const msg = handleError(error, "ڈیفالٹ کیٹیگریز لوڈ نہیں ہو سکیں۔");
      showToast(msg, "error");
    } finally {
      setDefaultCategoryLoading(false);
    }
  }

  useEffect(() => {
    loadDefaultCategories();
  }, []);

  const handleSaveDefaultCategories = async () => {
    try {
      setDefaultCategoryLoading(true);
      const res = await updateDefaultCategories({
        category_ids: selectedDefaultCategories,
      });
      showToast(res.data.message, "success");
    } catch (error) {
      const msg = handleError(error, "Failed to update default categories");
      showToast(msg, "error");
    } finally {
      setDefaultCategoryLoading(false);
    }
  };

  const filteredCategories = categories.filter((c) =>
    c.category_name.toLowerCase().includes(categorySearch.toLowerCase()),
  );

  const fieldError = (key) =>
    itemErrors[key] ? (
      <p className="text-red-500 text-sm mt-1">{itemErrors[key]}</p>
    ) : null;

  const inputCls = (key) =>
    `w-full bg-white border rounded px-3 py-2 text-gray-800 text-sm focus:outline-none focus:border-emerald-500 ${itemErrors[key] ? "border-red-400" : "border-gray-300"
    }`;

  return (
    <div className=" animate-in fade-in slide-in-from-bottom-2 duration-300 h-full w-full overflow-hidden">
      {/* ── Tabs ─────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 mb-4">
        <button
          onClick={() => setActiveTab("item")}
          className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === "item"
            ? "bg-emerald-600 text-white shadow-sm"
            : "bg-white border border-gray-200 text-gray-500 hover:text-gray-700"
            }`}
        >
          آئٹم شامل کریں
        </button>
        <button
          onClick={() => setActiveTab("category")}
          className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === "category"
            ? "bg-emerald-600 text-white shadow-sm"
            : "bg-white border border-gray-200 text-gray-500 hover:text-gray-700"
            }`}
        >
          کیٹیگری شامل کریں
        </button>
        <button
          onClick={() => setActiveTab("items-list")}
          className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === "items-list"
            ? "bg-emerald-600 text-white shadow-sm"
            : "bg-white border border-gray-200 text-gray-500 hover:text-gray-700"
            }`}
        >
          تمام اشیا
        </button>
      </div>

      {activeTab === "item" && (
        <div className="h-full w-full flex">
          <div className="w-1/2 h-full flex">
            <div className="flex gap-4 h-full w-full">
              <form onSubmit={handleSaveItem}>
                <div className="ITEMS bg-white border border-gray-200 rounded-xl shadow-sm">
                  <div className="px-5 py-4 space-y-4">
                    <div className="item-english-urdu-container grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-gray-500 text-sm font-semibold uppercase tracking-wider block mb-1">
                          (English) اشیاء کا نام
                        </label>
                        <input
                          dir="ltr"
                          value={newItem.item_name}
                          onChange={(e) => {
                            const value = e.target.value;

                            if (!/^[A-Za-z0-9()\s]*$/.test(value)) return;

                            setNewItem((f) => ({
                              ...f,
                              item_name: value,
                            }));

                            setItemErrors((f) => ({
                              ...f,
                              item_name: undefined,
                            }));
                          }}
                          placeholder="English"
                          className={inputCls("item_name")}
                        />
                        {fieldError("item_name")}
                      </div>

                      <div>
                        <label className="text-gray-500 text-sm font-semibold uppercase tracking-wider block mb-1">
                          (اردو) اشیاء کا نام
                        </label>
                        <input
                          value={newItem.item_name_urdu}
                          onChange={(e) => {
                            const value = e.target.value;

                            if (!/^[\u0600-\u06FFA-Za-z0-9()\s]*$/.test(value)) return;

                            setNewItem((f) => ({
                              ...f,
                              item_name_urdu: value,
                            }));

                            setItemErrors((f) => ({
                              ...f,
                              item_name_urdu: undefined,
                            }));
                          }}
                          placeholder="اردو"
                          className={inputCls("item_name_urdu")}
                        />
                        {fieldError("item_name_urdu")}
                      </div>
                    </div>

                    <div>
                      {showItemTypeDropdown && (
                        <div className="fixed inset-0 z-40" onClick={() => setShowItemTypeDropdown((prev) => !prev)} />
                      )}
                      <div className="relative min-w-45">
                        <label className="text-gray-500 text-sm font-semibold uppercase tracking-wider block mb-1">
                          آئٹم کی قسم
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setShowItemTypeDropdown((prev) => !prev)
                            setShowStoreDropdown(false)
                          }}
                          className={`${inputCls("item_type")} flex items-center justify-between`}
                        >
                          <span>
                            {newItem.item_type
                              ? ITEM_CONDITIONS.find((r) => r.value === newItem.item_type)?.label
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
                                setShowItemTypeDropdown(false);

                                setNewItem((f) => ({
                                  ...f,
                                  item_type: "",
                                }));
                              }}
                            >
                              آئٹم کی قسم
                            </button>

                            {ITEM_CONDITIONS.map((r) => (
                              <button
                                key={r.value}
                                onClick={async () => {
                                  setShowItemTypeDropdown(false);
                                  const selectedType = r.value
                                  setNewItem((f) => ({
                                    ...f,
                                    item_type: selectedType,
                                    item_uom:
                                      selectedType === "REUSABLE" ? "" : f.item_uom,
                                  }));
                                  setItemErrors((f) => ({ ...f, item_type: undefined }));
                                }}
                                className={` w-full text-left px-4 py-2.5 text-sm hover:bg-emerald-50 transition-colors ${newItem.item_type === r.value
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
                        {fieldError("item_type")}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div id="uom-dropdown-wrapper" className="relative">
                        <label className="text-gray-500 text-sm font-semibold uppercase tracking-wider block mb-1">
                          اکائی
                        </label>
                        <input
                          dir="ltr"
                          value={newItem.item_uom}
                          id="UOM"
                          disabled={newItem.item_type === "REUSABLE"}
                          autoComplete="off"
                          onChange={(e) => {
                            setNewItem((f) => ({
                              ...f,
                              item_uom: e.target.value,
                            }));
                            setItemErrors((f) => ({ ...f, item_uom: undefined }));
                          }}
                          placeholder="Unit of Measurement"
                          className={`w-full bg-white border rounded px-3 py-2 text-gray-800 text-sm focus:outline-none focus:border-emerald-500 disabled:bg-gray-100 ${itemErrors.item_uom ? "border-red-400" : "border-gray-300"
                            }`}
                        />
                        {fieldError("item_uom")}
                      </div>

                      <div id="category-dropdown-wrapper" className="relative">
                        <label className="text-gray-500 text-sm font-semibold uppercase tracking-wider block mb-1">
                          زمرہ
                        </label>
                        <input
                          dir="ltr"
                          value={
                            categories.find((c) => c.category_id === newItem.category)?.category_name ||
                            newItem.category ||
                            ""
                          }
                          onChange={(e) =>
                            setNewItem((f) => ({
                              ...f,
                              category: e.target.value,
                            }))
                          }
                          onFocus={() => setShowCategoryDropdown(true)}
                          placeholder="Select Category"
                          className={`${inputCls("category")} ${loading ? "pl-5" : ""}`}
                          autoComplete="off"
                        />
                        {loading && (
                          <div className="flex justify-center absolute top-1/2 left-1">
                            <div className="w-4 h-4 border-2 border-gray-200 border-t-emerald-500 rounded-full animate-spin" />
                          </div>
                        )}
                        {fieldError("category")}
                        {showCategoryDropdown && categories.length > 0 && (
                          <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                            {categories
                              .filter((c) => {
                                const isSelectedId = categories.some((cat) => cat.category_id === newItem.category);
                                if (isSelectedId) return true;

                                return c.category_name
                                  .toLowerCase()
                                  .includes((newItem.category || "").toLowerCase());
                              })
                              .map((cat) => (
                                <button
                                  key={cat.category_id}
                                  type="button"
                                  onMouseDown={() => {
                                    setNewItem((f) => ({
                                      ...f,
                                      category: cat.category_id,
                                    }));
                                    setShowCategoryDropdown(false);
                                  }}
                                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                                >
                                  {cat.category_name}
                                </button>
                              ))}
                            {categories.filter((c) => {
                              const isSelectedId = categories.some((cat) => cat.category_id === newItem.category);
                              if (isSelectedId) return true;

                              return c.category_name
                                .toLowerCase()
                                .includes((newItem.category || "").toLowerCase());
                            }).length === 0 && (
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
                          dir="ltr"
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
                          className={inputCls("item_quantity")}
                        />
                        {fieldError("item_quantity")}
                      </div>
                      <div>
                        <label className="text-gray-500 text-sm font-semibold uppercase tracking-wider block mb-1">
                          کم از کم اسٹاک
                        </label>
                        <input
                          dir="ltr"
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
                          className={inputCls("min_quantity")}
                        />
                        {fieldError("min_quantity")}
                      </div>
                    </div>

                    <div>
                      <div>
                        <label className="text-gray-500 text-sm font-semibold uppercase tracking-wider block mb-1">
                          اسٹور
                        </label>

                        {showStoreDropdown && (
                          <div
                            className="fixed inset-0 z-40"
                            onClick={() => setShowStoreDropdown(false)}
                          />
                        )}

                        <div className="relative">
                          <button
                            dir="ltr"
                            type="button"
                            onClick={() => {
                              setShowStoreDropdown((prev) => !prev)
                              setShowItemTypeDropdown(false)
                            }}
                            className={`${inputCls("store_id")} flex items-center justify-between`}
                          >
                            <span>
                              {newItem.store_id
                                ? mainStores.find(
                                  (s) => s.store_id === newItem.store_id
                                )?.store_name
                                : "اسٹور منتخب کریں"}
                            </span>
                            {showStoreDropdown ? (
                              <ChevronUp size={16} className="text-gray-400" />
                            ) : (
                              <ChevronDown size={16} className="text-gray-400" />
                            )}
                          </button>

                          {showStoreDropdown && (
                            <div className="absolute z-50 mt-2 w-full max-h-48 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-xl">
                              <button
                                type="button"
                                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-emerald-50`}
                                onClick={() => {
                                  setShowStoreDropdown(false);

                                  setNewItem((f) => ({
                                    ...f,
                                    store_id: "",
                                  }));
                                }}
                              >
                                اسٹور منتخب کریں
                              </button>

                              {mainStores.map((s) => (
                                <button
                                  key={s.store_id}
                                  type="button"
                                  onClick={() => {
                                    setShowStoreDropdown(false);

                                    setNewItem((f) => ({
                                      ...f,
                                      store_id: s.store_id,
                                    }));

                                    setItemErrors((f) => ({
                                      ...f,
                                      store_id: undefined,
                                    }));
                                  }}
                                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-emerald-50 transition-colors ${newItem.store_id === s.store_id
                                    ? "bg-emerald-100 text-emerald-700 font-semibold"
                                    : "text-gray-700"
                                    }`}
                                >
                                  {s.store_name}
                                </button>
                              ))}
                            </div>
                          )}

                          {fieldError("store_id")}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-200">
                    <button
                      disabled={loading}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold px-5 py-2 rounded disabled:opacity-40 transition-all"
                    >
                      {submitLoading ? "شامل ہو رہا ہے..." : "آئٹم شامل کریں"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
          <div className="w-1/2 h-[65%]  bg-white rounded-xl ml-5 border border-gray-200 shadow-sm">
            {existingitems > 0 ? "huh"
              :
              <div>
                <h1 className="text-center py-1 bg-zinc-100 text-gray-500">منتخب کرنے کے لیے آئٹم پر کلک کریں۔</h1>
                <div className="flex justify-center items-center">
                  <table className="w-full text-sm">
                    <thead>
                      <TableHead
                        pageType={pageType}
                      />
                    </thead>
                    <tbody>
                      {existingItemsLoading || existingItemsError || existingitems.length === 0 ?
                        <CheckLoadingAndError
                          loading={existingItemsLoading}
                          error={existingItemsError}
                          requests={existingitems}
                          pageType={pageType}
                        />
                        :
                        existingitems.map((i) => {
                          const isLow = Number(i.min_quantity) > Number(i.item_quantity) ? true : false
                          const categoryName = categories.find((c) => c.category_id === i.category_id)?.category_name
                          const cat = categories.find((c) => c.category_id === i.category_id)?.category_id
                          return (
                            <tr
                              key={i.item_no}
                              className={`border-b border-gray-100 hover:bg-gray-100 transition-colors whitespace-nowrap cursor-pointer ${isLow ? "bg-red-200/50 hover:bg-red-200" : ""}`}
                              onClick={() => {
                                setNewItem((prev) => ({
                                  ...prev,
                                  item_name: i.item_name,
                                  item_name_urdu: i.item_name_urdu,
                                  item_type: i.item_type,
                                  item_uom: i.item_uom,
                                  category: cat,
                                  item_quantity: i.item_quantity,
                                  min_quantity: i.min_quantity,
                                }))
                              }}
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
                                {categoryName || "—"}
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
                              <td className="px-4 py-3 font-mono text-gray-400 text-xs">
                                {Number(i.min_quantity) ?? "0"}
                              </td>
                              <td className="px-4 py-3">
                                <span

                                  className={`text-xs ${isLow ? "text-red-500 font-extrabold" : "text-emerald-600 font-semibold"}`}
                                >
                                  {isLow ? "Low" : "OK"}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      }
                    </tbody>

                  </table>
                </div>
              </div>
            }
          </div>
        </div>
      )}

      {activeTab === "category" && (
        <div className="h-auto w-full bg-white">
          <div className="Categorey flex h-full w-full border border-gray-200 rounded-xl shadow-sm">
            <div className="flex w-1/2 px-5 py-4 space-y-4">
              {categoryServerError && (
                <div className="flex gap-5 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
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

              <form className="w-[70%]" onSubmit={handleSaveCategory}>
                <div className="ADD_CATEGORY flex flex-col gap-4">
                  <label className="text-gray-500 text-sm font-semibold uppercase tracking-wider block ">
                    زمرے کا نام
                  </label>
                  <input
                    dir="ltr"
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
                      placeholder="تفصیل (اختیاری)…"
                      rows={3}
                      className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-800 text-sm focus:outline-none focus:border-emerald-500 resize-none"
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2 px-5 py-4 ">
                    <button
                      disabled={categorySubmitLoading}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold px-5 py-2 rounded disabled:opacity-40 transition-all"
                    >
                      {categorySubmitLoading ? "شامل ہو رہا ہے..." : "کیٹیگری شامل کریں"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
            <div className="DELETE_CATEGORY w-1/2 flex flex-col gap-4">
              <div className=" w-[80%] py-4 space-y-4">
                <div className="SEARCH">
                  <label className="text-gray-500 text-sm font-semibold uppercase tracking-wider block mb-1">
                    زمرے تلاش کریں
                  </label>
                  <input
                    dir="ltr"
                    value={categorySearch}
                    onChange={(e) => setCategorySearch(e.target.value)}
                    placeholder="Search…"
                    className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-800 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div dir="ltr" className="Delete_List border border-gray-200 rounded-lg overflow-hidden">
                  {filteredCategories.length === 0 ? (
                    <p className="text-gray-400 text-sm italic px-4 py-3">
                      {categorySearch
                        ? "No matching categories"
                        : "No categories yet"}
                    </p>
                  ) : (
                    <ul className="divide-y divide-gray-100 max-h-48 overflow-y-auto">
                      {filteredCategories.map((cat) => (
                        <li
                          key={cat.category_id}
                          className="flex items-center justify-between px-4 py-2 hover:bg-gray-50"
                        >
                          <div>
                            <p className="text-sm font-medium text-gray-800">
                              {cat.category_name}
                            </p>
                            {cat.description && (
                              <p className="text-sm mt-1 text-gray-400">
                                {cat.description}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() =>
                              handleDeleteCategory(cat.category_id)
                            }
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
            <div className="w-1/2 py-4 flex flex-col justify-between pl-3">
              {showDefaultCategoryDropdown && (
                <div className="fixed inset-0 z-40" onClick={() => setShowDefaultCategoryDropdown((prev) => !prev)} />
              )}
              <div id="default-category-dropdown-wrapper" className="relative w-[80%]">

                <label className="text-gray-500 text-sm font-semibold uppercase tracking-wider block mb-1">
                  ڈیفالٹ کیٹیگریز
                </label>

                <div
                  dir="ltr"
                  className="min-h-10.5 border border-gray-200 rounded-lg bg-white px-2 py-1.5 flex flex-wrap gap-1.5 cursor-text"
                  onClick={() => setShowDefaultCategoryDropdown(true)}
                >

                  {selectedDefaultCategories.map((categoryId) => {
                    const category = categories.find(
                      (c) => c.category_id === categoryId
                    );

                    if (!category) return null;

                    return (
                      <div
                        key={category.category_id}
                        className="flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-1 rounded-md text-sm"
                      >
                        <span>{category.category_name}</span>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();

                            setSelectedDefaultCategories((prev) =>
                              prev.filter(
                                (id) => id !== category.category_id
                              )
                            );
                          }}
                          className="text-emerald-500 hover:text-red-500"
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}

                  <input
                    dir="ltr"
                    value={defaultCategorySearch}
                    onChange={(e) => {
                      setDefaultCategorySearch(e.target.value);
                      setShowDefaultCategoryDropdown(true);
                    }}
                    onFocus={() => setShowDefaultCategoryDropdown(true)}
                    placeholder={
                      selectedDefaultCategories.length === 0
                        ? "Select Categories"
                        : "Add category..."
                    }
                    className="flex-1 min-w-30 outline-none text-sm"
                    autoComplete="off"
                  />

                </div>

                {showDefaultCategoryDropdown && categories.length > 0 && (
                  <div dir="ltr" className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {categories
                      .filter((category) => {
                        const matchesSearch =
                          category.category_name
                            .toLowerCase()
                            .includes(defaultCategorySearch.toLowerCase());

                        return matchesSearch;
                      })
                      .map((category) => {
                        const isSelected = selectedDefaultCategories.includes(
                          category.category_id
                        );

                        return (
                          <button
                            key={category.category_id}
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();

                              setSelectedDefaultCategories((prev) => {
                                if (prev.includes(category.category_id)) {
                                  return prev.filter(
                                    (id) => id !== category.category_id
                                  );
                                }

                                return [...prev, category.category_id];
                              });

                              setDefaultCategorySearch("");
                            }}
                            className={`w-full text-left px-3 py-2 text-sm transition-colors
                ${isSelected
                                ? "bg-emerald-50 text-emerald-700"
                                : "text-gray-700 hover:bg-gray-50"
                              }`}
                          >
                            <div className="flex items-center justify-between">

                              <span>
                                {category.category_name}
                              </span>

                              {isSelected && (
                                <span className="text-emerald-600">
                                  ✓
                                </span>
                              )}

                            </div>
                          </button>
                        );
                      })}

                  </div>
                )}
              </div>
              <button
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold px-5 py-2 rounded disabled:opacity-40 transition-all w-[30%]"
                type="button"
                onClick={handleSaveDefaultCategories}
                disabled={defaultCategoryLoading}
              >
                کیٹیگریز محفوظ کریں
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "items-list" && (
        <>
          <MainAllItems
            allItems={allItems}
            onRefresh={refresh}
            showToast={showToast}
            loading={loading}
            mainStoreError={mainStoreError}
            pagination={itemsPagination}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            pageLimit={pageLimit}
            setPageLimit={setPageLimit}
            search={search}
            setSearch={setSearch}
            filterCategory={filterCategory}
            setFilterCategory={setFilterCategory}
            filterType={filterType}
            categories={categories}
            setFilterType={setFilterType}
            setDebouncedSearch={setDebouncedSearch}
            pageTypeProp={pageType}
            handledeleteItem={handledeleteItem}
            deleteItemLoading={deleteItemLoading}
          />
        </>
      )}

      {showDeleteModal && (
        <ConfirmDeleteModal
          onConfirm={() => deleteResolveRef.current?.(true)}
          onCancel={() => deleteResolveRef.current?.(false)}
        />
      )}
    </div>
  );
};
export default AddItemsAndCategories;
