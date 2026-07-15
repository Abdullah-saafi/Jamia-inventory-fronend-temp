import { useParams, useNavigate } from "react-router-dom";
import { editItemById, getItemById, getCategories } from "../../../services/api";
import { useState, useEffect, useCallback } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { ITEM_CONDITIONS } from "../../../services/constants";
import { useStores } from "../../../hooks/useStores";
import { useToast } from "../../../context/ToastContext";
import useErrorHandler from "../../useErrorHandler";

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

const EditItems = () => {
    const [itemForm, setItemForm] = useState(EMPTY_NEW_ITEM);
    const [itemErrors, setItemErrors] = useState({});
    const [showItemTypeDropdown, setShowItemTypeDropdown] = useState(false);
    const [showStoreDropdown, setShowStoreDropdown] = useState(false);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);

    const { id } = useParams();
    const { mainStores } = useStores();
    const navigate = useNavigate();
    const { showToast } = useToast()
    const handleError = useErrorHandler();


    // Fetch Categories on mount
    useEffect(() => {
        let isMounted = true;
        setLoading(true);
        getCategories()
            .then((res) => {
                if (isMounted && res?.data?.data) setCategories(res.data.data);
            })
            .catch((error) => {
                showToast(handleError(error, "Failed to load categories"), "error");
            })
            .finally(() => {
                if (isMounted) setLoading(false);
            });
        return () => (isMounted = false);
    }, []);

    // Fetch Item Data on mount
    useEffect(() => {
        let isMounted = true;
        const fetchData = async () => {
            try {
                const res = await getItemById(id);
                const data = res.data.data;
                if (isMounted) {
                    setItemForm({
                        item_name: data.item_name || "",
                        item_name_urdu: data.item_name_urdu || "",
                        item_uom: data.item_uom || "",
                        category: data.category_id || "",
                        item_quantity: data.item_quantity || "",
                        min_quantity: data.min_quantity || "",
                        store_id: data.store_id || "",
                        item_type: data.item_type || "",
                    });
                }
            } catch (error) {
                showToast(handleError(error, "Failed to load item"), "error");
            }
        };
        if (id) fetchData();
        return () => (isMounted = false);
    }, [id]);

    // --- Form Validations ---
    const validateForm = useCallback(() => {
        let errors = {};
        if (!itemForm.item_name) errors.item_name = "Item name is required";
        if (!itemForm.store_id) errors.store_id = "Store is required";
        if (!itemForm.item_type) errors.item_type = "Item type is required";
        // Only validate UOM if not 'REUSABLE'
        if (itemForm.item_type !== "REUSABLE" && !itemForm.item_uom) errors.item_uom = "Unit of Measurement is required";
        if (itemForm.item_quantity && Number(itemForm.item_quantity) < 0) errors.item_quantity = "Invalid quantity";
        if (itemForm.min_quantity && Number(itemForm.min_quantity) < 0) errors.min_quantity = "Invalid minimum quantity";
        setItemErrors(errors);
        return Object.keys(errors).length === 0;
    }, [itemForm]);

    const handleSaveItem = async (e) => {
        e.preventDefault();
        if (!validateForm()) {
            showToast("براہ کرم لازمی تمام فیلڈز کو درستی سے پُر کریں۔", "error");
            return;
        }
        setSubmitLoading(true);
        try {
            await editItemById(id, {
                item_name: itemForm.item_name,
                item_name_urdu: itemForm.item_name_urdu,
                item_uom: itemForm.item_type === "REUSABLE" ? "" : itemForm.item_uom,
                category_id: itemForm.category,
                item_quantity: itemForm.item_quantity,
                min_quantity: itemForm.min_quantity,
                store_id: itemForm.store_id,
                item_type: itemForm.item_type,
            });
            showToast("آئٹم میں ترمیم ہو گئی۔", "success");
            navigate(-1);
        } catch (error) {
            showToast(handleError(error, "Failed to edit item"), "error");
        } finally {
            setSubmitLoading(false);
        }
    };

    const inputCls = (key) =>
        `w-full bg-white border rounded px-3 py-2 text-gray-800 text-sm focus:outline-none focus:border-emerald-500 ${itemErrors[key] ? "border-red-400" : "border-gray-300"
        }`;

    const fieldError = (key) =>
        itemErrors[key] ? (
            <p className="text-red-500 text-sm mt-1">{itemErrors[key]}</p>
        ) : null;

    return (
        <form onSubmit={handleSaveItem}>
            <div className="flex gap-4">
                <div className="ITEMS bg-white border border-gray-200 rounded-xl shadow-sm">
                    <div className="px-5 py-4 space-y-4">
                        <div className="item-english-urdu-container grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-gray-500 text-sm font-semibold uppercase tracking-wider block mb-1">
                                    (English) اشیاء کا نام
                                </label>
                                <input
                                    value={itemForm.item_name}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        if (!/^[A-Za-z0-9()\s]*$/.test(value)) return;
                                        setItemForm((f) => ({
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
                                    value={itemForm.item_name_urdu}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        if (!/^[\u0600-\u06FFA-Za-z0-9()\s]*$/.test(value)) return;

                                        setItemForm((f) => ({
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
                                <div className="fixed inset-0 z-40" onClick={() => setShowItemTypeDropdown(false)} />
                            )}
                            <div className="relative min-w-45">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowItemTypeDropdown((prev) => !prev);
                                        setShowStoreDropdown(false);
                                    }}
                                    className={`${inputCls("item_type")} flex items-center justify-between`}
                                >
                                    <span>
                                        {itemForm.item_type
                                            ? ITEM_CONDITIONS.find((r) => r.value === itemForm.item_type)?.label
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
                                        className="absolute z-50 mt-2 w-full max-h-48 bg-white border border-gray-200 rounded-xl shadow-xl overflow-y-auto">
                                        <button
                                            type="button"
                                            className="w-full text-left px-4 py-2.5 hover:bg-emerald-50 text-sm"
                                            onClick={() => {
                                                setShowItemTypeDropdown(false);
                                                setItemForm((f) => ({
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
                                                type="button"
                                                onClick={() => {
                                                    setShowItemTypeDropdown(false);
                                                    const selectedType = r.value;
                                                    setItemForm((f) => ({
                                                        ...f,
                                                        item_type: selectedType,
                                                        item_uom: selectedType === "REUSABLE" ? "" : f.item_uom,
                                                    }));
                                                    setItemErrors((f) => ({ ...f, item_type: undefined }));
                                                }}
                                                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-emerald-50 transition-colors ${itemForm.item_type === r.value
                                                    ? "bg-emerald-100 text-emerald-700 font-semibold"
                                                    : "text-gray-700"
                                                    }`}
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
                                    اکائی *
                                </label>
                                <input
                                    value={itemForm.item_uom}
                                    id="UOM"
                                    disabled={itemForm.item_type === "REUSABLE"}
                                    autoComplete="off"
                                    onChange={(e) => {
                                        setItemForm((f) => ({
                                            ...f,
                                            item_uom: e.target.value,
                                        }));
                                        setItemErrors((f) => ({ ...f, item_uom: undefined }));
                                    }}
                                    placeholder="Type UOM"
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
                                    value={
                                        categories.find((c) => c.category_id === itemForm.category)?.category_name ||
                                        itemForm.category ||
                                        ""
                                    }
                                    onChange={(e) =>
                                        setItemForm((f) => ({
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
                                                const isSelectedId = categories.some((cat) => cat.category_id === itemForm.category);
                                                if (isSelectedId) return true;
                                                return c.category_name
                                                    .toLowerCase()
                                                    .includes((itemForm.category || "").toLowerCase());
                                            })
                                            .map((cat) => (
                                                <button
                                                    key={cat.category_id}
                                                    type="button"
                                                    onMouseDown={() => {
                                                        setItemForm((f) => ({
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
                                            const isSelectedId = categories.some((cat) => cat.category_id === itemForm.category);
                                            if (isSelectedId) return true;

                                            return c.category_name
                                                .toLowerCase()
                                                .includes((itemForm.category || "").toLowerCase());
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
                                    type="number"
                                    min="0"
                                    value={itemForm.item_quantity}
                                    onChange={(e) =>
                                        setItemForm((f) => ({
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
                                    type="number"
                                    min="0"
                                    value={itemForm.min_quantity}
                                    onChange={(e) =>
                                        setItemForm((f) => ({
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
                                    اسٹور*
                                </label>

                                {showStoreDropdown && (
                                    <div
                                        className="fixed inset-0 z-40"
                                        onClick={() => setShowStoreDropdown(false)}
                                    />
                                )}

                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowStoreDropdown((prev) => !prev);
                                            setShowItemTypeDropdown(false);
                                        }}
                                        className={`${inputCls("store_id")} flex items-center justify-between`}
                                    >
                                        <span>
                                            {itemForm.store_id
                                                ? mainStores.find(
                                                    (s) => s.store_id === itemForm.store_id
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

                                                    setItemForm((f) => ({
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

                                                        setItemForm((f) => ({
                                                            ...f,
                                                            store_id: s.store_id,
                                                        }));

                                                        setItemErrors((f) => ({
                                                            ...f,
                                                            store_id: undefined,
                                                        }));
                                                    }}
                                                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-emerald-50 transition-colors ${itemForm.store_id === s.store_id
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
                            type="submit"
                            disabled={loading || submitLoading}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold px-5 py-2 rounded disabled:opacity-40 transition-all"
                        >
                            {submitLoading ? "ترمیم ہو رہی ہے..." : "آئٹم میں ترمیم کریں"}
                        </button>
                    </div>
                </div>
            </div>
        </form>
    );
};

export default EditItems;