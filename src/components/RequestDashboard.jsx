import StatusCard from "./StatusCard"
const RequestDashboard = ({
  counts,
  setFilterStatus,
  filterStatus,
  pageType,
  data
}) => {

  const isEmergent = data?.filter((r) => {
   r.is_emergency;
  }).length
  const handleFilter = (status) => {
    setFilterStatus(status);
  };

  return (
    <div className="flex flex-wrap gap-4 mb-6 justify-evenly">
      {/* Pending / Fulfill Card */}
      {(pageType === "subStore" || pageType === "subStoreManager" || pageType === "mainReqToHO") && (
        <StatusCard
          title="منظوری کی منتظر"
          count={counts.pending}
          colorClass="bg-blue-500"
          isActive={filterStatus === (pageType === ("subStore" || "mainReqToHO") ? "FULFILLED" : "PENDING")}
          onClick={() => handleFilter(pageType === ("subStore" || "mainReqToHO") ? "FULFILLED" : "PENDING")}
        />
      )}

      {/* Emergency Card */}
      {/* {pageType === "mainSubStoreReqs" && (
        <StatusCard
          title="ہنگامی درخواستیں"
          count={counts.emergency}
          colorClass="bg-red-500"
          isActive={filterStatus === "APPROVED" || isEmergent > 0}
          onClick={() => handleFilter("APPROVED")}
        />
      )} */}

      {/* Approved Card */}

      {pageType === "mainSubStoreReqs" && (
        <StatusCard
          title="منظور شدہ"
          count={counts.pending}
          colorClass="bg-red-500"
          isActive={filterStatus === "APPROVED"}
          onClick={() => handleFilter("APPROVED")}
        />
      )}

      {/* Disputed Card */}
      {pageType === "mainSubStoreReqs" && (
        <StatusCard
          title="متنازع درخواستیں"
          count={counts.disputed}
          colorClass="bg-orange-500"
          isActive={filterStatus === "DISPUTED"}
          onClick={() => handleFilter("DISPUTED")}
        />
      )}

      {/* Return Card */}
      {pageType === "subStore" && (
        <StatusCard
        title="واپسی کی منتظر"
        count={counts.returnBack}
        colorClass="bg-amber-500"
        isActive={filterStatus === (pageType === "mainSubStoreReqs" ? "RETURN_BACK" : "RECEIVED")}
        onClick={() => handleFilter(pageType === "mainSubStoreReqs" ? "RETURN_BACK" : "RECEIVED")}
      />)}
    </div>
  );
};

export default RequestDashboard