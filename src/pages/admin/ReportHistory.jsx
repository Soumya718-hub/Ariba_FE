import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Table,
  Typography,
  Space,
  Button,
  Spin,
  message,
  Tooltip
} from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { getCaseHistoryForReport } from '../../api/report';
import { ArrowLeft } from "lucide-react";

const { Text } = Typography;

const getPriorityCell = (priority) => {
  if (!priority) return null;

  const lower = priority.toLowerCase();

  const color =
    lower === "high"
      ? "text-[#EC003F]"
      : lower === "medium"
        ? "text-[#FE9A00]"
        : "text-[#009966]";

  const displayText = priority.charAt(0).toUpperCase() + priority.slice(1);

  return (
    <span className="flex items-center gap-1">
      <span className={`text-[10px] leading-none ${color}`}>●</span>
      <span className={`text-sm font-medium ${color}`}>
        {displayText}
      </span>
    </span>
  );
};

const getStatusBadge = (status) => {
  if (!status) return null;
  const lower = status.toLowerCase();

  let cls = 'border-gray-300 bg-gray-100 text-gray-600';
  if (lower.includes('open'))
    cls = 'border-blue-300 bg-blue-50 text-blue-600';
  else if (lower.includes('closed'))
    cls = 'border-gray-300 bg-gray-100 text-gray-600';
  else if (lower.includes('follow_up'))
    cls = 'border-yellow-300 bg-yellow-50 text-yellow-500';
  else if (lower.includes('archived'))
    cls = 'border-purple-300 bg-purple-50 text-purple-600';
  else if (lower.includes('resolved'))
    cls = 'border-green-300 bg-green-50 text-green-600';
  else if (lower.includes('pending_updates'))
    cls = 'border-purple-300 bg-purple-50 text-purple-600';


  return (
    <span
      className={`inline-block border px-2 py-0.5 rounded-2xl text-[11px] font-semibold tracking-wide uppercase text-nowrap ${cls}`}
    >
      {status.replace('_', ' ')}
    </span>
  );
};

const ReportHistory = () => {
  const { caseId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [caseData, setCaseData] = useState(null);
  const [error, setError] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  useEffect(() => {
    fetchCaseHistory();
  }, [caseId]);

  useEffect(() => {
    if (caseData?.history) {
      setCurrentPage(1);
    }
  }, [caseData]);

  const fetchCaseHistory = async () => {
    setLoading(true);
    try {
      const response = await getCaseHistoryForReport(caseId);
      if (response.success) {
        setCaseData(response.data);
      } else {
        setError(response.message || 'Failed to fetch case history');
        message.error(response.message || 'Failed to fetch case history');
      }
    } catch (err) {
      setError('An error occurred while fetching case history');
      message.error('An error occurred while fetching case history');
    } finally {
      setLoading(false);
    }
  };

  const getVisiblePages = () => {
    const pages = [];

    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
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

  const handleBack = () => navigate(-1);

  const columns = [
    {
      title: 'Username',
      dataIndex: 'modified_by_name',
      key: 'modified_by_name',
      width: 120,
      render: (text) => (
        <span className="!text-[#62748E] !text-[14px]  text-nowrap">{text || 'N/A'}</span>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'activity_date',
      key: 'activity_date',
      width: 110,
      render: (text) => (
        <span className="!text-[#62748E] !text-[14px]">
          {text ? dayjs(text).format('YYYY-MM-DD') : 'N/A'}
        </span>
      ),
      sorter: (a, b) =>
        dayjs(a.activity_date).unix() - dayjs(b.activity_date).unix(),
      defaultSortOrder: 'descend',
    },
    {
      title: 'Client ',
      key: 'client_buyer',
      width: 160,
      render: (_, record) => (
        <div>
          <div className="font-semibold !text-[#62748E] !text-[14px]">
            {record.ClientName || 'N/A'}
          </div>
          <div className="!text-[#62748E] !text-[14px]">{record.BuyerName || ''}</div>
        </div>
      ),
    },
    {
      title: 'Type & Mode',
      key: 'type_mode',
      width: 140,
      render: (_, record) => (
        <span className="flex items-center gap-1.5">
          {(record.CallType || record.PO_subtype) && (
            <span className="inline-block px-1.5 py-0.5 bg-[#F1F5F9] text-[#45556C] rounded text-xs font-semibold">
              {record.CallType || record.PO_subtype}
            </span>
          )}
          {record.CallMode && (
            <span className="!text-[#62748E] !text-[14px]">{record.CallMode}</span>
          )}
        </span>
      ),
    },
    {
      title: 'Priority',
      dataIndex: 'Priority',
      key: 'Priority',
      width: 100,
      render: (text) => getPriorityCell(text),
    },
    {
      title: 'Forwarded To',
      dataIndex: 'forwarded_to_name',
      key: 'forwarded_to_name',
      width: 140,
      render: (text) => (
        <span className="!text-[#62748E] !text-[14px]">{text || 'N/A'}</span>
      ),
    },
    {
      title: (
        <span>
          Remarks Buyer/<br />Supplier
        </span>
      ),
      dataIndex: 'RemarksBuyerSupplier',
      key: 'RemarksBuyerSupplier',
      width: 170,
      render: (text) => (
        <Tooltip title={text}>
          <span className="!text-[#62748E] !text-[14px] cursor-pointer">
            {text ? (text.length > 20 ? text.substring(0, 20) + '...' : text) : '—'}
          </span>
        </Tooltip>
      ),
    },
    {
      title: (
        <span>
          Remarks Internal/<br />Follow-Up
        </span>
      ),
      dataIndex: 'RemarksInternal',
      key: 'RemarksInternal',
      width: 180,
      render: (text) => (
        <Tooltip title={text}>
          <span className="!text-[#62748E] !text-[14px] cursor-pointer">
            {text ? (text.length > 22 ? text.substring(0, 22) + '...' : text) : '—'}
          </span>
        </Tooltip>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'Status',
      key: 'Status',
      width: 120,
      className: "text-center",
      render: (text) => getStatusBadge(text),
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <Spin size="large" tip="Loading..." style={{ color: '#7861E6' }} />
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div className="p-0 bg-gray-100 min-h-screen">
        <div className="bg-white rounded-lg p-12 text-center">
          <Text type="danger">{error || 'Case history not found'}</Text>
          <div className="mt-4">
            <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const { case_info, history } = caseData;
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;

  const currentRows = history?.slice(indexOfFirstRow, indexOfLastRow) || [];

  const totalPages = Math.ceil((history?.length || 0) / rowsPerPage);

  return (
    <div className=" min-h-screen p-0 md:p-0 font-sans">

      {/* Top card: Back + Case ID */}
      {/* Top header */}
      <div className="flex items-start gap-4 mb-6">

        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-4 py-2
    rounded-2xl
    border border-[#CFE0F6]
    bg-white
    hover:bg-gray-50
    text-sm font-semibold text-gray-700
    transition-all duration-200"
        >
          <ArrowLeft size={20} strokeWidth={2.5} />
          Back
        </button>

        {/* Result + CaseID */}
        <div className="flex flex-col leading-tight">
          <span className="text-lg font-bold text-gray-800">
            Result
          </span>

          <a
            href="#"
            className="text-[#7861E6] text-sm font-medium "
          >
            {case_info?.CaseID || "CAS-2026-FEB-101"}
          </a>
        </div>

      </div>

      {/* Result card */}
      <div className="flex-1 min-h-0 overflow-hidden rounded-2xl">
        <div className="h-full bg-[#f7f8f9] shadow-sm overflow-x-auto">

          {/*
          Ant Design's table header/cell styles can't be overridden with pure Tailwind
          since they require CSS specificity targeting internal AntD class names.
          This minimal scoped block only targets AntD internals — all component
          layout and content styling uses Tailwind exclusively.
        */}
          <style>{`
  /* TABLE CONTAINER */
  .rh-table .ant-table {
    background: #f7f8f9 !important;
  }

  /* HEADER */
  .rh-table .ant-table-thead > tr > th {
    background: #E9EDF2 !important;
    color: #62748E !important;
    font-size: 12px !important;
    font-weight: 600 !important;
    text-transform: uppercase !important;
    height: 64px !important;
    padding: 16px !important;
    border-bottom: none !important;
  }

  /* BODY CELLS */
  .rh-table .ant-table-tbody > tr > td {
    padding: 16px !important;
    border-bottom: 1px solid #E2E8F0 !important;
    background: white !important;
    vertical-align: middle !important;
  }

  /* ROW HOVER */
  .rh-table .ant-table-tbody > tr:hover > td {
    background: #fafafa !important;
  }

  /* REMOVE ANT DEFAULT BORDERS */
  .rh-table .ant-table-container table > thead > tr:first-child th {
    border-top: none !important;
  }

  /* SCROLL BAR MATCH */
  .rh-table .ant-table-body {
    background: #f7f8f9 !important;
  }
`}</style>

          <Table
            // className="rh-table text-sm"
            columns={columns}
            dataSource={currentRows}
            className="custom-table-header2"
            rowKey="LogID"
            loading={loading}
            pagination={false}
            scroll={{ x: 1100 }}
            size="large"
            locale={{
              emptyText: (
                <div className="py-10 text-gray-400 text-sm">
                  No activity history found
                </div>
              ),
            }}
          />

        </div>
        {totalPages > 1 && (
          <div className="mt-6 px-6 py-3 flex flex-wrap items-center justify-between gap-3">

            <p className="text-xs text-[#45556C] whitespace-nowrap">
              Showing {indexOfFirstRow + 1} to{" "}
              {Math.min(indexOfLastRow, history?.length || 0)} of{" "}
              {history?.length || 0} Results
            </p>

            <div className="flex flex-wrap items-center gap-1 justify-end">

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
    </div>

  );
};

export default ReportHistory;