import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getCaseHistory } from "../../api/case";
import { FiArrowLeft } from "react-icons/fi";
import { Tooltip } from "antd";

export default function CaseHistory() {
    const { caseId } = useParams();
    const navigate = useNavigate();

    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const day = String(date.getDate()).padStart(2, "0");

        const month = date.toLocaleString("en-US", {
            month: "short",
        });

        return `${year}-${month}-${day}`;
    };
    const truncateText = (text, limit = 30) => {
        if (!text) return "-";
        return text.length > limit ? text.substring(0, limit) + "..." : text;
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

    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 10;

    const indexOfLastRow = currentPage * rowsPerPage;
    const indexOfFirstRow = indexOfLastRow - rowsPerPage;
    const currentRows = history.slice(indexOfFirstRow, indexOfLastRow);

    const totalPages = Math.ceil(history.length / rowsPerPage);

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
        setCurrentPage(1);
    }, [history]);

    useEffect(() => {
        const fetchHistory = async () => {
            setLoading(true);
            const res = await getCaseHistory(caseId);

            if (res?.success) {
                setHistory(res.data);
            } else {
                console.log("Failed to fetch case history");
            }

            setLoading(false);
        };

        fetchHistory();
    }, [caseId]);


    return (
        <div className="min-h-screen bg-[#f5f7fb]">
            <div className="flex items-start gap-4 mb-6">

                {/* Back Button */}
                <button
                    onClick={() => navigate(-1)}
                    className="
      inline-flex items-center gap-2
      px-4 py-1.5
      rounded-xl
      bg-white
      border border-gray-300
      text-sm font-medium text-gray-600
      hover:bg-gray-50
      transition
      shadow-sm
    "
                >
                    <FiArrowLeft className="w-4 h-4" />
                    Back
                </button>

                {/* Title + Case ID */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">
                        Logged Call Details
                    </h1>

                    <p className="text-[#7861E6] font-semibold mt-1">
                        {caseId}
                    </p>
                </div>

            </div>

            {/* Loading */}
            {loading && (
                <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center text-gray-500">
                    Loading case history...
                </div>
            )}

            {/* Table */}
            {!loading && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-[#E9EDF2] text-[#62748E] text-xs  uppercase">
                                <tr>
                                    <th className="p-4 text-left">Username</th>
                                    <th className="p-4 text-left">Date</th>
                                    <th className="p-4 text-left">Client & Buyer</th>
                                    <th className="p-4 text-left">Type & Mode</th>
                                    <th className="p-4 text-left">Priority</th>
                                    <th className="p-4 text-left">Forwarded To</th>
                                    <th className="p-4 text-left">
                                        Remarks Buyer/Supplier
                                    </th>
                                    <th className="p-4 text-left">
                                        Remarks Internal/Follow-Up
                                    </th>
                                    <th className="p-4 text-left">Status</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-200">
                                {currentRows.map((item, index) => (
                                    <tr key={index} className="hover:bg-gray-50">
                                        <td className="p-4 text-gray-700">
                                            {item.modified_by_name || "-"}
                                        </td>

                                        <td className="p-4 text-gray-600">
                                            {formatDate(item.formatted_date)}
                                        </td>

                                        <td className="p-4">
                                            <p className="font-medium text-gray-800">
                                                {item.ClientName}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {item.BuyerSupplierName}
                                            </p>
                                        </td>

                                        <td className="p-4">
                                            <span className="text-xs bg-gray-200 px-2 py-1 rounded mr-2">
                                                {item.CallType}
                                            </span>
                                            <span className="text-xs text-gray-600">
                                                {item.CallMode}
                                            </span>
                                        </td>

                                        <td className="p-4">
                                            <span
                                                className={`font-medium ${priorityColor(
                                                    item.Priority
                                                )}`}
                                            >
                                                ● {item.Priority}
                                            </span>
                                        </td>

                                        <td className="p-4 text-gray-600">
                                            {item.forwarded_to_name || "-"}
                                        </td>

                                        <td className="p-4 text-gray-600 whitespace-normal break-words max-w-[250px]">
                                            <Tooltip title={item.RemarksBuyerSupplier}>
                                                <span className="cursor-pointer">
                                                    {truncateText(item.RemarksBuyerSupplier, 20)}
                                                </span>
                                            </Tooltip>
                                        </td>

                                        <td className="p-4 text-gray-600 whitespace-normal break-words max-w-[250px]">
                                            <Tooltip title={item.RemarksInternal}>
                                                <span className="cursor-pointer">
                                                    {truncateText(item.RemarksInternal, 20)}
                                                </span>
                                            </Tooltip>
                                        </td>

                                        <td className="p-4">
                                            <span className={statusBadge(item.Status)}>
                                                {item.Status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {totalPages > 1 && (
                            <div className="mt-6 px-6 py-3 flex flex-wrap items-center justify-between gap-3">

                                <p className="text-xs text-[#45556C] whitespace-nowrap">
                                    Showing {indexOfFirstRow + 1} to{" "}
                                    {Math.min(indexOfLastRow, history.length)} of{" "}
                                    {history.length} Results
                                </p>

                                <div className="flex flex-wrap items-center gap-1 justify-end">

                                    <button
                                        disabled={currentPage === 1}
                                        onClick={() => setCurrentPage(prev => prev - 1)}
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
                                        onClick={() => setCurrentPage(prev => prev + 1)}
                                        className="w-8 h-8 flex items-center justify-center rounded-md border border-[#E2E8F0] bg-white text-[#45556C] disabled:opacity-40"
                                    >
                                        ›
                                    </button>

                                </div>
                            </div>
                        )}

                        {/* Empty state */}
                        {history.length === 0 && !loading && (
                            <div className="p-8 text-center text-gray-500">
                                No history found for this case.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>

    );
}