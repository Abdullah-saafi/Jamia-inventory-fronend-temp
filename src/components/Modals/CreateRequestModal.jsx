import { useState } from "react";
import { useAuth } from "../../context/authContext";

export default function CreateRequestModal({
  itemForm, setItemForm, mainStores, reusableItems,
  onClose, onSubmit, addLine, removeLine, updateLine,
  creating, EMPTY_FORM, usableItems, pageType, toStore, showToast,
  itemsLoading, duplicateItemIds
}) {
  const [activeTab, setActiveTab] = useState("items");
  const { auth } = useAuth();

  const DuplicateBadge = ({ itemNo }) => {
    if (!itemNo || !duplicateItemIds?.has(itemNo)) return null;
    return (
      <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-semibold px-2 py-0.5 rounded-full">
        ⚠ یہ آئٹم پہلے سے شامل ہے — مقدار جمع ہو جائے گی
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={() => {
        onClose()
        setItemForm({ ...EMPTY_FORM })
      }} />
      <div className="relative bg-white border border-gray-200 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <h2 className="text-gray-900 font-bold">نئی اشیاء کی درخواست</h2>
            {itemForm.is_emergency && <span className="inline-flex items-center gap-1 bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">Urgent</span>}
          </div>
          <button
            onClick={() => {
              onClose()
              setItemForm({ ...EMPTY_FORM })
            }}
            className="text-gray-400 hover:text-gray-700 text-xl"
          >
            ×
          </button>
        </div>
        {itemForm.is_emergency && (
          <div className="bg-red-50 border-b border-red-200 px-5 py-3 flex items-center gap-2 justify-end">
            <span className="text-red-600 text-sm font-semibold text-left">یہ درخواست براہ راست مرکزی اسٹور کو بھیجی جائے گی</span>
          </div>
        )}
        <form onSubmit={onSubmit} className="p-5 space-y-4">
          {pageType === "mainReqToHO" && (
            <div onClick={() => setItemForm((f) => ({ ...f, is_emergency: !f.is_emergency }))}
              className={`flex items-center justify-between rounded-lg px-4 py-3 cursor-pointer border-2 transition-all select-none ${itemForm.is_emergency ? "bg-red-50 border-red-400" : "bg-gray-50 border-gray-200 hover:border-red-300"}`}>
              <div>
                <p className={`text-sm font-bold ${itemForm.is_emergency ? "text-red-700" : "text-gray-700"}`}>ہنگامی درخواست (Emergency Request)</p>
                <p className="text-xs text-gray-400 mt-0.5">سب اسٹور منیجر کی منظوری کے بغیر مرکزی اسٹور کو بھیجیں</p>
              </div>
              <div className={`relative w-11 h-6 rounded-full transition-colors ${itemForm.is_emergency ? "bg-red-500" : "bg-gray-300"}`}>
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${itemForm.is_emergency ? "translate-x-5" : "translate-x-0.5"}`} />
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider block mb-1">درخواست کنندہ</label>
              <input value={itemForm.requested_by_name} readOnly className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 text-gray-500 text-sm cursor-not-allowed outline-none" />
            </div>
            {pageType === "subStore" && (
              <div>
                <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider block mb-1">بھیجیں(مرکزی اسٹور)</label>
                {mainStores.length === 1 ? (
                  <input value={mainStores[0].store_name} readOnly className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 text-gray-500 text-sm cursor-not-allowed outline-none" />
                ) : (
                  <select value={itemForm.to_store_id} onChange={(e) => setItemForm((f) => ({ ...f, to_store_id: e.target.value }))} className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-800 text-sm focus:outline-none focus:border-emerald-500">
                    <option value="">مرکزی اسٹور منتخب کریں</option>
                    {mainStores.map((s) => <option key={s.store_id} value={s.store_id}>{s.store_name}</option>)}
                  </select>
                )}
              </div>
            )}
            {pageType === "mainReqToHO" && (
              <div>
                <label className="text-gray-500 text-xs font-semibold uppercase tracking-wider block mb-1">
                  کے لیے ( پٹی کیش / ہیڈ آفس)
                </label>
                <select
                  value={itemForm.to_store_id}
                  onChange={(e) =>
                    setItemForm((f) => ({ ...f, to_store_id: Number(e.target.value) }))
                  }
                  className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-800 text-sm focus:outline-none focus:border-emerald-500"
                >
                  <option value="">مرکزی اسٹور منتخب کریں</option>
                  {toStore.map((s) => <option key={s.store_id} value={s.store_id}>{s.store_name}</option>)}
                </select>
              </div>
            )}
          </div>
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            <button
              type="button"
              onClick={() => {
                setActiveTab("items");
                setItemForm((prev) => ({
                  ...EMPTY_FORM,
                  to_store_id: prev.to_store_id,
                  requested_by_name: auth.username || "",
                  from_store_id: auth.store_id || "",
                }));
              }}
              className={`flex-1 py-2 text-sm font-semibold transition-colors
                ${activeTab === "items" ? "bg-emerald-600 text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}
            >
              استعمال ہونے والی اشیاء
            </button>
            <button type="button" onClick={() => { setActiveTab("assets"); setItemForm((prev) => ({ ...EMPTY_FORM, to_store_id: prev.to_store_id, requested_by_name: auth.username || "", from_store_id: auth.store_id || "" })); }}
              className={`flex-1 py-2 text-sm font-semibold transition-colors border-l border-gray-200 ${activeTab === "assets" ? "bg-blue-600 text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}>
              واپس بھیجنے والی اشیاء
            </button>
          </div>
          {activeTab === "items" && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-500 text-xs font-semibold uppercase">
                  آئٹمز
                </span>
                <button
                  type="button"
                  onClick={addLine}
                  className="text-xs text-emerald-600 hover:text-emerald-500 border border-gray-300 rounded px-2 py-1"
                >
                  + آئٹم شامل کریں
                </button>
              </div>
              {!itemForm.to_store_id ? (
                <div className="text-gray-400 text-xs text-center py-6 border border-dashed border-gray-300 rounded-lg">
                  {pageType === "subStore" ? "دستیاب اشیاء دیکھنے کے لیے پہلے مرکزی اسٹور کا انتخاب کریں" : "دستیاب اشیاء دیکھنے کے لیے پہلے سورس کا انتخاب کریں"}
                </div>
              ) : (
                <div className="space-y-3">
                  {itemForm.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-gray-50 rounded-lg p-3 border border-gray-200"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">
                            آئٹم {idx + 1}
                          </span>
                          <DuplicateBadge itemNo={item.item_no} />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeLine(idx)}
                          disabled={itemForm.items.length === 1}
                          className="text-red-400 hover:text-red-500 disabled:opacity-30 text-lg font-bold leading-none"
                        >
                          ×
                        </button>
                      </div>

                      {/* Search */}
                      <div className="mb-3">
                        <label className="text-gray-500 text-xs mb-1 block">
                          کیٹلاگ سے منتخب کریں ({usableItems.length} آئٹم دستیاب ہے)
                        </label>
                        <div className="relative mt-1.5">
                          <input
                            value={item.item_search}
                            onChange={(e) => {
                              updateLine(idx, "item_search", e.target.value);
                              updateLine(idx, "_showDropdown", true);
                            }}
                            onFocus={() =>
                              updateLine(idx, "_showDropdown", true)
                            }
                            onBlur={() =>
                              setTimeout(
                                () => updateLine(idx, "_showDropdown", false),
                                150,
                              )
                            }
                            placeholder="...آئٹم کے نام یا نمبر سے تلاش کریں"
                            className={`w-full bg-white border border-gray-300 rounded px-2 py-1.5 text-gray-800 text-sm focus:outline-none focus:border-emerald-500 ${itemsLoading ? "pl-6" : ""}`}
                          />
                          {itemsLoading && (
                            <div className="flex justify-center absolute top-1/3 left-1">
                              <div className="w-4 h-4 border-2 border-gray-200 border-t-emerald-500 rounded-full animate-spin" />
                            </div>
                          )}
                          {item._showDropdown && (
                            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                              {usableItems
                                .filter((si) => {
                                  const q = (
                                    item.item_search || ""
                                  ).toLowerCase();
                                  return (
                                    !q ||
                                    si.item_no.toLowerCase().includes(q) ||
                                    si.item_name.toLowerCase().includes(q)
                                  );
                                })
                                .map((si) => (
                                  <div
                                    key={si.item_id}
                                    onMouseDown={() => {
                                      updateLine(
                                        idx,
                                        "selected_item_no",
                                        si.item_no,
                                      );
                                      updateLine(
                                        idx,
                                        "item_search",
                                        `${si.item_no} — ${si.item_name} ( ${si.item_name_urdu} )`,
                                      );
                                      updateLine(idx, "_showDropdown", false);
                                    }}
                                    className={`px-3 py-2 cursor-pointer hover:bg-emerald-50 border-t border-gray-100 flex items-center justify-between ${item.selected_item_no === si.item_no ? "bg-emerald-50" : ""}`}
                                  >
                                    <div className="flex items-center">
                                      <div>
                                        <span className="font-mono text-emerald-600 text-xs font-bold">
                                          {si.item_no}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-gray-700 text-xs ml-2">
                                          {si.item_name}
                                        </span>
                                        <span className="text-gray-700 text-xs ml-2">{"("}</span>
                                        <span className="text-gray-700 text-xs ml-2">
                                          {si.item_name_urdu}
                                        </span>
                                        <span className="text-gray-700 text-xs ml-2">{")"}</span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex-1 h-px bg-gray-200" />
                        <span className="text-gray-400 text-xs">
                          آئٹم کی تفصیلات
                        </span>
                        <div className="flex-1 h-px bg-gray-200" />
                      </div>

                      <div className="grid grid-cols-12 gap-2">
                        <div className="col-span-3">
                          <label className="text-[10px] text-gray-400 uppercase font-bold mb-1 block">
                            اشیاء نمبر
                          </label>
                          <input
                            value={item.item_no}
                            readOnly
                            className="w-full bg-white border border-gray-200 rounded px-2 py-1 text-sm outline-none"
                          />
                        </div>
                        <div className="col-span-5 relative">
                          <label className="text-[10px] text-gray-400 uppercase font-bold mb-1 block">
                            نام
                          </label>
                          <input
                            value={item.item_name && `${item.item_name} ( ${item.item_name_urdu ?? ""} )`}
                            readOnly
                            className="w-full bg-white border border-gray-200 rounded px-2 py-1 text-sm outline-none"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="text-[10px] text-gray-400 uppercase font-bold mb-1 block">
                            اکائی
                          </label>
                          <input
                            value={item.item_uom}
                            readOnly
                            className="w-full bg-white border border-gray-200 rounded px-2 py-1 text-sm outline-none"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="text-[10px] uppercase font-bold mb-1 block text-emerald-600">
                            مقدار
                          </label>
                          <input
                            type="number"
                            min={1}
                            value={item.requested_qty}
                            onChange={(e) =>
                              updateLine(
                                idx,
                                "requested_qty",
                                parseFloat(e.target.value) || 0,
                              )
                            }
                            className="w-full bg-emerald-50 border border-emerald-200 rounded px-2 py-1 text-sm outline-none focus:border-emerald-500 font-bold text-emerald-700"
                          />
                        </div>
                      </div>
                      <div className="mt-3">
                        <label className="text-[10px] text-gray-400 uppercase font-bold mb-1 block">
                          تصاویر شامل کریں (اختیاری)
                        </label>

                        <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-white hover:bg-gray-100 hover:border-gray-400 transition-colors group">
                          <div className="flex flex-col items-center justify-center pt-3 pb-3">
                            <svg
                              className="w-6 h-6 mb-1 text-gray-400 group-hover:text-gray-500 transition-colors"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 002-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className="text-xs text-gray-500 font-medium">
                              تصویر منتخب کرنے کے لیے یہاں کلک کریں
                            </p>
                            <p className="text-[10px] text-gray-400 mt-0.5">
                              (زیادہ سے زیادہ 1 تصاویر)
                            </p>
                          </div>

                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={(e) => {
                              const files = Array.from(e.target.files);

                              const currentImages = itemForm.items[idx].images || [];

                              const newFiles = files.filter(
                                (file) =>
                                  !currentImages.some(
                                    (img) =>
                                      img.name === file.name &&
                                      img.size === file.size &&
                                      img.lastModified === file.lastModified
                                  )
                              );

                              const total = currentImages.length + newFiles.length;

                              if (total > 1) {
                                showToast("ہر آئٹم کے لیے صرف ایک تصویر کی اجازت ہے۔", "warn");
                                e.target.value = null;
                                return;
                              }

                              setItemForm((f) => {
                                const updatedItems = [...f.items];
                                updatedItems[idx].images = [...currentImages, ...newFiles];

                                return {
                                  ...f,
                                  items: updatedItems
                                };
                              });

                              e.target.value = null;
                            }}
                            className="hidden"
                          />
                        </label>
                        {item.images && item.images.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {item.images.map((img, imgIdx) => (
                              <div key={imgIdx} className="relative">
                                <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                                  {img.name}
                                </span>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setItemForm((f) => {
                                      const updatedItems = [...f.items];
                                      updatedItems[idx].images =
                                        updatedItems[idx].images.filter((_, i) => i !== imgIdx);

                                      return {
                                        ...f,
                                        items: updatedItems
                                      };
                                    });
                                  }}
                                  className="ml-1 text-red-500"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Elegant File Count Badge */}
                        {item.images?.length > 0 && (
                          <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded w-fit font-medium">
                            <span>{item.images.length} تصویر منتخب کر لی گئی ہے</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  <div>
                    <label className="text-gray-400 text-xs mt-3 font-semibold uppercase tracking-wider block mb-1">ہدایت یا نوٹس</label>
                    <textarea value={itemForm.notes} onChange={(e) => setItemForm((f) => ({ ...f, notes: e.target.value }))} rows={2} placeholder="اختیاری وجہ یا نوٹ" className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-800 text-sm focus:outline-none focus:border-emerald-500 resize-none" />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              Non-Consumalbe items TAB
          ══════════════════════════════════════════════════════════ */}
          {activeTab === "assets" && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-500 text-xs font-semibold uppercase">
                  آئٹمز
                </span>
                <button
                  type="button"
                  onClick={addLine}
                  className="text-xs text-emerald-600 hover:text-emerald-500 border border-gray-300 rounded px-2 py-1"
                >
                  + آئٹم شامل کریں
                </button>
              </div>
              {!itemForm.to_store_id ? (
                <div className="text-gray-400 text-xs text-center py-6 border border-dashed border-gray-300 rounded-lg">دستیاب اشیاء دیکھنے کے لیے پہلے مرکزی اسٹور کا انتخاب کریں</div>
              ) : (
                <div className="space-y-3">
                  {itemForm.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-gray-50 rounded-lg p-3 border border-gray-200"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">
                            آئٹم {idx + 1}
                          </span>
                          <DuplicateBadge itemNo={item.item_no} />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeLine(idx)}
                          disabled={itemForm.items.length === 1}
                          className="text-red-400 hover:text-red-500 disabled:opacity-30 text-lg font-bold leading-none"
                        >
                          ×
                        </button>
                      </div>

                      {/* Search */}
                      <div className="mb-3">
                        <label className="text-gray-500 text-xs mb-1 block">
                          کیٹلاگ سے منتخب کریں ({reusableItems.length} آئٹم
                          دستیاب ہے)
                        </label>
                        <div className="relative mt-1.5">
                          <input
                            value={item.item_search}
                            onChange={(e) => {
                              updateLine(idx, "item_search", e.target.value);
                              updateLine(idx, "_showDropdown", true);
                            }}
                            onFocus={() =>
                              updateLine(idx, "_showDropdown", true)
                            }
                            onBlur={() =>
                              setTimeout(
                                () => updateLine(idx, "_showDropdown", false),
                                150,
                              )
                            }
                            placeholder="...آئٹم کے نام یا نمبر سے تلاش کریں"
                            className={`w-full bg-white border border-gray-300 rounded px-2 py-1.5 text-gray-800 text-sm focus:outline-none focus:border-emerald-500 ${itemsLoading ? "pl-6" : ""}`}
                          />
                          {itemsLoading && (
                            <div className="flex justify-center absolute top-1/3 left-1">
                              <div className="w-4 h-4 border-2 border-gray-200 border-t-emerald-500 rounded-full animate-spin" />
                            </div>
                          )}
                          {item._showDropdown && (
                            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                              {reusableItems
                                .filter((si) => {
                                  const q = (
                                    item.item_search || ""
                                  ).toLowerCase();
                                  return (
                                    !q ||
                                    si.item_no.toLowerCase().includes(q) ||
                                    si.item_name.toLowerCase().includes(q)
                                  );
                                })
                                .map((si) => (
                                  <div
                                    key={si.item_id}
                                    onMouseDown={() => {
                                      updateLine(
                                        idx,
                                        "selected_item_no",
                                        si.item_no,
                                      );
                                      updateLine(
                                        idx,
                                        "item_search",
                                        `${si.item_no} — ${si.item_name}`,
                                      );
                                      updateLine(idx, "_showDropdown", false);
                                    }}
                                    className={`px-3 py-2 cursor-pointer hover:bg-emerald-50 border-t border-gray-100 flex items-center justify-between ${item.selected_item_no === si.item_no ? "bg-emerald-50" : ""}`}
                                  >
                                    <div>
                                      <span className="font-mono text-emerald-600 text-xs font-bold">
                                        {si.item_no}
                                      </span>
                                      <span className="text-gray-700 text-xs ml-2">
                                        {si.item_name}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex-1 h-px bg-gray-200" />
                        <span className="text-gray-400 text-xs">
                          آئٹم کی تفصیلات
                        </span>
                        <div className="flex-1 h-px bg-gray-200" />
                      </div>

                      <div className="grid grid-cols-12 gap-2">
                        <div className="col-span-3">
                          <label className="text-[10px] text-gray-400 uppercase font-bold mb-1 block">
                            اشیاء نمبر
                          </label>
                          <input
                            value={item.item_no}
                            readOnly
                            className="w-full bg-white border border-gray-200 rounded px-2 py-1 text-sm outline-none"
                          />
                        </div>
                        <div className="col-span-5">
                          <label className="text-[10px] text-gray-400 uppercase font-bold mb-1 block">
                            نام
                          </label>
                          <input
                            value={item.item_name}
                            readOnly
                            className="w-full bg-white border border-gray-200 rounded px-2 py-1 text-sm outline-none"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="text-[10px] uppercase font-bold mb-1 block text-emerald-600">
                            مقدار
                          </label>
                          <input
                            type="number"
                            min={1}
                            value={item.requested_qty}
                            onChange={(e) =>
                              updateLine(
                                idx,
                                "requested_qty",
                                parseFloat(e.target.value) || 0,
                              )
                            }
                            className="w-full bg-emerald-50 border border-emerald-200 rounded px-2 py-1 text-sm outline-none focus:border-emerald-500 font-bold text-emerald-700"
                          />
                        </div>
                      </div>
                      <div className="mt-3">
                        <label className="text-[10px] text-gray-400 uppercase font-bold mb-1 block">
                          تصاویر شامل کریں (اختیاری)
                        </label>

                        <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-white hover:bg-gray-100 hover:border-gray-400 transition-colors group">
                          <div className="flex flex-col items-center justify-center pt-3 pb-3">
                            <svg
                              className="w-6 h-6 mb-1 text-gray-400 group-hover:text-gray-500 transition-colors"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 002-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className="text-xs text-gray-500 font-medium">
                              تصویر منتخب کرنے کے لیے یہاں کلک کریں
                            </p>
                            <p className="text-[10px] text-gray-400 mt-0.5">
                              (زیادہ سے زیادہ 1 تصاویر)
                            </p>
                          </div>

                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={(e) => {
                              const files = Array.from(e.target.files);

                              const currentImages = itemForm.items[idx].images || [];

                              const newFiles = files.filter(
                                (file) =>
                                  !currentImages.some(
                                    (img) =>
                                      img.name === file.name &&
                                      img.size === file.size &&
                                      img.lastModified === file.lastModified
                                  )
                              );

                              const total = currentImages.length + newFiles.length;
                              if (total > 1) {
                                showToast("ہر آئٹم کے لیے صرف ایک تصویر کی اجازت ہے۔", "warn");
                                e.target.value = null;
                                return;
                              }

                              setItemForm((f) => {
                                const updatedItems = [...f.items];
                                updatedItems[idx].images = [...currentImages, ...newFiles];

                                return {
                                  ...f,
                                  items: updatedItems
                                };
                              });

                              e.target.value = null;
                            }}
                            className="hidden"
                          />
                        </label>
                        {item.images && item.images.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {item.images.map((img, imgIdx) => (
                              <div key={imgIdx} className="relative">
                                <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                                  {img.name}
                                </span>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setItemForm((f) => {
                                      const updatedItems = [...f.items];
                                      updatedItems[idx].images =
                                        updatedItems[idx].images.filter((_, i) => i !== imgIdx);

                                      return {
                                        ...f,
                                        items: updatedItems
                                      };
                                    });
                                  }}
                                  className="ml-1 text-red-500"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Elegant File Count Badge */}
                        {item.images?.length > 0 && (
                          <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded w-fit font-medium">
                            <span>{item.images.length} تصویر منتخب کر لی گئی ہے</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  <div>
                    <label className="text-gray-400 text-xs mt-3 font-semibold uppercase tracking-wider block mb-1">ہدایت یا نوٹس</label>
                    <textarea value={itemForm.notes} onChange={(e) => setItemForm((f) => ({ ...f, notes: e.target.value }))} rows={2} placeholder="اختیاری وجہ یا نوٹ" className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-800 text-sm focus:outline-none focus:border-emerald-500 resize-none" />
                  </div>
                </div>
              )}
            </div>
          )}
          <div className="pt-4 flex items-center justify-between gap-3 border-t border-gray-100">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              {itemForm.items?.length > 0 && <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-2 py-0.5 rounded">{itemForm.items.length} آئٹم{itemForm.items.length > 1 ? "s" : ""}</span>}
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  onClose()
                  setItemForm({ ...EMPTY_FORM })
                }}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold px-4 py-2 rounded"
              >
                منسوخ کریں
              </button>
              <button
                type="submit"
                disabled={creating || !itemForm.to_store_id}
                className={`text-white text-sm font-bold px-8 py-2 rounded-lg transition-all disabled:opacity-50
                  ${itemForm.is_emergency ? "bg-red-600 hover:bg-red-500" : "bg-emerald-600 hover:bg-emerald-500"}`}
              >
                {creating
                  ? "جمع کیا جا رہا ہے..."
                  : itemForm.is_emergency
                    ? "ہنگامی درخواست جمع کرائیں"
                    : "درخواست جمع کرائیں"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}