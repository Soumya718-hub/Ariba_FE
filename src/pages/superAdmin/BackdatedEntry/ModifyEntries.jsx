import { useState, useEffect, useRef } from "react";
import { FiChevronLeft, FiChevronRight,  FiSearch } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import {
  getAllLatestBackdatedCases,
  modifyBackdatedDirect,
  archiveBackdatedDirect,
} from "../../../api/backdated";
import {
  getAllCallTypes,
  getAllCallModes,
  getAllClients,
  getAllAribaEmp
} from "../../../api/case";
import { getAllEmployees } from "../../../api/hrms";
import { Archive, SquarePen } from "lucide-react";
import dayjs from "dayjs";
import EditModal from "./Modals/EditDetails";
import ArchiveModal from "./Modals/ArchiveModal";

export default function ModifyEntries() {
  const searchTimeout = useRef(null);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [cases, setCases] = useState([]);
  const [filteredCases, setFilteredCases] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);

  // Dropdown data for edit modal
  const [users, setUsers] = useState([]);
  const [clients, setClients] = useState([]);
  const [callTypes, setCallTypes] = useState([]);
  const [callModes, setCallModes] = useState([]);
  const [employees, setEmployees] = useState([]);
  // Add this with other state declarations
const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: null
});


  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredCases.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredCases.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const renderPageNumbers = () => {
    const pages = [];

    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
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

    return [...new Set(pages)];
  };

  // Define custom order for Status
const statusOrder = {
    'Open': 1,
    'Pending_Updates':2,
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
        
        // Handle text columns
        aValue = String(aValue || '').toLowerCase();
        bValue = String(bValue || '').toLowerCase();
        
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
    fetchCases();
    fetchDropdownData();
  }, []);

 useEffect(() => {
    let filtered = cases;
    
    if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        filtered = cases.filter(
            (item) =>
                (item.CaseID || "").toLowerCase().includes(term) ||
                (item.ClientName || "").toLowerCase().includes(term) ||
                (item.Priority || "").toLowerCase().includes(term)
        );
    }
    
    // Apply sorting to filtered data
    const sortedData = sortConfig.direction 
        ? sortData(filtered, sortConfig.key, sortConfig.direction) 
        : filtered;
    
    setFilteredCases(sortedData);
    setCurrentPage(1);
}, [searchTerm, cases, sortConfig]);

  const fetchCases = async () => {
    setLoading(true);
    try {
      const response = await getAllLatestBackdatedCases();
      if (response?.success) {
        setCases(response.data);
        setFilteredCases(response.data);
      }
    } catch (error) {
      console.error("Error fetching cases:", error);
    } finally {
      setLoading(false);
    }
  };

 const fetchDropdownData = async () => {
  try {
    const [usersData, clientsRes, typesRes, modesRes] =
      await Promise.all([
        getAllEmployees(),    // Changed back to getAllEmployees()
        getAllClients(),
        getAllCallTypes(),
        getAllCallModes(),
      ]);
    
    // Users - handle array directly
    if (Array.isArray(usersData) && usersData.length > 0) {
      setUsers(usersData);
      setEmployees(usersData);  // Set employees with same data
    } else {
      console.log("No users data or invalid response structure");
      setUsers([]);
      setEmployees([]);
    }
    
    if (clientsRes?.success) setClients(clientsRes.data || []);
    if (typesRes?.success) setCallTypes(typesRes.data || []);
    if (modesRes?.success) setCallModes(modesRes.data || []);
  } catch (error) {
    console.error("Error fetching dropdown data:", error);
  }
};

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);

    // Clear previous timeout
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    // Set new timeout to search after 300ms of no typing
    searchTimeout.current = setTimeout(() => {
      handleSearch();
    }, 300);
  };

  const handleClear = () => {
    setSearchTerm("");
    setFilteredCases(cases);
    setCurrentPage(1);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleEdit = (caseItem) => {
    navigate(`/superadmin/edit-request/${caseItem.CaseID}`, {
      state: { caseData: caseItem },
    });
  };

  const handleArchive = (caseItem) => {
    setSelectedCase(caseItem);
    setShowArchiveModal(true);
  };

  const handleSaveEdit = async (formData) => {
    try {
      const payload = {
        selectedDate: formData.selectedDate
          ? `${formData.selectedDate} 00:00:00`
          : undefined,
        username: formData.username,
        name: formData.name,
        callType: formData.callType,
        poSubtype: formData.poSubtype,
        callMode: formData.callMode,
        priority: formData.priority,
        forwardedTo: formData.forwardedTo,
        status: formData.status,
        followUpDate: formData.followUpDate,
        remarksBuyer: formData.remarksBuyer,
        remarksInternal: formData.remarksInternal,
      };
      const response = await modifyBackdatedDirect(
        selectedCase.CaseID,
        payload,
      );
      if (response?.success) {
        alert("Case modified successfully!");
        setShowEditModal(false);
        fetchCases();
      } else {
        alert(response?.message || "Failed to modify case");
      }
    } catch (error) {
      console.error("Error modifying case:", error);
      alert("An error occurred while modifying the case");
    }
  };

  const handleConfirmArchive = async (remarks) => {
    try {
      const response = await archiveBackdatedDirect(selectedCase.CaseID, {
        remarks,
      });
      if (response?.success) {
        alert("Case archived successfully!");
        setShowArchiveModal(false);
        fetchCases();
      } else {
        alert(response?.message || "Failed to archive case");
      }
    } catch (error) {
      console.error("Error archiving case:", error);
      alert("An error occurred while archiving the case");
    }
  };

  const getPriorityDisplay = (priority) => {
    if (!priority) return null;
    const lower = priority.toLowerCase();

    const priorityConfig = {
      high: { dot: "text-[#FF2056]", text: "text-[#EC003F]" },
      medium: { dot: "text-[#E17100]", text: "text-[#E17100]" },
      low: { dot: "text-[#00BC7D]", text: "text-[#00BC7D]" },
      normal: { dot: "text-[#E17100]", text: "text-[#E17100]" }
    };

    const config = priorityConfig[lower] || { dot: "text-[#E17100]", text: "text-[#E17100]" };


    return (
      <span className="flex items-center gap-1">
        <span className={`text-[10px] leading-none ${config.dot}`}>●</span>
        <span className={`text-sm font-medium ${config.text}`}>
          {priority.charAt(0).toUpperCase() + priority.slice(1).toLowerCase()}
        </span>
      </span>
    );
  };

  const getStatusBadge = (status) => {
    if (!status) return null;
    const lower = status.toLowerCase();
    let cls = "bg-[#FAF5FF] text-[#8200DB] border-[#FAF5FF]";
    let label = status;

    if (lower === "follow_up" || lower === "follow-up") {
      cls = "bg-[#FFFBEB] text-[#BB4D00] border-[#FFFBEB]";
      label = "FOLLOW-UP";
    } else if (lower === "closed") {
      cls = "bg-[#F8FAFC] text-gray-600";
      label = "Closed";
    } else if (lower === "resolved") {
      cls = "bg-[#F8FAFC] text-[#007A55] border-[#ECFDF5]";
      label = "Resolved";
    } else if (lower === "open") {
      cls = "bg-[#D9E9FE] text-[#1447E6] border-[#EFF6FF]";
      label = "Open";
    } else if (lower === "archived") {
      cls = "bg-[#D9E9FE] text-[#8200DB] border-[#FAF5FF]";
      label = "Archived";
    }

    return (
      <span
        className={`inline-block px-3 py-0.5 rounded-full  text-xs font-semibold tracking-wide ${cls}`}
      >
        {label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#f5f7fb] p-0">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1D293D] m-0 leading-tight">
          Modify Entry
        </h1>
        <p className="text-base text-[#62748E] mt-0.5 mb-0">
          Log historical call modify with full administrative control.
        </p>
      </div>



      {/* Total Calls Data Header - separate div */}
      <div className="flex items-end justify-between mb-5">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">
            Total Calls Data
          </h2>
        </div>


        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Case ID, Client, or Name..."
            className="w-[400px] border border-gray-200 rounded-lg pl-9 pr-4 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-gray-400 bg-white"
          />
        </div>
      </div>




      {/* Table - separate div with 16px gap (mt-4) */}
      <div className="flex-1 min-h-0 mt-4 overflow-hidden rounded-2xl">
        <div className="h-full bg-[#FFFFFF] overflow-x-auto">
          <table className="min-w-max w-full text-sm border-collapse">
            <thead className="bg-[#E9EDF2] text-[#62748E] text-xs uppercase">
    <tr className="h-[64px]">
        <th 
            className="p-4 text-left cursor-pointer hover:bg-[#E2E6EC] transition select-none"
            onClick={(e) => { e.preventDefault(); handleSort('CaseID'); }}
        >
            <div className="flex items-center gap-1">
                Case ID
                {sortConfig.key === 'CaseID' && sortConfig.direction === 'asc' && <span className="text-xs">↑</span>}
                {sortConfig.key === 'CaseID' && sortConfig.direction === 'desc' && <span className="text-xs">↓</span>}
            </div>
        </th>
        <th 
            className="p-4 text-left cursor-pointer hover:bg-[#E2E6EC] transition select-none"
            onClick={(e) => { e.preventDefault(); handleSort('ClientName'); }}
        >
            <div className="flex items-center gap-1">
                Client
                {sortConfig.key === 'ClientName' && sortConfig.direction === 'asc' && <span className="text-xs">↑</span>}
                {sortConfig.key === 'ClientName' && sortConfig.direction === 'desc' && <span className="text-xs">↓</span>}
            </div>
        </th>
        <th 
            className="p-4 text-left cursor-pointer hover:bg-[#E2E6EC] transition select-none"
            onClick={(e) => { e.preventDefault(); handleSort('CallType'); }}
        >
            <div className="flex items-center gap-1">
                Type
                {sortConfig.key === 'CallType' && sortConfig.direction === 'asc' && <span className="text-xs">↑</span>}
                {sortConfig.key === 'CallType' && sortConfig.direction === 'desc' && <span className="text-xs">↓</span>}
            </div>
        </th>
        <th 
            className="p-4 text-left cursor-pointer hover:bg-[#E2E6EC] transition select-none"
            onClick={(e) => { e.preventDefault(); handleSort('Priority'); }}
        >
            <div className="flex items-center gap-1">
                Priority
                {sortConfig.key === 'Priority' && sortConfig.direction === 'asc' && <span className="text-xs">↑</span>}
                {sortConfig.key === 'Priority' && sortConfig.direction === 'desc' && <span className="text-xs">↓</span>}
            </div>
        </th>
        <th 
            className="p-4 text-center cursor-pointer hover:bg-[#E2E6EC] transition select-none"
            onClick={(e) => { e.preventDefault(); handleSort('Status'); }}
        >
            <div className="flex items-center justify-center gap-1">
                Status
                {sortConfig.key === 'Status' && sortConfig.direction === 'asc' && <span className="text-xs">↑</span>}
                {sortConfig.key === 'Status' && sortConfig.direction === 'desc' && <span className="text-xs">↓</span>}
            </div>
        </th>
        <th 
            className="p-4 text-left cursor-pointer hover:bg-[#E2E6EC] transition select-none"
            onClick={(e) => { e.preventDefault(); handleSort('LogDate'); }}
        >
            <div className="flex items-center gap-1">
                Date
                {sortConfig.key === 'LogDate' && sortConfig.direction === 'asc' && <span className="text-xs">↑</span>}
                {sortConfig.key === 'LogDate' && sortConfig.direction === 'desc' && <span className="text-xs">↓</span>}
            </div>
        </th>
        <th className="p-4 text-left">Action</th>
    </tr>
</thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan="7"
                    className="px-6 py-10 text-center text-gray-400 text-sm"
                  >
                    Loading...
                  </td>
                </tr>
              ) : currentItems.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="px-6 py-10 text-center text-gray-400 text-sm"
                  >
                    No cases found
                  </td>
                </tr>
              ) : (
                currentItems.map((item) => (
                  <tr
                    key={item.LogID}
                    className={`border-y border-[#E2E8F0] transition ${item.highlight_status === "overdue" ? "bg-[#FDECEC]" : item.highlight_status === 'warning'
                      ? 'bg-[#FFFBEB]'
                      : ''}`}
                  >
                    {/* Case ID */}
                    <td className="p-4 border-y border-[#E2E8F0]">
                      <a className="text-sm font-medium text-gray-700  no-underline">
                        {item.CaseID}
                      </a>
                    </td>

                    {/* Client */}
                    <td className="p-4 border-y border-[#E2E8F0] text-sm text-gray-700">
                      {item.ClientName}
                    </td>

                    {/* Type */}
                    <td className="p-4 border-y border-[#E2E8F0]">
                      <span className="inline-block px-3 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-semibold">
                        {item.CallType}
                      </span>
                    </td>

                    {/* Priority */}
                    <td className="p-4 border-y border-[#E2E8F0]">
                      <div className="flex justify-start">
                        {getPriorityDisplay(item.Priority)}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="p-4 border-y  border-[#E2E8F0] text-center align-middle">
                      {getStatusBadge(item.Status)}
                    </td>

                    {/* Date */}
                    <td className="p-4 border-y border-[#E2E8F0]">
                      {dayjs(item.LogDate).format("MM/DD/YYYY")}
                    </td>

                    {/* Action */}
                    <td className="p-4 border-y border-[#E2E8F0]">
                      <div className="flex items-center justify-start gap-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-1.5 text-gray-500 hover:bg-gray-300 rounded-lg transition-colors "
                          title="Edit"
                        >
                          <SquarePen className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleArchive(item)}
                          className="p-1.5 text-red-400 hover:bg-red-200 rounded-lg transition-colors"
                          title="Archive"
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          <div className="text-sm text-gray-400">
            Showing {filteredCases.length === 0 ? 0 : indexOfFirstItem + 1} to{" "}
            {Math.min(indexOfLastItem, filteredCases.length)} of{" "}
            {filteredCases.length} Results
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className="w-8 h-8 flex items-center justify-center rounded-md border border-[#E2E8F0] bg-white text-[#45556C] disabled:opacity-40"
            >
              <FiChevronLeft className="w-4 h-4" />
            </button>

            {renderPageNumbers().map((page, idx) =>
              page === "..." ? (
                <span key={idx} className="px-2 text-sm text-gray-400">
                  ...
                </span>
              ) : (
                <button
                  key={page}
                  onClick={() => paginate(page)}
                  className={`w-8 h-8 flex items-center justify-center text-sm rounded-md ${currentPage === page
                    ? "bg-[#7861E6] text-white"
                    : "text-[#45556C] border border-[#E2E8F0] hover:bg-gray-100"
                    }`}
                >
                  {page}
                </button>
              )
            )}

            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages || totalPages === 0}
              className="w-8 h-8 flex items-center justify-center rounded-md border border-[#E2E8F0] bg-white text-[#45556C] disabled:opacity-40"
            >
              <FiChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && selectedCase && (
        <EditModal
          case={selectedCase}
          users={users}
          clients={clients}
          callTypes={callTypes}
          callModes={callModes}
          employees={employees}
          onClose={() => setShowEditModal(false)}
          onSave={handleSaveEdit}
        />
      )}

      {/* Archive Modal */}
      {showArchiveModal && selectedCase && (
        <ArchiveModal
          case={selectedCase}
          onClose={() => setShowArchiveModal(false)}
          onConfirm={handleConfirmArchive}
        />
      )}
    </div>
  );
}
