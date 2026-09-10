import TableHead from "../TableHead"

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
    onCancel,
    onConfirm,
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
                                dir="ltr"
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
                        <div dir="ltr">
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
                        <div dir="ltr">
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
                        <div dir="ltr">
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

    {/* ══════════════════════════════════════════════════════════
              Main Store Fulfill Modal
        ══════════════════════════════════════════════════════════ */}

    if (pageType === "mainSubStoreReqs")
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div
                    className="absolute inset-0 bg-black/30"
                    onClick={
                        onCancel
                        // setFulfillForm({ ...EMPTY_FULFILL_FORM })
                    }
                />
                <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
                    <div
                        className="fixed inset-0 bg-black/30 cursor-pointer"
                        onClick={onCancel}
                    />

                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col relative z-10">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
                            <div>
                                <h3 className="font-bold text-gray-800">
                                    آئٹم واپس کریں
                                </h3>

                                <p className="text-xs text-gray-400 mt-0.5">
                                    مرکزی اسٹور کو واپس بھیجنے کے لیے مقدار درج کریں
                                </p>
                            </div>

                            <button
                                onClick={onCancel}
                                className="text-gray-400 hover:text-gray-700 text-2xl leading-none cursor-pointer"
                            >
                                ×
                            </button>
                        </div>

                        {/* Table */}
                        <div className="flex-1 overflow-y-auto text-center">
                            <table className="w-full text-sm">
                                [
                                "درخواست کنندہ",
                                "منظور کنندہ",
                                "مکمل کرنے والا",
                                "حالت",
                                "عملیات",
                                ],
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-200">
                                        <th className="px-4 py-3 text-gray-500 font-semibold text-xs uppercase tracking-wider">
                                            درخواست نمبر
                                        </th>
                                        <th className="px-4 py-3 text-gray-500 font-semibold text-xs uppercase tracking-wider">
                                            اسٹور سے
                                        </th>
                                        <th className="px-4 py-3 text-gray-500 font-semibold text-xs uppercase tracking-wider">
                                            مرکزی اسٹور کو

                                        </th>
                                        <th className="px-4 py-3 text-gray-500 font-semibold text-xs uppercase tracking-wider">
                                            درخواست کی تاریخ
                                        </th>
                                        <th className="px-4 py-3 text-gray-500 font-semibold text-xs uppercase tracking-wider">
                                            تکمیل کی تاریخ
                                        </th>
                                        <th className="px-4 py-3 text-gray-500 font-semibold text-xs uppercase tracking-wider">
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {!pageType ? (
                                        // <CheckLoadingAndError
                                        //     loading={itemLoading}
                                        //     requests={allItems}
                                        //     pageType={pageType}
                                        // />
                                        <h1>wait bradar</h1>
                                    ) : (
                                        // allItems.map((item) => (
                                        <tr
                                            // key={item.item_id}
                                            className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                                        >
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className="font-mono text-emerald-600 text-xs">
                                                    {/* {item.item_no} */}
                                                    123
                                                </span>
                                            </td>

                                            <td className="px-4 py-3">
                                                <div className="font-semibold text-gray-800 whitespace-nowrap">
                                                    {/* {item.item_name} */}
                                                    biscuit
                                                </div>

                                                <div
                                                    className="font-semibold text-xs text-gray-800 whitespace-nowrap"
                                                    dir="rtl"
                                                >
                                                    {/* ({item.item_name_urdu}) */}
                                                    buscuit
                                                </div>
                                            </td>

                                            <td className="px-4 py-3 text-xs text-gray-500">
                                                {/* {item.item_type || "—"} */}
                                                khane wali
                                            </td>

                                            <td className="px-4 py-3 text-xs text-gray-500">
                                                {/* {item.item_uom || "—"} */}
                                                packt
                                            </td>

                                            <td className="px-4 py-3 font-mono font-bold text-emerald-600">
                                                {/* {Number(item.item_quantity)} */}
                                                10
                                            </td>
                                        </tr>
                                        // ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Footer */}
                        <div className="border-t border-zinc-200 px-6 py-4 space-y-3">
                            <div className="flex gap-3">
                                <button
                                    onClick={onCancel}
                                    className="flex-1 text-gray-500 text-sm py-2 border border-gray-300 rounded hover:bg-gray-50"
                                >
                                    منسوخ کریں
                                </button>

                                <button
                                    onClick={onConfirm}
                                    // disabled={returnBackSubmitting}
                                    className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white text-sm font-semibold py-2 rounded transition-colors"
                                >
                                    {/* {returnBackSubmitting
                                ? "بھیج رہے ہیں..."
                                : "واپس بھیجیں"} */}
                                    aaaa
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
}

export default FulfillModal