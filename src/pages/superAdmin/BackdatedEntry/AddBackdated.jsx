import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAllCallTypes, getAllCallModes, getAllClients, getAllAribaEmp  } from "../../../api/case";
import { getAllEmployees } from "../../../api/hrms"
import { createBackdatedDirect } from "../../../api/backdated"
import Select from "react-select";
import dayjs from "dayjs";
import { DatePicker, message } from "antd";

export default function AddBackdated() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Dropdown data states
  const [users, setUsers] = useState([]);
  const [clients, setClients] = useState([]);
  const [callTypes, setCallTypes] = useState([]);
  const [callModes, setCallModes] = useState([]);
  const [employees, setEmployees] = useState([]);

  const [form, setForm] = useState({
    selectedDate: "",
    username: "",
    clientId: "",
    name: "",
    callType: "",
    poSubtype: "",
    callMode: "",
    priority: "",
    forwardedTo: "",
    status: "",
    followUpDate: "",
    remarksBuyer: "",
    remarksInternal: ""
  });

  const showPOSubtype = form.callType === "PO";
  const [errors, setErrors] = useState({});

  // Fetch all dropdown data
useEffect(() => {
  fetchDropdownData();
}, []);

const fetchDropdownData = async () => {
  try {
    const [usersData, clientsRes, typesRes, modesRes, employeesData] = await Promise.all([
      getAllEmployees(),    // Changed back to getAllEmployees
      getAllClients(),
      getAllCallTypes(),
      getAllCallModes(),
      getAllEmployees()     // Changed back to getAllEmployees
    ]);

    console.log("Users Data:", usersData);
    console.log("Employees Data:", employeesData);

    // Users - handle array directly
    if (Array.isArray(usersData) && usersData.length > 0) {
      setUsers(usersData);
    } else {
      console.log("No users data or invalid response structure");
      setUsers([]);
    }

    // Clients
    if (clientsRes?.success && clientsRes.data) {
      setClients(clientsRes.data);
    }

    // Call Types
    if (typesRes?.success && typesRes.data) {
      setCallTypes(typesRes.data);
    }

    // Call Modes
    if (modesRes?.success && modesRes.data) {
      setCallModes(modesRes.data);
    }

    // Employees - handle array directly
    if (Array.isArray(employeesData) && employeesData.length > 0) {
      setEmployees(employeesData);
    } else {
      console.log("No employees data or invalid response structure");
      setEmployees([]);
    }

  } catch (error) {
    console.error("Error fetching dropdown data:", error);
  }
};

// Create options for the select
const userOptions = Array.isArray(users) && users.length > 0
  ? users.map(user => ({
    value: user.Employee_ID,           // Changed back to Employee_ID
    label: `${user.Employee_Name} (${user.Employee_ID})`  // Changed back to Employee_Name
  }))
  : [];

  // Handle status change to show/hide follow-up date
  const handleStatusChange = (selected) => {
    setForm(prev => ({
      ...prev,
      status: selected?.value || "",
      followUpDate: selected?.value === "Follow_up" ? prev.followUpDate : null
    }));
  };

  // Handle call type change to show/hide PO subtype
  const handleCallTypeChange = (selected) => {
    const value = selected?.value || "";
    setForm(prev => ({
      ...prev,
      callType: value,
      poSubtype: value === "PO" ? prev.poSubtype : ""
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
    setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.selectedDate) newErrors.selectedDate = "Date is required";
    if (!form.username) newErrors.username = "User is required";
    if (!form.clientId) newErrors.clientId = "Client is required";
    if (!form.name) newErrors.name = "Name is required";
    if (!form.callType) newErrors.callType = "Call Type is required";
    if (form.callType === "PO" && !form.poSubtype) newErrors.poSubtype = "PO Subtype is required";
    if (!form.callMode) newErrors.callMode = "Call Mode is required";
    if (!form.priority) newErrors.priority = "Priority is required";
    if (!form.status) newErrors.status = "Status is required";
    if (form.status === "Follow_up" && !form.followUpDate) {
      newErrors.followUpDate = "Follow-up date is required";
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);

    try {
      // Format the date properly
      const payload = {
        ...form,
        selectedDate: form.selectedDate ? `${form.selectedDate} 00:00:00` : undefined,
        clientId: Number(form.clientId)
      };

      const response = await createBackdatedDirect(payload);

      if (response?.success) {
    message.success({
      content: `Backdated entry created successfully!\nCase ID: ${response.data.caseId}`,
      duration: 5, 
      style: {
        whiteSpace: 'pre-line', // This allows the \n to create a line break
      }
    });
        // Reset form
        setForm({
          selectedDate: "",
          username: "",
          clientId: "",
          name: "",
          callType: "",
          poSubtype: "",
          callMode: "",
          priority: "",
          forwardedTo: "",
          status: "",
          followUpDate: "",
          remarksBuyer: "",
          remarksInternal: ""
        })
      } else {
        message.error(response?.message || "Failed to create backdated entry");
      }
    } catch (error) {
      console.error("Error creating backdated entry:", error);
      if (error.response?.data?.message) {
    message.error(error.response.data.message);
  } else if (error.message) {
    message.error(error.message);
  } else {
    message.error("An error occurred while creating the entry");
  }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(-1); // Go back to previous page
  };

  // React-select options


  const clientOptions = clients.map((client) => ({
    value: client.ClientID,
    label: client.ClientName,
  }));

  const callTypeOptions = callTypes.map((type) => ({
    value: type.callType,
    label: type.callType,
  }));

  const callModeOptions = callModes.map((mode) => ({
    value: mode.callMode,
    label: mode.callMode,
  }));

  const priorityOptions = [
    { value: "high", label: "High" },
    { value: "medium", label: "Medium" },
    { value: "low", label: "Low" },
  ];

  const statusOptions = [
    { value: "Open", label: "Open" },
    { value: "Pending_Updates", label: "Pending Updates" },
    { value: "Follow_up", label: "Follow Up" },
    { value: "Resolved", label: "Resolved" },
    { value: "Closed", label: "Closed" },
  ];
  //SR Raised','Helpdesk Raised','Resolved'

  const poSubtypeOptions = [
    { value: "SR Raised", label: "SR Raised" },
    { value: "Helpdesk Raised", label: "Helpdesk Raised" },
    { value: "Resolved", label: "Resolved" },
  ];


const employeeOptions = employees.map((emp) => ({
    value: String(emp.Employee_ID),        // Changed back to Employee_ID
    label: `${emp.Employee_Name} (${emp.Employee_ID})`,  // Changed back to Employee_Name
}));

  const customSelectStyles = (fieldName) => ({
    control: (provided, state) => ({
      ...provided,
      borderRadius: 8,
      minHeight: 42,
      borderColor: errors[fieldName]
        ? "#ef4444"
        : state.isFocused
          ? "#4B5563"
          : "#D1D5DB",
      boxShadow: "none",
      "&:hover": {
        borderColor: "#4B5563",
      },
    }),
    placeholder: (provided) => ({
      ...provided,
      color: "#9CA3AF",
    }),
    singleValue: (provided) => ({
      ...provided,
      color: "#374151",
    }),
    menu: (provided) => ({
      ...provided,
      borderRadius: 8,
      overflow: "hidden",
      zIndex: 50,
    }),
    indicatorSeparator: () => null,
  });

  const isFormValid = () => {
    if (
      !form.selectedDate ||
      !form.username ||
      !form.clientId ||
      !form.name ||
      !form.callType ||
      !form.callMode ||
      !form.priority ||
      !form.status
    ) {
      return false;
    }

    if (form.callType === "PO" && !form.poSubtype) return false;

    if (form.status === "Follow_up" && !form.followUpDate) return false;

    return true;
  };
  return (
    <div className="min-h-screen bg-[#f5f7fb] p-0">
      <h1 className="text-2xl font-bold text-gray-800 mb-1">New Backdated Request</h1>
      <p className="text-gray-500 mb-6">
        Log historical call entries with full administrative control.
      </p>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow-sm border border-gray-200 px-8 py-8 space-y-6"
      >
        {/* Date + User + Client */}
        <div className="grid grid-cols-3 gap-6">
          {/* Date Field */}
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              DATE <span className="text-red-600">*</span>
            </label>
            <DatePicker
              value={form.selectedDate ? dayjs(form.selectedDate) : null}
              format="YYYY-MM-DD"
              disabledDate={(current) => current && current > dayjs().endOf("day")}
              style={{ width: "100%", height: "42px" }}
              onChange={(date) => {
                setForm({
                  ...form,
                  selectedDate: date ? date.format("YYYY-MM-DD") : ""
                });
                setErrors(prev => ({ ...prev, selectedDate: "" }));
              }}
              className={`w-full ${errors.selectedDate ? "border-red-500" : ""}`}
            />

            {errors.selectedDate && (
              <p className="text-red-500 text-xs mt-1">{errors.selectedDate}</p>
            )}
          </div>

          {/* User Dropdown */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-500 mb-1">
              USER <span className="text-red-600">*</span>
            </label>
            <Select
              options={userOptions}
              value={userOptions.find(option => option.value === form.username) || null}
              onChange={(selected) => {
                setForm({ ...form, username: selected?.value || "" });
                setErrors(prev => ({ ...prev, username: "" }));
              }}
              placeholder="Select"
              isClearable
              styles={customSelectStyles("username")}
            />
            {errors.username && (
              <p className="text-red-500 text-xs mt-1">{errors.username}</p>
            )}
          </div>

          {/* Client Dropdown */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-500 mb-1">
              CLIENT <span className="text-red-600">*</span>
            </label>
            <Select
              options={clientOptions}
              value={clientOptions.find(option => option.value === form.clientId) || null}
              onChange={(selected) => {
                setForm({ ...form, clientId: selected?.value || "" });
                setErrors(prev => ({ ...prev, clientId: "" }));
              }}
              placeholder="Select Client"
              styles={customSelectStyles("clientId")}
            />
            {errors.clientId && (
              <p className="text-red-500 text-xs mt-1">{errors.clientId}</p>
            )}
          </div>
        </div>

        {/* Name (Buyer/Supplier) */}
        <div className="grid grid-cols-1 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              NAME (BUYER/SUPPLIER) <span className="text-red-600">*</span>
            </label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Enter contact name"
              className={`
                w-full border rounded-lg px-3 py-2 bg-white
                text-gray-700 placeholder-gray-400
                ${errors.name ? "border-red-500" : "border-gray-300"}
                focus:outline-none focus:border-gray-600
              `}
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1">{errors.name}</p>
            )}
          </div>
        </div>

        {/* Call Type / PO Subtype / Call Mode / Priority */}
        <div className="grid grid-cols-4 gap-6">
          {/* Call Type */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-500 mb-1">
              CALL TYPE <span className="text-red-600">*</span>
            </label>
            <Select
              options={callTypeOptions}
              value={callTypeOptions.find(option => option.value === form.callType) || null}
              onChange={handleCallTypeChange}
              placeholder="Select"
              styles={customSelectStyles("callType")}
            />
            {errors.callType && (
              <p className="text-red-500 text-xs mt-1">{errors.callType}</p>
            )}
          </div>

          {/* PO Subtype - Conditional */}
          {showPOSubtype && (
            <div className="relative">
              <label className="block text-sm font-medium text-gray-500 mb-1">
                PO SUBTYPE <span className="text-red-600">*</span>
              </label>
              <Select
                options={poSubtypeOptions}
                value={poSubtypeOptions.find(option => option.value === form.poSubtype) || null}
                onChange={(selected) => {
                  setForm({ ...form, poSubtype: selected?.value || "" });
                  setErrors(prev => ({ ...prev, poSubtype: "" }));
                }}
                placeholder="Select"
                styles={customSelectStyles("poSubtype")}
              />
              {errors.poSubtype && (
                <p className="text-red-500 text-xs mt-1">{errors.poSubtype}</p>
              )}
            </div>
          )}

          {/* Call Mode */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-500 mb-1">
              CALL MODE <span className="text-red-600">*</span>
            </label>
            <Select
              options={callModeOptions}
              value={callModeOptions.find(option => option.value === form.callMode) || null}
              onChange={(selected) => {
                setForm({ ...form, callMode: selected?.value || "" });
                setErrors(prev => ({ ...prev, callMode: "" }));
              }}
              placeholder="Select"
              styles={customSelectStyles("callMode")}
            />
            {errors.callMode && (
              <p className="text-red-500 text-xs mt-1">{errors.callMode}</p>
            )}
          </div>

          {/* Priority */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-500 mb-1">
              PRIORITY <span className="text-red-600">*</span>
            </label>
            <Select
              options={priorityOptions}
              value={priorityOptions.find(option => option.value === form.priority) || null}
              onChange={(selected) => {
                setForm({ ...form, priority: selected?.value || "" });
                setErrors(prev => ({ ...prev, priority: "" }));
              }}
              placeholder="Select"
              styles={customSelectStyles("priority")}
            />
            {errors.priority && (
              <p className="text-red-500 text-xs mt-1">{errors.priority}</p>
            )}
          </div>
        </div>

        {/* Status + Follow-up Date + Forward To */}
        <div className={`grid gap-6 ${form.status === "Follow_up" ? "grid-cols-3" : "grid-cols-2"}`}>
          {/* Status */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-500 mb-1">
              STATUS <span className="text-red-600">*</span>
            </label>
            <Select
              options={statusOptions}
              value={statusOptions.find(option => option.value === form.status) || null}
              onChange={handleStatusChange}
              placeholder="Select"
              styles={customSelectStyles("status")}
            />
            {errors.status && (
              <p className="text-red-500 text-xs mt-1">{errors.status}</p>
            )}
          </div>

          {/* Follow-up Date - Conditional */}
          {form.status === "Follow_up" && (
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                DATE <span className="text-red-600">*</span>
              </label>

              <DatePicker
                value={form.followUpDate ? dayjs(form.followUpDate) : null}
                format="YYYY-MM-DD"
                // disabledDate={(current) => current && current > dayjs().endOf("day")}
                style={{ width: "100%", height: "42px" }}
                onChange={(date) => {
                  setForm({
                    ...form,
                    followUpDate: date ? date.format("YYYY-MM-DD") : ""
                  });
                  setErrors(prev => ({ ...prev, followUpDate: "" }));
                }}
                className={`w-full ${errors.followUpDate ? "border-red-500" : ""}`}
              />

              {errors.followUpDate && (
                <p className="text-red-500 text-xs mt-1">{errors.followUpDate}</p>
              )}
            </div>
          )}

          {/* Forward To */}
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              FORWARD TO
            </label>
            <Select
              options={employeeOptions}
              value={employeeOptions.find(option => option.value === String(form.forwardedTo)) || null}
              onChange={(selected) =>
                setForm({ ...form, forwardedTo: selected?.value || "" })
              }
              placeholder="Select"
              isClearable
              styles={customSelectStyles("forwardedTo")}
            />
          </div>
        </div>

        {/* Remarks */}
        <div className="grid grid-cols-2 gap-6">

          {/* Buyer/Supplier Remarks */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-500 mb-1">
              REMARKS (BUYER/SUPPLIER)
            </label>

            <textarea
              name="remarksBuyer"
              value={form.remarksBuyer}
              onChange={handleChange}
              placeholder="Enter external remarks..."
              rows="4"
              maxLength={250}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-700 placeholder-gray-400 resize-none focus:outline-none focus:border-gray-600"
            />

            {/* Counter */}
            <div className="text-right text-xs text-gray-400 mt-1">
              {form.remarksBuyer.length}/250
            </div>
          </div>

          {/* Internal Remarks */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-500 mb-1">
              REMARKS (INTERNAL/FOLLOW-UP)
            </label>

            <textarea
              name="remarksInternal"
              value={form.remarksInternal}
              onChange={handleChange}
              placeholder="Enter internal notes..."
              rows="4"
              maxLength={250}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-700 placeholder-gray-400 resize-none focus:outline-none focus:border-gray-600"
            />

            {/* Counter */}
            <span className="absolute bottom-2 right-3 text-xs text-gray-400">
              {form.remarksInternal.length}/250
            </span>
          </div>

        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={handleCancel}
            className="px-6 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!isFormValid() || loading}
            className={`
    flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium
    transition-colors duration-200
    ${isFormValid()
                ? "bg-[#7861E6] text-white hover:bg-[#6B55D8]"
                : "bg-[#B9ABF7] text-white cursor-not-allowed"}
  `}
          >
            {loading ? (
              "Saving..."
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"
                  />
                  <polyline
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points="17 21 17 13 7 13 7 21"
                  />
                  <polyline
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points="7 3 7 8 15 8"
                  />
                </svg>
                Save Entry
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
