import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { editStoreById, getStoreById } from "../../services/api";
import { inputClass, labelClass } from "../../services/constants";
import useErrorHandler from "../useErrorHandler";
import { useAuth } from "../../context/authContext";
import { useToast } from "../../context/ToastContext";

const EditStore = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { loading: authLoading } = useAuth();
  const {showToast} = useToast()
  const handleError = useErrorHandler();

  const [pageLoading, setPageLoading] = useState(false);
  
  const [form, setForm] = useState({
    store_code: "",
    store_name: "",
    address: "",
    phone: ""
  });

  async function fetchData() {
    try {
      setPageLoading(true);
      const response = await getStoreById(id);
      const data = response.data.data
      setForm({
        store_code: data.store_code || "",
        store_name: data.store_name || "",
        address: data.address || "",
        phone: data.phone || "",
      });
    } catch (error) {
      const msg = handleError(error, "Failed to load store data");
      showToast(msg, "error");
    } finally {
      setPageLoading(false);
    }
  }

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
            <label className={labelClass}>اسٹور کوڈ *</label>
            <input
              name="store_code"
              value={form.store_code}
              onChange={handleChange}
              placeholder="e.g. SUB-004"
              className={inputClass}
              required
            />
          </div>
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