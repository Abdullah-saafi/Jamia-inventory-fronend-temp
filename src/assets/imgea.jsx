import React from 'react'

const imgea = () => {
  return (
    <div>
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
  )
}

export default imgea