import { useState } from "react";
import { useOutletContext } from "react-router-dom"; 
import { addStore } from "../../services/api";
import { inputClass, labelClass } from "../../services/constants";
import useErrorHandler from "../useErrorHandler";
import { useToast } from "../../context/ToastContext";

export default function AddStoreTab() {

  const { loadStores } = useOutletContext(); 

  const [form, setForm] = useState({
    store_code: "",
    store_name: "",
    address: "",
  });
  const [loading, setLoading] = useState(false);

  const handleError = useErrorHandler();
  const { showToast } = useToast()

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!form.store_code || !form.store_name) {
      return showToast("اسٹور کوڈ اور اسٹور کا نام درکار ہے", "error");
    }
    setLoading(true);
    try {
      // Force SUB_STORE type as per your requirement
      const res = await addStore({ ...form, store_type: "SUB_STORE" });

      const createdName = res.data?.data?.store_name || "Store";
      showToast(`اسٹور کامیابی سے بن گیا ہے`, "success");

      // Reset form
      setForm({ store_code: "", store_name: "", address: "",});

      // 3. Refresh the global stores list in Admin.jsx
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
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
        {/* Basic Info Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>اسٹور کوڈ *</label>
            <input
              name="store_code"
              value={form.store_code}
              onChange={handleChange}
              autoComplete="off"
              placeholder="e.g. SUB-004"
              className={inputClass}
            />
          </div>
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
            onClick={handleSubmit}
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
    </div>
  );
}
