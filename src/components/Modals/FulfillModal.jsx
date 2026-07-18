const FulfillModal = ({
    pageType,
    setFulfillForm,
    fulfillForm,
    setFulfillModal,
    setReferenceNo,
    requestNo,
    referenceNo,
    handleFulfill,
    fulfilling,
    EMPTY_FULFILL_FORM,

}) => {

    {/* ══════════════════════════════════════════════════════════
              Petty Cash Fulfill Modal
        ══════════════════════════════════════════════════════════ */}

    if (pageType === "pettyCash")
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div
                    className="absolute inset-0 bg-black/30"
                    onClick={() => {
                        setFulfillModal(null)
                        setReferenceNo("")
                    }}
                />
                <div className="relative bg-white border border-gray-200 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
                        <h2 className="text-gray-900 font-bold">
                            تکمیل — {requestNo.no}
                        </h2>
                        <button
                            onClick={() => {
                                setFulfillModal(null)
                                setReferenceNo("")
                            }}
                            className="text-gray-400 hover:text-gray-700 text-xl"
                        >
                            ✕
                        </button>
                    </div>
                    <div className="p-5 space-y-4">
                        <div>
                            <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider block mb-1">
                                حوالہ نمبر *
                            </label>
                            <input
                                type="text"
                                value={referenceNo}
                                onChange={(e) => {
                                    setReferenceNo(e.target.value)
                                }}
                                className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm outline-none"
                            />
                        </div>
                        <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
                            <button
                                onClick={() => {
                                    setFulfillModal(null)
                                    setReferenceNo("")
                                }}
                                className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold px-4 py-2 rounded"
                            >
                                منسوخ کریں
                            </button>
                            <button
                                onClick={() => {
                                    handleFulfill(requestNo.id, referenceNo)
                                }}
                                disabled={fulfilling}
                                className="text-white text-sm font-semibold px-4 py-2 rounded disabled:opacity-40 bg-emerald-600 hover:bg-emerald-500">
                                {fulfilling
                                    ? "جاری ہے..."
                                    : "تکمیل کی تصدیق کریں"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )

    {/* ══════════════════════════════════════════════════════════
              Head Office Fulfill Modal
        ══════════════════════════════════════════════════════════ */}

    if (pageType === "headOffice")
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div
                    className="absolute inset-0 bg-black/30"
                    onClick={() => {
                        setFulfillModal(null)
                        setFulfillForm({ ...EMPTY_FULFILL_FORM })
                    }}
                />
                <div className="relative bg-white border border-gray-200 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
                        <h2 className="text-gray-900 font-bold">
                            تکمیل — {requestNo.no}
                        </h2>
                        <button
                            onClick={() => {
                                setFulfillModal(null)
                                setFulfillForm({ ...EMPTY_FULFILL_FORM })
                            }}
                            className="text-gray-400 hover:text-gray-700 text-xl"
                        >
                            ✕
                        </button>
                    </div>
                    <div className="p-5 space-y-4">
                        <div>
                            <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider block mb-1">
                                ڈرائیور کا نام
                            </label>
                            <input
                                type="text"
                                value={fulfillForm.driver_name}
                                onChange={(e) => {
                                    setFulfillForm((prev) => ({ ...prev, driver_name: e.target.value }))
                                }}
                                placeholder="ڈرائیور کا نام درج کریں"
                                className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-800 text-sm focus:outline-none focus:border-emerald-500"
                            />
                        </div>
                        <div>
                            <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider block mb-1">فون</label>
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
                                    name="driver_no"
                                    inputMode="numeric"
                                    maxLength={10}
                                    value={fulfillForm.driver_no}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                                        setFulfillForm((f) => ({ ...f, driver_no: val }));
                                    }}
                                    placeholder="3001234567"
                                    className="w-full pl-14 bg-white border border-gray-300 rounded px-3 py-2 text-gray-800 text-sm focus:outline-none focus:border-emerald-500"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider block mb-1">
                                گاڑی کا نمبر
                            </label>
                            <input
                                type="text"
                                value={fulfillForm.vehicle_no}
                                onChange={(e) => {
                                    setFulfillForm((prev) => ({ ...prev, vehicle_no: e.target.value }))
                                }}
                                placeholder="گاڑی کی نمبر پلیٹ درج کریں"
                                className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-800 text-sm focus:outline-none focus:border-emerald-500"
                            />
                        </div>
                        <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
                            <button
                                onClick={() => {
                                    setFulfillModal(null)
                                    setFulfillForm({ ...EMPTY_FULFILL_FORM })
                                }}
                                className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold px-4 py-2 rounded"
                            >
                                منسوخ کریں
                            </button>
                            <button
                                onClick={() => {
                                    handleFulfill(requestNo.id, referenceNo)
                                }}
                                disabled={fulfilling}
                                className="text-white text-sm font-semibold px-4 py-2 rounded disabled:opacity-40 bg-emerald-600 hover:bg-emerald-500">
                                {fulfilling
                                    ? "جاری ہے..."
                                    : "تکمیل کی تصدیق کریں"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )
}

export default FulfillModal