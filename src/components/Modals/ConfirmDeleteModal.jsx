const ConfirmDeleteModal = ({
    onConfirm,
    onCancel
}) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/30"
                onClick={onCancel}
            />
            <div className="relative bg-white border border-gray-200 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
                    <h2 className="text-gray-900 font-bold">
                        ڈیلیٹ کرنے کی تصدیق
                    </h2>
                    <button
                        onClick={onCancel}
                        className="text-gray-400 hover:text-gray-700 text-xl"
                    >
                        ✕
                    </button>
                </div>
                <div className="p-5 space-y-4">
                    <div>
                        <h1 className="text-gray-500 text-right">کیا آپ واقعی اس کو ڈیلیٹ کرنا چاہتے ہیں؟</h1>
                    </div>
                    <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
                        <button
                            onClick={onCancel}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold px-4 py-2 rounded"
                        >
                            منسوخ کریں
                        </button>
                        <button
                            onClick={onConfirm}
                            className="text-white text-sm font-semibold px-4 py-2 rounded disabled:opacity-40 bg-emerald-600 hover:bg-emerald-500">
                            تصدیق کریں
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ConfirmDeleteModal