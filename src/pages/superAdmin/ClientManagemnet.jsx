import { useEffect, useState } from "react";
import {
    Search,
    Pencil,
    Trash2,
    Building2,
    Plus
} from "lucide-react";
import {
    getAllClients,
    addClient,
    editClient,
    removeClient,
    getAllCustomer 
} from "../../api/userManagement";
import { message } from "antd";
import Select from "react-select";

export default function ClientManagement() {
    const [clients, setClients] = useState([]);
    const [search, setSearch] = useState("");
    const [editClientData, setEditClientData] = useState(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [selectedClient, setSelectedClient] = useState(null);

    const [clientName, setClientName] = useState("");
    const [shortForm, setShortForm] = useState("");
    const [customers, setCustomers] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);

    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 10;

    // Create customer options for Select component
    const customerOptions = customers.map(customer => ({
        value: customer.id,
        label: customer.name
    }));

    useEffect(() => {
        fetchClients();
    }, []);

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        try {
            const res = await getAllCustomer();
            if (res?.success) {
                setCustomers(res.data);
            } else {
                message.error(res?.message || "Failed to fetch customers");
            }
        } catch (err) {
            console.error(err);
            message.error("Error fetching customers");
        }
    };

    const generateShortForm = (name) => {
        if (!name) return "";
        return name
            .split(" ")
            .map(word => word[0])
            .join("")
            .substring(0, 3)
            .toUpperCase();
    };

    const validateShortForm = (shortForm) => {
        const regex = /^[A-Za-z]{3}$/;
        return regex.test(shortForm);
    };

    const fetchClients = async () => {
        try {
            const res = await getAllClients();
            if (res?.success) {
                setClients(res.data);
            } else {
                message.error(res?.message || "Failed to fetch clients");
            }
        } catch (err) {
            console.error(err);
            message.error("Error fetching clients");
        }
    };

    // ADD CLIENT
    const handleAddClient = async () => {
        try {
            if (!selectedCustomer || !clientName || !shortForm) {
                message.warning("Please select a customer and enter short form");
                return;
            }

            const response = await addClient({
                clientName,
                shortForm: shortForm.toUpperCase()
            });

            if (response?.success) {
                message.success(response.message || "Client added successfully!");
                setSelectedCustomer(null);
                setClientName("");
                setShortForm("");
                fetchClients();
            } else {
                message.error(response?.message || "Failed to add client");
            }
        } catch (err) {
            console.error(err);
            message.error(err.response?.data?.message || "Error adding client");
        }
    };

    // EDIT CLIENT
    const handleEditClient = async () => {
        try {
            if (!clientName || !shortForm) {
                message.warning("Client Name and Short Form are required");
                return;
            }

            const response = await editClient(editClientData.ClientID, {
                clientName,
                shortForm: shortForm.toUpperCase()
            });

            if (response?.success) {
                message.success(response.message || "Client updated successfully!");
                setEditClientData(null);
                setSelectedCustomer(null);
                setClientName("");
                setShortForm("");
                fetchClients();
            } else {
                message.error(response?.message || "Failed to update client");
            }
        } catch (err) {
            console.error(err);
            message.error(err.response?.data?.message || "Error updating client");
        }
    };

    // DELETE CLIENT
    const handleDeleteClient = async (clientId) => {
        try {
            const response = await removeClient(clientId);
            if (response?.success) {
                message.success(response.message || "Client deleted successfully!");
                fetchClients();
            } else {
                message.error(response?.message || "Failed to delete client");
            }
        } catch (err) {
            console.error(err);
            message.error(err.response?.data?.message || "Error deleting client");
        }
    };

    const filteredClients = clients.filter(
        (client) =>
            (client.ClientName || "").toLowerCase().includes(search.toLowerCase()) ||
            (client.shortForm || "").toLowerCase().includes(search.toLowerCase())
    );

    // Pagination
    const indexOfLastRow = currentPage * rowsPerPage;
    const indexOfFirstRow = indexOfLastRow - rowsPerPage;
    const currentRows = filteredClients.slice(indexOfFirstRow, indexOfLastRow);
    const totalPages = Math.ceil(filteredClients.length / rowsPerPage);

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

    useEffect(() => {
        setCurrentPage(1);
    }, [search]);

    const inputStyle =
        "w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl bg-white text-[#0F172A] text-sm outline-none focus:outline-none focus:ring-0 focus:border-[#9da9b9] placeholder:text-[#94A3B8]";

    // Select styles matching user management
    const selectStyles = {
        container: (base) => ({
            ...base,
            width: "280px"
        }),

        control: (base, state) => ({
            ...base,
            backgroundColor: "#ffffff",
            borderRadius: "14px",
            borderColor: "#E2E8F0",
            minHeight: "44px",
            fontSize: "14px",
            boxShadow: "none",
            paddingLeft: "4px",

            "&:hover": {
                borderColor: "#E2E8F0"
            },

            ...(state.isFocused && {
                borderColor: "#E2E8F0",
                boxShadow: "none"
            })
        }),

        valueContainer: (base) => ({
            ...base,
            padding: "0px 8px"
        }),

        placeholder: (base) => ({
            ...base,
            color: "#94A3B8",
            fontSize: "14px"
        }),

        indicatorSeparator: () => ({
            display: "none"
        }),

        dropdownIndicator: (base) => ({
            ...base,
            color: "#94A3B8"
        }),

        menu: (base) => ({
            ...base,
            borderRadius: "12px",
            overflow: "hidden",
            zIndex: 9999
        })
    };

    return (
        <>
        <div className="">

            {/* HEADER */}
            <div className="flex items-center gap-2 mb-2">
                <h1 className="text-xl font-semibold text-[#0F172A]">
                    Client Management
                </h1>
            </div>

            <p className="text-sm text-[#94A3B8] mb-6">
                Manage client information and short forms.
            </p>

            {/* SEARCH */}
            <div className="relative w-[420px] mb-5">
                <Search size={18} className="absolute left-3 top-3 text-[#62748E]" />
                <input
                    type="text"
                    placeholder="Search by client name or short form"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-[#E2E8F0] rounded-xl bg-white text-[#62748E] text-sm outline-none focus:outline-none focus:ring-0 focus:border-[#9da9b9]"
                />
            </div>

            {/* INPUT ROW */}
            <div className="flex items-start gap-6 mb-6">

                {/* CLIENT NAME DROPDOWN */}
                <div>
                    <p className="text-xs text-[#62748E] mb-1">CLIENT NAME</p>
                    <Select
                        options={customerOptions}
                        styles={selectStyles}
                        value={
                            customerOptions.find(option => option.value === selectedCustomer) || null
                        }
                        onChange={(selected) => {
                            setSelectedCustomer(selected?.value || null);
                            setClientName(selected?.label || "");
                            
                            // Auto-generate short form from selected customer name
                            if (!shortForm || shortForm.length < 3) {
                                setShortForm(generateShortForm(selected?.label || ""));
                            }
                        }}
                        placeholder="Select customer"
                        components={{ IndicatorSeparator: () => null }}
                        isClearable
                        isDisabled={editClientData !== null}
                    />
                    {editClientData && (
                        <p className="text-xs text-amber-600 mt-1">
                            Client name cannot be changed in edit mode
                        </p>
                    )}
                </div>

                {/* SHORT FORM INPUT */}
                    <div>
                        <p className="text-xs text-[#62748E] mb-1">SHORT FORM</p>
                        <div className="relative" style={{ width: "280px" }}>
                            <input
                                type="text"
                                value={shortForm}
                                onChange={(e) => {
                                    const value = e.target.value.toUpperCase();
                                    if (/^[A-Z]*$/.test(value)) {
                                        setShortForm(value);
                                    }
                                }}
                                placeholder="e.g. INF"
                                maxLength={3}
                                className={inputStyle + " uppercase"}
                                style={{ minHeight: "44px", paddingRight: shortForm ? "32px" : "12px" }}
                            />
                            {shortForm && (
                                <button
                                    onClick={() => setShortForm("")}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    type="button"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                </button>
                            )}
                        </div>
                        {shortForm && !validateShortForm(shortForm) && (
                            <p className="text-red-500 text-xs mt-1">
                                Must be exactly 3 letters (A-Z)
                            </p>
                        )}
                    </div>

                {/* BUTTONS */}
                <div className="flex flex-col justify-end h-[60px]">
                    <button
                        onClick={editClientData ? handleEditClient : handleAddClient}
                        className="flex items-center gap-2 px-6 h-[44px] rounded-xl text-sm font-medium text-white bg-[#7861E6] hover:opacity-95 transition"
                    >
                        {editClientData ? <Pencil size={16} /> : <Plus size={16} />}
                        {editClientData ? "Update Client" : "Add Client"}
                    </button>
                </div>

                <div className="flex flex-col justify-end h-[60px]">
                    {editClientData && (
                        <button
                            onClick={() => {
                                setEditClientData(null);
                                setSelectedCustomer(null);
                                setClientName("");
                                setShortForm("");
                            }}
                            className="h-[44px] px-5 rounded-xl text-sm font-medium border border-[#E2E8F0] text-[#62748E] hover:bg-gray-50 transition"
                        >
                            Cancel
                        </button>
                    )}
                </div>
            </div>

            {/* TABLE */}
            <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden">

                {/* TABLE HEADER */}
                <div className="grid grid-cols-3 text-xs text-[#94A3B8] font-medium px-6 py-3 bg-[#F1F5F9]">
                    <div>CLIENT NAME</div>
                    <div>SHORT FORM</div>
                    <div>ACTIONS</div>
                </div>

                {/* TABLE BODY */}
                {currentRows.length > 0 ? (
                    currentRows.map((client) => (
                        <div
                            key={client.ClientID}
                            className="grid grid-cols-3 items-center px-6 py-4 border-t border-[#E2E8F0] text-sm"
                        >
                            <div className="text-[#0F172A] font-medium flex items-center gap-2">
                                <Building2 size={16} className="text-[#7861E6]" />
                                {client.ClientName}
                            </div>

                            <div>
                                <span className="bg-[#F1F5F9] px-3 py-1 rounded-lg text-xs text-[#0F172A]">
                                    {client.shortForm}
                                </span>
                            </div>

                            {/* ACTIONS */}
                            <div className="flex items-center gap-3 text-gray-500">
                                <button
                                    onClick={() => {
                                        setEditClientData(client);
                                        setClientName(client.ClientName || "");
                                        setShortForm(client.shortForm || "");
                                        const matchedCustomer = customers.find(c => c.name === client.ClientName);
                                        setSelectedCustomer(matchedCustomer?.id || null);
                                    }}
                                    className="hover:text-blue-500 transition"
                                >
                                    <Pencil size={16} />
                                </button>

                                <button
                                    onClick={() => {
                                        setSelectedClient(client);
                                        setDeleteModalOpen(true);
                                    }}
                                    className="hover:text-red-500 transition"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-12 text-[#94A3B8]">
                        No clients found
                    </div>
                )}
            </div>

            {/* PAGINATION */}
            {totalPages > 1 && filteredClients.length > 0 && (
                <div className="px-6 py-4 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs text-[#45556C] whitespace-nowrap">
                        Showing {indexOfFirstRow + 1} to{" "}
                        {Math.min(indexOfLastRow, filteredClients.length)} of{" "}
                        {filteredClients.length} Results
                    </p>

                    <div className="flex flex-wrap items-center gap-1">
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
                                    className={`w-8 h-8 flex items-center justify-center text-sm rounded-md ${
                                        currentPage === page
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

        {/* Delete Modal */}
        {deleteModalOpen && (
            <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
                <div className="bg-white rounded-2xl w-[420px] p-6 relative">
                    <div className="flex justify-center mb-4">
                        <div className="bg-red-100 p-4 rounded-full">
                            <Trash2 className="text-red-500" size={28} />
                        </div>
                    </div>

                    <h2 className="text-center text-lg font-semibold text-gray-800 mb-2">
                        Delete
                    </h2>

                    <p className="text-center text-sm text-gray-500 mb-6">
                        Are you sure you would like to do this?
                    </p>

                    <div className="flex gap-4">
                        <button
                            onClick={() => setDeleteModalOpen(false)}
                            className="w-1/2 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100"
                        >
                            Cancel
                        </button>

                        <button
                            onClick={async () => {
                                await handleDeleteClient(selectedClient.ClientID);
                                setDeleteModalOpen(false);
                            }}
                            className="w-1/2 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600"
                        >
                            Confirm
                        </button>
                    </div>
                </div>
            </div>
        )}
        </>
    );
}