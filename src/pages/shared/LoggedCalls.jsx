import { useNavigate } from "react-router-dom";
import { UserPlus, Search, Send, SquarePen, Folder } from "lucide-react";
import { getLoggedCalls, transferCase } from "../../api/case";
import { getAllEmployees } from "../../api/hrms";
import { FiCalendar, FiFilter } from "react-icons/fi";
import { useState, useRef, useEffect } from "react";
import dayjs from "dayjs";
import Select from "react-select";
import { DatePicker, message } from "antd";

export default function LoggedCalls() {
    const [showDatePicker, setShowDatePicker] = useState(false);
    const { RangePicker } = DatePicker;
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 10;
    const [transferLoading, setTransferLoading] = useState(false);
    const [employees, setEmployees] = useState([]);
    const [selectedStatus, setSelectedStatus] = useState("");
    const [appliedStatus, setAppliedStatus] = useState("");
    const [selectedTransferUser, setSelectedTransferUser] = useState("");
    const role = localStorage.getItem("role")?.toLowerCase() || "user";
    const loggedInUser = localStorage.getItem("emp_id")?.trim();
    
    const formatDate = (dateString) => {
        if (!dateString) return "-";
        const date = new Date(dateString);
        const year = date.getFullYear();
        const day = String(date.getDate()).padStart(2, "0");
        const month = date.toLocaleString("en-US", {
            month: "short",
        });
        return `${year}-${month}-${day}`;
    };
    
    const navigate = useNavigate();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedRows, setSelectedRows] = useState([]);
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [appliedStartDate, setAppliedStartDate] = useState(null);
    const [appliedEndDate, setAppliedEndDate] = useState(null);
    const [selectedPriority, setSelectedPriority] = useState("");
    const [selectedForwardedTo, setSelectedForwardedTo] = useState("");
    const [appliedPriority, setAppliedPriority] = useState("");
    const [appliedForwardedTo, setAppliedForwardedTo] = useState("");
    const [showFilter, setShowFilter] = useState(false);
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

    const statusOptions = [
        { value: "", label: "All" },
        { value: "Open", label: "Open" },
        { value: "Pending_Updates", label: "Pending Updates" },
        { value: "Follow_up", label: "Follow Up" },
        { value: "Resolved", label: "Resolved" },
        { value: "Closed", label: "Closed" }
    ];

    // Sorting function with custom orders
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
            
            if (sortKey === 'LogDate' || sortKey === 'FollowUpDate') {
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

    // First filter the data
    const filtered = data.filter((item) => {
        const matchesSearch =
            String(item.CaseID || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            String(item.ClientName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            String(item.name || "").toLowerCase().includes(searchTerm.toLowerCase());

        const matchesDate = (() => {
            if (!appliedStartDate || !appliedEndDate) return true;
            const itemTime = new Date(item.LogDate).getTime();
            const start = new Date(appliedStartDate);
            start.setHours(0, 0, 0, 0);
            const end = new Date(appliedEndDate);
            end.setHours(23, 59, 59, 999);
            return itemTime >= start.getTime() && itemTime <= end.getTime();
        })();

        const matchesPriority = !appliedPriority || item.Priority === appliedPriority;
        const matchesForwarded = !appliedForwardedTo ||
            String(item.ForwardedToUserID || "").trim() === String(appliedForwardedTo || "").trim();
        const matchesStatus = !appliedStatus || item.Status === appliedStatus;

        return matchesSearch && matchesDate && matchesPriority && matchesForwarded && matchesStatus;
    });

    // Apply sorting to filtered data
    const filteredData = sortConfig.direction 
        ? sortData(filtered, sortConfig.key, sortConfig.direction) 
        : filtered;

    // Pagination calculations
    const indexOfLastRow = currentPage * rowsPerPage;
    const indexOfFirstRow = indexOfLastRow - rowsPerPage;
    const currentRows = filteredData.slice(indexOfFirstRow, indexOfLastRow);
    const totalPages = Math.ceil(filteredData.length / rowsPerPage);

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

    const handleRowSelect = (id) => {
        setSelectedRows((prev) =>
            prev[0] === id ? [] : [id]
        );
    };

    const statusBadge = (status) => {
        const base = "px-3 py-1 rounded-full text-xs font-semibold";
        switch (status) {
            case "Open":
                return `${base} bg-[#D9E9FE] text-[#155DFC]`;
            case "Follow_up":
                return `${base} bg-[#FFFBEB] text-[#BB4D00]`;
            case "Resolved":
                return `${base} bg-[#ECFDF5] text-[#007A55]`;
            case "Pending_Updates":
                return `${base} bg-[#FAF5FF] text-[#8200DB]`;
            case "Closed":
                return `${base} bg-[#F8FAFC] text-[#314158]`;
            default:
                return `${base} bg-gray-200 text-gray-600`;
        }
    };

    const priorityColor = (priority) => {
        switch (priority) {
            case "high":
                return "text-[#FF0000]";
            case "medium":
                return "text-[#FE9A00]";
            case "low":
                return "text-green-500";
            default:
                return "";
        }
    };

    const isTransferDisabled = transferLoading || !selectedTransferUser || selectedRows.length === 0;

    useEffect(() => {
        const fetchLoggedCalls = async () => {
            setLoading(true);
            const res = await getLoggedCalls();
            if (res?.success) {
                setData(res.data);
            } else {
                console.log("Failed to fetch logged calls");
            }
            setLoading(false);
        };
        fetchLoggedCalls();
    }, []);

    useEffect(() => {
        const fetchEmployees = async () => {
            const response = await getAllEmployees();
            if (Array.isArray(response) && response.length > 0) {
                setEmployees(response);
            } else {
                setEmployees([]);
            }
        };
        fetchEmployees();
    }, []);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, appliedStartDate, appliedEndDate, appliedPriority, appliedForwardedTo, appliedStatus, sortConfig]);

    const employeeOptions = employees.map(emp => ({
        value: emp.Employee_ID,
        label: `${emp.Employee_Name} (${emp.Employee_ID})`
    }));

    const priorityOptions = [
        { value: "", label: "All" },
        { value: "high", label: "High" },
        { value: "medium", label: "Medium" },
        { value: "low", label: "Low" }
    ];

    const filterRef = useRef(null);
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (filterRef.current && !filterRef.current.contains(event.target)) {
                setShowFilter(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const transferUserOptions = Array.isArray(employees) && employees.length > 0
        ? employees.map(emp => ({
            value: emp.Employee_ID,
            label: `${emp.Employee_Name} (${emp.Employee_ID})`
        }))
        : [];

    return (
        <div className="bg-[#f4f6fb] min-h-screen">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">
                        Logged Calls
                    </h1>
                    <p className="text-gray-500 text-sm">
                        View and manage calls you have logged.
                    </p>
                </div>

                <button
                    disabled={selectedRows.length === 0}
                    onClick={() => setShowTransferModal(true)}
                    className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-semibold transition-all duration-200
                ${selectedRows.length === 0
                            ? "bg-[#B9ABF7] text-white cursor-not-allowed"
                            : "bg-gradient-to-r bg-[#7861E6] text-white shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                        }
            `}
                >
                    <UserPlus size={18} strokeWidth={2} />
                    Transfer Cases
                </button>
            </div>

            {/* Search */}
            <div className="mb-6 flex items-center justify-between flex-wrap">
                {/* Search */}
                <div className="flex items-center flex-1 min-w-[260px] max-w-[640px] bg-[#FFFFFF] border border-[#EAEDEF] rounded-xl px-4 h-11 transition-all focus-within:border-[#90A1B9]">
                    <Search className="text-[#90A1B9] mr-3 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search by Case ID, Client, or Name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-transparent outline-none flex-1 text-sm text-[#90A1B9] placeholder:text-[#90A1B9] font-medium"
                    />
                </div>

                {/* Right side controls */}
                <div className="flex items-center gap-3">
                    {/* Date */}
                    <div className="flex justify-end relative">
                        {!showDatePicker && (
                            <button
                                onClick={() => setShowDatePicker(true)}
                                className="flex items-center gap-2 px-4 py-2 border border-[#EAEDEF] rounded-lg bg-white text-[#62748E] hover:bg-gray-50 shadow-sm"
                            >
                                <FiCalendar size={16} />
                                {startDate && endDate
                                    ? `${dayjs(startDate).format("DD MMM")} - ${dayjs(endDate).format("DD MMM")}`
                                    : "Date Range"}
                            </button>
                        )}
                        {showDatePicker && (
                            <RangePicker
                                autoFocus
                                open={showDatePicker}
                                bordered={false}
                                value={startDate && endDate ? [dayjs(startDate), dayjs(endDate)] : null}
                                format="DD MMM YYYY"
                                className="custom-range-picker"
                                onOpenChange={(open) => setShowDatePicker(open)}
                                onChange={(dates) => {
                                    if (!dates) {
                                        setStartDate(null);
                                        setEndDate(null);
                                        setAppliedStartDate(null);
                                        setAppliedEndDate(null);
                                        return;
                                    }
                                    if (dates[0] && dates[1]) {
                                        const start = dates[0].toDate();
                                        const end = dates[1].toDate();
                                        setStartDate(start);
                                        setEndDate(end);
                                        setAppliedStartDate(start);
                                        setAppliedEndDate(end);
                                    }
                                }}
                            />
                        )}
                    </div>

                    {/* Filters */}
                    <div ref={filterRef} className="relative">
                        <button
                            onClick={() => setShowFilter(!showFilter)}
                            className="flex items-center gap-2 h-11 px-4 rounded-xl border border-[#E2E8F0] bg-[#FFFFFF] text-[#45556C] text-sm font-normal hover:bg-[#F1F5F9] transition"
                        >
                            <FiFilter size={16} />
                            Filters
                        </button>

                        {showFilter && (
                            <div className="absolute right-0 mt-2 w-64 bg-white border border-[#E2E8F0] rounded-xl shadow-lg p-4 z-50">
                                {/* Priority Filter */}
                                <div className="mb-4">
                                    <label className="text-xs text-gray-500 block mb-1">Priority</label>
                                    <Select
                                        options={priorityOptions}
                                        value={priorityOptions.find(option => option.value === selectedPriority) || priorityOptions[0]}
                                        onChange={(selected) => setSelectedPriority(selected?.value || "")}
                                        isClearable={false}
                                        components={{ IndicatorSeparator: () => null }}
                                        styles={{
                                            control: (base) => ({
                                                ...base,
                                                borderRadius: "10px",
                                                borderColor: "#E5E7EB",
                                                minHeight: "36px",
                                                boxShadow: "none",
                                                fontSize: "13px",
                                                "&:hover": { borderColor: "#CBD5F5" }
                                            }),
                                            menu: (base) => ({
                                                ...base,
                                                borderRadius: "10px",
                                                overflow: "hidden",
                                                fontSize: "13px"
                                            })
                                        }}
                                    />
                                </div>

                                {/* Status Filter */}
                                <div className="mb-4">
                                    <label className="text-xs text-gray-500 block mb-1">Status</label>
                                    <Select
                                        options={statusOptions}
                                        value={statusOptions.find(option => option.value === selectedStatus) || statusOptions[0]}
                                        onChange={(selected) => setSelectedStatus(selected?.value || "")}
                                        isClearable={false}
                                        components={{ IndicatorSeparator: () => null }}
                                        styles={{
                                            control: (base) => ({
                                                ...base,
                                                borderRadius: "10px",
                                                borderColor: "#E5E7EB",
                                                minHeight: "36px",
                                                boxShadow: "none",
                                                fontSize: "13px",
                                                "&:hover": { borderColor: "#CBD5F5" }
                                            }),
                                            menu: (base) => ({
                                                ...base,
                                                borderRadius: "10px",
                                                overflow: "hidden",
                                                fontSize: "13px"
                                            })
                                        }}
                                    />
                                </div>

                                {/* Forwarded To Filter */}
                                <div className="mb-4">
                                    <label className="text-xs text-gray-500 block mb-1">Forwarded To</label>
                                    <Select
                                        options={employeeOptions}
                                        value={employeeOptions.find(option => option.value === selectedForwardedTo) || null}
                                        onChange={(selected) => setSelectedForwardedTo(selected?.value || "")}
                                        placeholder="Select"
                                        isClearable
                                        components={{ IndicatorSeparator: () => null }}
                                        styles={{
                                            control: (base) => ({
                                                ...base,
                                                borderRadius: "10px",
                                                borderColor: "#E5E7EB",
                                                minHeight: "36px",
                                                boxShadow: "none",
                                                fontSize: "13px",
                                                "&:hover": { borderColor: "#CBD5F5" }
                                            }),
                                            menu: (base) => ({
                                                ...base,
                                                borderRadius: "10px",
                                                overflow: "hidden",
                                                fontSize: "13px"
                                            })
                                        }}
                                    />
                                </div>

                                {/* Buttons */}
                                <div className="flex justify-end gap-2">
                                    <button
                                        onClick={() => {
                                            setSelectedPriority("");
                                            setSelectedStatus("");
                                            setSelectedForwardedTo("");
                                            setAppliedPriority("");
                                            setAppliedStatus("");
                                            setAppliedForwardedTo("");
                                        }}
                                        className="text-xs px-3 py-1 border border-[#EAEDEF] border rounded-lg"
                                    >
                                        Reset
                                    </button>
                                    <button
                                        onClick={() => {
                                            setAppliedPriority(selectedPriority);
                                            setAppliedStatus(selectedStatus);
                                            setAppliedForwardedTo(selectedForwardedTo);
                                            setShowFilter(false);
                                        }}
                                        className="text-xs px-3 py-1 bg-[#7861E6] text-white rounded-lg"
                                    >
                                        Apply
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="flex-1 min-h-0 overflow-hidden rounded-2xl">
                <div className="h-full bg-[#f7f8f9] shadow-sm overflow-x-auto">
                    <table className="min-w-max w-full text-sm border-collapse">
                        <thead className="bg-[#E9EDF2] text-[#62748E] text-xs uppercase">
                            <tr className="h-[64px]">
                                <th className="w-[56px] pl-0 pr-2 py-4 sticky left-0 bg-[#E9EDF2] z-30"></th>
                                <th className="p-4 sticky left-[48px] bg-[#E9EDF2] z-20 cursor-pointer hover:bg-[#E2E6EC] transition select-none"
                                    onClick={(e) => { e.preventDefault(); handleSort('CaseID'); }}>
                                    <div className="flex items-center gap-1">
                                        Case ID
                                        {sortConfig.key === 'CaseID' && sortConfig.direction === 'asc' && <span className="text-xs">↑</span>}
                                        {sortConfig.key === 'CaseID' && sortConfig.direction === 'desc' && <span className="text-xs">↓</span>}
                                    </div>
                                </th>
                                <th className="p-4 text-left cursor-pointer hover:bg-[#E2E6EC] transition select-none"
                                    onClick={(e) => { e.preventDefault(); handleSort('LogDate'); }}>
                                    <div className="flex items-center gap-1">
                                        Date
                                        {sortConfig.key === 'LogDate' && sortConfig.direction === 'asc' && <span className="text-xs">↑</span>}
                                        {sortConfig.key === 'LogDate' && sortConfig.direction === 'desc' && <span className="text-xs">↓</span>}
                                    </div>
                                </th>
                                <th className="p-4 text-left cursor-pointer hover:bg-[#E2E6EC] transition select-none"
                                    onClick={(e) => { e.preventDefault(); handleSort('ClientName'); }}>
                                    <div className="flex items-center gap-1">
                                        Client & Buyer
                                        {sortConfig.key === 'ClientName' && sortConfig.direction === 'asc' && <span className="text-xs">↑</span>}
                                        {sortConfig.key === 'ClientName' && sortConfig.direction === 'desc' && <span className="text-xs">↓</span>}
                                    </div>
                                </th>
                                <th className="p-4 text-left cursor-pointer hover:bg-[#E2E6EC] transition select-none"
                                    onClick={(e) => { e.preventDefault(); handleSort('CallType'); }}>
                                    <div className="flex items-center gap-1">
                                        Type & Mode
                                        {sortConfig.key === 'CallType' && sortConfig.direction === 'asc' && <span className="text-xs">↑</span>}
                                        {sortConfig.key === 'CallType' && sortConfig.direction === 'desc' && <span className="text-xs">↓</span>}
                                    </div>
                                </th>
                                <th className="p-4 text-left cursor-pointer hover:bg-[#E2E6EC] transition select-none"
                                    onClick={(e) => { e.preventDefault(); handleSort('Priority'); }}>
                                    <div className="flex items-center gap-1">
                                        Priority
                                        {sortConfig.key === 'Priority' && sortConfig.direction === 'asc' && <span className="text-xs">↑</span>}
                                        {sortConfig.key === 'Priority' && sortConfig.direction === 'desc' && <span className="text-xs">↓</span>}
                                    </div>
                                </th>
                                <th className="p-4 text-left cursor-pointer hover:bg-[#E2E6EC] transition select-none"
                                    onClick={(e) => { e.preventDefault(); handleSort('forwarded_to_name'); }}>
                                    <div className="flex items-center gap-1">
                                        Forwarded To
                                        {sortConfig.key === 'forwarded_to_name' && sortConfig.direction === 'asc' && <span className="text-xs">↑</span>}
                                        {sortConfig.key === 'forwarded_to_name' && sortConfig.direction === 'desc' && <span className="text-xs">↓</span>}
                                    </div>
                                </th>
                                <th className="text-center cursor-pointer hover:bg-[#E2E6EC] transition select-none"
                                    onClick={(e) => { e.preventDefault(); handleSort('Status'); }}>
                                    <div className="flex items-center justify-center gap-1">
                                        STATUS
                                        {sortConfig.key === 'Status' && sortConfig.direction === 'asc' && <span className="text-xs">↑</span>}
                                        {sortConfig.key === 'Status' && sortConfig.direction === 'desc' && <span className="text-xs">↓</span>}
                                    </div>
                                </th>
                                <th className="text-center cursor-pointer hover:bg-[#E2E6EC] transition select-none"
                                    onClick={(e) => { e.preventDefault(); handleSort('FollowUpDate'); }}>
                                    <div className="flex items-center justify-center gap-1">
                                        Follow_Up DATE
                                        {sortConfig.key === 'FollowUpDate' && sortConfig.direction === 'asc' && <span className="text-xs">↑</span>}
                                        {sortConfig.key === 'FollowUpDate' && sortConfig.direction === 'desc' && <span className="text-xs">↓</span>}
                                    </div>
                                </th>
                                <th className="p-4 text-right">Edit</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentRows.length === 0 ? (
                                <tr>
                                    <td colSpan="10" className="py-16">
                                        <div className="flex flex-col items-center justify-center text-center">
                                            <div className="flex justify-center mb-2"><Folder size={16} color="#bfbfbf" /></div>
                                            <div className="text-[#90A1B9] text-[10px] font-bold">No Data Found</div>
                                            <div className="text-[#90A1B9] text-[8px]">We couldn't find any LoggedCall entries for the selected criteria.</div>
                                            <div className='text-[#90A1B9] text-[8px]'>Try adjusting your search, date range or filters</div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                currentRows.map((item) => {
                                    let rowColor = "bg-white";
                                    if (item.highlight_status === "overdue") {
                                        rowColor = "bg-[#FDECEC]";
                                    } else if (item.highlight_status === "warning") {
                                        rowColor = "bg-[#FEF5E6]";
                                    }
                                    const nonEditableStatuses = ["Closed", "Resolved"];
                                    const canEdit = (item.ForwardedToUserID ? String(item.ForwardedToUserID).trim() === loggedInUser : true) && !nonEditableStatuses.includes(item.Status);

                                    return (
                                        <tr key={item.CaseID} className={`transition ${selectedRows.includes(item.CaseID) ? "" : ""}`}>
                                            <td className={`pl-2 pr-2 py-4 border-y border-[#E2E8F0] ${rowColor} sticky left-0 z-20`}>
                                                <input type="checkbox" checked={selectedRows.includes(item.CaseID)} disabled={selectedRows.length > 0 && !selectedRows.includes(item.CaseID)} onChange={() => handleRowSelect(item.CaseID)} />
                                            </td>
                                            <td onClick={() => navigate(`/${role}/case/${item.CaseID}`)} className={`p-4 border-y border-[#E2E8F0] ${rowColor} text-[#7861E6] font-semibold underline underline-offset-2 cursor-pointer hover:text-indigo-700 sticky left-[40px] z-10`}>
                                                {item.CaseID}
                                            </td>
                                            <td className={`p-4 border-y border-[#E2E8F0] ${rowColor}`}>{formatDate(item.LogDate)}</td>
                                            <td className={`p-4 border-y border-[#E2E8F0] ${rowColor}`}>
                                                <p className="font-xs text-[#1D293D]">{item.ClientName}</p>
                                                <p className="text-xs text-[#314158]">{item.name}</p>
                                            </td>
                                            <td className={`p-4 border-y border-[#E2E8F0] ${rowColor}`}>
                                                <span className="text-xs text-[#45556C] bg-[#F1F5F9] px-2 py-1 rounded mr-2">{item.CallType}</span>
                                                <span className="text-xs text-[#45556C]">{item.CallMode}</span>
                                            </td>
                                            <td className={`p-4 border-y border-[#E2E8F0] ${rowColor}`}>
                                                <span className={`font-medium ${priorityColor(item.Priority)}`}>
                                                    ● {item.Priority?.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}
                                                </span>
                                            </td>
                                            <td className={`p-4 border-y border-[#E2E8F0] ${rowColor}`}>{item.forwarded_to_name || "-"}</td>
                                            <td className={`text-center align-middle border-y border-[#E2E8F0] ${rowColor}`}>
                                                <span className={statusBadge(item.Status)}>{item.Status}</span>
                                            </td>
                                            <td className={`p-4 border-y border-[#E2E8F0] ${rowColor}`}>{formatDate(item.FollowUpDate)}</td>
                                            <td className={`p-4 border-y border-[#E2E8F0] ${rowColor}`}>
                                                {canEdit ? (
                                                    <button onClick={() => navigate(`/${role}/add-entry/${item.CaseID}`)} className="p-1 hover:text-indigo-600 transition text-gray-500">
                                                        <SquarePen size={16} strokeWidth={1.8} />
                                                    </button>
                                                ) : (
                                                    <span className="text-gray-300 cursor-not-allowed">
                                                        <SquarePen size={16} strokeWidth={1.8} />
                                                    </span>
                                                )}
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
            {totalPages > 1 && (
                <div className="mt-6 px-6 py-3 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs text-[#45556C] whitespace-nowrap">
                        Showing {indexOfFirstRow + 1} to {Math.min(indexOfLastRow, filteredData.length)} of {filteredData.length} Results
                    </p>
                    <div className="flex flex-wrap items-center gap-1 justify-end">
                        <button disabled={currentPage === 1} onClick={() => setCurrentPage((prev) => prev - 1)} className="w-8 h-8 flex items-center justify-center rounded-md border border-[#E2E8F0] bg-white text-[#45556C] disabled:opacity-40">‹</button>
                        {getVisiblePages().map((page, index) => page === "..." ? (
                            <span key={index} className="px-2 text-[#45556C]">...</span>
                        ) : (
                            <button key={index} onClick={() => setCurrentPage(page)} className={`w-8 h-8 flex items-center justify-center text-sm rounded-md ${currentPage === page ? "bg-[#7861E6] text-white" : "text-[#45556C] hover:bg-gray-100"}`}>{page}</button>
                        ))}
                        <button disabled={currentPage === totalPages} onClick={() => setCurrentPage((prev) => prev + 1)} className="w-8 h-8 flex items-center justify-center rounded-md border border-[#E2E8F0] bg-white text-[#45556C] disabled:opacity-40">›</button>
                    </div>
                </div>
            )}

            {/* Transfer Modal */}
            {showTransferModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white w-[520px] rounded-3xl shadow-2xl">
                        <div className="flex justify-between items-center px-6 py-5 bg-gray-100 border-b border-gray-100 rounded-t-3xl">
                            <div className="flex items-center gap-3">
                                <div className="bg-indigo-100 p-2 rounded-xl">
                                    <UserPlus className="text-[#7861E6]" size={20} />
                                </div>
                                <h2 className="text-xl font-semibold text-gray-800">Transfer Case</h2>
                            </div>
                            <button onClick={() => setShowTransferModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
                        </div>
                        <div className="px-6 py-6 space-y-4 pb-8">
                            <div className="bg-[#EEF2FF] border border-[#E0E7FF] rounded-3xl px-6 py-6">
                                <p className="text-[#7861E6] text-sm font-semibold tracking-widest mb-4">SELECTED CASE</p>
                                <div className="flex flex-wrap gap-3">
                                    {selectedRows.map((id) => (
                                        <span key={id} className="bg-white text-[#7861E6] text-sm px-4 py-2.5 rounded-xl shadow-sm border border-indigo-100 font-bold">{id}</span>
                                    ))}
                                </div>
                            </div>
                            <div className="relative">
                                <label className="block text-xs font-semibold text-[#62748E] mb-2 uppercase">Transfer TO <span className="text-red-600">*</span></label>
                                <Select options={transferUserOptions} value={transferUserOptions.find(o => o.value === selectedTransferUser) || null} onChange={(selected) => setSelectedTransferUser(selected?.value || "")} placeholder="Select User" isClearable components={{ IndicatorSeparator: () => null }} menuPlacement="bottom" menuPosition="fixed" menuPortalTarget={document.body} styles={{ control: (base) => ({ ...base, borderRadius: "12px", borderColor: "#E5E7EB", minHeight: "48px", boxShadow: "none", fontSize: "14px" }), menu: (base) => ({ ...base, borderRadius: "12px", overflow: "hidden", zIndex: 9999 }), menuPortal: (base) => ({ ...base, zIndex: 9999 }) }} />
                            </div>
                            <div className="bg-[#FFFBEB] border border-[#FEF3C6] rounded-2xl p-4 flex gap-3 items-start">
                                <div className="mt-1 text-[#E17100]">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="9" /><line x1="12" y1="8" x2="12" y2="12" strokeLinecap="round" /><circle cx="12" cy="16" r="1" fill="currentColor" stroke="none" />
                                    </svg>
                                </div>
                                <p className="text-[#973C00] text-base leading-relaxed">Transferring this case will reassign responsibility to the selected user. You will still be able to view it in your logged calls history.</p>
                            </div>
                            <div className="flex gap-5 pt-2">
                                <button onClick={() => setShowTransferModal(false)} className="flex-1 border border-gray-300 rounded-3xl py-4 font-semibold text-gray-600 hover:bg-gray-100 transition">Cancel</button>
                                <button disabled={isTransferDisabled} onClick={async () => { if (String(selectedTransferUser).trim() === String(loggedInUser).trim()) { message.error("You cannot transfer a case to yourself"); return; } if (isTransferDisabled) return; try { setTransferLoading(true); const response = await transferCase({ caseId: selectedRows[0], transferToEmpId: selectedTransferUser }); if (response?.success) { message.success("Case transferred successfully"); setShowTransferModal(false); setSelectedRows([]); setSelectedTransferUser(""); const res = await getLoggedCalls(); if (res?.success) { setData(res.data); } } else { message.error(response?.message || "Transfer failed. Please try again."); } } catch (error) { console.error("Transfer error:", error); if (error.response?.data?.message) { message.error(error.response.data.message); } else if (error.message) { message.error(error.message); } else { message.error("Transfer failed. Please try again."); } } finally { setTransferLoading(false); } }} className={`flex-1 flex items-center justify-center gap-2 h-15 rounded-2xl text-white text-sm font-semibold shadow-lg transition ${isTransferDisabled ? "bg-[#B9ABF7] cursor-not-allowed" : "bg-[#7861E6] hover:bg-[#6D55E0]"}`}>
                                    <Send className="w-4 h-4" /> {transferLoading ? "Transferring..." : "Transfer Now"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}