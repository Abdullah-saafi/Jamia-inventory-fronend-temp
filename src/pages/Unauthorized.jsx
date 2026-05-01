import { useNavigate } from "react-router";
import { ShieldAlert, ArrowLeft, Home } from "lucide-react";
import { useState } from "react";
import { logout } from "../services/api";
import { useAuth } from "../context/authContext";

const Unauthorized = () => {
  const [logoutLoading, setLogoutLoading] = useState(false)

  const {auth, setAuth} = useAuth()
  const navigate = useNavigate();

  const logoutUser = async () => {
    try {
      setLogoutLoading(true);
      const response = await logout();
      if (response.data.message) console.log("successfully logout");
      setAuth({
        accessToken: null,
        username: null,
        role: null,
        storeName: null,
        store_id: null,
        message: null,
        isBlocked: false,
      });
      navigate("/login");
    } catch (error) {
      console.error("Logout failed", error);
      setAuth({
        accessToken: null,
        username: null,
        role: null,
        storeName: null,
        store_id: null,
        message: null,
        isBlocked: false,
      });
      navigate("/login");
    } finally {
      setLogoutLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Visual Icon */}
        <div className="flex justify-center">
          <div className="bg-red-100 p-6 rounded-full">
            <ShieldAlert className="w-16 h-16 text-red-600" />
          </div>
        </div>

        {/* Text Content */}
        <div className="space-y-3">
          <h1 className="text-7xl font-black text-gray-900 tracking-tighter">403</h1>
          <h2 className="text-2xl font-bold text-gray-800">رسائی کی اجازت نہیں ہے</h2>
          <p className="text-gray-500 text-base">
            معذرت، آپ کے پاس اس صفحے کو دیکھنے کے لیے مطلوبہ اجازت موجود نہیں ہے۔ اگر آپ سمجھتے ہیں کہ یہ کوئی غلطی ہے تو براہِ کرم اپنے ایڈمنسٹریٹر سے رابطہ کریں۔
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all shadow-sm"
          >
            <ArrowLeft size={18} />
            پیچھے جائیں
          </button>

          <button
            onClick={() => logoutUser()}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-500 transition-all shadow-md shadow-emerald-200"
          >
            <Home size={18} />
            {logoutLoading ? <div className="w-6 h-6 border-2 border-white border-t-red-500 rounded-full animate-spin bg-emerald-600" /> : "ہوم پیج پر واپس جائیں"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;