import CheckLoadingAndError from "../CheckLoadingAndError";
import Pagination from "../Pagination";
import TableHead from "../TableHead";

const ReturnModal = ({
    setReturnBackModal,
    returnBackNote,
    setReturnBackNote,
    handleReturnBack,
    returnBackSubmitting,
    setCurrentPage,
    setPageSize,
    allItems,
    pagination = {
        currentPage: 1,
        totalItems: 0,
        pageLimit: 10,
    },
    setItemSearch,
    setAllItems,
    itemLoading,
}) => {
    const pageType = "returnModal";

    const selectedItems = allItems.filter(
        (item) => Number(item.return_qty) > 0
    );

    const totalSelectedQuantity = allItems.reduce(
        (total, item) => total + Number(item.return_qty),
        0
    );

    const closeModal = () => {
        setReturnBackModal(false);
        setReturnBackNote("");
    };

    const updateReturnQuantity = (itemId, value, maxQuantity) => {
        setAllItems((prev) =>
            prev.map((item) =>
                item.item_id === itemId
                    ? {
                          ...item,
                          return_qty:
                              value === ""
                                  ? ""
                                  : Math.min(
                                        maxQuantity,
                                        Math.max(0, Number(value))
                                    ),
                      }
                    : item
            )
        );
    };

    return (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
            <div
                className="fixed inset-0 bg-black/30 cursor-pointer"
                onClick={closeModal}
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
                        onClick={closeModal}
                        className="text-gray-400 hover:text-gray-700 text-2xl leading-none cursor-pointer"
                    >
                        ×
                    </button>
                </div>

                {/* Search */}
                <div className="px-6 py-3">
                    <input
                        placeholder="آئٹم تلاش کریں..."
                        onChange={(e) => {
                            setItemSearch(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-800 text-sm focus:outline-none focus:border-emerald-500 shadow-sm"
                    />
                </div>

                {/* Table */}
                <div className="flex-1 overflow-y-auto text-center">
                    <table className="w-full text-sm">
                        <thead>
                            <TableHead pageType={pageType} />
                        </thead>

                        <tbody>
                            {itemLoading || allItems.length === 0 ? (
                                <CheckLoadingAndError
                                    loading={itemLoading}
                                    requests={allItems}
                                    pageType={pageType}
                                />
                            ) : (
                                allItems.map((item) => (
                                    <tr
                                        key={item.item_id}
                                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                                    >
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className="font-mono text-emerald-600 text-xs">
                                                {item.item_no}
                                            </span>
                                        </td>

                                        <td className="px-4 py-3">
                                            <div className="font-semibold text-gray-800 whitespace-nowrap">
                                                {item.item_name}
                                            </div>

                                            <div
                                                className="font-semibold text-xs text-gray-800 whitespace-nowrap"
                                                dir="rtl"
                                            >
                                                ({item.item_name_urdu})
                                            </div>
                                        </td>

                                        <td className="px-4 py-3 text-xs text-gray-500">
                                            {item.item_type || "—"}
                                        </td>

                                        <td className="px-4 py-3 text-xs text-gray-500">
                                            {item.item_uom || "—"}
                                        </td>

                                        <td className="px-4 py-3 font-mono font-bold text-emerald-600">
                                            {Number(item.item_quantity)}
                                        </td>

                                        <td className="px-4 py-3 font-mono font-bold text-emerald-600">
                                            {Number(item.return_transit_qty)}
                                        </td>

                                        <td
                                            className="px-4 py-3"
                                            onClick={(e) =>
                                                e.stopPropagation()
                                            }
                                        >
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() =>
                                                        updateReturnQuantity(
                                                            item.item_id,
                                                            Math.max(
                                                                0,
                                                                Number(
                                                                    item.return_qty
                                                                ) - 1
                                                            ),
                                                            Number(
                                                                item.item_quantity
                                                            )
                                                        )
                                                    }
                                                    className="w-7 h-7 rounded border border-gray-300 text-gray-600 hover:bg-gray-100 font-bold flex items-center justify-center"
                                                >
                                                    −
                                                </button>

                                                <input
                                                    type="number"
                                                    min={0}
                                                    max={Number(
                                                        item.item_quantity
                                                    )}
                                                    value={
                                                        item.return_qty
                                                    }
                                                    onChange={(e) =>
                                                        updateReturnQuantity(
                                                            item.item_id,
                                                            e.target.value,
                                                            Number(
                                                                item.item_quantity
                                                            )
                                                        )
                                                    }
                                                    className="w-16 border border-gray-300 rounded px-2 py-1 text-center font-mono text-sm focus:outline-none focus:border-emerald-500"
                                                />

                                                <button
                                                    onClick={() =>
                                                        updateReturnQuantity(
                                                            item.item_id,
                                                            Math.min(
                                                                Number(
                                                                    item.item_quantity
                                                                ),
                                                                Number(
                                                                    item.return_qty
                                                                ) + 1
                                                            ),
                                                            Number(
                                                                item.item_quantity
                                                            )
                                                        )
                                                    }
                                                    className="w-7 h-7 rounded border border-gray-300 text-gray-600 hover:bg-gray-100 font-bold flex items-center justify-center"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <Pagination
                    currentPage={pagination.currentPage}
                    totalItems={pagination.totalItems}
                    pageSize={pagination.pageLimit}
                    onPageChange={setCurrentPage}
                    pageSizeOptions={[10, 25, 50]}
                    onPageSizeChange={(size) => {
                        setPageSize(size);
                        setCurrentPage(1);
                    }}
                />

                {/* Footer */}
                <div className="border-t border-zinc-200 px-6 py-4 space-y-3">
                    {selectedItems.length > 0 && (
                        <div className="flex gap-4 text-xs text-gray-500 bg-gray-50 rounded px-3 py-2">
                            <span>
                                منتخب آئٹمز:{" "}
                                <strong className="text-gray-800">
                                    {selectedItems.length}
                                </strong>
                            </span>

                            <span>
                                کل مقدار:{" "}
                                <strong className="text-emerald-600">
                                    {totalSelectedQuantity}
                                </strong>
                            </span>
                        </div>
                    )}

                    <input
                        value={returnBackNote}
                        onChange={(e) =>
                            setReturnBackNote(e.target.value)
                        }
                        placeholder="نوٹ (optional)"
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                    />

                    <div className="flex gap-3">
                        <button
                            onClick={closeModal}
                            className="flex-1 text-gray-500 text-sm py-2 border border-gray-300 rounded hover:bg-gray-50"
                        >
                            منسوخ کریں
                        </button>

                        <button
                            onClick={handleReturnBack}
                            disabled={returnBackSubmitting}
                            className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white text-sm font-semibold py-2 rounded transition-colors"
                        >
                            {returnBackSubmitting
                                ? "بھیج رہے ہیں..."
                                : "واپس بھیجیں"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReturnModal;