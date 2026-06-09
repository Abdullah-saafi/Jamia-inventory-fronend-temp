const BlockedUI = ({ message }) => (
    <div className="min-h-[70vh] flex items-center justify-center p-6 animate-in fade-in zoom-in duration-300">
        <div className="max-w-md w-full bg-white border border-red-100 p-8 rounded-2xl text-center shadow-xl">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0-8V7m0 0a2 2 0 100-4 2 2 0 000 4zm-4 12h8a2 2 0 002-2v-3a2 2 0 10-4 0v-1a2 2 0 00-2-2H8a2 2 0 00-2 2v1a2 2 0 10-4 0v3a2 2 0 002 2z" />
                </svg>
            </div>
            <h2 className="text-gray-900 text-xl font-black uppercase tracking-tight mb-2">رسائی ممنوع ہے</h2>
            <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                {message || "آپ کا اکاؤنٹ فی الحال غیر فعال ہے۔ رسائی دوبارہ حاصل کرنے کے لیے براہ کرم اپنے ایڈمنسٹریٹر سے رابطہ کریں۔"}
            </p>
            {/* <button 
                onClick={() => window.location.href = "/"} 
                className="w-full bg-gray-900 text-white px-6 py-3 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-gray-800 transition-all shadow-lg shadow-gray-200"
            >
                Return to Dashboard
            </button> */}
        </div>
    </div>
);
export default BlockedUI;