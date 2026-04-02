import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { DatePicker, Button, Table, Typography, Space, Card, Row, Col, Input, Select, message, Spin } from 'antd';
import { ListFilter, CalendarMinus2, Folder, Funnel, FunnelX } from "lucide-react"
import { DownloadOutlined } from '@ant-design/icons';
import { Pagination } from "antd";
import dayjs from 'dayjs';
import { getReportsData, exportReportsToCSV } from '../../api/report';
import { getAllClients, getAllAribaEmp } from '../../api/case';
import { getAllEmployees } from "../../api/hrms"
import * as XLSX from 'xlsx';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const Reports = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isSuperAdmin = location.pathname.startsWith("/superadmin");

  const [page, setPage] = useState(1);
  const pageSize = 5;
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const [filters, setFilters] = useState({
  caseId: '',
  dateRange: null,
  username: undefined,  
  clientId: null,
  status: undefined  // Add this line
});
  const [reportData, setReportData] = useState(null);
  const [error, setError] = useState(null);

  // State for API data
  const [employees, setEmployees] = useState([]);
  const [clients, setClients] = useState([]);

  useEffect(() => {
    if (!initialLoading) {
      handleApplyFilter();
    }
  }, [page, initialLoading]);

  // Fetch employees and clients on component mount
  useEffect(() => {
    const fetchInitialData = async () => {
  setInitialLoading(true);
  try {
    // Fetch both APIs in parallel
    const [employeesData, clientsRes] = await Promise.all([
      getAllEmployees(),   // Changed back to getAllEmployees
      getAllClients()      // This returns { success, data }
    ]);

    console.log("Employees data:", employeesData); // Debug: see what you get
    console.log("Clients response:", clientsRes);   // Debug: see what you get

    // Process employees data - handle array directly
    if (Array.isArray(employeesData) && employeesData.length > 0) {
      setEmployees(employeesData);
      console.log("Employees set successfully:", employeesData.length, "employees");
    } else {
      console.error('Failed to fetch employees:', employeesData);
      message.error('Failed to load employees list');
      setEmployees([]);
    }

    // Process clients data - keep as is
    if (clientsRes?.success && clientsRes.data) {
      setClients(clientsRes.data);
    } else {
      console.error('Failed to fetch clients:', clientsRes);
      message.error('Failed to load clients list');
    }
  } catch (error) {
    console.error('Error fetching initial data:', error);
    message.error('Failed to load filter options');
  } finally {
    setInitialLoading(false);
  }
};

    fetchInitialData();
  }, []);

  const handleFilterChange = (key, value) => setFilters(prev => ({ ...prev, [key]: value }));

  const handleDateRangeChange = (dates) => {
    setFilters(prev => ({
      ...prev,
      dateRange: dates,
      startDate: dates ? dates[0] : null,
      endDate: dates ? dates[1] : null
    }));
  };

  const handleApplyFilter = async () => {
  setLoading(true);
  setError(null);
  try {
    const apiFilters = {
      page,
      limit: pageSize,
      caseId: filters.caseId || undefined,
      startDate: filters.dateRange && filters.dateRange[0] ? filters.dateRange[0].format('YYYY-MM-DD') : undefined,
      endDate: filters.dateRange && filters.dateRange[1] ? filters.dateRange[1].format('YYYY-MM-DD') : undefined,
      username: filters.username ? filters.username : undefined,
      clientId: filters.clientId !== 'All Client' ? filters.clientId : undefined,
      status: filters.status || undefined  // Add this line
    };
    const response = await getReportsData(apiFilters);
      if (response.success) {
        setReportData(response);
        if (page === 1) {
          // message.success('Reports data loaded successfully');
        }
      } else {
        setError(response.message || 'Failed to fetch reports data');
        message.error(response.message || 'Failed to fetch reports data');
      }
    } catch (err) {
      setError('An error occurred while fetching data');
      message.error('An error occurred while fetching data');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (p) => {
    setPage(p);
  };

  const handleReset = () => {
  setFilters({
    caseId: '',
    dateRange: null,
    username: undefined,
    clientId: '',
    status: undefined  // Add this line
  });
  setReportData(null);
  setError(null);
};

  const handleDownloadCSV = async () => {
  if (!reportData?.data?.length) {
    message.warning('No data to download');
    return;
  }

  setExportLoading(true);
  try {
    // Prepare the same filters that were used for the current report
    const exportFilters = {
      caseId: filters.caseId || undefined,
      startDate: filters.dateRange && filters.dateRange[0] ? filters.dateRange[0].format('YYYY-MM-DD') : undefined,
      endDate: filters.dateRange && filters.dateRange[1] ? filters.dateRange[1].format('YYYY-MM-DD') : undefined,
      username: filters.username !== 'All Users' ? filters.username : undefined,
      clientId: filters.clientId !== 'All Client' ? filters.clientId : undefined,
      status: filters.status || undefined  // Add this line
    };

      // Call the export API
      const response = await exportReportsToCSV(exportFilters);

      // Extract data from response (your API returns { success: true, data: rows })
      const data = response.data || [];

      if (data.length === 0) {
        message.warning('No data to export');
        return;
      }

      // Define headers (including all fields you want)
      const headers = [
        'Case ID',
        'Client Name',
        'Call Type',
        'PO Subtype',
        'Call Mode',
        'Priority',
        'Status',
        'Created Date',
        'Follow Up Date',
        'Expiry Date',
        'Created By Name',
        'Forwarded To Name',
        'Current Owner Name',
        'Remarks Buyer/Supplier',
        'Remarks Internal'
      ];

      // Prepare data rows
      const dataRows = data.map(row => [
        row.CaseID || '',
        row.ClientName || '',
        row.CallType || '',
        row.PO_subtype || '',
        row.CallMode || '',
        row.Priority || '',
        row.Status || '',
        row.created_date ? dayjs(row.created_date).format('MM/DD/YYYY') : '',
        row.FollowUpDate ? dayjs(row.FollowUpDate).format('MM/DD/YYYY') : '',
        row.ExpiryDate ? dayjs(row.ExpiryDate).format('MM/DD/YYYY') : '',
        row.created_by_name || '',
        row.forwarded_to_name || '',
        row.current_owner_name || '',
        row.RemarksBuyerSupplier || '',
        row.RemarksInternal || ''
      ]);

      // Create worksheet
      const worksheetData = [headers, ...dataRows];
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

      // Set column widths
      const colWidths = [
        { wch: 20 }, // Case ID
        { wch: 25 }, // Client Name
        { wch: 15 }, // Call Type
        { wch: 15 }, // PO Subtype
        { wch: 15 }, // Call Mode
        { wch: 12 }, // Priority
        { wch: 20 }, // Status
        { wch: 15 }, // Created Date
        { wch: 15 }, // Follow Up Date
        { wch: 15 }, // Expiry Date
        { wch: 30 }, // Created By Name
        { wch: 30 }, // Forwarded To Name
        { wch: 30 }, // Current Owner Name
        { wch: 45 }, // Remarks Buyer/Supplier
        { wch: 45 }  // Remarks Internal
      ];
      worksheet['!cols'] = colWidths;

      // Style the header row
      for (let C = 0; C < headers.length; C++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C });
        if (!worksheet[cellAddress]) continue;

        worksheet[cellAddress].s = {
          font: { bold: true, sz: 12, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "7861E6" } },
          alignment: { horizontal: "center", vertical: "center" },
          border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } }
          }
        };
      }

      // Style data rows
      for (let R = 1; R <= dataRows.length; R++) {
        for (let C = 0; C < headers.length; C++) {
          const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
          if (!worksheet[cellAddress]) continue;

          // Set alignment based on column type
          let alignment = { vertical: "center" };

          // Date columns (7,8,9) - center align
          if (C === 7 || C === 8 || C === 9) {
            alignment.horizontal = "center";
          }
          // Remarks columns (14,15) - left align
          else if (C === 14 || C === 15) {
            alignment.horizontal = "left";
          }
          // Other columns - center align
          else {
            alignment.horizontal = "center";
          }

          worksheet[cellAddress].s = {
            font: { sz: 11 },
            alignment: alignment,
            border: {
              top: { style: "thin", color: { rgb: "E5EAF1" } },
              bottom: { style: "thin", color: { rgb: "E5EAF1" } },
              left: { style: "thin", color: { rgb: "E5EAF1" } },
              right: { style: "thin", color: { rgb: "E5EAF1" } }
            }
          };
        }
      }

      // Create workbook and download as .xlsx
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, worksheet, 'Reports');

      // Download as Excel file
      const fileName = `reports_${dayjs().format('DD-MM-YYYY')}.xlsx`;
      XLSX.writeFile(wb, fileName);

      message.success('Excel file downloaded successfully');
    } catch (error) {
      console.error('Export error:', error);
      message.error('Failed to download Excel file');
    } finally {
      setExportLoading(false);
    }
  };




  const handleCaseClick = (caseId) => {
    // Use relative navigation - this will work from both /admin/reports and /superadmin/reports
    navigate(`history/${caseId}`);
  };

  // Custom filter function for Select dropdowns
  const filterOption = (input, option) => {
    if (option?.children) {
      return option.children.toString().toLowerCase().includes(input.toLowerCase());
    }
    return false;
  };

  const PriorityBadge = ({ value }) => {
    if (!value) return <span>N/A</span>;
    const dotColor = value.toLowerCase() === 'high' ? '#ff4d4f' : value.toLowerCase() === 'medium' ? '#faad14' : '#52c41a';
    return (
      <Space size={4} className="flex items-center">
        <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: dotColor }} />
        <span className="font-medium capitalize" style={{ color: dotColor }}>{value}</span>
      </Space>
    );
  };

  const StatusBadge = ({ value }) => {
    if (!value) return <span>N/A</span>;
    const lower = value.toLowerCase();
    let bg = '#F3E8FF', color = '#8200DB';
    if (lower.includes('follow')) { bg = '#FFFBEB'; color = '#BB4D00'; }
    else if (lower === 'open') { bg = '#e6f4ff'; color = '#0958d9'; }
    else if (lower === 'closed') { bg = '#F1F5F9'; color = '#314158'; }
    return (
      <span
        className="px-3 py-1.5 rounded-xl text-[11px] font-semibold uppercase inline-block tracking-wide text-nowrap !text-center !align-middle"
        style={{ backgroundColor: bg, color }}
      >
        {value.replace('_', '-')}
      </span>
    );
  };

  const TypeBadge = ({ value }) => (
    <span className="px-3 py-1 text-xs font-medium bg-[#F1F5F9] text-[#314158] rounded-lg">
      {value}
    </span>
  );

  const columns = [
    {
      title: 'CASE ID',
      dataIndex: 'CaseID',
      key: 'CaseID',
      width: 120,
      render: (text) => (
        <Button
          type="link"
          className="!text-[#7861E6] !text-[14px] underline !font-medium !p-0 !h-auto text-left hover:!text-[#7861E6]"
          onClick={() => handleCaseClick(text)}
        >
          {text}
        </Button>
      )
    },
    { title: 'CLIENT', dataIndex: 'ClientName', key: 'ClientName', width: 120, render: (text) => <span className="text-[13px] !text-gray-700">{text || 'N/A'}</span> },
    { title: 'TYPE', dataIndex: 'CallType', key: 'CallType', width: 100, render: (text, record) => <TypeBadge value={text || record.PO_subtype} /> },
    {
      title: <div className="text-center">STATUS</div>, // ← ONLY title centered
      dataIndex: 'Status',
      key: 'Status',
      width: 120,
      className: "text-center",
      render: (text) => <StatusBadge value={text} />
    },
    { title: 'DATE', dataIndex: 'created_date', key: 'created_date', width: 100, render: (text) => dayjs(text).format('MM/DD/YYYY') },
    { title: 'USER', key: 'user', width: 120, render: (_, record) => record.current_owner_name?.split('(')[0]?.trim() || record.created_by_name?.split('(')[0]?.trim() || 'N/A' },
  ];

  // Show loading spinner while initial data is being fetched
  if (initialLoading) {
    return (
      <div className="p-0 max-w-[1400px] mx-auto min-h-screen flex justify-center items-center">
        <Spin size="large" tip="Loading filters..." style={{ color: '#7861E6' }} />
      </div>
    );
  }

  return (
    <div className="bg-[#f4f6fb] min-h-screen">
      <Row justify="space-between" align="middle" className="mb-4 bg-[#F5F7FB]" >
        <Col>
          <Title level={3} className="!m-0 !font-bold text-[#1D293D]">Reports</Title>
          <Text className=' !text-[16px] !text-[#62748E]'>Generate and view administrative reports for case activity.</Text>
        </Col>
        {isSuperAdmin && (
          <Col>
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={handleDownloadCSV}
              disabled={!reportData?.data?.length || exportLoading}
              loading={exportLoading}
              size="medium"
              className="flex items-center gap-2 px-5 !h-[38px] rounded-xl text-sm font-medium !bg-[#7861E6] !text-white hover:!bg-[#6f59d4]"
            >
              {exportLoading ? 'Downloading...' : 'Download as Excel'}
            </Button>
          </Col>
        )}
      </Row>

      <Card className="mb-2 rounded-lg border bg-[#FFFFFF]" bodyClassName="!p-5 md:!p-6">
        <Row align="middle" className="mb-4">
          <Space>
            <ListFilter className="text-base text-[#000000] h-[16px]" />
            <Text className="text-base text-[#000000] !text-[16px] font-bold">Filter Criteria</Text>
          </Space>
        </Row>

        {/* Filter Fields - All in one row */}
        <Row gutter={[16, 16]} justify="start" align="bottom">
          {/* Case ID - 4.8 columns (approx 20% width) */}
          <Col xs={24} sm={12} md={5} lg={5}>
            <label className="text-[12px] font-bold text-[#62748E] tracking-wider mb-1.5 block uppercase">
              SEARCH BY CASEID
            </label>
            <Input
              placeholder="e.g CAS-2026"
              value={filters.caseId}
              onChange={(e) => handleFilterChange('caseId', e.target.value)}
              allowClear
              className="!rounded-xl !h-[38px]"
            />
          </Col>

          {/* Date Range - 5 columns (approx 20% width) */}
          <Col xs={24} sm={12} md={5} lg={5}>
            <label className="text-[12px] font-bold !text-[#62748E] tracking-wider mb-1.5 block uppercase">
              DATE RANGE
            </label>
            <RangePicker
              value={filters.dateRange}
              onChange={handleDateRangeChange}
              format="MM/DD/YYYY"
              placeholder={['Start Date', 'End Date']}
              suffixIcon={<CalendarMinus2 size={16} strokeWidth={2.5} />}
              className="!w-full !rounded-xl !h-[38px]"
              allowClear
            />
          </Col>

          {/* User Name - 5 columns */}
          <Col xs={24} sm={12} md={5} lg={5}>
            <label className="text-[12px] font-bold !text-[#62748E] tracking-wider mb-1.5 block uppercase">
              USER NAME
            </label>
            <Select
              value={filters.username}
              onChange={(value) => handleFilterChange('username', value)}
              className="!w-full !rounded-xl !h-[38px]"
              showSearch
              optionFilterProp="children"
              filterOption={filterOption}
              allowClear
              placeholder="Select user"
            >
              {employees.map(emp => (
                <Option key={emp.Employee_ID} value={emp.Employee_ID}>
                  {emp.Employee_Name} ({emp.Employee_ID})
                </Option>
              ))}
            </Select>
          </Col>

          {/* Client - 5 columns */}
          <Col xs={24} sm={12} md={5} lg={5}>
            <label className="text-[12px] font-bold !text-[#62748E] tracking-wider mb-1.5 block uppercase">
              CLIENT
            </label>
            <Select
              value={filters.clientId}
              onChange={(value) => handleFilterChange('clientId', value)}
              className="!w-full !rounded-xl !h-[38px]"
              showSearch
              optionFilterProp="children"
              filterOption={filterOption}
              allowClear
              placeholder="Select client"
            >
              {clients.map(client => (
                <Option key={client.ClientID} value={client.ClientID}>
                  {client.ClientName}
                </Option>
              ))}
            </Select>
          </Col>

          {/* Status - 4 columns (total = 5+5+5+5+4 = 24 columns) */}
          <Col xs={24} sm={12} md={4} lg={4}>
            <label className="text-[12px] font-bold !text-[#62748E] tracking-wider mb-1.5 block uppercase">
              STATUS
            </label>
            <Select
              value={filters.status}
              onChange={(value) => handleFilterChange('status', value)}
              className="!w-full !rounded-xl !h-[38px]"
              showSearch
              optionFilterProp="children"
              filterOption={filterOption}
              allowClear
              placeholder="Select status"
            >
              <Option value="Open">Open</Option>
              <Option value="Pending_Updates">Pending Updates</Option>
              <Option value="Follow_up">Follow Up</Option>
              <Option value="Resolved">Resolved</Option>
              <Option value="Closed">Closed</Option>
            </Select>
          </Col>
        </Row>

        {/* Button Row - Keep as is */}
        <Row justify="end" className="mt-4">
          <div className="flex gap-3">
            {/* Clear Filter */}
            <Button
              type="primary"
              icon={<FunnelX size={16} />}
              onClick={() => {
                handleReset();
                setPage(1);
                handleApplyFilter();
              }}
              className="flex items-center gap-2 px-5 !h-[36px] rounded-xl text-sm font-medium !bg-[#7861E6] !text-white hover:!bg-[#6f59d4]"
            >
              Clear Filter
            </Button>

            {/* Apply Filter */}
            <Button
              type="primary"
              icon={<Funnel size={16} />}
              onClick={() => {
                setPage(1);
                handleApplyFilter();
              }}
              loading={loading}
              className="flex items-center gap-2 px-5 !h-[36px] rounded-xl text-sm font-medium !bg-[#7861E6] !text-white hover:!bg-[#6f59d4]"
            >
              Apply Filter
            </Button>
          </div>
        </Row>
      </Card>

      {/* Result Header Card */}
      <div className="mt-6">
        <Text className="!text-[#1D293D] !text-[18px] !font-bold ml-1">
          Result
        </Text>
      </div>

      {/* Table Card */}
      <div className="mt-4 rounded-2xl overflow-hidden border border-[#E5EAF1]">
        <Table
          columns={columns}
          dataSource={reportData?.data || []}
          rowKey="LogID"
          loading={loading}
          className="custom-table-header"
          pagination={false}
          scroll={{ x: 1000 }}
          size="large"
          rowClassName={(record) => {
      // Same condition as your other table
      if (record.highlight_status === "overdue") {
        return "bg-[#FDECEC]";
      } else if (record.highlight_status === "warning") {
        return "bg-[#FEF5E6]";
      }
      return "";
    }}
    loc
          locale={{
            emptyText: (
              <div className="py-12">
                {error ? (
                  <Text type="secondary">{error}</Text>
                ) : (
                  <div className="rounded-lg py-14 px-6 text-center bg-white">
                    <div className="flex justify-center mb-2"><Folder size={16} color="#bfbfbf" /></div>
                    <div className="text-[#90A1B9] text-[10px] font-bold">No Data Found </div>
                    <div className="text-[#90A1B9] text-[8px] ">We couldn't find any Report entries for the selected criteria.</div>
                    <div className='text-[#90A1B9] text-[8px] '> Try adjusting your data range or filters</div>
                  </div>
                )}
              </div>
            )
          }}
        />
      </div>

      {/* Pagination Row */}
      <div className="flex items-center justify-between mt-4 px-2">
        {/* Result count */}
        <span className="text-sm text-[#62748E]">
          <span className="text-sm text-[#62748E]">
            Showing {(page - 1) * pageSize + 1}
            {" "}to{" "}
            {Math.min(page * pageSize, reportData?.total || 0)}
            {" "}of{" "}
            {reportData?.total || 0} Results
          </span>
        </span>

        {/* Pagination */}
        <Pagination
          current={page}
          total={reportData?.total || 0}
          pageSize={pageSize}
          showSizeChanger={false}
          showLessItems
          onChange={handlePageChange}
        />
      </div>
    </div>
  );
};

export default Reports;