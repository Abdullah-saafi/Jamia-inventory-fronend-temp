import { useState } from "react";
import { useOutletContext } from "react-router-dom"; // 1. Import this
import API from "../../services/api";
import { EyeOpen, EyeClosed } from "../EyeIcons";
import {
  ROLES,
  ROLE_STORE_MAP,
  inputClass,
  labelClass,
} from "../../services/constants";
import useErrorHandler from "../useErrorHandler";

const addUser = (data) => API.post("/users/addUser", data);

export default function AddUserTab() {
  const { stores, showToast } = useOutletContext();

  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "",
    store_id: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleError = useErrorHandler();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({
      ...f,
      [name]: value,
      ...(name === "role" ? { store_id: "" } : {}),
    }));
  };

  const filteredStores = stores.filter(
    (s) => s.store_type === ROLE_STORE_MAP[form.role] && s.is_active,
  );

  const handleSubmit = async () => {
    const { name, email, role, store_id, password, confirmPassword } = form;

    if (!name || !email || !role || !store_id || !password || !confirmPassword)
      return showToast("براہ کرم تمام مطلوبہ خانے پُر کریں", "warn");
    if (password !== confirmPassword)
      return showToast("پاس ورڈ میچ نہیں کر رہے", "error");
    if (password.length < 6)
      return showToast("پاس ورڈ کم از کم 6 حروف پر مشتمل ہونا چاہیے","warn");

    setLoading(true);
    try {
      const res = await addUser(form);
      showToast(res.data.message || "صارف کا اکاؤنٹ کامیابی سے بن گیا ہے", "success");
      setForm({
        name: "",
        email: "",
        role: "",
        store_id: "",
        password: "",
        confirmPassword: "",
      });
    } catch (e) {
      const msg = handleError(e, "Failed to add user");
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl">
      {/* HACK: Fake hidden inputs to trick browser auto-fill */}
      <input type="text" style={{ display: "none" }} />
      <input type="password" style={{ display: "none" }} />

      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>شعبہ</label>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className={inputClass}
            >
              <option value="">شعبہ منتخب کریں</option>
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>اسٹور / شاخ</label>
            <select
              name="store_id"
              value={form.store_id}
              onChange={handleChange}
              disabled={!form.role}
              className={
                inputClass +
                (!form.role ? " opacity-50 cursor-not-allowed" : "")
              }
            >
              <option value="">
                {form.role ? "Select Store" : "Select role first"}
              </option>
              {filteredStores.map((s) => (
                <option key={s.store_id} value={s.store_id}>
                  {s.store_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>پورا نام *</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              autoComplete="off"
              placeholder="Abdullah Saafi"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>ای میل ایڈریس *</label>
            <input
              type="email"
              name="email"
              autoComplete="new-password"
              value={form.email}
              onChange={handleChange}
              placeholder="ahmed@company.com"
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="relative">
            <label className={labelClass}>پاس ورڈ *</label>
            <input
              type={showPass ? "text" : "password"}
              name="password"
              autoComplete="new-password"
              value={form.password}
              onChange={handleChange}
              className={inputClass + " pr-10"}
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute bottom-2.5 right-3 text-gray-400 hover:text-emerald-500"
            >
              {showPass ? <EyeOpen /> : <EyeClosed />}
            </button>
          </div>
          <div className="relative">
            <label className={labelClass}>پاس ورڈ کی تصدیق *</label>
            <input
              type={showConfirm ? "text" : "password"}
              name="confirmPassword"
              autoComplete="new-password"
              value={form.confirmPassword}
              onChange={handleChange}
              className={inputClass + " pr-10"}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute bottom-2.5 right-3 text-gray-400 hover:text-emerald-500"
            >
              {showConfirm ? <EyeOpen /> : <EyeClosed />}
            </button>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100 flex flex-col gap-3">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              "نیا اکاؤنٹ بنائیں"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
