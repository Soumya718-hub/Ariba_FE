import { useState, useEffect } from "react";
import {
  getAllBackdatedRequests,
  getBackdatedRequestDetails,
  processBackdatedRequest,
} from "../../../api/backdated";
import { FiEye, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { LuListFilter } from "react-icons/lu";
import dayjs from "dayjs";
import RequestDetails from "./Modals/RequestDetails";

export default function ViewRequest() {
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [totalResults, setTotalResults] = useState(0);
  // Add this with other state declarations
const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: null
});
// Define custom order for Request Type
const requestTypeOrder = {
    'Backdated_Create': 1,
    'Backdated_Modify': 2,
    'Backdated_Archive': 3
};
// Sorting function with custom orders
const sortData = (data, sortKey, sortDirection) => {
    if (!sortDirection || !sortKey) return data;
    
    return [...data].sort((a, b) => {
        let aValue = a[sortKey];
        let bValue = b[sortKey];
        
        // Handle Request ID with numeric extraction (RID-047)
        if (sortKey === 'RequestID') {
            // Extract numbers from RID-047 -> 47
            const aNum = parseInt(String(aValue).replace(/[^0-9]/g, '')) || 0;
            const bNum = parseInt(String(bValue).replace(/[^0-9]/g, '')) || 0;
            return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
        }
        
        // Handle Request Type with custom order
        if (sortKey === 'RequestType') {
            const aOrder = requestTypeOrder[aValue] || 999;
            const bOrder = requestTypeOrder[bValue] || 999;
            return sortDirection === 'asc' ? aOrder - bOrder : bOrder - aOrder;
        }
        
        // Handle Date column
        if (sortKey === 'created_at') {
            aValue = new Date(aValue);
            bValue = new Date(bValue);
        } else {
            aValue = String(aValue || '').toLowerCase();
            bValue = String(bValue || '').toLowerCase();
        }
        
        if (aValue < bValue) {
            return sortDirection === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
            return sortDirection === 'asc' ? 1 : -1;
        }
        return 0;
    });
};
// Handle column sort with 3 states: asc -> desc -> default
const handleSort = (key) => {
    setSortConfig(prevConfig => {
        if (prevConfig.key !== key) {
            return { key: key, direction: 'asc' };
        }
        if (prevConfig.direction === 'asc') {
            return { key: key, direction: 'desc' };
        } else if (prevConfig.direction === 'desc') {
            return { key: null, direction: null };
        } else {
            return { key: key, direction: 'asc' };
        }
    });
};

  useEffect(() => {
  fetchRequests();
}, []);

const fetchRequests = async () => {
  setLoading(true);
  try {
    const response = await getAllBackdatedRequests();
    if (response?.success) {
      // Filter out approved requests - only keep pending ones
      const pendingRequests = response.data.filter(
        (request) => request.Status !== "Approved" && request.Status !== "Rejected"
      );
      
      setRequests(pendingRequests);
      // Apply sorting to filtered requests
      const sortedData = sortConfig.direction 
        ? sortData(pendingRequests, sortConfig.key, sortConfig.direction) 
        : pendingRequests;
      setFilteredRequests(sortedData);
      setTotalResults(pendingRequests.length);
    }
  } catch (error) {
    console.error("Error fetching requests:", error);
  } finally {
    setLoading(false);
  }
};

  const handleSearch = () => {
    let filtered = requests;
    
    if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        filtered = requests.filter(
            (item) =>
                item.RequestID?.toLowerCase().includes(term) ||
                item.AdminName?.toLowerCase().includes(term) ||
                item.RequestType?.toLowerCase().includes(term)
        );
    }
    
    // Apply sorting to filtered data
    const sortedData = sortConfig.direction 
        ? sortData(filtered, sortConfig.key, sortConfig.direction) 
        : filtered;
    
    setFilteredRequests(sortedData);
    setTotalResults(filtered.length);
    setCurrentPage(1);
};

  const handleClear = () => {
    setSearchTerm("");
    // Apply sorting to all requests
    const sortedData = sortConfig.direction 
        ? sortData(requests, sortConfig.key, sortConfig.direction) 
        : requests;
    setFilteredRequests(sortedData);
    setTotalResults(requests.length);
    setCurrentPage(1);
};
// Update filtered requests when sort config changes
useEffect(() => {
    if (requests.length > 0) {
        const sortedData = sortConfig.direction 
            ? sortData(requests, sortConfig.key, sortConfig.direction) 
            : requests;
        setFilteredRequests(sortedData);
        setCurrentPage(1);
    }
}, [sortConfig]);
  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleViewRequest = (request, e) => {
    e.stopPropagation(); // Prevent event bubbling
    setSelectedRequest(request);
    setShowDetails(true);
  };

  const handleBack = () => {
    setShowDetails(false);
    setSelectedRequest(null);
  };

  const handleRequestProcessed = () => {
    fetchRequests();
    setShowDetails(false);
    setSelectedRequest(null);
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredRequests.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);

  const paginate = (pageNumber) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;
    setCurrentPage(pageNumber);
  };

  // Request type badge — matches snapshot: light blue bg, blue text, rounded, no pill
  const getRequestTypeBadge = (type) => {
    switch (type) {
      case "Backdated_Create":
        return { cls: "bg-[#DBEAFE] text-[#1447E6]", label: "Backdated_Create" };
      case "Backdated_Modify":
        return { cls: "bg-[#D9E9FE] text-[#1447E6]", label: "Backdated_Modify" };
      case "Backdated_Archive":
        return { cls: "bg-[#D9E9FE] text-[#1447E6]", label: "Backdated_Archive" };
      default:
        return { cls: "bg-[#D9E9FE] text-[#1447E6]", label: type };
    }
  };

  // Pagination page numbers: 1, 2, 3, ..., last
  const renderPageNumbers = () => {
    const pages = [];

    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show 1, 2, 3, ..., last
      pages.push(1);
      if (currentPage > 3) pages.push("...");
      if (currentPage > 2 && currentPage < totalPages - 1) {
        pages.push(currentPage - 1);
      }
      if (currentPage !== 1 && currentPage !== totalPages) {
        pages.push(currentPage);
      }
      if (currentPage < totalPages - 2) {
        pages.push(currentPage + 1);
      }
      if (currentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }

    // Deduplicate
    return [...new Set(pages)];
  };
  // Helper function to format Request ID
const formatRequestId = (id) => {
  if (!id) return "N/A";
  // If it's already in RID_XXX format, return as is
  if (typeof id === 'string' && id.startsWith('RID_')) return id;
  // Otherwise, format it as RID_XXX with leading zeros
  return `RID-${String(id).padStart(3, '0')}`;
};

  return (
    <div className="min-h-screen bg-[#f5f7fb] p-0">
      {!showDetails ? (
        <>
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-xl font-bold text-gray-800 mb-0.5 leading-tight">
              Backdated Entry Requests
            </h1>
            <p className="text-sm text-gray-500 mt-0">
              Review and authorize historical data modifications requested by Super Admins.
            </p>
          </div>

          {/* Main container with three cards and gap-4 */}
          <div className="flex flex-col gap-4">
            {/* Card 1: Pending Authorization Title */}
            <div className="">
              <div className="">
                <h2 className="text-base font-semibold text-gray-800">
                  Pending Authorization
                </h2>
              </div>
            </div>

            {/* Card 2: Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#E9EDF2] border-b border-gray-100">
    <tr>
        <th 
    className="px-6 py-5 text-left text-[11px] font-semibold text-[#62748E] uppercase tracking-wider cursor-pointer hover:bg-[#E2E6EC] transition select-none"
    onClick={(e) => { e.preventDefault(); handleSort('RequestID'); }}
>
    <div className="flex items-center gap-1">
        Request ID
        {sortConfig.key === 'RequestID' && sortConfig.direction === 'asc' && <span className="text-xs">↑</span>}
        {sortConfig.key === 'RequestID' && sortConfig.direction === 'desc' && <span className="text-xs">↓</span>}
    </div>
</th>
        <th 
            className="px-6 py-5 text-left text-[11px] font-semibold text-[#62748E] uppercase tracking-wider cursor-pointer hover:bg-[#E2E6EC] transition select-none"
            onClick={(e) => { e.preventDefault(); handleSort('AdminName'); }}
        >
            <div className="flex items-center gap-1">
                Admin Name
                {sortConfig.key === 'AdminName' && sortConfig.direction === 'asc' && <span className="text-xs">↑</span>}
                {sortConfig.key === 'AdminName' && sortConfig.direction === 'desc' && <span className="text-xs">↓</span>}
            </div>
        </th>
        <th 
            className="px-6 py-5 text-left text-[11px] font-semibold text-[#62748E] uppercase tracking-wider cursor-pointer hover:bg-[#E2E6EC] transition select-none"
            onClick={(e) => { e.preventDefault(); handleSort('RequestType'); }}
        >
            <div className="flex items-center gap-1">
                Request Type
                {sortConfig.key === 'RequestType' && sortConfig.direction === 'asc' && <span className="text-xs">↑</span>}
                {sortConfig.key === 'RequestType' && sortConfig.direction === 'desc' && <span className="text-xs">↓</span>}
            </div>
        </th>
        <th 
            className="px-6 py-5 text-left text-[11px] font-semibold text-[#62748E] uppercase tracking-wider cursor-pointer hover:bg-[#E2E6EC] transition select-none"
            onClick={(e) => { e.preventDefault(); handleSort('created_at'); }}
        >
            <div className="flex items-center gap-1">
                Request Date
                {sortConfig.key === 'created_at' && sortConfig.direction === 'asc' && <span className="text-xs">↑</span>}
                {sortConfig.key === 'created_at' && sortConfig.direction === 'desc' && <span className="text-xs">↓</span>}
            </div>
        </th>
    </tr>
</thead>
                  <tbody className="divide-y divide-gray-100">
                    {loading ? (
                      <tr>
                        <td colSpan="4" className="px-6 py-10 text-center text-[#62748E] text-sm">
                          Loading...
                        </td>
                      </tr>
                    ) : currentItems.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="px-6 py-10 text-center text-[#62748E] text-sm">
                          No requests found
                        </td>
                      </tr>
                    ) : (
                      currentItems.map((item) => {
                        const typeBadge = getRequestTypeBadge(item.RequestType);
                        return (
                          <tr
                            key={item.RequestID}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            {/* Request ID — indigo link - only this is clickable */}
                            <td className="px-6 py-4">
                              <a
                                href="#"
                                onClick={(e) => handleViewRequest(item, e)}
                                className="text-sm font-medium text-[#7861E6] hover:text-[#6c52eb] underline cursor-pointer"
                              >
                                {formatRequestId(item.RequestID || item.CaseID)}
                              </a>
                            </td>

                            {/* Admin Name */}
                            <td className="px-6 py-4 text-sm text-gray-700">
                              {item.AdminName || "N/A"}
                            </td>

                            {/* Request Type badge */}
                            <td className="px-6 py-4">
                              <span
                                className={`inline-block px-3 py-0.5 rounded text-xs font-semibold ${typeBadge.cls}`}
                              >
                                {typeBadge.label}
                              </span>
                            </td>

                            {/* Request Date */}
                            <td className="px-6 py-4 text-sm text-gray-700">
                              {item.created_at
                                ? dayjs(item.created_at).format("MM/DD/YYYY")
                                : "N/A"}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            </div>

            {/* Card 3: Pagination (only shown when there are results) */}
            {filteredRequests.length > 0 && (
              <div className=" overflow-hidden">
                <div className="px-6 py-4 flex items-center justify-between">
                  {/* Left: showing info */}
                  <div className="text-sm text-[#45556C]">
                    Showing {indexOfFirstItem + 1} To{" "}
                    {Math.min(indexOfLastItem, filteredRequests.length)} Of{" "}
                    {totalResults} Results
                  </div>

                  {/* Right: pagination controls */}
                  <div className="flex items-center gap-1">
                    {/* Prev chevron */}
                    <button
                      onClick={() => paginate(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="w-7 h-7 flex items-center justify-center rounded border border-gray-200 text-gray-400 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <FiChevronLeft className="w-3.5 h-3.5" />
                    </button>

                    {/* Page numbers */}
                    {renderPageNumbers().map((page, idx) =>
                      page === "..." ? (
                        <span
                          key={`ellipsis-${idx}`}
                          className="px-1 text-xs text-gray-400"
                        >
                          ···
                        </span>
                      ) : (
                        <button
                          key={page}
                          onClick={() => paginate(page)}
                          className={`w-7 h-7 flex items-center justify-center rounded text-xs font-medium transition-colors ${
                            currentPage === page
                              ? "bg-[#7861E6] text-white"
                              : "border border-gray-200 text-gray-500 hover:bg-gray-50"
                          }`}
                        >
                          {page}
                        </button>
                      )
                    )}

                    {/* Next chevron */}
                    <button
                      onClick={() => paginate(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="w-7 h-7 flex items-center justify-center rounded border border-gray-200 text-gray-400 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <FiChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
       
        </>
      ) : (
        /* Details View */
        <RequestDetails
          request={selectedRequest}
          onBack={handleBack}
          onProcessed={handleRequestProcessed}
          getBackdatedRequestDetails={getBackdatedRequestDetails}
          processBackdatedRequest={processBackdatedRequest}
        />
      )}
    </div>
  );
}