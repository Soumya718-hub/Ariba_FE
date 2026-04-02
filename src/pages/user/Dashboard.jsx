import { useEffect, useState } from "react";
import { DatePicker } from "antd";
import dayjs from "dayjs";
const { RangePicker } = DatePicker;
import {
  FiPhone,
  FiClock,
  FiCheckCircle,
  FiArrowUpRight,
  FiMessageSquare,
  FiCalendar,
} from "react-icons/fi";

import {
  getUserDashboardCounts,
  markForwardedAsSeen,
  getUserFilteredCases,
} from "../../api/dashboard";

export default function Dashboard() {
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  const [showCalendar, setShowCalendar] = useState(false);
  const [dateRange, setDateRange] = useState(null);
  const [counts, setCounts] = useState({
    total_calls: 0,
    open_calls: 0,
    resolved_calls: 0,
    pending_updates_calls: 0,
    follow_up_calls: 0,
    closed_calls: 0,
    forwarded: 0
  });
  const [tableData, setTableData] = useState([]);
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: null
  });
  const [activeCard, setActiveCard] = useState("total");
  const [forwardNotification, setForwardNotification] = useState({
    has_unseen: false,
    unseen_count: 0,
    total_forwarded: 0,
    recent_unseen: []
  });

  // Define custom order for Status (MUST be before sortData)
  const statusOrder = {
    'Open': 1,
    'Pending_Updates': 2,
    'Follow_up': 3,
    'Resolved': 4,
    'Closed': 5
  };

  // Define custom order for Priority (MUST be before sortData)
  const priorityOrder = {
    'high': 1,
    'medium': 2,
    'low': 3
  };

  // Sorting function with custom orders and 3-state support (MUST be before being used)
  const sortData = (data, sortKey, sortDirection) => {
    if (!sortDirection || !sortKey) return data;
    
    return [...data].sort((a, b) => {
      let aValue = a[sortKey];
      let bValue = b[sortKey];
      
      if (sortKey === 'Status') {
        const aOrder = statusOrder[aValue] || 999;
        const bOrder = statusOrder[bValue] || 999;
        return sortDirection === 'asc' ? aOrder - bOrder : bOrder - aOrder;
      }
      
      if (sortKey === 'Priority') {
        const aOrder = priorityOrder[aValue?.toLowerCase()] || 999;
        const bOrder = priorityOrder[bValue?.toLowerCase()] || 999;
        return sortDirection === 'asc' ? aOrder - bOrder : bOrder - aOrder;
      }
      
      aValue = String(aValue || '').toLowerCase();
      bValue = String(bValue || '').toLowerCase();
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  };

  // Handle column sort with 3 states (MUST be after sortData)
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

  // Pagination calculations (MUST be after tableData and sortConfig)
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const sortedTableData = sortConfig.direction ? sortData(tableData, sortConfig.key, sortConfig.direction) : tableData;
  const currentRows = sortedTableData.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(tableData.length / rowsPerPage);

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

  useEffect(() => {
    fetchDashboard();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [dateRange, activeCard, sortConfig]);

  // Updated: Fetch counts with date range
  const fetchDashboardCountsOnly = async (startDate = null, endDate = null) => {
    try {
      const countRes = await getUserDashboardCounts({ startDate, endDate });

      if (countRes?.success) {
        const countsData = countRes.data?.counts || {};

        setCounts({
          total_calls: parseInt(countsData.total_calls) || 0,
          open_calls: parseInt(countsData.open_calls) || 0,
          resolved_calls: parseInt(countsData.resolved_calls) || 0,
          pending_updates_calls: parseInt(countsData.pending_updates_calls) || 0,
          follow_up_calls: parseInt(countsData.follow_up_calls) || 0,
          closed_calls: parseInt(countsData.closed_calls) || 0,
          forwarded: parseInt(countsData.forwarded) || 0
        });

        setForwardNotification({
          has_unseen: countRes.data?.notification?.has_unseen || false,
          unseen_count: parseInt(countRes.data?.notification?.unseen_count) || 0,
          total_forwarded: parseInt(countRes.data?.notification?.total_forwarded) || 0,
          recent_unseen: countRes.data?.notification?.recent_unseen || []
        });
      }
    } catch (error) {
      console.error("Error fetching counts:", error);
    }
  };

  // Updated: Fetch dashboard with date range for counts
  const fetchDashboard = async () => {
    const startDate = dateRange?.startDate || null;
    const endDate = dateRange?.endDate || null;

    await fetchDashboardCountsOnly(startDate, endDate);

    // Only fetch total cases if active card is "total"
    if (activeCard === "total") {
      const tableRes = await getUserFilteredCases({
        cardType: "total",
        startDate,
        endDate
      });
      if (tableRes?.success) {
        setTableData(tableRes.data?.cases || []);
      }
    }
  };

  const fetchFilteredData = async (type, startDate = null, endDate = null) => {
    let apiCardType = type;

    if (type === "forwarded") {
      apiCardType = "forwarded_to_me";
    }

    const res = await getUserFilteredCases({
      cardType: apiCardType,
      startDate,
      endDate,
    });

    if (res?.success) {
      setTableData(res.data?.cases || []);
    }
  };

  const handleCardClick = async (type) => {
    setActiveCard(type);
    setTableData([]);
    setCurrentPage(1);
    fetchFilteredData(type, dateRange?.startDate, dateRange?.endDate);
    if (type === "forwarded") {
      await markForwardedAsSeen({});
      setForwardNotification(prev => ({
        ...prev,
        has_unseen: false,
        unseen_count: 0
      }));
      setTimeout(() => {
        fetchDashboardCountsOnly(dateRange?.startDate, dateRange?.endDate);
      }, 500);
    }
  };

  // Handle date range change
  const handleDateRangeChange = (dates) => {
    if (!dates) {
      setDateRange(null);
      setCurrentPage(1);
      // Refresh both counts and table data without date range
      fetchDashboardCountsOnly(null, null);
      fetchFilteredData(activeCard, null, null);
      return;
    }

    if (dates[0] && dates[1]) {
      const startDate = dayjs(dates[0]).format("YYYY-MM-DD");
      const endDate = dayjs(dates[1]).format("YYYY-MM-DD");

      setCurrentPage(1);
      setDateRange({ startDate, endDate });

      // Refresh counts with new date range
      fetchDashboardCountsOnly(startDate, endDate);
      // Refresh table data with new date range
      fetchFilteredData(activeCard, startDate, endDate);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f6fb]">
      <div className="flex justify-between items-center mb-8 relative">

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-800">
          Dashboard Overview
        </h1>

        {/* Date Range */}
        <div className="relative">
          {!showCalendar && (
            <button
              onClick={() => setShowCalendar(true)}
              className="flex items-center gap-2 px-4 py-2 border border-[#EAEDEF] rounded-lg bg-white text-[#62748E] hover:bg-gray-50 shadow-sm focus:outline-none"
            >
              <FiCalendar />
              {dateRange
                ? `${dateRange.startDate} - ${dateRange.endDate}`
                : "Date Range"}
            </button>
          )}
          {showCalendar && (
            <RangePicker
              autoFocus
              allowClear
              value={
                dateRange
                  ? [dayjs(dateRange.startDate), dayjs(dateRange.endDate)]
                  : null
              }
              open={showCalendar}
              format="YYYY-MM-DD"
              className="custom-range-picker"
              onOpenChange={(open) => setShowCalendar(open)}
              onChange={handleDateRangeChange}
            />
          )}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-5 gap-6 mb-8">
        <StatCard
          active={activeCard === "total"}
          icon={<FiPhone />}
          bg="bg-indigo-100"
          iconColor="text-indigo-600"
          label="Total Calls"
          value={counts.total_calls}
          onClick={() => handleCardClick("total")}
        />
        <StatCard
          active={activeCard === "open"}
          icon={<FiClock />}
          bg="bg-orange-100"
          iconColor="text-orange-500"
          label="Open Calls"
          value={counts.open_calls}
          onClick={() => handleCardClick("open")}
        />
        <StatCard
          active={activeCard === "resolved"}
          icon={<FiCheckCircle />}
          bg="bg-green-100"
          iconColor="text-green-500"
          label="Resolved"
          value={counts.resolved_calls}
          onClick={() => handleCardClick("resolved")}
        />

        {/* Follow Up */}
        <StatCard
          active={activeCard === "follow_up"}
          icon={<FiArrowUpRight />}
          bg="bg-blue-100"
          iconColor="text-blue-500"
          label="Follow-up"
          value={counts.follow_up_calls}
          onClick={() => handleCardClick("follow_up")}
        />

        {/* Forwarded */}
        <div
          onClick={() => handleCardClick("forwarded")}
          className={`cursor-pointer bg-white rounded-2xl p-6 shadow-sm relative ${activeCard === "forwarded" ? "border-2 border-[#7861E6]" : ""
            }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <FiMessageSquare className="text-purple-500" />
            </div>

            {/* Show badge using unseen_count */}
            {forwardNotification.has_unseen && (
              <span className="absolute top-4 right-4 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                {forwardNotification.unseen_count}
              </span>
            )}
          </div>

          <p className="text-sm text-gray-500">Forwarded</p>
          <h2 className="text-2xl font-bold text-gray-800 mt-1">
            {forwardNotification.total_forwarded || 0}
          </h2>
        </div>
      </div>

      {/* Table Section */}
      <h2 className="text-xl font-semibold text-gray-800 mb-6">
        {activeCard === "total"
          ? "Total Calls Data"
          : `${activeCard
            .replace("_", " ")
            .toLowerCase()
            .replace(/\b\w/g, (char) => char.toUpperCase())
          } Cases`}
      </h2>

      <div className="bg-white rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm bg-[#FFFFFF]">
            <thead className="bg-[#E9EDF2] text-[#62748E] text-xs uppercase">
              <tr className="min-h-[48px] h-[48px]">
                <th
                  className="px-6 py-3 text-left cursor-pointer hover:bg-[#E2E6EC] transition select-none"
                  onClick={(e) => {
                    e.preventDefault();
                    handleSort('CaseID');
                  }}
                >
                  <div className="flex items-center gap-1">
                    CASE ID
                    {sortConfig.key === 'CaseID' && sortConfig.direction === 'asc' && (
                      <span className="text-xs">↑</span>
                    )}
                    {sortConfig.key === 'CaseID' && sortConfig.direction === 'desc' && (
                      <span className="text-xs">↓</span>
                    )}
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-left cursor-pointer hover:bg-[#E2E6EC] transition select-none"
                  onClick={(e) => {
                    e.preventDefault();
                    handleSort('ClientName');
                  }}
                >
                  <div className="flex items-center gap-1">
                    CLIENT
                    {sortConfig.key === 'ClientName' && sortConfig.direction === 'asc' && (
                      <span className="text-xs">↑</span>
                    )}
                    {sortConfig.key === 'ClientName' && sortConfig.direction === 'desc' && (
                      <span className="text-xs">↓</span>
                    )}
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-left cursor-pointer hover:bg-[#E2E6EC] transition select-none"
                  onClick={(e) => {
                    e.preventDefault();
                    handleSort('CallType');
                  }}
                >
                  <div className="flex items-center gap-1">
                    TYPE
                    {sortConfig.key === 'CallType' && sortConfig.direction === 'asc' && (
                      <span className="text-xs">↑</span>
                    )}
                    {sortConfig.key === 'CallType' && sortConfig.direction === 'desc' && (
                      <span className="text-xs">↓</span>
                    )}
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-left cursor-pointer hover:bg-[#E2E6EC] transition select-none"
                  onClick={(e) => {
                    e.preventDefault();
                    handleSort('Priority');
                  }}
                >
                  <div className="flex items-center gap-1">
                    PRIORITY
                    {sortConfig.key === 'Priority' && sortConfig.direction === 'asc' && (
                      <span className="text-xs">↑</span>
                    )}
                    {sortConfig.key === 'Priority' && sortConfig.direction === 'desc' && (
                      <span className="text-xs">↓</span>
                    )}
                  </div>
                </th>
                <th
                  className="text-center cursor-pointer hover:bg-[#E2E6EC] transition select-none"
                  onClick={(e) => {
                    e.preventDefault();
                    handleSort('Status');
                  }}
                >
                  <div className="flex items-center justify-center gap-1">
                    STATUS
                    {sortConfig.key === 'Status' && sortConfig.direction === 'asc' && (
                      <span className="text-xs">↑</span>
                    )}
                    {sortConfig.key === 'Status' && sortConfig.direction === 'desc' && (
                      <span className="text-xs">↓</span>
                    )}
                  </div>
                </th>
               </tr>
            </thead>
            <tbody className="text-gray-600">
              {tableData.length > 0 ? (
                currentRows.map((row, index) => (
                  <tr key={index} className="hover:bg-gray-50 border-b border-[#F1F5F9]">
                    <td className="px-6 py-4">{row.CaseID}</td>
                    <td className="px-6 py-4">{row.ClientName}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-gray-100 rounded-md text-xs font-medium">
                        {row.CallType}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-sm font-medium ${row.Priority === "High" || row.Priority === "high"
                          ? "text-[#EC003F]"
                          : row.Priority === "medium"
                            ? "text-[#FE9A00]"
                            : "text-[#00BC7D]"
                          }`}
                      >
                        ● {row.Priority?.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}
                      </span>
                    </td>
                    <td className="text-center align-middle">
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full ${row.Status === "Resolved"
                          ? "bg-[#ECFDF5] text-[#007A55]"
                          : row.Status === "Follow_up" || row.Status === "Followup"
                            ? "bg-[#FFFBEB] text-[#BB4D00]"
                            : row.Status === "Open"
                              ? "bg-[#EFF6FF] text-[#155DFC]"
                              : row.Status === "Closed"
                                ? "bg-[#F8FAFC] text-[#314158]"
                                : row.Status === "Pending Updates" || row.Status === "Pending_Updates"
                                  ? "bg-[#FAF5FF] text-[#8200DB]"
                                  : "bg-[#F1F5F9] text-[#45556C]"
                          }`}
                      >
                        {row.Status
                          ?.replace("_", " ")
                          .toLowerCase()
                          .replace(/\b\w/g, (c) => c.toUpperCase())}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-6 text-gray-400">
                    No records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="mt-6 px-6 py-3 flex flex-wrap items-center justify-between gap-3">

          <p className="text-xs text-[#45556C] whitespace-nowrap">
            Showing {indexOfFirstRow + 1} to{" "}
            {Math.min(indexOfLastRow, tableData.length)} of{" "}
            {tableData.length} Results
          </p>

          <div className="flex flex-wrap items-center gap-1 justify-end">

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

/* Reusable Stat Card */
function StatCard({
  icon,
  bg,
  iconColor,
  label,
  value,
  onClick,
  active,
}) {
  return (
    <div
      onClick={onClick}
      className={`cursor-pointer bg-white rounded-2xl p-6 shadow-sm ${active ? "border-2 border-[#7861E6]" : ""
        }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2 ${bg} rounded-lg`}>
          <span className={iconColor}>{icon}</span>
        </div>
      </div>
      <p className="text-sm text-gray-500">{label}</p>
      <h2 className="text-2xl font-bold text-gray-800 mt-1">
        {value || 0}
      </h2>
    </div>
  );
}