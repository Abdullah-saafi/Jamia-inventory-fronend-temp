import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { editUserById, getStores, getUserById } from "../../services/api";
import { EyeOpen, EyeClosed } from "../EyeIcons"; // Using your icon components
import { ROLES, ROLE_STORE_MAP, inputClass, labelClass } from "../../services/constants";
import useErrorHandler from "../useErrorHandler";
import { useAuth } from "../../context/authContext";
import { useToast } from "../../context/ToastContext";

const EditUser = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { loading: authLoading } = useAuth();
  const {showToast} = useToast()
  const handleError = useErrorHandler();

  const [form, setForm] = useState({
    username: "",
    email: "",
    role: "",
    store_id: "",
    password: "",
    confirmPassword: "",
  });

  const [pageLoading, setPageLoading] = useState(false);
  const [stores, setStores] = useState([]);
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  async function fetchData() {
    try {
      setPageLoading(true);
      const [storesRes, userRes] = await Promise.all([
        getStores(),
        getUserById(id)
      ]);
      
      setStores(storesRes.data.data || []);
      
      const user = userRes.data.user;
      setForm({
        username: user.name || "",
        email: user.email || "",
        role: user.role || "",
        store_id: user.store_id || "",
        password: "",
        confirmPassword: "",
      });
    } catch (error) {
      const msg = handleError(error, "Failed to load user data");
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
    if (form.password && form.password !== form.confirmPassword) {
        return showToast("Passwords do not match", "error");
    }

    try {
      setPageLoading(true);
      const response = await editUserById(id, form);
      showToast(response.data.message || "User updated successfully", "success");
      setTimeout(() => navigate("/admin/all-users"), 2000);
    } catch (error) {
      const msg = handleError(error, "Failed to edit user");
      showToast(msg, "error");
    } finally {
      setPageLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ 
        ...f, 
        [name]: value,
        ...(name === "role" ? { store_id: "" } : {}), 
    }));
  };

  const filteredStores = stores.filter(
    (s) => s.store_type === ROLE_STORE_MAP[form.role] && s.is_active
  );


  return (
    <div className="max-w-xl animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="mb-4">
        <h1 className="text-xl font-black text-gray-900 uppercase tracking-tight">Edit Staff Member</h1>
        <p className="text-xs text-gray-500">Modify credentials or branch assignment for this user.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
        
        {/* Role & Store Selection */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Role *</label>
            <select name="role" value={form.role} onChange={handleChange} className={inputClass}>
              <option value="">Select Role</option>
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Store / Branch *</label>
            <select
              name="store_id"
              value={form.store_id}
              onChange={handleChange}
              disabled={!form.role}
              className={inputClass + (!form.role ? " opacity-50 cursor-not-allowed" : "")}
            >
              <option value="">{form.role ? "Select Store" : "Select role first"}</option>
              {filteredStores.map((s) => (
                <option key={s.store_id} value={s.store_id}>{s.store_name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Name & Email */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Full Name *</label>
            <input 
              name="username" 
              value={form.username} 
              onChange={handleChange} 
              placeholder="e.g. Ahmed Khan" 
              className={inputClass} 
            />
          </div>
          <div>
            <label className={labelClass}>Email Address *</label>
            <input 
              type="email" 
              name="email" 
              value={form.email} 
              onChange={handleChange} 
              placeholder="e.g. ahmed@company.com" 
              className={inputClass} 
            />
          </div>
        </div>

        {/* Password Fields (Optional for Edit) */}
        <div className="grid grid-cols-2 gap-3">
          <div className="relative">
            <label className={labelClass}>New Password (Optional)</label>
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
            <label className={labelClass}>Confirm New Password</label>
            <input 
              type={showConfirmPass ? "text" : "password"} 
              name="confirmPassword" 
              autoComplete="new-password" 
              value={form.confirmPassword} 
              onChange={handleChange} 
              className={inputClass + " pr-10"} 
            />
            <button 
              type="button" 
              onClick={() => setShowConfirmPass(!showConfirmPass)} 
              className="absolute bottom-2.5 right-3 text-gray-400 hover:text-emerald-500"
            >
              {showConfirmPass ? <EyeOpen /> : <EyeClosed />}
            </button>
          </div>
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
              "Update User Profile"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditUser;