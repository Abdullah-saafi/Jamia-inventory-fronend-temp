const TableHead = () => {
    return (
        <>
            <tr className="bg-gray-50 border-b border-gray-200">
              {[
                "درخواست نمبر",
                "نوع",
                "درخواست کنندہ",
                "درخواست کی تاریخ",
                "حالت",
                "منظوری کی تاریخ",
                "تکمیل کی تاریخ",
                // "اسکریپ مقدار",
                "عملیات",
              ].map((h) => (
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