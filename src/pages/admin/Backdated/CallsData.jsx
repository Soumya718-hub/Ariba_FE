import { useState, useEffect } from "react";
import { FiSearch } from "react-icons/fi";
import { HiPaperAirplane } from "react-icons/hi";
import { PhoneCall, Archive, SquarePen } from "lucide-react";
import dayjs from "dayjs";
import {
  raiseArchiveRequest,
  getAllLatestBackdatedCases,
} from "../../../api/backdated";
import {
  getAllCallTypes,
  getAllCallModes,
  getAllClients,
} from "../../../api/case";
import { getAllEmployees } from "../../../api/hrms";
import { useNavigate } from "react-router-dom";

export default function CallData() {
  const navigate = useNavigate();
  const [toastMessage, setToastMessage] = useState("");
  const [tableData, setTableData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [modalError, setModalError] = useState("");
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [modalRemarks, setModalRemarks] = useState("");
  const [selectedCaseId, setSelectedCaseId] = useState("");
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
      
      // Handle Date columns
      if (sortKey === 'LogDate') {
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

  const poSubtypeOptions = [
    { label: "SR Raised", value: "SR Raised" },
    { label: "Helpdesk Raised", value: "Helpdesk Raised" },
    { label: "Resolved", value: "Resolved" },
  ];

  const handleArchive = async () => {
    if (!modalRemarks.trim()) {
      setModalError("Remarks is required");
      return;
    } else if (modalRemarks.length > 250) {
      setModalError("Maximum 250 characters allowed");
      return;
    }

    console.log("Sending payload:", {
      requestRemarks: modalRemarks,
    });
    try {
      const response = await raiseArchiveRequest(selectedCaseId, {
        requestRemarks: modalRemarks,
      });

      if (response?.success) {
        setShowRequestModal(false);

        setTableData((prev) =>
          prev.filter((item) => item.CaseID !== selectedCaseId),
        );

        setModalRemarks("");
        setModalError(false);
        setToastMessage("Archive request submitted successfully.");
      } else {
        alert(response?.message || "Failed to archive");
      }
    } catch (error) {
      console.error(error);
      alert("Server error.");
    }
  };

  const inputStyle =
    "w-full min-h-[44px] px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 placeholder-gray-400 focus:outline-none focus:border-gray-600";

  const [userOptions, setUserOptions] = useState([]);
  const [clientOptions, setClientOptions] = useState([]);
  const [callTypeOptions, setCallTypeOptions] = useState([]);
  const [callModeOptions, setCallModeOptions] = useState([]);
  const [priorityOptions, setPriorityOptions] = useState([]);
  const [statusOptions, setStatusOptions] = useState([]);
  const customSelectStyles = (hasError) => ({
    control: (provided, state) => ({
      ...provided,
      minHeight: 44,
      height: 44,
      borderRadius: 8,
      borderColor: hasError
        ? "#ef4444"
        : state.isFocused
          ? "#4B5563"
          : "#D1D5DB",
      boxShadow: "none",
      paddingLeft: "2px",
      paddingRight: "2px",
      "&:hover": {
        borderColor: "#4B5563",
      },
    }),
    valueContainer: (provided) => ({
      ...provided,
      padding: "0 8px",
    }),
    placeholder: (provided) => ({
      ...provided,
      color: "#9CA3AF",
      fontSize: "14px",
    }),
    singleValue: (provided) => ({
      ...provided,
      color: "#374151",
      fontSize: "14px",
    }),
    indicatorsContainer: (provided) => ({
      ...provided,
      height: 44,
    }),
    menu: (provided) => ({
      ...provided,
      borderRadius: 8,
      zIndex: 50,
    }),
  });

  useEffect(() => {
    const fetchDropdowns = async () => {
      const callTypeRes = await getAllCallTypes();
      const callModeRes = await getAllCallModes();
      if (callTypeRes?.success) {
        setCallTypeOptions(
          callTypeRes.data.map((item) => ({
            label: item.callType,
            value: item.callType,
          })),
        );
      }

      if (callModeRes?.success) {
        setCallModeOptions(
          callModeRes.data.map((item) => ({
            label: item.callMode,
            value: item.callMode,
          })),
        );
      }
    };

    fetchDropdowns();
  }, []);

  useEffect(() => {
    const fetch = async () => {
      const res = await getAllLatestBackdatedCases();
      if (res?.success) setTableData(res.data);
    };
    fetch();
  }, []);

  useEffect(() => {
    const fetchUsersAndClients = async () => {
      const usersData = await getAllEmployees();
      const clientsRes = await getAllClients();

      console.log("Users data:", usersData);

      if (Array.isArray(usersData) && usersData.length > 0) {
        setUserOptions(
          usersData.map((u) => ({
            label: `${u.Employee_Name} (${u.Employee_ID}) `,
            value: u.Employee_ID,
          })),
        );
      } else {
        console.log("No users data or empty array");
      }

      if (clientsRes?.success) {
        setClientOptions(
          clientsRes.data.map((c) => ({
            label: c.ClientName,
            value: c.ClientID,
          })),
        );
      }
    };

    fetchUsersAndClients();
  }, []);

  useEffect(() => {
    setPriorityOptions([
      { label: "High", value: "high" },
      { label: "Normal", value: "normal" },
      { label: "Low", value: "low" },
    ]);

    setStatusOptions([
      { label: "Open", value: "Open" },
      { label: "Pending Updates", value: "Pending_Updates" },
      { label: "Follow Up", value: "Follow_up" },
      { label: "Resolved", value: "Resolved" },
      { label: "Closed", value: "Closed" },
    ]);
  }, []);

  useEffect(() => {
    if (showRequestModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [showRequestModal]);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage("");
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;
  
  // Apply sorting to table data
  const sortedTableData = sortConfig.direction 
    ? sortData(tableData, sortConfig.key, sortConfig.direction) 
    : tableData;
  
  // Pagination calculations
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = sortedTableData.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(tableData.length / rowsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [tableData, sortConfig]);

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

  return (
    <div>
      <div className="mt-8 space-y-6">
        {/* Title + Search Row */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[#1D293D]">
            Total Calls Data
          </h2>

          {/* Search */}
          <div className="relative">
            <FiSearch className="absolute left-3 top-2.5 text-[#90A1B9] text-sm" />

            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={async (e) => {
                if (e.key === "Enter") {
                  if (!searchTerm.trim()) return;

                  const res = await getAllLatestBackdatedCases();

                  if (res?.success) {
                    const filtered = res.data.filter(
                      (item) =>
                        (item.CaseID || "")
                          .toLowerCase()
                          .includes(searchTerm.toLowerCase()) ||
                        (item.ClientName || "")
                          .toLowerCase()
                          .includes(searchTerm.toLowerCase()),
                    );

                    setTableData(filtered);
                  } else {
                    setTableData([]);
                  }

                  setHasSearched(true);
                }
              }}
              placeholder="Search by Case ID, Client..."
              className="w-72 h-9 pl-9 pr-4 rounded-lg border border-[#E2E8F0] bg-white text-sm outline-none focus:border-[#7861E6]"
            />
          </div>
        </div>
        
        {/* Data Card */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {/* Empty State */}
          {!hasSearched ? (
            <div className="bg-white min-h-[416px] flex items-center justify-center">
              <div className="flex flex-col items-center gap-2 text-center">
                <PhoneCall className="w-9 h-9 text-[#90A1B9]" />
                <p className="text-xs text-[#90A1B9]">
                  Search by Case ID to view data.
                </p>
              </div>
            </div>
          ) : tableData.length === 0 ? (
            <div className="bg-white min-h-[416px] flex items-center justify-center">
              <p className="text-xs text-[#90A1B9]">No records found.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  {/* HEADER */}
                  <thead className="bg-[#E9EDF2] text-[#62748E] text-xs uppercase">
                    <tr className="h-[64px]">
                      <th 
                        className="px-6 text-left rounded-tl-xl cursor-pointer hover:bg-[#E2E6EC] transition select-none"
                        onClick={(e) => { e.preventDefault(); handleSort('CaseID'); }}
                      >
                        <div className="flex items-center gap-1">
                          CASE ID
                          {sortConfig.key === 'CaseID' && sortConfig.direction === 'asc' && <span className="text-xs">↑</span>}
                          {sortConfig.key === 'CaseID' && sortConfig.direction === 'desc' && <span className="text-xs">↓</span>}
                        </div>
                      </th>
                      <th 
                        className="px-6 text-left cursor-pointer hover:bg-[#E2E6EC] transition select-none"
                        onClick={(e) => { e.preventDefault(); handleSort('ClientName'); }}
                      >
                        <div className="flex items-center gap-1">
                          CLIENT
                          {sortConfig.key === 'ClientName' && sortConfig.direction === 'asc' && <span className="text-xs">↑</span>}
                          {sortConfig.key === 'ClientName' && sortConfig.direction === 'desc' && <span className="text-xs">↓</span>}
                        </div>
                      </th>
                      <th 
                        className="px-6 text-left cursor-pointer hover:bg-[#E2E6EC] transition select-none"
                        onClick={(e) => { e.preventDefault(); handleSort('CallType'); }}
                      >
                        <div className="flex items-center gap-1">
                          TYPE
                          {sortConfig.key === 'CallType' && sortConfig.direction === 'asc' && <span className="text-xs">↑</span>}
                          {sortConfig.key === 'CallType' && sortConfig.direction === 'desc' && <span className="text-xs">↓</span>}
                        </div>
                      </th>
                      <th 
                        className="px-6 text-left cursor-pointer hover:bg-[#E2E6EC] transition select-none"
                        onClick={(e) => { e.preventDefault(); handleSort('Priority'); }}
                      >
                        <div className="flex items-center gap-1">
                          PRIORITY
                          {sortConfig.key === 'Priority' && sortConfig.direction === 'asc' && <span className="text-xs">↑</span>}
                          {sortConfig.key === 'Priority' && sortConfig.direction === 'desc' && <span className="text-xs">↓</span>}
                        </div>
                      </th>
                      <th 
                        className="text-center cursor-pointer hover:bg-[#E2E6EC] transition select-none"
                        onClick={(e) => { e.preventDefault(); handleSort('Status'); }}
                      >
                        <div className="flex items-center justify-center gap-1">
                          STATUS
                          {sortConfig.key === 'Status' && sortConfig.direction === 'asc' && <span className="text-xs">↑</span>}
                          {sortConfig.key === 'Status' && sortConfig.direction === 'desc' && <span className="text-xs">↓</span>}
                        </div>
                      </th>
                      <th 
                        className="px-6 text-left cursor-pointer hover:bg-[#E2E6EC] transition select-none"
                        onClick={(e) => { e.preventDefault(); handleSort('LogDate'); }}
                      >
                        <div className="flex items-center gap-1">
                          DATE
                          {sortConfig.key === 'LogDate' && sortConfig.direction === 'asc' && <span className="text-xs">↑</span>}
                          {sortConfig.key === 'LogDate' && sortConfig.direction === 'desc' && <span className="text-xs">↓</span>}
                        </div>
                      </th>
                      <th className="px-6 text-center rounded-tr-xl">ACTION</th>
                    </tr>
                  </thead>

                  {/* BODY */}
                  <tbody>
                    {currentRows.map((row, index) => {
                      const priority = row.Priority?.trim().toLowerCase();
                      const highlight = row.highlight_status
                        ? row.highlight_status.toLowerCase().replace("-", "_")
                        : "";

                      const priorityDotColor =
                        priority === "high"
                          ? "bg-red-500"
                          : priority === "medium"
                            ? "bg-[#FE9A00]"
                            : priority === "low"
                              ? "bg-green-500"
                              : "bg-gray-400";

                      const priorityTextColor =
                        priority === "high"
                          ? "text-[#FF0000]"
                          : priority === "medium"
                            ? "text-[#FE9A00]"
                            : priority === "low"
                              ? "text-green-500"
                              : "text-gray-600";
                      const status = row.Status?.toLowerCase();

                      const statusStyles =
                        status === "open"
                          ? "bg-[#D9E9FE] text-[#155DFC]"
                          : status === "follow_up" || status === "follow-up"
                            ? "bg-[#FFFBEB] text-[#BB4D00]"
                            : status === "resolved"
                              ? "bg-[#ECFDF5] text-[#007A55]"
                              : status === "pending_updates" ||
                                  status === "pending-updates"
                                ? "bg-[#FAF5FF] text-[#8200DB]"
                                : status === "closed"
                                  ? "bg-[#F8FAFC] text-[#314158]"
                                  : "bg-gray-200 text-gray-600";

                      return (
                        <tr
                          key={index}
                          className={`border-b border-[#E5EAF1] hover:bg-[#F9FAFB] transition
    ${
      highlight === "warning"
        ? "bg-[#FFF7E6]"
        : highlight === "overdue"
          ? "bg-[#FFECEC]"
          : ""
    }`}
                        >
                          {/* CASE ID */}
                          <td className="px-6 py-4">
                            <span className="text-[#62748E] font-semibold cursor-pointer">
                              {row.CaseID}
                            </span>
                          </td>

                          {/* CLIENT */}
                          <td className="px-6 py-4 text-[#314158]">
                            {row.ClientName}
                          </td>

                          {/* TYPE BADGE */}
                          <td className="px-6 py-4">
                            <span className="px-3 py-1 text-xs font-medium bg-[#F1F5F9] text-[#314158] rounded-lg">
                              {row.CallType}
                            </span>
                          </td>

                          {/* PRIORITY WITH DOT */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span
                                className={`w-2 h-2 rounded-full ${priorityDotColor}`}
                              />
                              <span
                                className={`font-medium ${priorityTextColor}`}
                              >
                                {row.Priority?.toLowerCase().replace(
                                  /\b\w/g,
                                  (c) => c.toUpperCase(),
                                )}
                              </span>
                            </div>
                          </td>

                          {/* STATUS PILL */}
                          <td className="text-center align-middle">
                            <span
                              className={`px-4 py-1 text-xs font-semibold rounded-full ${statusStyles}`}
                            >
                              {row.Status}
                            </span>
                          </td>

                          {/* DATE */}
                          <td className="px-6 py-4 text-[#314158] font-medium">
                            {dayjs(row.LogDate).format("DD/MM/YYYY")}
                          </td>

                          {/* ACTION BUTTONS */}
                          <td className="px-6 py-4">
                            <div className="flex justify-center gap-3">
                              {/* EDIT */}
                              <button
                                onClick={() => {
                                  const role = localStorage
                                    .getItem("role")
                                    ?.toLowerCase();
                                  navigate(
                                    `/${role}/edit-backdated/${row.CaseID}`,
                                  );
                                }}
                                className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-[#E5EAF1] transition"
                              >
                                <SquarePen className="w-4 h-4 text-gray-600" />
                              </button>

                              {/* ARCHIVE */}
                              <button
                                onClick={() => {
                                  setSelectedCaseId(row.CaseID);
                                  setShowRequestModal(true);
                                }}
                                className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-[#FFD6D6] transition"
                              >
                                <Archive className="w-4 h-4 text-[#FF2056]" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 px-6 py-3 flex items-center justify-between">
            <p className="text-xs text-[#45556C]">
              Showing {indexOfFirstRow + 1} to{" "}
              {Math.min(indexOfLastRow, tableData.length)} of {tableData.length}{" "}
              Results
            </p>

            <div className="flex items-center gap-1">
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
            ${
              currentPage === page
                ? "bg-[#7861E6] text-white"
                : "text-[#45556C] hover:bg-gray-100"
            }`}
                  >
                    {page}
                  </button>
                ),
              )}

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

        {showRequestModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
            <div className="bg-white w-[520px] rounded-3xl shadow-2xl">
              {/* Header */}
              <div className="flex justify-between items-center px-6 py-5 bg-gray-100 border-b border-gray-100 rounded-t-3xl">
                <div className="flex items-center gap-3">
                  <div className="bg-indigo-100 p-2 rounded-xl">
                    <Archive className="text-[#7861E6]" size={20} />
                  </div>

                  <h2 className="text-xl font-semibold text-gray-800">
                    "Archive Request"
                  </h2>
                </div>

                <button
                  onClick={() => setShowRequestModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-xl"
                >
                  ✕
                </button>
              </div>

              <div className="px-6 py-6 space-y-4 pb-8">
                {/* Selected Case */}
                {"Provide a reason for archiving this request..." && (
                  <div className="bg-[#EEF2FF] border border-[#E0E7FF] rounded-3xl px-6 py-6">
                    <p className="text-[#7861E6] text-sm font-semibold tracking-widest mb-4">
                      SELECTED CASES
                    </p>

                    <span className="inline-block bg-white text-[#7861E6] text-sm font-bold px-5 py-2.5 rounded-xl shadow-md border border-[#C6D2FF]">
                      {selectedCaseId}
                    </span>
                  </div>
                )}

                {/* Mandatory Remarks */}
                <div className="mb-4">
                  <textarea
                    maxLength={250}
                    rows="3"
                    value={modalRemarks}
                    onChange={(e) => {
                      let value = e.target.value;
                      value = value.replace(/\s+/g, " ");

                      if (value.length <= 250) {
                        setModalRemarks(value);
                      }
                      setModalError("");
                    }}
                    className="w-full p-3 rounded-xl border text-md outline-none"
                  />

                  <p className="text-xs text-gray-400 text-right mt-1">
                    {modalRemarks?.length || 0}/250
                  </p>

                  {modalError && (
                    <p className="text-red-500 text-xs mt-1">{modalError}</p>
                  )}
                </div>
                
                {/* Warning Box */}
                <div className="bg-[#FFFBEB] border border-[#FEF3C6] rounded-2xl p-4 flex gap-3 items-start">
                  <div className="text-[#E17100] mt-[2px]">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle cx="12" cy="12" r="9" />
                      <line
                        x1="12"
                        y1="8"
                        x2="12"
                        y2="12"
                        strokeLinecap="round"
                      />
                      <circle
                        cx="12"
                        cy="16"
                        r="1"
                        fill="currentColor"
                        stroke="none"
                      />
                    </svg>
                  </div>

                  <p className="text-[#973C00] text-base leading-relaxed">
                    <>
                      Are you sure you want to request archiving for case ID:{" "}
                      <span className="font-semibold">{selectedCaseId}</span>?
                    </>
                  </p>
                </div>

                {/* Buttons */}
                <div className="flex gap-5 pt-2">
                  <button
                    onClick={() => {
                      setShowRequestModal(false);
                      setModalRemarks("");
                      setModalError(false);
                    }}
                    className="flex-1 h-11 rounded-xl bg-[#FFFFFF] border border-[#E2E8F0] text-[#314158] text-sm font-medium hover:bg-[#E2E8F0] transition"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={handleArchive}
                    disabled={!modalRemarks.trim()}
                    className={`flex-1 flex items-center justify-center gap-2 h-11 rounded-xl 
  bg-[#7861E6] text-white text-sm font-semibold shadow-lg transition
  ${
    !modalRemarks.trim()
      ? "opacity-40 cursor-not-allowed"
      : "opacity-100 hover:bg-[#7861E6]"
  }`}
                  >
                    <HiPaperAirplane className="w-4 h-4 rotate-45" />
                    "Archive Request"
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}