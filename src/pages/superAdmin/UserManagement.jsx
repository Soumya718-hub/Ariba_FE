import { useEffect, useState } from "react";
import Select from "react-select";
import {
    Search,
    Plus,
    Pencil,
    Trash2
} from "lucide-react";
import { getAllEmployees } from "../../api/hrms";
import {
    getAllRoles,
    toggleEmployeeStatus,
    removeEmployeeFromRoles,
    addRoleToEmployee,
    editEmployeeRole
} from "../../api/userManagement";
import { message } from "antd";

export default function UserManagement() {

    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState("");
    const [empId, setEmpId] = useState("");
    const [role, setRole] = useState("");
    const [editUser, setEditUser] = useState(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
const [selectedUser, setSelectedUser] = useState(null);

    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 10;

    const [employees, setEmployees] = useState([]);
    const employeeOptions = employees;
    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                const res = await getAllEmployees();

                if (Array.isArray(res) && res.length > 0) {

                    const formatted = res.map(emp => ({
                        value: emp.Employee_ID,
                        label: `${emp.Employee_Name} (${emp.Employee_ID})`
                    }));

                    setEmployees(formatted);

                } else {
                    console.error("Employees data is empty:", res);
                    setEmployees([]);
                }

            } catch (err) {
                console.error(err);
            }
        };

        fetchEmployees();
    }, []);

    useEffect(() => {
        fetchRoles();
    }, []);

    const fetchRoles = async () => {
    try {
        const res = await getAllRoles();
        if (res?.success) {
            setUsers(res.data);
        } else {
            message.error(res?.message || "Failed to fetch roles");
        }
    } catch (err) {
        console.error(err);
        message.error("Error fetching roles");
    }
};

    const toggleStatus = async (empId) => {
    try {
        const response = await toggleEmployeeStatus(empId);
        if (response?.success) {
            message.success("Employee status updated successfully!");
            fetchRoles();
        } else {
            message.error(response?.message || "Failed to update status");
        }
    } catch (err) {
        console.error(err);
        message.error(err.response?.data?.message || "Error updating employee status");
    }
};

    const deleteUser = async (empId) => {
    try {
        const response = await removeEmployeeFromRoles(empId);
        if (response?.success) {
            message.success("Employee removed successfully!");
            fetchRoles();
        } else {
            message.error(response?.message || "Failed to remove employee");
        }
    } catch (err) {
        console.error(err);
        message.error(err.response?.data?.message || "Error removing employee");
    }
};

    // ADD USER
    const handleAddUser = async () => {
    try {
        if (!empId || !role) {
            message.warning("Employee ID and Role are required");
            return;
        }

        const response = await addRoleToEmployee({
            emp_id: empId,
            role_name: role
        });

        if (response?.success) {
            message.success(response.message || "User added successfully!");
            setEmpId("");
            setRole("");
            fetchRoles();
        } else {
            message.error(response?.message || "Failed to add user");
        }

    } catch (err) {
        console.error(err);
        message.error(err.response?.data?.message || "Error adding user");
    }
};


    // EDIT ROLE
    const handleEditUser = async () => {
    try {
        const response = await editEmployeeRole(empId, {
            role_name: role
        });

        if (response?.success) {
            message.success(response.message || "Role updated successfully!");
            setEditUser(null);
            setEmpId("");
            setRole("");
            fetchRoles();
        } else {
            message.error(response?.message || "Failed to update role");
        }

    } catch (err) {
        console.error(err);
        message.error(err.response?.data?.message || "Error updating role");
    }
};

    const filteredUsers = users.filter(
        (u) =>
            (u.emp_id || "").toLowerCase().includes(search.toLowerCase()) ||
            (u.emp_name || "").toLowerCase().includes(search.toLowerCase())
    );

    // Pagination calculations
    const indexOfLastRow = currentPage * rowsPerPage;
    const indexOfFirstRow = indexOfLastRow - rowsPerPage;
    const currentRows = filteredUsers.slice(indexOfFirstRow, indexOfLastRow);

    const totalPages = Math.ceil(filteredUsers.length / rowsPerPage);

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
    }, [search]);

    const roleOptions = [
        { value: "ADMIN", label: "Admin" },
        { value: "SUPERADMIN", label: "Super Admin" },
        { value: "USER", label: "User" },

    ];

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
                    User Management
                </h1>
            </div>

            <p className="text-sm text-[#94A3B8] mb-6">
                Manage employee access levels and security roles.
            </p>

            {/* SEARCH */}
            <div className="relative w-[420px] mb-5">
                <Search size={18} className="absolute left-3 top-3 text-[#62748E]" />
                <input
                    type="text"
                    placeholder="Search by Emp ID or name"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-[#E2E8F0] rounded-xl bg-white text-[#62748E] text-sm outline-none focus:outline-none focus:ring-0 focus:border-[#9da9b9]"
                />
            </div>

            {/* FILTER ROW */}
            <div className="flex items-end gap-6 mb-6">

                <div>
                    <p className="text-xs  text-[#62748E] mb-1">SELECT USER</p>
                    <Select
                        options={employeeOptions}
                        styles={selectStyles}
                        value={
                            employeeOptions.find(option => option.value === empId) || null
                        }
                        onChange={(selected) => {
                            setEmpId(selected?.value || "");
                            if (!selected) setEditUser(null);
                        }}
                        placeholder="Select"
                        components={{ IndicatorSeparator: () => null }}
                        isClearable
                        isDisabled={editUser !== null}
                    />
                </div>

                <div>
                    <p className="text-xs text-[#62748E] mb-1">SELECT ROLE</p>
                    <Select
                        options={roleOptions}
                        styles={selectStyles}
                        value={roleOptions.find(option => option.value === role) || null}
                        onChange={(selected) => setRole(selected?.value || "")}
                        placeholder="Select"
                        components={{ IndicatorSeparator: () => null }}
                        isClearable
                    />
                </div>

                <button
                    onClick={editUser ? handleEditUser : handleAddUser}
                    className="flex items-center gap-2 px-6 h-[44px] rounded-xl text-sm font-medium text-white bg-[#7861E6] hover:opacity-95 transition"
                >
                    {editUser ? <Pencil size={16} /> : <Plus size={16} />}
                    {editUser ? "Update Role" : "Add User"}
                </button>
                    {/* ✅ CANCEL BUTTON */}
                    {editUser && (
                        <button
                            onClick={() => {
                                setEditUser(null);
                                setEmpId("");
                                setRole("");
                            }}
                            className="h-[44px] px-5 rounded-xl text-sm font-medium border border-[#E2E8F0] text-[#62748E] hover:bg-gray-100 transition"
                        >
                            Cancel
                        </button>
                    )}

            </div>

            {/* TABLE */}
            <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden ">

                {/* TABLE HEADER */}
                <div className="grid grid-cols-5 text-xs text-[#94A3B8] font-medium px-6 py-3 bg-[#F1F5F9]">
                    <div>EMPLOYEE ID</div>
                    <div>EMPLOYEE NAME</div>
                    <div>ROLE</div>
                    <div>STATUS</div>
                    <div>ACTIONS</div>
                </div>

                {/* TABLE BODY */}
                {currentRows.map((user) => (
                    <div
                        key={user.emp_id}
                        className="grid grid-cols-5 items-center px-6 py-4 border-t border-[#E2E8F0] text-sm"
                    >
                        <div className="text-[#7861E6] font-medium">{user.emp_id}</div>

                        <div className="text-[#0F172A] font-medium">{user.emp_name}</div>

                        <div>
                            <span className="bg-[#F1F5F9] px-3 py-1 rounded-lg text-xs">
                                {user.role_name}
                            </span>
                        </div>

                        {/* STATUS */}
                        <div className="flex items-center gap-3">
                            <span
                                className={`flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full ${user.active_status === 1
                                    ? "bg-[#D1FAE5] text-[#047857]"
                                    : "bg-[#E2E8F0] text-[#64748B]"
                                    }`}
                            >
                                <span
                                    className={`w-2 h-2 rounded-full ${user.active_status === 1
                                        ? "bg-[#10B981]"
                                        : "bg-[#94A3B8]"
                                        }`}
                                ></span>

                                {user.active_status === 1 ? "ACTIVE" : "INACTIVE"}
                            </span>


                        </div>

                        {/* ACTIONS */}
                        <div className="flex items-center gap-3 text-gray-500">
                            <button
                                onClick={() => toggleStatus(user.emp_id)}
                                className={`w-10 h-5 flex items-center rounded-full p-1 transition ${user.active_status === 1
                                    ? "bg-[#6AB551]"
                                    : "bg-gray-300"
                                    }`}
                            >
                                <div
                                    className={`bg-white w-4 h-4 rounded-full shadow transform transition ${user.active_status === 1
                                        ? "translate-x-4"
                                        : ""
                                        }`}
                                />
                            </button>
                            <button
                                onClick={() => {
                                    setEditUser(user);
                                    setEmpId(user.emp_id);
                                    setRole(user.role_name);
                                }}
                                className="hover:text-blue-500"
                            >
                                <Pencil size={16} />
                            </button>

                            <button
                                onClick={() => {
                                    setSelectedUser(user);
                                    setDeleteModalOpen(true);
                                }}
                                className="hover:text-red-500"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))}

            </div>
            {/* PAGINATION */}
            {totalPages > 1 && (
                <div className="px-6 py-4 flex flex-wrap items-center justify-between gap-3">

                    <p className="text-xs text-[#45556C] whitespace-nowrap">
                        Showing {indexOfFirstRow + 1} to{" "}
                        {Math.min(indexOfLastRow, filteredUsers.length)} of{" "}
                        {filteredUsers.length} Results
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
                                    className={`w-8 h-8 flex items-center justify-center text-sm rounded-md ${currentPage === page
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
         {deleteModalOpen && (
      <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
        
        <div className="bg-white rounded-2xl w-[420px] p-6 relative">


          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div className="bg-red-100 p-4 rounded-full">
              <Trash2 className="text-red-500" size={28} />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-center text-lg font-semibold text-gray-800 mb-2">
            Delete
          </h2>

          {/* Description */}
          <p className="text-center text-sm text-gray-500 mb-6">
            Are you sure you want to remove{" "}
            <span className="font-medium">
              {selectedUser?.emp_name}
            </span>
            ?
          </p>

          {/* Buttons */}
          <div className="flex gap-4">
            <button
              onClick={() => setDeleteModalOpen(false)}
              className="w-1/2 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </button>

            <button
              onClick={async () => {
                await deleteUser(selectedUser.emp_id);
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