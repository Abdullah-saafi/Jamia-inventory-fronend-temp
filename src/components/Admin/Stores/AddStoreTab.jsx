import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { addStore, getItemCategories } from "../../../services/api";
import { inputClass, labelClass } from "../../../services/constants";
import useErrorHandler from "../../useErrorHandler";
import { useToast } from "../../../context/ToastContext";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useAuth } from "../../../context/authContext";

export default function AddStoreTab() {

  const [categories, setCategories] = useState([]);
  const [showCategory, setShowCategory] = useState(false);
  const [categoryLoading, setCategoryLoading] = useState(false);

  const { auth } = useAuth()

  const handleError = useErrorHandler();
  const { showToast } = useToast()
  const { loadStores } = useOutletContext();

  const [form, setForm] = useState({
    store_category: "",
    store_name: "",
    address: "",
  });
  const [loading, setLoading] = useState(false);

  const getCategories = async () => {
    try {
      setCategoryLoading(true)
      const res = await getItemCategories(auth.store_id)
      setCategories(res.data?.data)
    } catch (error) {
      const msg = handleError(error, "Failed to get categories");
      showToast(msg);
    } finally {
      setCategoryLoading(false)
    }
  }

  useEffect(() => {
    getCategories()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.store_name) {
      return showToast("اسٹور کوڈ کا نام درکار ہے", "error");
    }
    setLoading(true);
    try {
      await addStore({ ...form, store_type: "SUB_STORE" });
      showToast(`اسٹور کامیابی سے بن گیا ہے`, "success");
      setForm({ store_category: "", store_name: "", address: "", });
      if (loadStores) await loadStores();
    } catch (e) {
      const msg = handleError(e, "Failed to create store");
      showToast(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl animate-in fade-in slide-in-from-bottom-2 duration-300">
      <form onSubmit={handleSubmit}>
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">

          {/* Basic Info Grid */}
          <div className="grid grid-cols-2 gap-3 items-end">
            {/* Store Name Field */}
            <div>
              <label className={labelClass}>اسٹور کا نام *</label>
              <input
                name="store_name"
                value={form.store_name}
                onChange={handleChange}
                autoComplete="off"
                placeholder="e.g. Kitchen Store"
                className={inputClass}
              />
            </div>

            {/* Category drop down */}
            <div>
              <label className={`${labelClass} `}>زمرہ</label>

              {showCategory && (
                <div className="absolute inset-0" onClick={() => setShowCategory((prev) => !prev)} />
              )}

              <div className="relative w-full">
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
                    form.store_category
                      ? categories.find((c) => c.category_id === form.store_category).category_name
                      : "تمام زمرے"
                  }
                  onClick={() => setShowCategory((prev) => !prev)}
                  className={`bg-white leading-none rounded border w-full border-gray-300 pl-3 pr-10 py-2.5 text-gray-700 text-sm focus:outline-none focus:border-emerald-500 cursor-pointer shadow-sm ${categoryLoading ? "pl-5.5" : ""}`}
                />
                {categoryLoading && (
                  <div className="flex justify-center absolute top-1/3 left-1">
                    <div className="w-4 h-4 border-2 border-gray-200 border-t-emerald-500 rounded-full animate-spin" />
                  </div>
                )}
                {/* Arrow */}
                <div className="absolute top-1/2 -translate-y-1/2 right-3 pointer-events-none">
                  {showCategory ? (
                    <ChevronUp size={16} className="text-gray-400" />
                  ) : (
                    <ChevronDown size={16} className="text-gray-400" />
                  )}
                </div>

                {/* Dropdown Menu */}
                {showCategory && (
                  <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                    {/* Default option */}
                    <button
                      type="button"
                      onClick={() => {
                        setForm((f) => ({ ...f, store_category: null }))
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
                          setForm((f) => ({ ...f, store_category: c.category_id }))
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
            </div>
          </div>

          {/* Address Field */}
          <div>
            <label className={labelClass}>پتہ</label>
            <input
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="e.g. Block 5, Karachi"
              className={inputClass}
            />
          </div>

          {/* Informational Note */}
          <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-blue-600 text-[11px] font-medium leading-relaxed">
            <div className="flex gap-2">
              <span>💡</span>
              <p>
                اسٹور بنانے کے بعد، نمائندہ بنانے والے سیکشن سے اس اسٹور کے لیے
                نمائندہ بنائیں تاکہ اسٹور کے لیے انوینٹری اور دیگر انتظامی کام
                انجام دے سکیں۔
              </p>
            </div>
          </div>

          {/* Action Area */}
          <div className="pt-2 border-t border-gray-100 flex flex-col gap-3">
            <button
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm shadow-sm"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "اسٹور بنائیں"
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
