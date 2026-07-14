import CheckLoadingAndError from "./CheckLoadingAndError";
import CreateRequestModal from "./CreateRequestModal";
import GRNModal from "./GRNModal";
import Pagination from "./Pagination";
import RequestDashboard from "./RequestDashboard";
import RequestRow from "./RequestRow";
import ReturnModal from "./ReturnModal";
import StoreFilters from "./StoreFilters";
import TableHead from "./TableHead";


const NewRequestList = () => {
    return (
        <div>
            <RequestDashboard
                pageType={pageType}
                setFilterStatus={setFilterStatus}
                filterStatus={filterStatus}
                counts={{
                    pending: pendingGRN,
                    returnBack: 0,
                    emergency: 0,
                    disputed: 0,
                }}
                setPage={setPage}

            />
            {/* ── Filters ── */}
            <div className="flex py-2 items-end justify-between">
                <div className="Filter">
                    <div className="flex gap-2">
                        <input
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                            placeholder="مکمل ریکویسٹ نمبر یا آخری 4 نمبر سے تلاش کریں..."
                            title="مکمل ریکویسٹ نمبر یا آخری 4 نمبر سے تلاش کریں..."
                            className="bg-white border leading-none border-gray-300 rounded px-3 h-7.5 text-gray-800 text-sm focus:outline-none focus:border-emerald-500 w-52 shadow-sm"
                        />
                        <StoreFilters
                            filterStatus={filterStatus}
                            setFilterStatus={(v) => {
                                setFilterStatus(v);
                                setPage(1);
                            }}
                            pageType={pageType}
                            filterStore={filterStore}
                            setFilterStore={(v) => {
                                setFilterStore(v);
                                setPage(1);
                            }}
                            role={auth.role}
                            subStores={subStores}
                            loading={pageLoading}
                        />
                        {(search || filterStatus) && (
                            <button
                                onClick={() => {
                                    setSearch("");
                                    setFilterStatus("");
                                    setPage(1);
                                    setDebouncedSearch("")
                                }}
                                className="text-gray-500 hover:text-gray-800 text-sm px-3 h-7.5 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                            >
                                Clear
                            </button>
                        )}
                    </div>
                    <button
                        onClick={() => {
                            load();
                            fetchStoreData();
                            setPage(1);
                        }}
                        className="text-gray-500 hover:text-gray-800 text-sm px-3 py-2 border border-gray-300 rounded ml-auto hover:bg-gray-50 shadow-sm"
                    >
                        ↻ Refresh
                    </button>
                </div>

                <div className="Temp-downloader flex justify-center items-center gap-4">
                    <div className="">
                        <ExcelDownloaderWithDates
                            data={requests}
                            dateKey="created_at"
                            fileName={auth.username}
                            columns={[
                                { key: "request_no", label: "درخواست نمبر", format: (v) => (v ? v : "—") },
                                { key: "item_type", label: "نوع", format: (v) => (v ? v : "—") },
                                { key: "requested_by_name", label: "درخواست کنندہ", format: (v) => (v ? v : "—") },
                                { key: "created_at", label: "درخواست کی تاریخ", format: (v) => (v ? new Date(v).toLocaleDateString() : "—"), },
                                { key: "approved_at", label: "منظوری کی تاریخ", format: (v) => (v ? new Date(v).toLocaleDateString() : "—"), },
                                { key: "fulfilled_at", label: "تکمیل کی تاریخ", format: (v) => (v ? new Date(v).toLocaleDateString() : "—"), },
                                { key: "status", label: "حالت", format: (v) => (v ? v : "—") },
                            ]}
                            pageLoading={pageLoading}
                        />
                    </div>
                </div>
            </div>
            {/* ── Table ── */}
            <div className="overflow-x-auto text-center rounded-lg border border-gray-200 shadow-sm">
                <table className="w-full text-sm">
                    <thead>
                        <TableHead pageType={pageType} />
                    </thead>
                    <tbody>
                        {pageLoading || error || requests.length === 0 ? (
                            <CheckLoadingAndError
                                loading={pageLoading}
                                error={error}
                                requests={requests}
                            />
                        ) : (
                            requests.map((r) => (
                                <RequestRow
                                    key={r.request_id}
                                    r={r}
                                    detail={detail}
                                    detailLoad={detailLoad}
                                    openDetail={openDetail}
                                    openGRN={openGRN}
                                    grnLoading={grnLoading}
                                    pageType={pageType}
                                    returnModalLoading={returnModalLoading}
                                />
                            ))
                        )}
                    </tbody>
                </table>

                <Pagination
                    currentPage={pagination.currentPage}
                    totalItems={pagination.totalItems}
                    pageSize={pagination.pageLimit}
                    onPageChange={setPage}
                    pageSizeOptions={[10, 25, 50]}
                    onPageSizeChange={(s) => {
                        setPageSize(s);
                        setPage(1);
                    }}
                />
            </div>
            {/* GRN Modal */}
            {grnRequest && (
                <GRNModal
                    request={grnRequest}
                    onClose={() => setGrnRequest(null)}
                    onSubmit={handleGRNSubmit}
                    submitting={grnSubmitting}
                    showToast={showToast}
                />
            )}
            {/* Create Modal */}
            {showCreate && (
                <CreateRequestModal
                    itemForm={itemForm}
                    setCreating={setCreating}
                    setItemForm={setItemForm}
                    mainStores={mainStores}
                    storeItems={storeItems}
                    reusableItems={reusableItems}
                    usableItems={usableItems}
                    onClose={() => setShowCreate(false)}
                    onSubmit={handleCreate}
                    addLine={addLine}
                    removeLine={removeLine}
                    updateLine={updateLine}
                    creating={creating}
                    EMPTY_FORM={EMPTY_FORM}
                    pageType={pageType}
                    showToast={showToast}
                />
            )}
            {returnBackModal && (
                <ReturnModal
                    setReturnBackModal={setReturnBackModal}
                    setReturnBackItems={setReturnBackItems}
                    returnBackItems={returnBackItems}
                    returnBackNote={returnBackNote}
                    setReturnBackNote={setReturnBackNote}
                    handleReturnBack={handleReturnBack}
                    returnBackSubmitting={returnBackSubmitting}
                />
            )}
        </div>
    )
}

export default NewRequestList