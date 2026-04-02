import { useState, useEffect } from "react";
import { getAllBackdatedRequests } from "../../../api/backdated";
import dayjs from "dayjs";

export default function ViewRequest() {

  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: null
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [totalResults, setTotalResults] = useState(0);

  // Define custom order for Status
  const statusOrder = {
    'Pending': 1,
    'Approved': 2,
    'Rejected': 3
  };

  // Define custom order for Request Type
  const requestTypeOrder = {
    'Backdated_Create': 1,
    'Backdated_Archive': 3,
    'Backdated_Modify': 2
  };

  // Helper function to get value for sorting
  const getSortValue = (item, sortKey) => {
    switch (sortKey) {
      case 'adminName':
        return item.admin?.name || '';
      case 'requestId':
        return formatRequestIdForSort(item.requestId);
      default:
        return item[sortKey];
    }
  };

  // Format request ID for sorting (remove RID- prefix for numeric comparison)
  const formatRequestIdForSort = (id) => {
    if (!id) return '';
    if (typeof id === 'string' && id.startsWith('RID-')) {
      return parseInt(id.replace('RID-', '')) || 0;
    }
    return id;
  };

  // Sorting function with custom orders
  const sortData = (data, sortKey, sortDirection) => {
    if (!sortDirection || !sortKey) return data;
    
    return [...data].sort((a, b) => {
      let aValue = getSortValue(a, sortKey);
      let bValue = getSortValue(b, sortKey);
      
      // Handle Status with custom order
      if (sortKey === 'status') {
        const aOrder = statusOrder[aValue] || 999;
        const bOrder = statusOrder[bValue] || 999;
        return sortDirection === 'asc' ? aOrder - bOrder : bOrder - aOrder;
      }
      
      // Handle Request Type with custom order
      if (sortKey === 'requestType') {
        const aOrder = requestTypeOrder[aValue] || 999;
        const bOrder = requestTypeOrder[bValue] || 999;
        return sortDirection === 'asc' ? aOrder - bOrder : bOrder - aOrder;
      }
      
      // Handle Date column
      if (sortKey === 'createdAt') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      } 
      // Handle numeric Request ID
      else if (sortKey === 'requestId') {
        aValue = Number(aValue);
        bValue = Number(bValue);
      }
      // Handle text columns
      else {
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

  useEffect(() => {
    setCurrentPage(1);
  }, [sortConfig]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const response = await getAllBackdatedRequests();

      if (response?.success) {
        setRequests(response.data);
        setFilteredRequests(response.data);
        setTotalResults(response.data.length);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Apply sorting to requests
  const sortedRequests = sortConfig.direction 
    ? sortData(filteredRequests, sortConfig.key, sortConfig.direction) 
    : filteredRequests;

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedRequests.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);

  const getVisiblePages = () => {
    const pages = [];

    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, "...", totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, "...", totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, "...", currentPage, "...", totalPages);
      }
    }

    return pages;
  };

  const paginate = (pageNumber) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;
    setCurrentPage(pageNumber);
  };

  // Badge styling
  const getRequestTypeBadge = (type) => {
    switch (type) {
      case "CREATE":
        return { cls: "bg-[#DBEAFE] text-[#1447E6]", label: "CREATE" };
      case "MODIFY":
        return { cls: "bg-[#FEF3C7] text-[#B45309]", label: "MODIFY" };
      case "ARCHIVE":
        return { cls: "bg-[#E0E7FF] text-[#4338CA]", label: "ARCHIVE" };
      default:
        return { cls: "bg-[#F3F4F6] text-[#6B7280]", label: type };
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-100 text-yellow-700";
      case "Approved":
        return "bg-green-100 text-green-700";
      case "Rejected":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  // Helper function to format IDs to RID_XXX format for display
  const formatRequestId = (id) => {
    if (!id) return "N/A";
    if (typeof id === 'string' && id.startsWith('RID_')) return id;
    return `RID-${String(id).padStart(3, '0')}`;
  };

  return (
    <div className="min-h-screen bg-[#f5f7fb]">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-800">
          Backdated Entry Requests
        </h1>
        <p className="text-sm text-gray-500">
          View all backdated create, modify, and archive requests.
        </p>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#E9EDF2]">
              <tr>
                <th 
                  className="px-6 py-5 text-left text-[11px] text-[#62748E] uppercase cursor-pointer hover:bg-[#E2E6EC] transition select-none"
                  onClick={(e) => { e.preventDefault(); handleSort('requestId'); }}
                >
                  <div className="flex items-center gap-1">
                    Request ID
                    {sortConfig.key === 'requestId' && sortConfig.direction === 'asc' && (
                      <span className="text-xs">↑</span>
                    )}
                    {sortConfig.key === 'requestId' && sortConfig.direction === 'desc' && (
                      <span className="text-xs">↓</span>
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-5 text-left text-[11px] text-[#62748E] uppercase cursor-pointer hover:bg-[#E2E6EC] transition select-none"
                  onClick={(e) => { e.preventDefault(); handleSort('caseId'); }}
                >
                  <div className="flex items-center gap-1">
                    Case ID
                    {sortConfig.key === 'caseId' && sortConfig.direction === 'asc' && (
                      <span className="text-xs">↑</span>
                    )}
                    {sortConfig.key === 'caseId' && sortConfig.direction === 'desc' && (
                      <span className="text-xs">↓</span>
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-5 text-left text-[11px] text-[#62748E] uppercase cursor-pointer hover:bg-[#E2E6EC] transition select-none"
                  onClick={(e) => { e.preventDefault(); handleSort('adminName'); }}
                >
                  <div className="flex items-center gap-1">
                    Admin
                    {sortConfig.key === 'adminName' && sortConfig.direction === 'asc' && (
                      <span className="text-xs">↑</span>
                    )}
                    {sortConfig.key === 'adminName' && sortConfig.direction === 'desc' && (
                      <span className="text-xs">↓</span>
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-5 text-left text-[11px] text-[#62748E] uppercase cursor-pointer hover:bg-[#E2E6EC] transition select-none"
                  onClick={(e) => { e.preventDefault(); handleSort('requestType'); }}
                >
                  <div className="flex items-center gap-1">
                    Type
                    {sortConfig.key === 'requestType' && sortConfig.direction === 'asc' && (
                      <span className="text-xs">↑</span>
                    )}
                    {sortConfig.key === 'requestType' && sortConfig.direction === 'desc' && (
                      <span className="text-xs">↓</span>
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-5 text-left text-[11px] text-[#62748E] uppercase cursor-pointer hover:bg-[#E2E6EC] transition select-none"
                  onClick={(e) => { e.preventDefault(); handleSort('status'); }}
                >
                  <div className="flex items-center gap-1">
                    Status
                    {sortConfig.key === 'status' && sortConfig.direction === 'asc' && (
                      <span className="text-xs">↑</span>
                    )}
                    {sortConfig.key === 'status' && sortConfig.direction === 'desc' && (
                      <span className="text-xs">↓</span>
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-5 text-left text-[11px] text-[#62748E] uppercase cursor-pointer hover:bg-[#E2E6EC] transition select-none"
                  onClick={(e) => { e.preventDefault(); handleSort('createdAt'); }}
                >
                  <div className="flex items-center gap-1">
                    Date
                    {sortConfig.key === 'createdAt' && sortConfig.direction === 'asc' && (
                      <span className="text-xs">↑</span>
                    )}
                    {sortConfig.key === 'createdAt' && sortConfig.direction === 'desc' && (
                      <span className="text-xs">↓</span>
                    )}
                  </div>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#F1F5F9]">
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-8">
                    Loading...
                  </td>
                </tr>
              ) : currentItems.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-8">
                    No data found
                  </td>
                </tr>
              ) : (
                currentItems.map((item) => {
                  const typeBadge = getRequestTypeBadge(item.requestType);

                  return (
                    <tr key={item.requestId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-[#7861E6] font-medium">
                        {formatRequestId(item.requestId)}
                      </td>
                      <td className="px-6 py-4">{item.caseId}</td>
                      <td className="px-6 py-4">
                        {item.admin?.name || "N/A"}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-0.5 rounded text-xs font-semibold ${typeBadge.cls}`}
                        >
                          {typeBadge.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-semibold ${getStatusBadge(
                            item.status
                          )}`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {item.createdAt
                          ? dayjs(item.createdAt).format("MM/DD/YYYY")
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

      {/* Pagination */}
      {filteredRequests.length > 0 && (
        <div className="px-6 py-4 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Showing {indexOfFirstItem + 1} to{" "}
            {Math.min(indexOfLastItem, filteredRequests.length)} of{" "}
            {totalResults}
          </div>

          <div className="flex items-center gap-1">
            {/* Previous */}
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => prev - 1)}
              className="w-8 h-8 flex items-center justify-center rounded-md border border-[#E2E8F0] bg-white text-[#45556C] disabled:opacity-40"
            >
              ‹
            </button>

            {getVisiblePages().map((page, index) =>
              page === "..." ? (
                <span key={index} className="px-2 text-[#45556C]">
                  ...
                </span>
              ) : (
                <button
                  key={index}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 flex items-center justify-center text-sm rounded-md
                  ${currentPage === page
                      ? "bg-[#7861E6] text-white"
                      : "text-[#45556C] hover:bg-gray-100"
                    }`}
                >
                  {page}
                </button>
              )
            )}

            {/* Next */}
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((prev) => prev + 1)}
              className="w-8 h-8 flex items-center justify-center rounded-md border border-[#E2E8F0] bg-white text-[#45556C] disabled:opacity-40"
            >
              ›
            </button>
          </div>
        </div>
      )}
    </div>
  );
}