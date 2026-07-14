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
import { ChevronDown, ChevronUp } from "lucide-react";

const addUser = (data) => API.post("/users/addUser", data);

export default function AddUserTab() {
  const { stores, showToast } = useOutletContext();

  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "",
    phone_no: "",
    store_id: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showStoreTypeDropdown, setShowStoreTypeDropdown] = useState(false);
  const [showStoreDropdown, setShowStoreDropdown] = useState(false);
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
      return showToast("پاس ورڈ کم از کم 6 حروف پر مشتمل ہونا چاہیے", "warn");
    if(form.phone_no.length < 10){
      return showToast("فون نمبر درست نہیں ہے۔","error")
    }

    setLoading(true);
    try {
      const res = await addUser(form);
      showToast(res.data.message || "صارف کا اکاؤنٹ کامیابی سے بن گیا ہے", "success");
      setForm({
        name: "",
        email: "",
        role: "",
        phone_no: "",
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
      <input type="text" style={{ display: "none" }} />
      <input type="password" style={{ display: "none" }} />

      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {/* Role Filter */}
          {showStoreTypeDropdown && (
            <div className="absolute inset-0" onClick={() => setShowStoreTypeDropdown((prev) => !prev)} />
          )}
          <div className="relative min-w-45">
            <label className={labelClass}>شعبہ</label>

            <button
              type="button"
              onClick={() => {
                setShowStoreTypeDropdown((prev) => !prev)
              }}
              className=" w-full h-10 px-3 flex items-center justify-between bg-white border border-gray-300 rounded-lg shadow-sm hover:border-emerald-400 focus:border-emerald-500 transition-all text-sm text-gray-700">
              <span>
                {form.role ? ROLES.find((r) => r.value === form.role)?.label : "شعبہ منتخب کریں"}
              </span>

              {showStoreTypeDropdown ? (
                <ChevronUp size={16} className="text-gray-400" />
              ) : (
                <ChevronDown size={16} className="text-gray-400" />
              )}
            </button>

            {showStoreTypeDropdown && (
              <div
                className=" absolute z-50 mt-2 w-full max-h-48 bg-white border border-gray-200 rounded-xl shadow-xl overflow-y-auto">
                <button
                  className=" w-full text-left px-4 py-2.5 hover:bg-emerald-50 text-sm"
                  onClick={() => {
                    handleChange({ target: { name: "role", value: "" } });
                    setShowStoreTypeDropdown(false);
                  }}
                >
                  شعبہ منتخب کریں
                </button>

                {ROLES.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => {
                      const storesForRole = stores.filter(
                        (s) => s.store_type === r.value
                      );

                      setForm((prev) => ({
                        ...prev,
                        role: r.value,
                        store_id: storesForRole[0]?.store_id || "",
                      }));

                      setShowStoreTypeDropdown(false);
                    }}
                    className={` w-full text-left px-4 py-2.5 text-sm hover:bg-emerald-50 transition-colors ${form.role === r.value
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
          </div>
          {/* Role Filter ends here */}

          {/* Store Filter */}
          {showStoreDropdown && (
            <div className="absolute inset-0" onClick={() => setShowStoreDropdown((prev) => !prev)} />
          )}

          <div className="relative min-w-50">
            <label className={labelClass}>اسٹور</label>
            <button
              type="button"
              onClick={() => {
                setShowStoreDropdown((prev) => !prev)
                setShowStoreTypeDropdown(false)
              }}
              disabled={!form.role}
              className=" w-full h-10 px-3 flex items-center justify-between bg-white border border-gray-300 rounded-lg shadow-sm hover:border-emerald-400 focus:border-emerald-500 transition-all text-sm text-gray-700">
              <span>
                {!form.role
                  ? "پہلے شعبہ منتخب کریں"
                  : filteredStores.find(
                    (s) => s.store_id === form.store_id
                  )?.store_name || "اسٹور منتخب کریں"}
              </span>
              {showStoreDropdown ? (
                <ChevronUp size={16} className="text-gray-400" />
              ) : (
                <ChevronDown size={16} className="text-gray-400" />
              )}
            </button>

            {showStoreDropdown && (
              <div
                className=" absolute max-h-48 z-50 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden overflow-y-auto">
                <button
                  className={`w-full text-left px-4 py-2.5 hover:bg-emerald-50 text-sm ${!form.role ? "cursor-not-allowed text-gray-300" : "text-gray-700"}`}
                  onClick={() => {
                    handleChange({ target: { name: "store_id", value: "" } });
                    setShowStoreDropdown(false);
                  }}
                  disabled={!form.role}
                >
                  {form.role ? "اسٹور منتخب کریں" : "پہلے شعبہ منتخب کریں"}
                </button>
                {filteredStores.map((s) => (
                  <button
                    key={s.store_id}
                    onClick={() => {
                      handleChange({ target: { name: "store_id", value: s.store_id } });
                      setShowStoreDropdown(false);
                    }}
                    className={` w-full text-left px-4 py-2.5 text-sm hover:bg-emerald-50 transition-colors ${form.store_id === s.store_id
                      ? "bg-emerald-100 text-emerald-700 font-semibold"
                      : "text-gray-700"
                      }
          `}
                  >
                    {s.store_name}
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* Store filter ends here */}
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

        <div>
          <div>
            <label className={labelClass}>فون</label>
            <div className="relative flex items-center w-full">
              <span
                className="absolute left-3 flex items-center gap-1 text-emerald-500 font-semibold text-sm select-none pointer-events-none"
              >
                <span>+</span>
                <span className="text-gray-400">92</span>
                <span className="h-4 w-px bg-gray-700 ml-1.5 inline-block"></span>
              </span>

              {/* Input Field */}
              <input
                name="phone_no"
                inputMode="numeric"
                maxLength={10}
                value={form.phone_no}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                  setForm((f) => ({ ...f, phone_no: val }));
                }}
                placeholder="3001234567"
                className={`${inputClass} pl-14 w-full`}
              />
            </div>
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
