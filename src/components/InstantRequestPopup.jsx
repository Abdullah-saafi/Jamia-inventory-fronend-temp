import { useAuth } from "../context/authContext";

const InstantRequestPopup = ({
  onClose,
  getDetail,
  setItemForm,
  EMPTY_LINE,
  requestId,
}) => {
  const { auth } = useAuth();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">

      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-300 bg-red-50">
          <h2 className="text-red-700 font-bold text-lg tracking-wide">
            اسٹاک کم ہے ⚠️
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-xl transition"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 text-center">

          <p className="text-gray-700 text-sm leading-relaxed">
            اسٹاک ناکافی ہونے کی وجہ سے یہ درخواست پوری نہیں کی جا سکتی۔
          </p>

          <p className="text-gray-500 text-sm">
            کیا آپ{" "}
            <span className="font-semibold text-gray-700">
              ہیڈ آفس / پیٹی کیش
            </span>{" "}
            کو ایک نئی درخواست بھیجنا چاہتے ہیں؟
          </p>

          {/* Buttons */}
          <div className="flex gap-3 justify-center pt-2">

            {/* YES */}
            <button
              onClick={() => {
                setItemForm({
                  from_store_id: auth.store_id || "",
                  requested_by_name: auth.username || "",
                  to_store_id: "",
                  notes: "",
                  is_emergency: false,
                  items: [{ ...EMPTY_LINE }],
                });
                getDetail(requestId);
                onClose();
              }}
              className="px-5 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-500 transition shadow-sm"
            >
              درخواست بنائیں
            </button>

            {/* NO */}
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-semibold hover:bg-gray-200 transition"
            >
              منسوخ کریں
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default InstantRequestPopup;