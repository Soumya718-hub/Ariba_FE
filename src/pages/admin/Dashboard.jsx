import { useEffect, useState } from "react";
import {
  getAdminDashboardCounts,
  getWeeklySummary,
  getAdminFilteredCases,
} from "../../api/dashboard";
import { Phone, Clock, CircleCheck, ArrowUpRight } from "lucide-react";
import { DatePicker } from "antd";
import dayjs from "dayjs";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { FiCalendar } from "react-icons/fi";
const { RangePicker } = DatePicker;

export default function Dashboard() {
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  const [showCalendar, setShowCalendar] = useState(false);
  const [dateRange, setDateRange] = useState(null);
  const [counts, setCounts] = useState({
    total_calls: 0,
    open_calls: 0,
    resolved_calls: 0,
    follow_up_calls: 0,
    pending_updates: 0,
    closed_calls: 0
  });
  const [weeklyData, setWeeklyData] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [activeCard, setActiveCard] = useState("total");
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

  // Sorting function with custom orders and 3-state support
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
      // If clicking a new column, set to asc
      if (prevConfig.key !== key) {
        return {
          key: key,
          direction: 'asc'
        };
      }
      
      // If clicking the same column
      // Toggle: asc -> desc -> default (null)
      if (prevConfig.direction === 'asc') {
        return {
          key: key,
          direction: 'desc'
        };
      } else if (prevConfig.direction === 'desc') {
        return {
          key: null,
          direction: null
        };
      } else {
        // If default, set to asc
        return {
          key: key,
          direction: 'asc'
        };
      }
    });
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [dateRange, activeCard, sortConfig]);

  // Updated: Fetch counts with date range
  const fetchDashboardCountsOnly = async (startDate = null, endDate = null) => {
    const countRes = await getAdminDashboardCounts({ startDate, endDate });

    if (countRes?.success) {
      const cards = countRes.data?.cards || {};

      setCounts({
        total_calls: parseInt(cards.total_calls) || 0,
        open_calls: parseInt(cards.open_calls) || 0,
        resolved_calls: parseInt(cards.resolved_calls) || 0,
        follow_up_calls: parseInt(cards.follow_up_calls) || 0,
        pending_updates: parseInt(cards.pending_updates) || 0,
        closed_calls: parseInt(cards.closed_calls) || 0
      });
    }
  };

  // Updated: Fetch dashboard with date range
  const fetchDashboard = async () => {
    const startDate = dateRange?.startDate || null;
    const endDate = dateRange?.endDate || null;
    
    // Fetch counts with date range
    await fetchDashboardCountsOnly(startDate, endDate);
    
    // Fetch weekly summary (this might not be affected by date range)
    const weeklyRes = await getWeeklySummary();
    if (weeklyRes?.success) {
      setWeeklyData(weeklyRes.data);
    }

    // Fetch table data for active card with date range
    const tableRes = await getAdminFilteredCases({
      cardType: activeCard,
      startDate,
      endDate,
    });

    if (tableRes?.success) {
      setTableData(tableRes.data);
    }
  };

  const fetchFilteredData = async (type, startDate = null, endDate = null) => {
    const res = await getAdminFilteredCases({
      cardType: type,
      startDate,
      endDate,
    });

    if (res?.success) {
      setTableData(res.data);
    }
  };

  const handleCardClick = async (type) => {
    setActiveCard(type);
    setCurrentPage(1);
    setTableData([]);
    // Reset sorting when changing cards
    setSortConfig({ key: null, direction: null });

    fetchFilteredData(
      type,
      dateRange?.startDate,
      dateRange?.endDate
    );
  };

  // Handle date range change
  const handleDateRangeChange = (dates) => {
    if (!dates) {
      setDateRange(null);
      setCurrentPage(1);
      // Reset sorting when clearing date range
      setSortConfig({ key: null, direction: null });
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
      // Reset sorting when changing date range
      setSortConfig({ key: null, direction: null });
      
      // Refresh counts with new date range
      fetchDashboardCountsOnly(startDate, endDate);
      // Refresh table data with new date range
      fetchFilteredData(activeCard, startDate, endDate);
    }
  };

  // Pagination calculations with sorting
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const sortedTableData = sortConfig.direction ? sortData(tableData, sortConfig.key, sortConfig.direction) : tableData;
  const currentRows = sortedTableData?.slice(indexOfFirstRow, indexOfLastRow) || [];
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

  return (
    <div className="min-h-screen">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">
          Dashboard Overview
        </h2>
      </div>

      {/* WEEKLY SUMMARY */}
      <div className="bg-white rounded-xl p-5 shadow-sm mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className=" text-lg font-semibold text-gray-800">
              Weekly Summary Report
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Call volume distribution for the current week
            </p>
          </div>

          <div className="text-sm flex items-center gap-2">
            <span className="text-[#7861E6]">●</span>
            <span className="text-[#62748E]">
              Total calls: {weeklyData.reduce((sum, d) => sum + (d.total || 0), 0)}
            </span>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={weeklyData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="day" />
            <YAxis
              allowDecimals={false}
              domain={[0, "dataMax + 1"]}
              tickCount={6}
            />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="total"
              stroke="#8979FF"
              strokeWidth={3}
              dot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="flex justify-end mb-6 relative">
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

      {/* CARDS */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          {
            key: "total",
            label: "Total Calls",
            value: counts.total_calls,
            icon: <Phone size={18} className="text-[#7861E6]" />,
            bg: "bg-[#EEF2FF]",
          },
          {
            key: "open",
            label: "Open Calls",
            value: counts.open_calls,
            icon: <Clock size={18} className="text-[#F59E0B]" />,
            bg: "bg-[#FFF7ED]",
          },
          {
            key: "resolved",
            label: "Resolved",
            value: counts.resolved_calls,
            icon: <CircleCheck size={18} className="text-[#10B981]" />,
            bg: "bg-[#ECFDF5]",
          },
          {
            key: "follow_up",
            label: "Follow-up",
            value: counts.follow_up_calls,
            icon: <ArrowUpRight size={18} className="text-[#7861E6]" />,
            bg: "bg-[#EEF2FF]",
          },
        ].map((card) => (
          <div
            key={card.key}
            onClick={() => handleCardClick(card.key)}
            className={`cursor-pointer bg-white rounded-2xl px-6 py-4 shadow-sm border-2 transition h-[150px]
  ${activeCard === card.key
                ? "border-[#7861E6]"
                : "border-transparent hover:border-gray-200"}
`}
          >
            {/* ICON */}
            <div
              className={`w-10 h-10 flex items-center justify-center rounded-full mb-3 ${card.bg}`}
            >
              {card.icon}
            </div>

            {/* LABEL */}
            <p className="text-sm text-gray-500">{card.label}</p>

            {/* VALUE */}
            <h3 className="text-2xl font-semibold text-gray-800 mt-1">
              {card.value || 0}
            </h3>
          </div>
        ))}
      </div>

      {/* TABLE */}
      <div className="mb-6">
        <div className="p-4">
          <h3 className="text-xl font-semibold text-gray-800">
            {activeCard === "total"
              ? "Total Logged Calls Data"
              : `${activeCard
                .replace("_", " ")
                .toLowerCase()
                .replace(/\b\w/g, (c) => c.toUpperCase())
              } Calls Data`}
          </h3>
        </div>

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

              <tbody>
                {currentRows?.map((row, index) => (
                  <tr
                    key={index}
                    className="hover:bg-gray-50 border-b border-[#F1F5F9]"
                  >
                    <td className="px-6 py-4">{row.CaseID}</td>
                    <td className="px-6 py-4">{row.ClientName}</td>
                    <td className="px-6 py-4">
                      <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs">
                        {row.CallType}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-sm font-medium ${row.Priority === "High" || row.Priority === "high"
                          ? "text-[#EC003F]"
                          : row.Priority === "Medium" || row.Priority === "medium"
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
                ))}

                {tableData.length === 0 && (
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

            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => prev - 1)}
                className="w-8 h-8 flex items-center justify-center rounded-md border border-[#E2E8F0] bg-white text-[#45556C] hover:bg-gray-100 disabled:opacity-40"
              >
                ‹
              </button>

              {getVisiblePages().map((page, index) =>
                page === "..." ? (
                  <span key={index} className="px-2 text-[#94A3B8] text-sm">
                    ...
                  </span>
                ) : (
                  <button
                    key={index}
                    onClick={() => setCurrentPage(page)}
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

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((prev) => prev + 1)}
                className="w-8 h-8 flex items-center justify-center rounded-md border border-[#E2E8F0] bg-white text-[#45556C] hover:bg-gray-100 disabled:opacity-40"
              >
                ›
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}