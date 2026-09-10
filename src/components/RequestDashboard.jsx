import StatusCard from "./StatusCard"
const RequestDashboard = ({
  counts,
  setFilterStatus,
  setFilterStatusForSubStore,
  filterStatus,
  pageType,
  isEmergency,
  setIsEmergency,
  setPage,
}) => {

  const handleFilter = (status) => {
    setPage(1)
    setFilterStatus((prev) => prev === status ? "" : status);
    pageType === "subStore" ? setFilterStatusForSubStore((prev) => prev === status ? "" : status) : null
  };

  return (
    <div className="flex flex-wrap gap-5 mb-6 justify-evenly">
      {/* Fulfill Card */}
      {(pageType === "subStore" || pageType === "mainReqToHO") && (
        <StatusCard
          title="منظوری کی منتظر"
          count={counts.pending}
          colorClass="bg-blue-500"
          isActive={filterStatus === "FULFILLED"}
          onClick={() => handleFilter("FULFILLED")}
        />
      )}


      {/* Pending Card */}
      {(pageType === "subStoreManager" || pageType === "mainStoreApprover") && (
        <StatusCard
          title="منظوری کی منتظر"
          count={counts.pending}
          colorClass="bg-blue-500"
          isActive={filterStatus === "PENDING"}
          onClick={() => handleFilter("PENDING")}
        />
      )}


      {/* Approved Card */}

      {(pageType === "mainSubStoreReqs" || pageType === "headOffice" || pageType === "pettyCash") && (
        <StatusCard
          title="منظور شدہ"
          count={counts.pending}
          colorClass="bg-blue-500"
          isActive={filterStatus === "APPROVED"}
          onClick={() => handleFilter("APPROVED")}
        />
      )}

      {/* Disputed Card */}
      {(pageType === "mainSubStoreReqs" || pageType === "headOffice" || pageType === "pettyCash") && (
        <StatusCard
          title="متنازع درخواستیں"
          count={counts.disputed}
          colorClass="bg-orange-500"
          isActive={filterStatus === "DISPUTED"}
          onClick={() => handleFilter("DISPUTED")}
        />
      )}
      {/* Emergency Card */}
      {(pageType === "mainReqToHO" || pageType === "headOffice" || pageType === "pettyCash" || pageType === "mainStoreApprover") && (
        <StatusCard
          title="ہنگامی درخواستیں"
          count={counts.emergency}
          colorClass="bg-red-500"
          isActive={isEmergency}
          onClick={() => {
            setPage(1);
            setIsEmergency((prev) => !prev);
          }}
        />
      )}
    </div>
  );
};

export default RequestDashboard