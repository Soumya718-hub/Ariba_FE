import { useState, useEffect } from "react";
import { useCallback, useRef } from "react";
import { UserPlus, Send } from "lucide-react";
import Select from "react-select";
import { DatePicker, Input, message  } from "antd";
import dayjs from "dayjs";
const { RangePicker } = DatePicker;
import { bulkTransferCases, getAllAribaEmp  } from "../../api/case";
import { getReportsData } from "../../api/report";
import { getAllEmployees } from "../../api/hrms";

export default function Transfer() {
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 8;
  const [cases, setCases] = useState([]);
  const [filteredCases, setFilteredCases] = useState([]); // Add this for filtered data
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(false);
  
  const [selectedCases, setSelectedCases] = useState([]);
  const [userOptions, setUserOptions] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [transferLoading, setTransferLoading] = useState(false);

  // Filter states (like in LoggedCalls)
  const [searchClient, setSearchClient] = useState("");
  const [dateRange, setDateRange] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  
  // Applied filters (like in LoggedCalls)
  const [appliedSearch, setAppliedSearch] = useState("");
  const [appliedStartDate, setAppliedStartDate] = useState(null);
  const [appliedEndDate, setAppliedEndDate] = useState(null);
  // Add this with other state declarations
const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: null
});
// Define custom order for Status
const statusOrder = {
    'Open': 1,
    'Pending_Updates': 2,
    'Follow_up': 3,
    'Resolved': 4,
    'Closed': 5
};

// Define custom order for Priority
const priorityOrder = {
    'high': 1,
    'medium': 2,
    'low': 3
};
// Sorting function with custom orders
const sortData = (data, sortKey, sortDirection) => {
    if (!sortDirection || !sortKey) return data;
    
    return [...data].sort((a, b) => {
        let aValue = a[sortKey];
        let bValue = b[sortKey];
        
        // Handle Status with custom order
        if (sortKey === 'Status') {
            const aOrder = statusOrder[aValue] || 999;
            const bOrder = statusOrder[bValue] || 999;
            return sortDirection === 'asc' ? aOrder - bOrder : bOrder - aOrder;
        }
        
        // Handle Priority with custom order
        if (sortKey === 'Priority') {
            const aOrder = priorityOrder[aValue?.toLowerCase()] || 999;
            const bOrder = priorityOrder[bValue?.toLowerCase()] || 999;
            return sortDirection === 'asc' ? aOrder - bOrder : bOrder - aOrder;
        }
        
        // Handle Date column
        if (sortKey === 'created_date' || sortKey === 'LogDate') {
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

  /* ---------------- FETCH ALL CASES ONCE ---------------- */
  useEffect(() => {
    fetchAllCases();
    fetchEmployees();
  }, []);
  // Reset to page 1 when sort changes
useEffect(() => {
    setCurrentPage(1);
}, [sortConfig]);

  const fetchAllCases = async () => {
  setLoading(true);
  try {
    const res = await getReportsData({
      page: 1,
      limit: 1000
    });
    
    console.log("API Response:", res);
    
    // Handle different response structures
    if (res?.data?.success) {
      setCases(res.data.data || []);
      setFilteredCases(res.data.data || []);
      setTotalRecords(res.data.data?.length || 0);
      setTotalPages(Math.ceil((res.data.data?.length || 0) / rowsPerPage));
    } else if (res?.success) {
      setCases(res.data || []);
      setFilteredCases(res.data || []);
      setTotalRecords(res.data?.length || 0);
      setTotalPages(Math.ceil((res.data?.length || 0) / rowsPerPage));
    } else if (Array.isArray(res)) {
      setCases(res);
      setFilteredCases(res);
      setTotalRecords(res.length);
      setTotalPages(Math.ceil(res.length / rowsPerPage));
    } else if (res?.data && Array.isArray(res.data)) {
      setCases(res.data);
      setFilteredCases(res.data);
      setTotalRecords(res.data.length);
      setTotalPages(Math.ceil(res.data.length / rowsPerPage));
    } else {
      console.error("Unexpected response structure:", res);
      message.error("Failed to load cases data");
      setCases([]);
      setFilteredCases([]);
      setTotalRecords(0);
      setTotalPages(1);
    }
  } catch (error) {
    console.error("Error fetching cases:", error);
    message.error("Error fetching cases");
    setCases([]);
    setFilteredCases([]);
    setTotalRecords(0);
    setTotalPages(1);
  } finally {
    setLoading(false);
  }
};

const fetchEmployees = async () => {
  try {
    const res = await getAllEmployees();
    console.log("Raw employees response:", res);
    
    // getAllEmployees returns array directly
    if (Array.isArray(res) && res.length > 0) {
      const formatted = res.map(emp => ({
        value: emp.Employee_ID,        // Changed from emp_id
        label: `${emp.Employee_Name} (${emp.Employee_ID})`  // Changed from emp_name
      }));
      setUserOptions(formatted);
    } else {
      console.error("Employees data is not available:", res);
      message.error("Failed to load employees");
      setUserOptions([]);
    }
  } catch (error) {
    console.error("Error fetching employees:", error);
    message.error("Error loading employees list");
    setUserOptions([]);
  }
};
// Add this helper function
const formatDate = (dateString) => {
  if (!dateString) return "-";
  return dayjs(dateString).format('YYYY-MM-DD');
};
  /* ---------------- CLIENT-SIDE FILTERING (like LoggedCalls) ---------------- */
useEffect(() => {
    // Apply filters whenever search or date range changes
    const filtered = cases.filter((item) => {
        // Client name search
        const matchesSearch = !appliedSearch || 
            (item.ClientName || "").toLowerCase().includes(appliedSearch.toLowerCase());

        // Date range filter
        const matchesDate = (() => {
            if (!appliedStartDate || !appliedEndDate) return true;
            const itemDate = new Date(item.created_date || item.LogDate).getTime();
            const start = new Date(appliedStartDate);
            start.setHours(0, 0, 0, 0);
            const end = new Date(appliedEndDate);
            end.setHours(23, 59, 59, 999);
            return itemDate >= start.getTime() && itemDate <= end.getTime();
        })();

        return matchesSearch && matchesDate;
    });
    
    // Apply sorting to filtered data
    const sorted = sortConfig.direction 
        ? sortData(filtered, sortConfig.key, sortConfig.direction) 
        : filtered;

    setFilteredCases(sorted);
    setTotalRecords(filtered.length);
    setTotalPages(Math.ceil(filtered.length / rowsPerPage));
    setCurrentPage(1); // Reset to first page when filters change
}, [appliedSearch, appliedStartDate, appliedEndDate, cases, sortConfig]);

  // Handle search change with debounce (like LoggedCalls but smoother)
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchClient(value);
    
    // Clear previous timeout
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    
    // Set new timeout
    searchTimeout.current = setTimeout(() => {
      setAppliedSearch(value);
    }, 300); // Slight delay but still feels smooth
  };

  const handleDateRangeChange = (dates) => {
    setDateRange(dates);
    
    if (dates && dates.length === 2) {
      setStartDate(dates[0].toDate());
      setEndDate(dates[1].toDate());
      setAppliedStartDate(dates[0].toDate());
      setAppliedEndDate(dates[1].toDate());
    } else {
      setStartDate(null);
      setEndDate(null);
      setAppliedStartDate(null);
      setAppliedEndDate(null);
    }
  };

  // Cleanup timeout on unmount
  const searchTimeout = useRef(null);
  useEffect(() => {
    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, []);

  /* ---------------- PAGINATION FUNCTIONS ---------------- */
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredCases.slice(indexOfFirstRow, indexOfLastRow);

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

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  /* ---------------- SELECT LOGIC ---------------- */
  const toggleCase = (caseId) => {
    setSelectedCases(prev =>
      prev.includes(caseId)
        ? prev.filter(id => id !== caseId)
        : [...prev, caseId]
    );
  };

  const toggleSelectAll = () => {
    const currentPageIds = currentRows.map(row => row.CaseID);
    const allSelected = currentPageIds.every(id => selectedCases.includes(id));

    if (allSelected) {
      setSelectedCases(prev => prev.filter(id => !currentPageIds.includes(id)));
    } else {
      setSelectedCases(prev => [...new Set([...prev, ...currentPageIds])]);
    }
  };

  /* ---------------- TRANSFER ---------------- */
  const handleTransfer = async () => {
  if (!selectedUser) {
    message.warning("Please select a user to transfer");
    return;
  }

  if (selectedCases.length === 0) {
    message.warning("Please select at least one case");
    return;
  }

  setTransferLoading(true);

  try {
    const res = await bulkTransferCases({
      caseIds: selectedCases,
      transferToEmpId: selectedUser.value,
    });
    
    if (res?.success) {
      message.success(res.message || "Cases transferred successfully!");
      setShowModal(false);
      setSelectedCases([]);
      setSelectedUser(null);
      // Refresh data after transfer
      fetchAllCases();
    } else {
      message.error(res?.message || "Transfer failed");
    }
  } catch (error) {
    console.error(error);
    message.error(error.response?.data?.message || "Server error occurred");
  } finally {
    setTransferLoading(false);
  }
};

  return (
    <div className="bg-[#f4f6fb] min-h-screen">
      {/* PAGE HEADER */}
      <div className="mb-4 flex flex-col gap-4">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">
              Transfer Cases
            </h1>
            <p className="text-sm text-gray-500">
              Select cases to reassign them to another user.
            </p>
          </div>

          <button
            disabled={selectedCases.length === 0}
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[#7861E6] text-white disabled:opacity-50"
          >
            <UserPlus size={16} />
            Transfer Cases ({selectedCases.length})
          </button>
        </div>

       {/* Search and Filter Section */}
{/* Search and Filter Section */}
<div className="flex gap-4 items-center">
  {/* Client Name Search */}
  <div className="w-[300px] h-10">
    <Input
      placeholder="Search by client name..."
      value={searchClient}
      onChange={handleSearchChange}
      allowClear
      className="w-full h-full rounded-lg"
      style={{ height: '100%' }}
    />
  </div>
  
  {/* Date Range Picker */}
  <div className="w-[300px] h-10">
    <RangePicker
      onChange={handleDateRangeChange}
      value={dateRange}
      format="YYYY-MM-DD"
      placeholder={['Start Date', 'End Date']}
      className="w-full h-full rounded-lg"
      style={{ height: '100%' }}
    />
  </div>
</div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="relative h-full bg-[#f7f8f9] shadow-sm overflow-x-auto">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-gray-500">Loading cases...</div>
            </div>
          ) : (
            <table className="min-w-max w-full text-sm border-collapse">
              <thead className="bg-[#E9EDF2] text-[#62748E] text-xs uppercase">
  <tr className="h-[56px] text-[12px] font-semibold text-[#62748E] uppercase tracking-wider">
    {/* Select All Checkbox */}
    <th className="w-[56px] px-[10px] sticky left-0 bg-[#E9EDF2] z-40">
      <div className="flex items-center justify-center">
        <label
          className={`w-[16px] h-[16px] rounded-[3px] border cursor-pointer flex items-center justify-center transition-all duration-150 shadow
            ${currentRows.length > 0 && currentRows.every(row => selectedCases.includes(row.CaseID))
              ? "bg-[#7861E6] border-[#7861E6]"
              : "border-[#CBD5E1] bg-white"
            }`}
        >
          <input
            type="checkbox"
            checked={currentRows.length > 0 && currentRows.every(row => selectedCases.includes(row.CaseID))}
            onChange={toggleSelectAll}
            className="hidden"
          />
          {currentRows.length > 0 && currentRows.every(row => selectedCases.includes(row.CaseID)) && (
            <svg
              className="w-[10px] h-[10px] text-white"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 10l3 3 9-9" />
            </svg>
          )}
        </label>
      </div>
    </th>
    <th 
      className="px-6 text-left sticky left-[56px] bg-[#E9EDF2] z-20 cursor-pointer hover:bg-[#E2E6EC] transition select-none"
      onClick={(e) => { e.preventDefault(); handleSort('CaseID'); }}
    >
      <div className="flex items-center gap-1">
        Case ID
        {sortConfig.key === 'CaseID' && sortConfig.direction === 'asc' && <span className="text-xs">↑</span>}
        {sortConfig.key === 'CaseID' && sortConfig.direction === 'desc' && <span className="text-xs">↓</span>}
      </div>
    </th>
    <th 
      className="px-6 text-left cursor-pointer hover:bg-[#E2E6EC] transition select-none"
      onClick={(e) => { e.preventDefault(); handleSort('created_date'); }}
    >
      <div className="flex items-center gap-1">
        Date
        {sortConfig.key === 'created_date' && sortConfig.direction === 'asc' && <span className="text-xs">↑</span>}
        {sortConfig.key === 'created_date' && sortConfig.direction === 'desc' && <span className="text-xs">↓</span>}
      </div>
    </th>
    <th 
      className="px-6 text-left cursor-pointer hover:bg-[#E2E6EC] transition select-none"
      onClick={(e) => { e.preventDefault(); handleSort('ClientName'); }}
    >
      <div className="flex items-center gap-1">
        Client
        {sortConfig.key === 'ClientName' && sortConfig.direction === 'asc' && <span className="text-xs">↑</span>}
        {sortConfig.key === 'ClientName' && sortConfig.direction === 'desc' && <span className="text-xs">↓</span>}
      </div>
    </th>
    <th 
      className="px-6 text-left cursor-pointer hover:bg-[#E2E6EC] transition select-none"
      onClick={(e) => { e.preventDefault(); handleSort('name'); }}
    >
      <div className="flex items-center gap-1">
        Name
        {sortConfig.key === 'name' && sortConfig.direction === 'asc' && <span className="text-xs">↑</span>}
        {sortConfig.key === 'name' && sortConfig.direction === 'desc' && <span className="text-xs">↓</span>}
      </div>
    </th>
    <th 
      className="px-6 text-left cursor-pointer hover:bg-[#E2E6EC] transition select-none"
      onClick={(e) => { e.preventDefault(); handleSort('CallType'); }}
    >
      <div className="flex items-center gap-1">
        Type
        {sortConfig.key === 'CallType' && sortConfig.direction === 'asc' && <span className="text-xs">↑</span>}
        {sortConfig.key === 'CallType' && sortConfig.direction === 'desc' && <span className="text-xs">↓</span>}
      </div>
    </th>
    <th 
      className="px-6 text-left cursor-pointer hover:bg-[#E2E6EC] transition select-none"
      onClick={(e) => { e.preventDefault(); handleSort('Priority'); }}
    >
      <div className="flex items-center gap-1">
        Priority
        {sortConfig.key === 'Priority' && sortConfig.direction === 'asc' && <span className="text-xs">↑</span>}
        {sortConfig.key === 'Priority' && sortConfig.direction === 'desc' && <span className="text-xs">↓</span>}
      </div>
    </th>
    <th 
      className="px-6 text-left cursor-pointer hover:bg-[#E2E6EC] transition select-none"
      onClick={(e) => { e.preventDefault(); handleSort('current_owner_name'); }}
    >
      <div className="flex items-center gap-1">
        Current Owner
        {sortConfig.key === 'current_owner_name' && sortConfig.direction === 'asc' && <span className="text-xs">↑</span>}
        {sortConfig.key === 'current_owner_name' && sortConfig.direction === 'desc' && <span className="text-xs">↓</span>}
      </div>
    </th>
    <th 
      className="px-6 text-left cursor-pointer hover:bg-[#E2E6EC] transition select-none"
      onClick={(e) => { e.preventDefault(); handleSort('Status'); }}
    >
      <div className="flex items-center gap-1">
        Status
        {sortConfig.key === 'Status' && sortConfig.direction === 'asc' && <span className="text-xs">↑</span>}
        {sortConfig.key === 'Status' && sortConfig.direction === 'desc' && <span className="text-xs">↓</span>}
      </div>
    </th>
    <th 
      className="px-6 text-left cursor-pointer hover:bg-[#E2E6EC] transition select-none"
      onClick={(e) => { e.preventDefault(); handleSort('FollowUpDate'); }}
    >
      <div className="flex items-center gap-1">
        Follow-Up
        {sortConfig.key === 'FollowUpDate' && sortConfig.direction === 'asc' && <span className="text-xs">↑</span>}
        {sortConfig.key === 'FollowUpDate' && sortConfig.direction === 'desc' && <span className="text-xs">↓</span>}
      </div>
    </th>
   </tr>
</thead>
              <tbody className="divide-y divide-gray-200">
                {currentRows.length > 0 ? (
                  currentRows.map((item) => {
                    let rowColor = "bg-white";
                    if (item.highlight_status === "overdue") {
                      rowColor = "bg-[#FDECEC]";
                    } else if (item.highlight_status === "warning") {
                      rowColor = "bg-[#FEF5E6]";
                    }

                    return (
                      <tr key={item.CaseID} className={`h-[64px] border-b border-gray-100 transition ${rowColor}`}>
                        {/* Checkbox */}
                        <td className={`w-[56px] px-[10px] py-4 sticky left-0 z-30 ${rowColor}`}>
                          <div className="flex items-center justify-center">
                            <label
                              className={`w-[16px] h-[16px] rounded-[3px] border cursor-pointer flex items-center justify-center transition-all duration-150
                                ${selectedCases.includes(item.CaseID)
                                  ? "bg-[#7861E6] border-[#7861E6]"
                                  : "border-[#CBD5E1] bg-white"
                                }`}
                            >
                              <input
                                type="checkbox"
                                checked={selectedCases.includes(item.CaseID)}
                                onChange={() => toggleCase(item.CaseID)}
                                className="hidden"
                              />
                              {selectedCases.includes(item.CaseID) && (
                                <svg
                                  className="w-[10px] h-[10px] text-white"
                                  viewBox="0 0 20 20"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M4 10l3 3 9-9" />
                                </svg>
                              )}
                            </label>
                          </div>
                        </td>
                        
                        {/* Case ID */}
                        <td className={`px-6 py-4 text-sm font-semibold text-[#62748E] sticky left-[56px] z-10 ${rowColor}`}>
                          {item.CaseID}
                        </td>

                        {/* Date */}
                        <td className="px-6 py-4 text-sm text-[#334155]">{formatDate(item.created_date || item.LogDate)}</td>

                        {/* Client */}
                        <td className="px-6 py-4 text-sm text-[#334155]">{item.ClientName}</td>

                        {/* Name */}
                        <td className="px-6 py-4 text-sm text-[#334155]">{item.name}</td>

                        {/* Type */}
                        <td className="px-6 py-4 text-sm text-[#334155]">{item.CallType}</td>

                        {/* Priority */}
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 text-xs font-medium
                            ${item.Priority === "high" ? "text-[#FF0000]" : 
                              item.Priority === "medium" ? "text-[#FE9A00]" : 
                              item.Priority === "low" ? "text-green-500" : ""}`}
                          >
                         ● {item.Priority?.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}
                          </span>
                        </td>

                        {/* Forwarded To */}
                        <td className="px-6 py-4 text-sm text-[#334155]">{item.current_owner_name || "-"}</td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium
                            ${item.Status === "Open" ? "bg-[#D9E9FE] text-[#155DFC]" : 
                              item.Status === "Follow_up" ? "bg-[#FFFBEB] text-[#BB4D00]" : 
                              item.Status === "Resolved" ? "bg-[#ECFDF5] text-[#007A55]" : 
                              item.Status === "Pending_Updates" ? "bg-[#FAF5FF] text-[#8200DB]" : 
                              item.Status === "Closed" ? "bg-[#F8FAFC] text-[#314158]" : 
                              "bg-gray-200 text-gray-600"}`}
                          >
                            {item.Status?.replace("_", "-")}
                          </span>
                        </td>

                        {/* Follow-Up */}
                        <td className="px-6 py-4 text-sm text-[#334155]">{item.FollowUpDate || "-"}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="10" className="text-center py-8 text-gray-500">
                      No cases found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && !loading && (
        <div className="mt-6 px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-gray-500">
            Showing {filteredCases.length > 0 ? indexOfFirstRow + 1 : 0} to {Math.min(indexOfLastRow, filteredCases.length)} of {filteredCases.length} Results
          </div>

          <div className="flex items-center gap-1">
            {/* Previous */}
            <button
              disabled={currentPage === 1}
              onClick={() => goToPage(currentPage - 1)}
              className="w-8 h-8 flex items-center justify-center rounded-md border border-[#E2E8F0] bg-white text-[#45556C] hover:bg-gray-100 disabled:opacity-40"
            >
              ‹
            </button>

            {/* Pages */}
            {getVisiblePages().map((page, index) =>
              page === "..." ? (
                <span key={index} className="px-2 text-[#94A3B8] text-sm">...</span>
              ) : (
                <button
                  key={index}
                  onClick={() => goToPage(page)}
                  className={`w-8 h-8 flex items-center justify-center text-sm rounded-md transition
                    ${currentPage === page
                      ? "bg-[#7861E6] text-white shadow-sm"
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
              onClick={() => goToPage(currentPage + 1)}
              className="w-8 h-8 flex items-center justify-center rounded-md border border-[#E2E8F0] bg-white text-[#45556C] hover:bg-gray-100 disabled:opacity-40"
            >
              ›
            </button>
          </div>
        </div>
      )}

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-fadeIn">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
                  <UserPlus className="w-4 h-4 text-indigo-600" />
                </div>
                <h2 className="text-sm font-semibold text-gray-800">Transfer Cases</h2>
              </div>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition">✕</button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5">
              {/* Selected Cases Section */}
              <div className="bg-[#EEF2FF] rounded-xl p-4 border border-[#E0E7FF]">
                <p className="text-normal font-bold tracking-widest text-[#7861E6] uppercase mb-3">
                  Selected Cases ({selectedCases.length})
                </p>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                  {selectedCases.map((id) => (
                    <span key={id} className="bg-white text-[#432DD7] border border-[#C6D2FF] px-3 py-1 rounded-lg text-xs font-semibold shadow-sm">
                      {id}
                    </span>
                  ))}
                </div>
              </div>

              {/* FORWARDED TO */}
              <div>
                <label className="block text-xs font-semibold text-[#62748E] mb-2 uppercase">Transfer To?</label>
                <Select
                  options={userOptions}
                  value={selectedUser}
                  onChange={setSelectedUser}
                  placeholder="Select User"
                  components={{ IndicatorSeparator: () => null }}
                  styles={{
                    control: (base) => ({
                      ...base,
                      borderRadius: "12px",
                      borderColor: "#E5E7EB",
                      minHeight: "44px",
                      boxShadow: "none",
                      fontSize: "14px"
                    }),
                    menu: (base) => ({
                      ...base,
                      borderRadius: "12px",
                      overflow: "hidden"
                    })
                  }}
                />
              </div>

              {/* Warning Box */}
              <div className="bg-[#FFFBEB] border border-[#FEF3C6] rounded-2xl p-2 flex gap-3 items-start">
                <div className="text-[#E17100] mt-[2px]">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="9" />
                    <line x1="12" y1="8" x2="12" y2="12" strokeLinecap="round" />
                    <circle cx="12" cy="16" r="1" fill="currentColor" stroke="none" />
                  </svg>
                </div>
                <p className="text-[#973C00] text-base leading-relaxed">
                  Transferring these cases will reassign responsibility to the selected user.
                </p>
              </div>

              {/* Buttons */}
              <div className="flex gap-4 pt-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 h-10 rounded-xl border border-[#E2E8F0] bg-white text-[#314158] text-sm font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleTransfer}
                  disabled={transferLoading || !selectedUser}
                  className={`flex-1 flex items-center justify-center gap-2 h-10 rounded-xl text-white text-sm font-semibold shadow-lg transition
                    ${transferLoading || !selectedUser
                      ? "bg-[#B9ABF7] cursor-not-allowed"
                      : "bg-[#7861E6] hover:bg-[#6D55E0]"
                    }`}
                >
                  <Send className="w-4 h-4" />
                  {transferLoading ? "Transferring..." : "Transfer Now"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}