// EditRequest.jsx
import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { FiChevronLeft, FiSave } from "react-icons/fi";
import Select from "react-select";
import dayjs from "dayjs";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import {  ArrowLeft } from "lucide-react";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import {message} from "antd"
import {
  modifyBackdatedDirect
} from "../../../../api/backdated";
import {
  getAllCallTypes,
  getAllCallModes,
  getAllClients,
  getAllAribaEmp
} from "../../../../api/case";
import { getAllEmployees } from "../../../../api/hrms";
export default function EditRequest() {
  const navigate = useNavigate();
  const { caseId } = useParams();
  const location = useLocation();
  const caseData = location.state?.caseData; // Get the case data from navigation state
 
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true); 
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showFollowUpPicker, setShowFollowUpPicker] = useState(false);
 
  // Dropdown data
  const [users, setUsers] = useState([]);
  const [clients, setClients] = useState([]);
  const [callTypes, setCallTypes] = useState([]);
  const [callModes, setCallModes] = useState([]);
  const [employees, setEmployees] = useState([]);
 
  // Form state - initialize with caseData from navigation
  const [form, setForm] = useState({
    selectedDate: caseData?.creat || "",
    username: caseData?.modified_by_name?.split('(')[1]?.replace(')', '') || "",
    name: caseData?.name || "",
    callType: caseData?.CallType || "",
    poSubtype: caseData?.PO_subtype || "",
    callMode: caseData?.CallMode || "",
    priority: caseData?.Priority || "",
    forwardedTo: caseData?.ForwardedToUserID || "",
    status: caseData?.Status || "",
    followUpDate: caseData?.FollowUpDate || "",
    remarksBuyer: caseData?.RemarksBuyerSupplier || "",
    remarksInternal: caseData?.RemarksInternal || ""
  });
 
  const [errors, setErrors] = useState({});
  const [showPOSubtype, setShowPOSubtype] = useState(caseData?.CallType === "PO");

  const fetchDropdownData = async () => {
  try {
    const [usersData, clientsRes, typesRes, modesRes] =
      await Promise.all([
        getAllEmployees(),    // Changed back to getAllEmployees
        getAllClients(),     // Returns { success, data }
        getAllCallTypes(),   // Returns { success, data }
        getAllCallModes(),   // Returns { success, data }
      ]);

    console.log("Users data:", usersData); // Debug

    // Handle users data from getAllEmployees (returns array directly)
    if (Array.isArray(usersData) && usersData.length > 0) {
      setUsers(usersData);
      setEmployees(usersData);  // Set employees with same data
    } else {
      console.error("Users data is not available:", usersData);
      setUsers([]);
      setEmployees([]);
    }

    // Handle clients (object with success/data)
    if (clientsRes?.success && clientsRes.data) {
      setClients(clientsRes.data);
    } else {
      setClients([]);
    }

    // Handle call types
    if (typesRes?.success && typesRes.data) {
      setCallTypes(typesRes.data);
    } else {
      setCallTypes([]);
    }

    // Handle call modes
    if (modesRes?.success && modesRes.data) {
      setCallModes(modesRes.data);
    } else {
      setCallModes([]);
    }

  } catch (error) {
    console.error("Error fetching dropdown data:", error);
    setUsers([]);
    setClients([]);
    setCallTypes([]);
    setCallModes([]);
    setEmployees([]);
  }
};
 
  // Fetch dropdown data
useEffect(() => {
  const loadData = async () => {
    await fetchDropdownData();
    // All data is now loaded (dropdowns + form data already from caseData)
    setInitialLoading(false);
  };
  
  loadData();
}, []);
 
  useEffect(() => {
    setShowPOSubtype(form.callType === "PO");
  }, [form.callType]);



 
  // If no caseData in state, show error
  if (!caseData) {
    return (
      <div className="min-h-screen bg-[#f5f7fb] p-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
          <p className="text-gray-500">No case data available</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-4 py-2 bg-[#D6DEE8] text-[#5F6F81] rounded-lg text-sm font-medium hover:bg-[#C9D3DF]"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (initialLoading) {
  return (
    <div className="min-h-screen bg-[#f5f7fb] p-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
        <div className="flex flex-col items-center justify-center py-8">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-[#7861E6] rounded-full animate-spin mb-4"></div>
          <p className="text-gray-500 text-sm">Loading form data...</p>
        </div>
      </div>
    </div>
  );
}
 

 
  const validate = () => {
    const newErrors = {};
    if (!form.selectedDate) newErrors.selectedDate = "Date is required";
    if (!form.username) newErrors.username = "User is required";
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

  setSaving(true);
  try {
    // Format dates properly for the database
    const formatDateForDB = (dateString) => {
      if (!dateString) return undefined;
      // If it's already in YYYY-MM-DD format, keep it as is
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        return dateString;
      }
      // Otherwise parse and format
      return dayjs(dateString).format('YYYY-MM-DD');
    };

    const payload = {
      selectedDate: formatDateForDB(form.selectedDate),
      username: form.username,
      name: form.name,
      callType: form.callType,
      poSubtype: form.poSubtype,
      callMode: form.callMode,
      priority: form.priority,
      forwardedTo: form.forwardedTo,
      status: form.status,
      followUpDate: formatDateForDB(form.followUpDate),
      remarksBuyer: form.remarksBuyer,
      remarksInternal: form.remarksInternal
    };

    // Remove undefined values to avoid sending them
    Object.keys(payload).forEach(key => {
      if (payload[key] === undefined) {
        delete payload[key];
      }
    });

    const response = await modifyBackdatedDirect(caseId, payload);
    
    if (response?.success) {
      message.success("Case modified successfully!");
      // Small delay to show the success message before navigating
      setTimeout(() => {
        navigate(-1);
      }, 1500);
    } else {
      message.error(response?.message || "Failed to modify case");
    }
  } catch (error) {
    console.error("Error modifying case:", error);
    
    // Show appropriate error message
    if (error.response?.data?.message) {
      message.error(error.response.data.message);
    } else if (error.message) {
      message.error(error.message);
    } else {
      message.error("An error occurred while modifying the case");
    }
  } finally {
    setSaving(false);
  }
};
 
  const handleBack = () => {
    navigate(-1);
  };
 
  // React-select options (copied from your EditModal)
const userOptions = Array.isArray(users) 
  ? users.map(user => ({
      value: user.Employee_ID,        // Changed back to Employee_ID
      label: `${user.Employee_Name} (${user.Employee_ID})`  // Changed back to Employee_Name
    }))
  : [];
 
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
 
  const poSubtypeOptions = [
    { value: "SR Raised", label: "SR Raised" },
    { value: "Helpdesk Raised", label: "Helpdesk Raised" },
    { value: "Resolved", label: "Resolved" },
  ];
 
 const employeeOptions = Array.isArray(employees)
  ? employees.map(emp => ({
      value: emp.Employee_ID,        // Changed back to Employee_ID
      label: `${emp.Employee_Name} (${emp.Employee_ID})`  // Changed back to Employee_Name
    }))
  : [];
  const customSelectStyles = (fieldName) => ({
    control: (provided, state) => ({
      ...provided,
      borderRadius: '12px', // Changed from 8 to 12px for rounded-xl
      minHeight: 38,
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
      borderRadius: '12px', // Changed from 8 to 12px for rounded-xl
      overflow: "hidden",
      zIndex: 60,
    }),
    indicatorSeparator: () => null,
  });
 
 return (
  <div className="min-h-screen ">
    {/* Header with Back button - matching Code A style */}
    <div className="flex items-center gap-4 mb-6">
      {/* Back Button - matching Code A exactly */}
      <button
        onClick={handleBack}
        className="flex items-center gap-3 px-4 py-2 rounded-2xl border border-[#CFE0F6] bg-white hover:bg-gray-50 text-base font-semibold text-gray-700 transition-all duration-200"
      >
        <ArrowLeft size={22} strokeWidth={2.5} />
        Back
      </button>

      {/* Title Section - matching Code A exactly */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">
          Modify Entry
        </h1>
        <p className="text-md text-[#7861E6] font-semibold">
          {caseId}
        </p>
      </div>
    </div>

    {/* Card - matching Code A style with white background and shadow */}
    <div className="bg-[#FFFFFF] rounded-2xl shadow-sm p-6">
      <form onSubmit={handleSubmit}>
        {/* Grid layout matching Code A */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3  gap-6">
          {/* CLIENT - Read Only */}
          <div className="rounded-lg"> {/* Changed from rounded-2xl to rounded-xl */}
            <label className="block text-xs font-semibold text-gray-500 mb-2">
              CLIENT <span className="text-red-600">*</span>
            </label>
            <Select
              options={clientOptions}
              value={clientOptions.find(option => option.value === caseData.ClientID) || null}
              isDisabled
              components={{ IndicatorSeparator: () => null }}
              styles={customSelectStyles()}
            />
          </div>

          {/* REQUEST DATE */}
          <div className="relative">
            <label className="block text-xs font-semibold text-gray-500 mb-2">
              DATE <span className="text-red-600">*</span>
            </label>
            <div
              onClick={() => setShowDatePicker(!showDatePicker)}
              className={`
                w-full border rounded-xl px-3 py-2 bg-white cursor-pointer
                flex items-center justify-between
                ${!form.selectedDate ? "text-gray-400" : "text-gray-700"}
                ${errors.selectedDate ? "border-red-500" : "border-gray-300"}
              `} // Changed from rounded-lg to rounded-xl
            >
              <span>
                {form.selectedDate
                  ? dayjs(form.selectedDate).format("YYYY-MM-DD")
                  : "Select date"}
              </span>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            {showDatePicker && (
              <div className="absolute z-50 mt-2 bg-white rounded-xl shadow-xl border border-gray-200">
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DateCalendar
  value={form.selectedDate ? dayjs(form.selectedDate) : null}
  onChange={(newValue) => {
    setForm({ 
      ...form, 
      selectedDate: newValue ? newValue.format("YYYY-MM-DD") : "" 
    });
    setShowDatePicker(false);
    setErrors(prev => ({ ...prev, selectedDate: "" }));
  }}
  sx={{ width: 280 }}
  shouldDisableDate={(date) => {
    return date.isAfter(dayjs().subtract(1, 'day'), 'day');
  }}
/>
                </LocalizationProvider>
              </div>
            )}
            {errors.selectedDate && (
              <p className="text-xs text-red-500 mt-1">
                Date is required
              </p>
            )}
          </div>

          {/* REQUESTED BY */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-2">
              USER <span className="text-red-600">*</span>
            </label>
            <Select
              options={userOptions}
              value={userOptions.find(option => option.value === form.username) || null}
              onChange={(selected) => {
                setForm({ ...form, username: selected?.value || "" });
                setErrors(prev => ({ ...prev, username: "" }));
              }}
              components={{ IndicatorSeparator: () => null }}
              styles={customSelectStyles("username")}
            />
            {errors.username && (
              <p className="text-xs text-red-500 mt-1">
                Requested By is required
              </p>
            )}
          </div>

          {/* NAME */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              NAME (BUYER/SUPPLIER) <span className="text-red-600">*</span>
            </label>
            <input
              value={form.name}
              onChange={(e) => {
                setForm({ ...form, name: e.target.value });
                setErrors(prev => ({ ...prev, name: "" }));
              }}
              placeholder="Enter contact name"
              className={`
                w-full border rounded-xl px-3 py-2 bg-white
                text-gray-700 placeholder-gray-400
                ${errors.name ? "border-red-500" : "border-gray-300"}
                focus:outline-none focus:border-gray-600
              `} // Changed from rounded-lg to rounded-xl
            />
            {errors.name && (
              <p className="text-xs text-red-500 mt-1">{errors.name}</p>
            )}
          </div>

          {/* CALL TYPE */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-2">
              CALL TYPE <span className="text-red-600">*</span>
            </label>
            <Select
              options={callTypeOptions}
              value={callTypeOptions.find(option => option.value === form.callType) || null}
              onChange={(selected) => {
                setForm({ 
                  ...form, 
                  callType: selected?.value || "",
                  poSubtype: "" 
                });
                setErrors(prev => ({ ...prev, callType: "" }));
              }}
              components={{ IndicatorSeparator: () => null }}
              styles={customSelectStyles("callType")}
            />
            {errors.callType && (
              <p className="text-xs text-red-500 mt-1">{errors.callType}</p>
            )}
          </div>

          {/* PO SUBTYPE - Conditional */}
          {form.callType === "PO" && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-2">
                SUB TYPE <span className="text-red-600">*</span>
              </label>
              <Select
                options={poSubtypeOptions}
                value={poSubtypeOptions.find(option => option.value === form.poSubtype) || null}
                onChange={(selected) => {
                  setForm({ ...form, poSubtype: selected?.value || "" });
                  setErrors(prev => ({ ...prev, poSubtype: "" }));
                }}
                components={{ IndicatorSeparator: () => null }}
                styles={customSelectStyles("poSubtype")}
              />
              {errors.poSubtype && (
                <p className="text-xs text-red-500 mt-1">{errors.poSubtype}</p>
              )}
            </div>
          )}

          {/* CALL MODE */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-2">
              CALL MODE <span className="text-red-600">*</span>
            </label>
            <Select
              options={callModeOptions}
              value={callModeOptions.find(option => option.value === form.callMode) || null}
              onChange={(selected) => {
                setForm({ ...form, callMode: selected?.value || "" });
                setErrors(prev => ({ ...prev, callMode: "" }));
              }}
              components={{ IndicatorSeparator: () => null }}
              styles={customSelectStyles("callMode")}
            />
            {errors.callMode && (
              <p className="text-xs text-red-500 mt-1">{errors.callMode}</p>
            )}
          </div>

          {/* PRIORITY */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-2">
              PRIORITY <span className="text-red-600">*</span>
            </label>
            <Select
              options={priorityOptions}
              value={priorityOptions.find(option => option.value === form.priority) || null}
              onChange={(selected) => {
                setForm({ ...form, priority: selected?.value || "" });
                setErrors(prev => ({ ...prev, priority: "" }));
              }}
              components={{ IndicatorSeparator: () => null }}
              styles={customSelectStyles("priority")}
            />
            {errors.priority && (
              <p className="text-xs text-red-500 mt-1">{errors.priority}</p>
            )}
          </div>

          {/* STATUS */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-2">
              STATUS <span className="text-red-600">*</span>
            </label>
            <Select
              options={statusOptions}
              value={statusOptions.find(option => option.value === form.status) || null}
              onChange={(selected) => {
                setForm({ 
                  ...form, 
                  status: selected?.value || "",
                  followUpDate: selected?.value === "Follow_up" ? form.followUpDate : ""
                });
                setErrors(prev => ({ ...prev, status: "" }));
              }}
              components={{ IndicatorSeparator: () => null }}
              styles={customSelectStyles("status")}
            />
            {errors.status && (
              <p className="text-xs text-red-500 mt-1">{errors.status}</p>
            )}
          </div>

          {/* FOLLOW-UP DATE - Conditional */}
          {form.status === "Follow_up" && (
            <div className="relative">
              <label className="block text-xs font-semibold text-gray-500 mb-2">
                FOLLOW-UP DATE <span className="text-red-600">*</span>
              </label>
              <div
                onClick={() => setShowFollowUpPicker(!showFollowUpPicker)}
                className={`
                  w-full border rounded-xl px-3 py-2 bg-white cursor-pointer
                  flex items-center justify-between
                  ${!form.followUpDate ? "text-gray-400" : "text-gray-700"}
                  ${errors.followUpDate ? "border-red-500" : "border-gray-300"}
                `} // Changed from rounded-lg to rounded-xl
              >
                <span>
                  {form.followUpDate
                    ? dayjs(form.followUpDate).format("YYYY-MM-DD")
                    : "Select date"}
                </span>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>

              {showFollowUpPicker && (
                <div className="absolute z-50 mt-2 bg-white rounded-xl shadow-xl border border-gray-200">
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DateCalendar
  value={form.followUpDate ? dayjs(form.followUpDate) : null}
  onChange={(newValue) => {
    setForm({
      ...form,
      followUpDate: newValue ? newValue.format("YYYY-MM-DD") : ""
    });
    setShowFollowUpPicker(false);
    setErrors(prev => ({ ...prev, followUpDate: "" }));
  }}
  sx={{ width: 280 }}
  shouldDisableDate={(date) => {
    return date.isAfter(dayjs().subtract(1, 'day'), 'day');
  }}
/>
                  </LocalizationProvider>
                </div>
              )}
              {errors.followUpDate && (
                <p className="text-xs text-red-500 mt-1">{errors.followUpDate}</p>
              )}
            </div>
          )}

          {/* FORWARD TO */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-2">
              FORWARD TO
            </label>
            <Select
              options={employeeOptions}
              value={employeeOptions.find(option => option.value === String(form.forwardedTo)) || null}
              onChange={(selected) =>
                setForm({ ...form, forwardedTo: selected?.value || "" })
              }
              components={{ IndicatorSeparator: () => null }}
              styles={customSelectStyles()}
              isClearable
            />
          </div>
        </div>

        {/* Remarks Section - matching Code A layout */}
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">

           {/* Buyer/Supplier Remarks */}
           <div>
             <label className="block text-xs font-semibold text-gray-500 mb-2">
               REMARKS (BUYER/SUPPLIER)
             </label>

             <textarea
               rows="3"
               maxLength={250}
               value={form.remarksBuyer}
               onChange={(e) =>
                 setForm({ ...form, remarksBuyer: e.target.value })
               }
               className="w-full p-3 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-gray-600"
               placeholder="Enter external remarks..."
             />

             {/* Counter */}
             <div className="text-right text-xs text-gray-400 mt-1">
               {form.remarksBuyer.length}/250
             </div>
           </div>

           {/* Internal Remarks */}
           <div>
             <label className="block text-xs font-semibold text-gray-500 mb-2">
               REMARKS (INTERNAL/FOLLOW-UP)
             </label>

             <textarea
               rows="3"
               maxLength={250}
               value={form.remarksInternal}
               onChange={(e) =>
                 setForm({ ...form, remarksInternal: e.target.value })
               }
               className="w-full p-3 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-gray-600"
               placeholder="Enter internal notes..."
             />

             {/* Counter */}
             <div className="text-right text-xs text-gray-400 mt-1">
               {form.remarksInternal.length}/250
             </div>
           </div>

         </div>

        {/* Submit Button - matching Code A style */}
        <div className="flex justify-end mt-6">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition bg-[#7861E6] text-white hover:bg-[#6C56E0]"
          >
            <FiSave className="w-4 h-4" />
            {saving ? "Saving..." : "Save Entry"}
          </button>
        </div>
      </form>
    </div>
  </div>
);
}