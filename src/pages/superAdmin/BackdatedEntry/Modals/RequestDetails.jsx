import { useState, useEffect } from "react";
import { FiChevronLeft, FiCheck, FiX } from "react-icons/fi";
import { ArrowLeft, CircleX} from "lucide-react";
import dayjs from "dayjs";
import RejectModal from "./RejectModal";
 
export default function RequestDetails({
  request,
  onBack,
  onProcessed,
  getBackdatedRequestDetails,
  processBackdatedRequest
}) {
  const [loading, setLoading] = useState(true);
  const [details, setDetails] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [processing, setProcessing] = useState(false);
 
  useEffect(() => {
    fetchDetails();
  }, [request.RequestID]);
 
  const fetchDetails = async () => {
    setLoading(true);
    try {
      const response = await getBackdatedRequestDetails(request.RequestID);
      if (response?.success) {
        setDetails(response.data);
      }
    } catch (error) {
      console.error("Error fetching request details:", error);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to format dates for API
const formatDateForAPI = (date) => {
  if (!date) return null;
  // If already in YYYY-MM-DD format, return as is
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return date;
  }
  // Convert to YYYY-MM-DD format
  return dayjs(date).format('YYYY-MM-DD');
};
 
const handleApprove = async () => {
  setProcessing(true);
  try {
    // Get the raw data
    const rawData = details.requestDetails?.raw_data || {};
    
    // Create payload with formatted dates
    let approvalPayload = {};
    
    if (details.requestType === 'Backdated_Modify' || details.requestType === 'Backdated_MODIFY') {
      const modifications = rawData.modifications || {};
      approvalPayload = {
        selectedDate: formatDateForAPI(rawData.selectedDate),
        followUpDate: formatDateForAPI(modifications.followUpDate),
        ...modifications
      };
    } 
    else if (details.requestType === 'Backdated_Create' || details.requestType === 'Backdated_CREATE') {
      approvalPayload = {
        selectedDate: formatDateForAPI(rawData.selectedDate),
        followUpDate: formatDateForAPI(rawData.caseData?.followUpDate),
        ...rawData.caseData
      };
    }
    
    // Remove undefined values
    Object.keys(approvalPayload).forEach(key => {
      if (approvalPayload[key] === undefined) delete approvalPayload[key];
    });
    
    // Pass the formatted payload as the third parameter
    const response = await processBackdatedRequest(
      request.RequestID, 
      'APPROVED', 
      approvalPayload  // Add this as third parameter
    );
    
    if (response?.success) {
      setDetails(prev => ({ ...prev, status: "APPROVED" }));
      if (onProcessed) onProcessed();
    } else {
      alert(response?.message || "Failed to approve request");
    }
  } catch (error) {
    console.error("Error approving request:", error);
    alert("An error occurred while approving the request");
  } finally {
    setProcessing(false);
  }
};
 
  const handleReject = async (remarks) => {
    setProcessing(true);
    try {
      const response = await processBackdatedRequest(request.RequestID, 'REJECTED', remarks);
      if (response?.success) {
        alert("Request rejected successfully!");
        setShowRejectModal(false);
        onProcessed();
      } else {
        alert(response?.message || "Failed to reject request");
      }
    } catch (error) {
      console.error("Error rejecting request:", error);
      alert("An error occurred while rejecting the request");
    } finally {
      setProcessing(false);
    }
  };
 
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F6F8FB]">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
          <p className="text-gray-500 text-sm">Loading request details...</p>
        </div>
      </div>
    );
  }
 
  if (!details) {
    return (
      <div className="min-h-screen bg-[#F6F8FB]">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
          <p className="text-gray-500 text-sm">Failed to load request details</p>
          <button
            onClick={onBack}
            className="mt-4 px-4 py-2 bg-[#D6DEE8] text-[#5F6F81] rounded-lg text-xs font-medium hover:bg-[#C9D3DF]"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Check if approved
  if (details.status === "Approved" || details.status === "APPROVED") {
    return (
      <div className="min-h-screen bg-[#F6F8FB]">
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl shadow-sm">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-6">
            <FiCheck className="w-8 h-8 text-green-600" />
          </div>
 
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Backdated Entry Request Approved!
          </h2>
 
          <p className="text-gray-600 text-xs">
            REFERENCE CASE ID:{" "}
            <span className="font-semibold text-gray-900">
              {details.caseId || details.clientDetails?.CaseID}
            </span>
          </p>
        </div>
      </div>
    );
  }

// Extract data from the nested structure properly
const rawData = details.requestDetails?.raw_data || {};

// For MODIFY requests
const modifications = rawData.modifications || {};
const originalData = rawData.originalData || {};

// For ARCHIVE requests, caseDetails is at the root level
const caseDetails = details.caseDetails || {};

// Determine which data to show based on request type
let displayData = {};

if (details.requestType === 'Backdated_Create' || details.requestType === 'Backdated_CREATE') {
  // For CREATE requests
  displayData = {
    selectedDate: rawData.selectedDate || null,
    intendedUser: rawData.intendedUser || null,
    name: rawData.caseData?.name || 'N/A',
    callType: rawData.caseData?.callType || 'N/A',
    callMode: rawData.caseData?.callMode || 'N/A',
    priority: rawData.caseData?.priority || 'N/A',
    status: rawData.caseData?.status || 'N/A',
    forwardedTo: rawData.caseData?.forwardedTo || 'N/A',
    followUpDate: rawData.caseData?.followUpDate || null,
    remarksBuyer: rawData.caseData?.remarksBuyer || 'No remarks',
    remarksInternal: rawData.caseData?.remarksInternal || 'No remarks',
    requestRemarks: details.RequestRemark || "No remarks",
    poSubtype: rawData.caseData?.poSubtype || null,
    clientName: rawData.caseData?.clientName || 'N/A',
    currentStatus: rawData.caseData?.status || 'N/A' // For archive display if needed
  };
} else if (details.requestType === 'Backdated_Modify' || details.requestType === 'Backdated_MODIFY') {
  // For MODIFY requests - use modifications (the new values)
  displayData = {
    selectedDate: rawData.selectedDate || null,
    intendedUser: rawData.intendedUser || null,
    name: modifications.name || 'N/A',
    callType: modifications.callType || 'N/A',
    callMode: modifications.callMode || 'N/A',
    priority: modifications.priority || 'N/A',
    status: modifications.status || 'N/A',
    forwardedTo: modifications.forwardedTo || 'N/A',
    followUpDate: modifications.followUpDate || null,
    remarksBuyer: modifications.remarksBuyer || 'No remarks',
    remarksInternal: modifications.remarksInternal || 'No remarks',
    requestRemarks: details.RequestRemark || "No remarks",
    poSubtype: modifications.poSubtype || null,
    clientName: details.clientDetails?.ClientName || 'N/A',
    currentStatus: modifications.status || 'N/A' // For archive display if needed
  };
  
  // Log to verify data is being extracted
  console.log('Modifications data:', modifications);
  console.log('Display data:', displayData);
} else if (details.requestType === 'Backdated_Archive' || details.requestType === 'Backdated_ARCHIVE') {
  // For ARCHIVE requests - use caseDetails from root
  displayData = {
    selectedDate: rawData.selectedDate || null,
    intendedUser: rawData.requestedBy || null, // Use requestedBy as intended user
    name: caseDetails.BuyerSupplierName || 'N/A',
    callType: caseDetails.CallType || 'N/A',
    callMode: caseDetails.CallMode || 'N/A',
    priority: caseDetails.Priority || 'N/A',
    status: caseDetails.Status || 'N/A',
    forwardedTo: caseDetails.CurrentOwner || 'N/A',
    followUpDate: caseDetails.FollowUpDate || null,
    remarksBuyer: caseDetails.RemarksBuyerSupplier || 'No remarks',
    remarksInternal: caseDetails.RemarksInternal || 'No remarks',
    requestRemarks: details.RequestRemark || "No remarks",
    poSubtype: caseDetails.PO_subtype || null,
    clientName: caseDetails.ClientName || 'N/A',
    currentStatus: caseDetails.CurrentStatus || 'N/A', // Current status before archive
    caseId: caseDetails.CaseID || details.caseId || 'N/A',
    currentOwner: caseDetails.CurrentOwnerName || 'N/A'
  };
  
  console.log('Archive data:', displayData);
} else {
  // Fallback for other types
  displayData = {
    selectedDate: rawData.selectedDate || null,
    intendedUser: rawData.intendedUser || rawData.requestedBy || null,
    name: caseDetails.BuyerSupplierName || 'N/A',
    callType: caseDetails.CallType || 'N/A',
    callMode: caseDetails.CallMode || 'N/A',
    priority: caseDetails.Priority || 'N/A',
    status: caseDetails.Status || 'N/A',
    forwardedTo: caseDetails.CurrentOwner || 'N/A',
    followUpDate: caseDetails.FollowUpDate || null,
    remarksBuyer: caseDetails.RemarksBuyerSupplier || 'No remarks',
    remarksInternal: caseDetails.RemarksInternal || 'No remarks',
    requestRemarks: details.RequestRemark || "No remarks",
    poSubtype: caseDetails.PO_subtype || null,
    clientName: caseDetails.ClientName || 'N/A',
    currentStatus: caseDetails.CurrentStatus || 'N/A'
  };
}

// Format date for display
const formatDate = (date) => {
  if (!date) return 'N/A';
  return dayjs(date).format('MM/DD/YYYY');
};

// Format date with time if needed
const formatDateTime = (date) => {
  if (!date) return 'N/A';
  return dayjs(date).format('MM/DD/YYYY HH:mm');
};
  return (
    <div className="min-h-screen bg-[#F6F8FB]">
      {/* Container with gap between cards */}
      <div className="flex flex-col gap-6">
        {/* Card 1: Header with Back button and Request ID */}
        <div className=" ">
          <div className="flex items-center gap-4">
            <button
        onClick={onBack}
        className="flex items-center gap-3 px-4 py-2 rounded-2xl border border-[#CFE0F6] bg-white hover:bg-gray-50 text-base font-semibold text-gray-700 transition-all duration-200"
      >
        <ArrowLeft size={22} strokeWidth={2.5} />
        Back
      </button>
            <div>
              <h1 className="text-[24px] font-bold text-gray-800 leading-tight">
                Backdated Entry Requests
              </h1>
              <p className="text-sm text-[#7861E6] font-medium ">
                {details.requestId}
              </p>
            </div>
          </div>
        </div>
 
        {/* Card 2: Form Fields */}
        <div className="bg-[#FFFFFF] rounded-lg shadow-sm p-6">
          {/* Request Info Cards - First row - matching Code A exactly */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div>
              <label className="block text-[12px] font-bold text-[#62748E] mb-2">REQUEST TYPE</label>
              <div className="min-h-[42px] px-3 py-2 rounded-xl border border-gray-300 bg-white flex items-center">
                <p className="text-sm text-gray-700">{details.requestType}</p>
              </div>
            </div>
            <div>
              <label className="block text-[12px] font-bold text-[#62748E] mb-2">ADMIN NAME</label>
              <div className="min-h-[42px] px-3 py-2 rounded-xl border border-gray-300 bg-white flex items-center">
                <p className="text-sm text-gray-700">{details.adminDetails?.name}</p>
              </div>
            </div>
            <div>
              <label className="block text-[12px] font-bold text-[#62748E] mb-2">REQUEST DATE</label>
              <div className="min-h-[42px] px-3 py-2 rounded-xl border border-gray-300 bg-white flex items-center">
                <p className="text-sm text-gray-700">{formatDate(details.createdAt)}</p>
              </div>
            </div>
          </div>
 
          {/* Main form grid - matching Code A exactly */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* DATE */}
            <div>
              <label className="block text-[12px] font-bold text-[#62748E] mb-2">DATE <span className="text-red-600">*</span></label>
              <div className="min-h-[42px] px-3 py-2 rounded-xl border border-gray-300 bg-white flex items-center">
                <p className="text-sm text-gray-700">
                  {displayData.selectedDate ? formatDate(displayData.selectedDate) : 'N/A'}
                </p>
              </div>
            </div>
 
            {/* USER */}
            <div>
              <label className="block text-[12px] font-bold text-[#62748E] mb-2">USER <span className="text-red-600">*</span></label>
              <div className="min-h-[42px] px-3 py-2 rounded-xl border border-gray-300 bg-white flex items-center">
                <p className="text-sm text-gray-700">
                  {typeof displayData.intendedUser === 'object'
                    ? displayData.intendedUser?.emp_name || displayData.intendedUser?.emp_id || 'N/A'
                    : displayData.intendedUser || 'N/A'}
                </p>
              </div>
            </div>
 
            {/* CLIENT */}
            <div>
              <label className="block text-[12px] font-bold text-[#62748E] mb-2">CLIENT <span className="text-red-600">*</span></label>
              <div className="min-h-[42px] px-3 py-2 rounded-xl border border-gray-300 bg-white flex items-center">
                <p className="text-sm text-gray-700">
                  {displayData.clientName || details.clientDetails?.ClientName || 'N/A'}
                </p>
              </div>
            </div>
 
            {/* NAME */}
            <div>
              <label className="block text-[12px] font-bold text-[#62748E] mb-2">NAME (BUYER/SUPPLIER) <span className="text-red-600">*</span></label>
              <div className="min-h-[42px] px-3 py-2 rounded-xl border border-gray-300 bg-white flex items-center">
                <p className="text-sm text-gray-700">{displayData.name}</p>
              </div>
            </div>
 
            {/* CALL TYPE */}
            <div>
              <label className="block text-[12px] font-bold text-[#62748E] mb-2">CALL TYPE <span className="text-red-600">*</span></label>
              <div className="min-h-[42px] px-3 py-2 rounded-xl border border-gray-300 bg-white flex items-center">
                <p className="text-sm text-gray-700">{displayData.callType}</p>
              </div>
            </div>
 
            {/* PO SUBTYPE - Only if call type is PO */}
            {displayData.callType === 'PO' && (
              <div>
                <label className="block text-[12px] font-bold text-[#62748E] mb-2">PO SUBTYPE <span className="text-red-600">*</span></label>
                <div className="min-h-[42px] px-3 py-2 rounded-xl border border-gray-300 bg-white flex items-center">
                  <p className="text-sm text-gray-700">
                    {displayData.poSubtype || 'N/A'}
                  </p>
                </div>
              </div>
            )}
 
            {/* CALL MODE */}
            <div>
              <label className="block text-[12px] font-bold text-[#62748E] mb-2">CALL MODE <span className="text-red-600">*</span></label>
              <div className="min-h-[42px] px-3 py-2 rounded-xl border border-gray-300 bg-white flex items-center">
                <p className="text-sm text-gray-700">{displayData.callMode}</p>
              </div>
            </div>
 
            {/* PRIORITY */}
            <div>
              <label className="block text-[12px] font-bold text-[#62748E] mb-2">PRIORITY <span className="text-red-600">*</span></label>
              <div className="min-h-[42px] px-3 py-2 rounded-xl border border-gray-300 bg-white flex items-center">
                <p className="text-sm text-gray-700">{displayData.priority}</p>
              </div>
            </div>
 
            {/* STATUS */}
            <div>
              <label className="block text-[12px] font-bold text-[#62748E] mb-2">STATUS <span className="text-red-600">*</span></label>
              <div className="min-h-[42px] px-3 py-2 rounded-xl border border-gray-300 bg-white flex items-center">
                <p className="text-sm text-gray-700">{displayData.status}</p>
              </div>
            </div>
 
            {/* FOLLOW-UP DATE - Only if status is Follow_up */}
            {displayData.status === 'Follow_up' && displayData.followUpDate && (
              <div>
                <label className="block text-[12px] font-bold text-[#62748E] mb-2">FOLLOW-UP DATE <span className="text-red-600">*</span></label>
                <div className="min-h-[42px] px-3 py-2 rounded-xl border border-gray-300 bg-white flex items-center">
                  <p className="text-sm text-gray-700">{formatDate(displayData.followUpDate)}</p>
                </div>
              </div>
            )}
 
            {/* FORWARD TO */}
            <div>
              <label className="block text-[12px] font-bold text-[#62748E] mb-2">FORWARD TO</label>
              <div className="min-h-[42px] px-3 py-2 rounded-xl border border-gray-300 bg-white flex items-center">
                <p className="text-sm text-gray-700">
                  {typeof displayData.forwardedTo === 'object'
                    ? displayData.forwardedTo?.emp_name || displayData.forwardedTo?.emp_id || 'N/A'
                    : displayData.forwardedTo || 'N/A'}
                </p>
              </div>
            </div>
          </div>
 
        
         
<div className="grid grid-cols-2 gap-6 mt-8">
  <div>
    <label className="block text-[12px] font-bold text-[#62748E] mb-2">REMARKS (BUYER/SUPPLIER)</label>
    <div className="min-h-[80px] p-3 rounded-xl border border-gray-300 bg-white">
      <p className="text-sm text-gray-700">{displayData.remarksBuyer}</p>
    </div>
  </div>
  <div>
    <label className="block text-[12px] font-bold text-[#62748E] mb-2">REMARKS (INTERNAL/FOLLOW-UP)</label>
    <div className="min-h-[80px] p-3 rounded-xl border border-gray-300 bg-white">
      <p className="text-sm text-gray-700">{displayData.remarksInternal}</p>
    </div>
  </div>
</div>

{/* Second row - 2 columns with request remarks in first column */}
<div className="grid grid-cols-2 gap-6 mt-6">
  <div>
    <label className="block text-[12px] font-bold text-[#62748E] mb-2">REQUEST REMARKS</label>
    <div className="min-h-[80px] p-3 rounded-xl border border-gray-300 bg-white">
      <p className="text-sm text-gray-700">{displayData.requestRemarks}</p>
    </div>
  </div>
  <div>
    {/* Empty div to maintain grid structure - or you can leave it empty */}
  </div>
</div>
 
          
 
          {/* Reject Remark (if rejected) */}
          {details.status === 'REJECTED' && details.RejectRemark && (
            <div className="mt-6">
              <label className="block text-xs font-semibold text-red-500 mb-2">REJECTION REASON</label>
              <div className="min-h-[60px] p-3 rounded-lg border border-red-300 bg-red-50">
                <p className="text-sm text-red-700">{details.RejectRemark}</p>
              </div>
            </div>
          )}
 
          {/* Resolver Info (if processed) */}
          {details.status !== 'PENDING' && details.resolverDetails && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 pt-6 border-t border-gray-200">
              <div>
                <label className="block text-[12px] font-bold text-[#62748E] mb-2">PROCESSED BY</label>
                <div className="min-h-[42px] px-3 py-2 rounded-lg border border-gray-300 bg-white flex items-center">
                  <p className="text-sm text-gray-700">{details.resolverDetails.name}</p>
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-bold text-[#62748E] mb-2">PROCESSED DATE</label>
                <div className="min-h-[42px] px-3 py-2 rounded-lg border border-gray-300 bg-white flex items-center">
                  <p className="text-sm text-gray-700">
                    {details.resolvedDate ? dayjs(details.resolvedDate).format('MM/DD/YYYY HH:mm') : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
 
        {/* Card 3: Action Buttons - Only show for PENDING requests */}
        {details.status === "Pending" && (
          <div className=" ">
            <div className="flex justify-end gap-4">
              {/* Reject Button - matching Code A exactly */}
              <button
                onClick={() => setShowRejectModal(true)}
                disabled={processing}
                className="px-5 py-2.5 rounded-xl bg-[#FFFFFF] border-2 border-[#E2E8F0]  text-[#314158] text-sm font-medium hover:bg-[#C9D3DF] transition-colors duration-200 disabled:opacity-50 flex items-center gap-2"
              >
                
                <CircleX className="w-6 h-6" />
                Reject Request
              </button>
 
              {/* Approve Button - matching Code A exactly */}
              <button
                onClick={handleApprove}
                disabled={processing}
                className="px-5 py-2.5 rounded-xl bg-[#7861E6] text-white text-sm font-medium transition-colors duration-200 disabled:opacity-50 shadow-lg flex items-center gap-2"
              >
                <FiCheck className="w-4 h-4" />
                {processing ? "Processing..." : "Approve Request"}
              </button>
            </div>
          </div>
        )}
      </div>
 
      {/* Reject Modal */}
      {showRejectModal && (
        <RejectModal
          onClose={() => setShowRejectModal(false)}
          onConfirm={handleReject}
          processing={processing}
        />
      )}
    </div>
  );
}