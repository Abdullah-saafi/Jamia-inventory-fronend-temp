const TableHead = ({ pageType }) => {
  const headerMap = {
    subStore: [
      "درخواست نمبر",
      "نوع",
      "درخواست کنندہ",
      "درخواست کی تاریخ",
      "حالت",
      "منظوری کی تاریخ",
      "تکمیل کی تاریخ",
      "عملیات",
    ],
    subStoreManager: [
      "درخواست نمبر",
      "نوع",
      "درخواست کنندہ",
      "درخواست کی تاریخ",
      "حالت",
      "منظوری کی تاریخ",
      "تکمیل کی تاریخ",
      "عملیات",
    ],
    mainSubStoreReqs: [
      "درخواست نمبر",
      "اسٹور سے",
      " مرکزی اسٹور کو",
      "درخواست کنندہ",
      "منظور کنندہ",
      "مکمل کرنے والا",
      "درخواست کی تاریخ",
      "تکمیل کی تاریخ",
      "حالت",
      "عملیات",
    ]
  }
  const headers = headerMap[pageType] || []
  return (
    <>
      <tr className="bg-gray-50 border-b border-gray-200">
        {headers.map((h) => (
          <th
            key={h}
            className="text-left px-4 py-3 text-gray-500 font-semibold text-xs uppercase tracking-wider"
          >
            {h}
          </th>
        ))}
      </tr>
    </>
  )
}

export default TableHead