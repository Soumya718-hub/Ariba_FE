import React, { useState, useEffect } from 'react';
import { DatePicker, Button, Table, Typography, Space, Alert, Spin } from 'antd';
import { Filter, RotateCcw, ArchiveX, Download, ListFilter, CalendarMinus2, Folder } from 'lucide-react';
import { format } from 'date-fns';
import { getArchivedCases } from '../../api/backdated';

const { Text, Title } = Typography;

const ArchivedCases = () => {
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [archivedData, setArchivedData] = useState(null);
  const [error, setError] = useState(null);
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
        if (sortKey === 'archived_date') {
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
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    setError(null);

    try {
        const response = await getArchivedCases(); // no filter initially

        if (response.success) {
            setArchivedData(response);
            // Reset sorting when fetching new data
            setSortConfig({ key: null, direction: null });
        } else {
            setError(response.message || "Failed to fetch archived cases");
        }
    } catch (err) {
        setError("An error occurred while fetching data");
    } finally {
        setLoading(false);
    }
};
 const handleApplyFilter = async () => {
    if (!startDate || !endDate) {
      setError('Please select both start and end dates');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await getArchivedCases({
        startDate: startDate.format('YYYY-MM-DD'),
        endDate: endDate.format('YYYY-MM-DD'),
      });
      if (response.success) {
        setArchivedData(response);
        // Reset sorting when applying new filters
        setSortConfig({ key: null, direction: null });
      } else {
        setError(response.message || 'Failed to fetch archived cases');
      }
    } catch (err) {
      setError('An error occurred while fetching data');
    } finally {
      setLoading(false);
    }
};

const handleReset = () => {
    setStartDate(null);
    setEndDate(null);
    setError(null);
    setSortConfig({ key: null, direction: null }); // Reset sorting
    fetchInitialData();   // reload all data
};
// Get sorted data for current page

  const formatDate = (d) => {
    if (!d) return "N/A";
    return format(new Date(d.replace(" ", "T")), "MM/dd/yyyy");
  };
  const getPriorityClass = (p) => {
    const priority = p?.toLowerCase();

    if (priority === "high") return "text-[#EC003F]";
    if (priority === "medium" || priority === "normal") return "text-[#FE9A00]";
    if (priority === "low") return "text-[#00BC7D]";

    return "text-gray-500";
  };

  const getStatusClass = (status) => {
    const s = status?.toLowerCase();

    if (s === "resolved") return "bg-[#ECFDF5] text-[#007A55]";
    if (s === "follow_up" || s === "followup") return "bg-[#FFFBEB] text-[#BB4D00]";
    if (s === "open") return "bg-[#EFF6FF] text-[#155DFC]";
    if (s === "closed") return "bg-[#F8FAFC] text-[#314158]";
    if (s === "pending updates" || s === "pending_updates")
      return "bg-[#FAF5FF] text-[#8200DB]";

    return "bg-[#F1F5F9] text-[#45556C]";
  };

 const columns = [
    {
        title: (
            <div className="flex items-center gap-1 cursor-pointer" onClick={() => handleSort('CaseID')}>
                CASE ID
                {sortConfig.key === 'CaseID' && sortConfig.direction === 'asc' && <span className="ml-1">↑</span>}
                {sortConfig.key === 'CaseID' && sortConfig.direction === 'desc' && <span className="ml-1">↓</span>}
            </div>
        ),
        dataIndex: 'CaseID',
        render: (t) => <a className="!text-[#7861E6] font-medium" href="#">{t}</a>,
    },
    {
        title: (
            <div className="flex items-center gap-1 cursor-pointer" onClick={() => handleSort('ClientName')}>
                CLIENT
                {sortConfig.key === 'ClientName' && sortConfig.direction === 'asc' && <span className="ml-1">↑</span>}
                {sortConfig.key === 'ClientName' && sortConfig.direction === 'desc' && <span className="ml-1">↓</span>}
            </div>
        ),
        dataIndex: 'ClientName',
        render: (t) => t ? <a className="!text-[#314158]" href="#">{t}</a> : 'N/A',
    },
    {
        title: (
            <div className="flex items-center gap-1 cursor-pointer" onClick={() => handleSort('CallType')}>
                TYPE
                {sortConfig.key === 'CallType' && sortConfig.direction === 'asc' && <span className="ml-1">↑</span>}
                {sortConfig.key === 'CallType' && sortConfig.direction === 'desc' && <span className="ml-1">↓</span>}
            </div>
        ),
        dataIndex: 'CallType',
        render: (t) => (
            <span className="bg-gray-100 rounded px-3 py-0.5 text-xs text-[#45556C] font-medium">
                {t || 'REQ'}
            </span>
        ),
    },
    {
        title: (
            <div className="flex items-center gap-1 cursor-pointer" onClick={() => handleSort('Priority')}>
                PRIORITY
                {sortConfig.key === 'Priority' && sortConfig.direction === 'asc' && <span className="ml-1">↑</span>}
                {sortConfig.key === 'Priority' && sortConfig.direction === 'desc' && <span className="ml-1">↓</span>}
            </div>
        ),
        dataIndex: "Priority",
        render: (t) => (
            <span className={`text-sm font-medium ${getPriorityClass(t)}`}>
                ● {t?.toUpperCase()}
            </span>
        )
    },
    {
        title: (
            <div className="flex items-center justify-center gap-1 cursor-pointer" onClick={() => handleSort('Status')}>
                STATUS
                {sortConfig.key === 'Status' && sortConfig.direction === 'asc' && <span className="ml-1">↑</span>}
                {sortConfig.key === 'Status' && sortConfig.direction === 'desc' && <span className="ml-1">↓</span>}
            </div>
        ),
        dataIndex: "Status",
        render: (t) => (
            <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusClass(t)}`}>
                {t?.replace("_", " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
            </span>
        )
    },
    {
        title: (
            <div className="flex items-center gap-1 cursor-pointer" onClick={() => handleSort('archived_date')}>
                DATE
                {sortConfig.key === 'archived_date' && sortConfig.direction === 'asc' && <span className="ml-1">↑</span>}
                {sortConfig.key === 'archived_date' && sortConfig.direction === 'desc' && <span className="ml-1">↓</span>}
            </div>
        ),
        dataIndex: 'archived_date',
        render: (t) => <a className="!text-[#314158]" href="#">{formatDate(t)}</a>
    },
    {
        title: (
            <div className="flex items-center gap-1 cursor-pointer" onClick={() => handleSort('current_owner_name')}>
                USER
                {sortConfig.key === 'current_owner_name' && sortConfig.direction === 'asc' && <span className="ml-1">↑</span>}
                {sortConfig.key === 'current_owner_name' && sortConfig.direction === 'desc' && <span className="ml-1">↓</span>}
            </div>
        ),
        dataIndex: 'current_owner_name',
        render: (t) => t ? <a className="!text-[#314158]" href="#">{t}</a> : 'N/A',
    },
];

  const hasData = archivedData?.count > 0;
  const noData = archivedData && archivedData.count === 0;

  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;

  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;

  // Get sorted data for current page
const getSortedData = () => {
    if (!archivedData?.data) return [];
    if (sortConfig.direction) {
        return sortData(archivedData.data, sortConfig.key, sortConfig.direction);
    }
    return archivedData.data;
};

const sortedData = getSortedData();
const currentRows = sortedData.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil((archivedData?.data?.length || 0) / rowsPerPage);

  useEffect(() => {
    setCurrentPage(1);
}, [archivedData, sortConfig]); // Add sortConfig to dependency

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
    <div className="bg-[#f4f6fb] min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-start mb-6 ">
        <div>
          <Title level={3} className="!m-0 !font-bold text-[#1D293D]">Archive</Title>
          <Text className='!text-[16px] !text-[#62748E]'>Generate and view administrative reports for case activity.</Text>
        </div>
        {/* <Button
          icon={<Download size={16} />}
          disabled={!hasData}
          className={`
            ${hasData ? 'bg-[#5b5bd6] border-[#5b5bd6] text-white' : 'bg-[#c7c7e8] border-[#c7c7e8] text-[#5b5bd6]'}
            rounded-lg h-[38px] font-medium flex items-center gap-1.5
          `}
        >
          Download as CSV
        </Button> */}
      </div>

      {/* Filter Card */}
      <div className="border border-gray-200 rounded-xl p-6 mb-6 bg-[#FFFFFF]">

        {/* Header */}
        <div className="flex items-center gap-2 mb-5">
          <ListFilter size={15} className="text-[#000000]" />
          <Text className="!text-[16px] !font-bold text-[#000000]">
            Date Range Filter
          </Text>
        </div>

        {/* Fields Row */}
        <div className="flex items-end gap-4 w-full">

          {/* Start Date */}
          <div className="flex-[2]">
            <div className="text-[12px] font-bold text-[#62748E] mb-1.5 uppercase tracking-wide">
              START DATE
            </div>
            <DatePicker
              value={startDate}
              onChange={(date) => setStartDate(date)}
              format="MM/DD/YYYY"
              placeholder="mm/dd/yyyy"
              suffixIcon={<CalendarMinus2 size={16} strokeWidth={2.5} className="text-[#90A1B9]" />}
              className="!h-[40px] !w-full !rounded-xl"
            />
          </div>

          {/* End Date */}
          <div className="flex-[2]">
            <div className="text-[12px] font-bold text-[#62748E] mb-1.5 uppercase tracking-wide">
              END DATE
            </div>
            <DatePicker
              value={endDate}
              onChange={(date) => setEndDate(date)}
              format="MM/DD/YYYY"
              placeholder="mm/dd/yyyy"
              suffixIcon={<CalendarMinus2 size={16} strokeWidth={2.5} className="text-[#90A1B9]" />}
              className="!h-[40px] !w-full !rounded-xl"
            />
          </div>

          {/* Apply Button */}
          <div className="flex-[1]">
            <Button
              type="primary"
              onClick={handleApplyFilter}
              disabled={!startDate || !endDate}
              loading={loading}
              icon={!loading && <Filter size={14} strokeWidth={2.5} />}
              className="!bg-[#7861E6] hover:!bg-[#7861E6] !border-none !rounded-lg
             !h-[40px] !font-medium w-full flex items-center
             justify-center gap-2 !text-white
             disabled:!text-white disabled:!opacity-50"
            >
              Apply Filter
            </Button>
          </div>

          {/* Reset Button */}
          <div className="flex-[1]">
            <Button
              onClick={handleReset}
              icon={<RotateCcw size={14} />}
              className="!bg-gray-200 hover:!bg-gray-300 !text-gray-700
                   !border-none !rounded-lg !h-[40px]
                   !font-medium w-full flex items-center
                   justify-center gap-2"
            >
              Reset
            </Button>
          </div>

        </div>
      </div>

      {error && <Alert message={error} type="error" showIcon className="!mb-4 !rounded-lg" />}
      {loading && <div className="flex justify-center py-12"><Spin size="large" /></div>}

      {!loading && noData && (
        <div className="border border-gray-200 rounded-lg py-14 px-6 text-center bg-white">
          <div className="flex justify-center mb-4"><ArchiveX size={48} color="#bfbfbf" /></div>
          <div className="text-base font-semibold mb-1.5">No Data Found</div>
          <div className="text-gray-500 text-sm">We couldn't find any archived log entries for the selected criteria.</div>
          <div className="text-gray-500 text-sm">Try adjusting your date range or filters.</div>
        </div>
      )}

      {!loading && hasData && (
        <>
          {/* Result Header Card */}
          <div className="mt-6">
            <h2 className="!text-[#1D293D] !text-[18px] !font-bold ml-1">
              Result
            </h2>
          </div>

          {/* Table Card */}
          <div className="border border-gray-200 rounded-lg bg-white mt-4 overflow-hidden">
            <Table
              dataSource={currentRows}
              columns={columns}
              className="custom-table-header"
              rowKey="LogID"
              pagination={false}
              size="middle"
            />


          </div>
          {totalPages > 1 && (
            <div className="mt-6 px-6 py-3 flex flex-wrap items-center justify-between gap-3">

              <div className="text-sm text-gray-500">
                Showing {indexOfFirstRow + 1} to{" "}
                {Math.min(indexOfLastRow, archivedData?.data?.length || 0)} of{" "}
                {archivedData?.data?.length || 0} Results
              </div>

              <div className="flex items-center gap-1">

                {/* Previous */}
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => prev - 1)}
                  className="w-8 h-8 flex items-center justify-center rounded-md border border-[#E2E8F0] bg-white text-[#45556C] hover:bg-gray-100 disabled:opacity-40"
                >
                  ‹
                </button>

                {getVisiblePages().map((page, index) =>
                  page === "..." ? (
                    <span key={index} className="px-2 text-[#94A3B8] text-sm">...</span>
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

                {/* Next */}
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  className="w-8 h-8 flex items-center justify-center rounded-md border border-[#E2E8F0] bg-white text-[#45556C] hover:bg-gray-100 disabled:opacity-40"
                >
                  ›
                </button>

              </div>
            </div>
          )}
        </>
      )}

      <style>{`
.ant-table-tbody > tr:hover > td { 
  background: #f5f5ff !important; 
}
`}</style>
    </div>
  );
};

export default ArchivedCases;