import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { editStoreById, getItemCategories, getStoreById } from "../../services/api";
import { inputClass, labelClass } from "../../services/constants";
import useErrorHandler from "../useErrorHandler";
import { useAuth } from "../../context/authContext";
import { useToast } from "../../context/ToastContext";
import { ChevronDown, ChevronUp } from "lucide-react";

const EditStore = () => {
  const [categories, setCategories] = useState([]);
  const [showCategory, setShowCategory] = useState(false);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);
  const [form, setForm] = useState({
    store_name: "",
    category_id: "",
    address: "",
  });

  const { id } = useParams();
  const {auth} = useAuth()
  const navigate = useNavigate();
  const { loading: authLoading } = useAuth();
  const { showToast } = useToast()
  const handleError = useErrorHandler();

  async function fetchData() {
    try {
      setPageLoading(true);
      const response = await getStoreById(id);
      const data = response.data.data
      setForm({
        store_name: data.store_name || "",
        category_id: data.category_id || "",
        address: data.address || "",
      });
    } catch (error) {
      const msg = handleError(error, "Failed to load store data");
      showToast(msg, "error");
    } finally {
      setPageLoading(false);
    }
  }

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

  useEffect(() => {
    if (!authLoading) fetchData();
  }, [id, authLoading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setPageLoading(true);
      const response = await editStoreById(id, form);
      showToast(response.data.message || "اسٹور کامیابی سے اپڈیٹ ہو گیا ہے", "success");
      setTimeout(() => navigate("/admin/all-stores"), 2000);
    } catch (error) {
      const msg = handleError(error, "Failed to edit store");
      showToast(msg, "error");
    } finally {
      setPageLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  return (
    <div className="max-w-xl animate-in fade-in duration-500">
      {/* Updated Header to match EditUser */}
      <div className="mb-4">
        <h1 className="text-xl font-black text-gray-900 uppercase tracking-tight">اسٹور برانچ کی ترمیم کریں</h1>
        <p className="text-xs text-gray-500">اس برانچ کی لوکیشن یا شناختی تفصیلات اپڈیٹ کریں۔</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">

        {/* Store Identifiers */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>اسٹور کا نام *</label>
            <input
              name="store_name"
              value={form.store_name}
              onChange={handleChange}
              placeholder="e.g. Sub Store Delta"
              className={inputClass}
              required
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
                  form.category_id
                    ? categories.find((c) => c.category_id === form.category_id)?.category_name
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
                      setForm((f) => ({ ...f, category_id: null }))
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
                        setForm((f) => ({ ...f, category_id: c.category_id }))
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

        {/* Location & Contact */}
        <div>
          <label className={labelClass}>پتہ *</label>
          <input
            name="address"
            value={form.address}
            onChange={handleChange}
            placeholder="e.g. Block 5, Karachi"
            className={inputClass}
          />
        </div>

        {/* Action Button */}
        <div className="pt-4 border-t border-gray-100 flex flex-col gap-3">
          <button
            type="submit"
            disabled={pageLoading || authLoading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
          >
            {pageLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              "برانچ کی تبدیلیاں محفوظ کریں"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditStore;