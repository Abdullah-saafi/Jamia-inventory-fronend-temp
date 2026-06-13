export const ROLE_STORE_MAP = {
  "sub-store": "SUB_STORE",
  "sub-store-manager": "SUB_STORE",
  "main-store": "MAIN_STORE",
  "main-store-manager": "MAIN_STORE",
  headoffice: "HEAD_OFFICE",
  pettycash: "pettycash"
}

export const ROLES = [
  { value: "sub-store", label: "اسٹور" },
  { value: "sub-store-manager", label: "اسٹور نگران" },
  { value: "main-store", label: "مرکزی اسٹور" },
  { value: "main-store-manager", label: "مرکزی اسٹور نگران" },
  { value: "headoffice", label: "مرکزی دفتر" },
  { value: "pettycash", label: "پٹی کیش" },
  { value: "admin", label: "انتظامی دفتر" },
]

export const ROLE_LABELS = {
  "sub-store": "اسٹور",
  "sub-store-manager": "اسٹور نگران",
  "main-store": "مرکزی اسٹور",
  "main-store-manager": "مرکزی اسٹور نگران",
  headoffice: "مرکزی دفتر",
  "pettycash": "پٹی کیش",
  admin: "انتظامی دفتر",
  "super admin": "سپر ایڈمن",
}

export const TABS = [
  { id: "user", label: "نمائندہ شامل کریں" },
  { id: "store", label: "اسٹورز شامل کریں" },
  { id: "all-users", label: "تمام نمائندے" },
  { id: "all-stores", label: "تمام اسٹورز" },
  { id: "items-and-categories", label: " آئٹم اور کیٹیگری شامل کریں" }
]

export const STORE_TYPE_LABELS = {
  MAIN_STORE: "مرکزی اسٹور",
  SUB_STORE: "اسٹور",
  HEAD_OFFICE: "مرکزی دفتر",
  pettycash: "پٹی کیش",
}

export const STORES = [
  {value: "MAIN_STORE", label: "مرکزی اسٹور"},
  {value: "SUB_STORE", label: "اسٹور"},
  {value: "HEAD_OFFICE", label: "مرکزی دفتر"},
  {value: "PETTY_CASH", label: "پٹی کیش"},
]

export const RETURN_STATUSES = [
  { value: "PENDING", label: "زیر التواء" },
  { value: "ADDED_TO_STOCK", label: "اسٹاک میں شامل کر دیا گیا" },
  { value: "SCRAPPED", label: "اسکریپ کر دیا گیا" },
  { value: "SCRAPPED_AND_STOCKED", label: "اسکریپ شدہ اور اسٹاک میں محفوظ" }
];
export const ITEM_CONDITIONS = [
  { value: "USABLE", label: "استعمال ہونے والی اشیاء" },
  { value: "REUSABLE", label: " دوبارہ استعمال ہونے والی اشیاء" },
]              

export const inputClass =
  "w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-800 text-sm focus:outline-none focus:border-emerald-500 placeholder-gray-400";

export const labelClass =
  "text-gray-500 text-xs font-semibold uppercase tracking-wider block mb-1";