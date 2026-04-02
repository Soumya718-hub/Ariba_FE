import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DatePicker } from "antd";
import {
  getAllClients,
  createCase,
  updateCase,
  getAllCallTypes,
  getAllCallModes,
  getLatestCaseDetails,
  getAllAribaEmp
} from "../../api/case";
import { getAllEmployees } from "../../api/hrms"
import Select from "react-select";
import dayjs from "dayjs";
import { Save } from "lucide-react";

export default function AddEntry({ role }) {
  // Trim + remove extra spaces
  const cleanText = (value) => value.replace(/\s+/g, " ").trim();

  // Only alphabets + space
  const isValidName = (value) => /^[A-Za-z\s]+$/.test(value);

  // Not empty (no only spaces)
  const isNotEmpty = (value) => value.trim().length > 0;

  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });
  const [callTypes, setCallTypes] = useState([]);
  const [callModes, setCallModes] = useState([]);
  const [employees, setEmployees] = useState([]);
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const { caseId } = useParams();
  const isEditMode = !!caseId;
  const [form, setForm] = useState({
    client: "",
    name: "",
    callType: "",
    poSubtype: "",
    callMode: "",
    priority: "",
    forwardTo: "",
    status: "",
    followUpDate: "",
    remarksExternal: "",
    remarksInternal: "",
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    setErrors({ ...errors, [name]: "" });
  };

  const validate = () => {
    const newErrors = {};

    if (!form.client) newErrors.client = "Client is required";
    const trimmedName = cleanText(form.name);

    if (!trimmedName) {
      newErrors.name = "Name is required";
    } else if (!isValidName(trimmedName)) {
      newErrors.name = "Only alphabets are allowed";
    }

    if (form.remarksExternal) {
      if (!isNotEmpty(form.remarksExternal)) {
        newErrors.remarksExternal = "Cannot be empty or spaces only";
      } else if (form.remarksExternal.length > 250) {
        newErrors.remarksExternal = "Maximum 250 characters allowed";
      }
    }

    if (form.remarksInternal) {
      if (!isNotEmpty(form.remarksInternal)) {
        newErrors.remarksInternal = "Cannot be empty or spaces only";
      } else if (form.remarksInternal.length > 250) {
        newErrors.remarksInternal = "Maximum 250 characters allowed";
      }
    }

    if (!form.callType) newErrors.callType = "Call Type is required";

    if (form.callType === "PO" && !form.poSubtype) {
      newErrors.poSubtype = "PO Subtype is required";
    }

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
    const loggedInUser = localStorage.getItem("emp_id");

    if (form.forwardTo && form.forwardTo === loggedInUser) {
      setToast({
        show: true,
        message: "You cannot forward case to yourself.",
        type: "error",
      });
      return;
    }

    if (loading) return;

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);

    const payload = {
      clientId: Number(form.client),
      name: cleanText(form.name),
      callType: form.callType,
      poSubtype: form.callType === "PO" ? form.poSubtype : null,
      callMode: form.callMode,
      priority: form.priority,
      forwardedTo: form.forwardTo || null,
      status: form.status,
      followUpDate: form.followUpDate || null,
      remarksBuyer: cleanText(form.remarksExternal),
      remarksInternal: cleanText(form.remarksInternal),
    };

    if (isEditMode) {
      payload.caseId = caseId;
    }

    try {
      let res;

      if (isEditMode) {
        res = await updateCase(payload);
      } else {
        res = await createCase(payload);
      }

      if (res?.success) {
        setToast({
          show: true,
          message: res.message || (isEditMode ? "Entry updated successfully!" : "Entry created successfully!"),
          type: "success",
        });

        setTimeout(() => {
          navigate(`/${role?.toLowerCase() || "user"}/logged-calls`);
        }, 2500);
      } else {
        setToast({
          show: true,
          message: res?.message || "Something went wrong",
          type: "error",
        });
      }

    } catch (error) {
      setToast({
        show: true,
        message: "Server error. Please try again.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchClients = async () => {
      const res = await getAllClients();
      if (res?.success) {
        setClients(res.data);
      }
    };

    fetchClients();
  }, []);

  useEffect(() => {
    const loadCaseData = async () => {
      if (caseId && clients.length > 0) {   // 🔥 IMPORTANT
        const res = await getLatestCaseDetails(caseId);
        if (res?.success) {
          const data = res.data;

          setForm({
            client: data.ClientID !== null && data.ClientID !== undefined
              ? Number(data.ClientID)
              : "",
            name: data.BuyerSupplierName || "",
            callType: data.CallType || "",
            poSubtype: data.PO_subtype || "",
            callMode: data.CallMode || "",
            priority: data.Priority || "",
            status: data.Status || "",
            forwardTo: data.ForwardedToUserID
              ? String(data.ForwardedToUserID)
              : "",
            followUpDate: data.FollowUpDate
              ? dayjs(data.FollowUpDate).format("YYYY-MM-DD")
              : "",
            remarksExternal: data.RemarksBuyerSupplier || "",
            remarksInternal: data.RemarksInternal || "",
          });
        }
      }
    };

    loadCaseData();
  }, [caseId, clients]);

useEffect(() => {
  const fetchEmployees = async () => {
    try {
      const response = await getAllEmployees();
      console.log("Full response:", response);
      
      // getAllEmployees returns array directly
      if (Array.isArray(response) && response.length > 0) {
        console.log("Employees data from API:", response);
        setEmployees(response);
      } else {
        console.log("Unexpected response format:", response);
        setEmployees([]);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
      setEmployees([]);
    }
  };

  fetchEmployees();
}, []);
  // Map to react-select options
const employeeOptions = Array.isArray(employees) && employees.length > 0
  ? employees.map((emp) => ({
      value: String(emp.Employee_ID), // Use Employee_ID from getAllEmployees
      label: `${emp.Employee_Name} (${emp.Employee_ID})`, // Use Employee_Name from getAllEmployees
    }))
  : [];

console.log("Employee options:", employeeOptions); // This should now show valid options

  console.log("Employee options:", employeeOptions);

  // Convert clients to react-select format
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
  ];
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
  });

  useEffect(() => {
    const fetchDropdowns = async () => {
      const typeRes = await getAllCallTypes();
      const modeRes = await getAllCallModes();

      if (typeRes?.success) {
        setCallTypes(typeRes.data);
      }

      if (modeRes?.success) {
        setCallModes(modeRes.data);
      }
    };

    fetchDropdowns();
  }, []);

  const poSubtypeOptions = [
    { value: "SR Raised", label: "SR Raised" },
    { value: "Helpdesk Raised", label: "Helpdesk Raised" },
    { value: "Resolved", label: "Resolved" },
  ];

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast((prev) => ({ ...prev, show: false }));
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  const isFormValid =
    form.client &&
    form.name &&
    form.callType &&
    (form.callType !== "PO" || form.poSubtype) &&
    form.callMode &&
    form.priority &&
    form.status &&
    (form.status !== "Follow_up" || form.followUpDate);
  const isClosedOrResolved = ["Closed", "Resolved"].includes(form.status);

  return (
    <div className="min-h-screen bg-[#f5f7fb]">
      <h1 className="text-2xl font-bold text-gray-800 mb-1">
        {isEditMode ? "Update Entry" : "Add New Entry"}
      </h1>
      <p className="text-gray-500 mb-6">
        {isEditMode
          ? "Modify the existing call record."
          : "Create a new call record in the system."}
      </p>
      {/* toast message */}
      {toast.show && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50">
          <div
            className={`px-6 py-3 rounded-xl shadow-lg text-sm font-medium text-white transition-all duration-300 animate-fadeIn
        ${toast.type === "success"
                ? "bg-green-600"
                : "bg-red-600"
              }`}
          >
            {toast.message}
          </div>
        </div>
      )}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow-sm border border-gray-200 px-8 py-8 space-y-6"
      >
        {/* Client + Name */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="relative">
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              CLIENT <span className="text-red-600">*</span>
            </label>
            <Select
              options={clientOptions}
              value={
                clientOptions.find(
                  (option) => Number(option.value) === Number(form.client)
                ) || null
              }
              onChange={(selected) =>
                setForm({
                  ...form,
                  client: selected ? Number(selected.value) : ""
                })
              }
              placeholder="Select Client"
              isDisabled={isEditMode}
              components={{ IndicatorSeparator: () => null }}
              styles={customSelectStyles("client")}
            />
            {errors.client && (
              <p className="text-red-500 text-xs mt-1">{errors.client}</p>
            )}
          </div>

          <div >
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              NAME (BUYER/SUPPLIER) <span className="text-red-600">*</span>
            </label>
            <input
              name="name"
              value={form.name}
              onChange={(e) => {
                let value = e.target.value;

                if (/^[A-Za-z\s]*$/.test(value)) {
                  value = value.replace(/\s+/g, " ");
                  setForm({ ...form, name: value });
                  setErrors({ ...errors, name: "" });
                }
              }}
              placeholder="Enter contact name"
              className={`
                  w-full border rounded-lg px-3 py-2 bg-white
                  text-gray-700
                  placeholder-gray-400
                  ${errors.name ? "border-red-500" : "border-gray-300"}
                  focus:outline-none focus:border-gray-600
                `}
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1">{errors.name}</p>
            )}
          </div>
        </div>


        {/* CALL TYPE + SUBTYPE + CALL MODE + PRIORITY */}
        <div className={`grid gap-6 ${form.callType === "PO" ? "grid-cols-4" : "grid-cols-3"
          }`}>

          {/* CALL TYPE */}
          <div className="relative">
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              CALL TYPE <span className="text-red-600">*</span>
            </label>

            <Select
              options={callTypeOptions}
              value={
                callTypeOptions.find(
                  (option) => option.value === form.callType
                ) || null
              }
              onChange={(selected) =>
                setForm({
                  ...form,
                  callType: selected?.value || "",
                  poSubtype: "" // reset when changing
                })
              }
              placeholder="Select"
              components={{ IndicatorSeparator: () => null }}
              styles={customSelectStyles("callType")}
            />

            {errors.callType && (
              <p className="text-red-500 text-xs mt-1">{errors.callType}</p>
            )}
          </div>

          {/* SUBTYPE (ONLY IF PO SELECTED) */}
          {form.callType === "PO" && (
            <div className="relative">
              <label className="block text-xs font-semibold text-gray-500 mb-1">
                SUB-TYPE <span className="text-red-600">*</span>
              </label>

              <Select
                options={poSubtypeOptions}
                value={
                  poSubtypeOptions.find(
                    (option) => option.value === form.poSubtype
                  ) || null
                }
                onChange={(selected) =>
                  setForm({ ...form, poSubtype: selected?.value || "" })
                }
                placeholder="Select"
                components={{ IndicatorSeparator: () => null }}
                styles={customSelectStyles("poSubtype")}
              />

              {errors.poSubtype && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.poSubtype}
                </p>
              )}
            </div>
          )}

          {/* CALL MODE */}
          <div className="relative">
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              CALL MODE <span className="text-red-600">*</span>
            </label>

            <Select
              options={callModeOptions}
              value={
                callModeOptions.find(
                  (option) => option.value === form.callMode
                ) || null
              }
              onChange={(selected) =>
                setForm({ ...form, callMode: selected?.value || "" })
              }
              placeholder="Select"
              components={{ IndicatorSeparator: () => null }}
              styles={customSelectStyles("callMode")}
            />

            {errors.callMode && (
              <p className="text-red-500 text-xs mt-1">{errors.callMode}</p>
            )}
          </div>

          {/* PRIORITY */}
          <div className="relative">
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              PRIORITY <span className="text-red-600">*</span>
            </label>

            <Select
              options={priorityOptions}
              value={
                priorityOptions.find(
                  (option) => option.value === form.priority
                ) || null
              }
              onChange={(selected) =>
                setForm({ ...form, priority: selected?.value || "" })
              }
              placeholder="Select"
              components={{ IndicatorSeparator: () => null }}
              styles={customSelectStyles("priority")}
            />

            {errors.priority && (
              <p className="text-red-500 text-xs mt-1">
                {errors.priority}
              </p>
            )}
          </div>

        </div>

        {/* Forward + Status */}
        <div className={`grid gap-6 ${form.status === "Follow_up" ? "grid-cols-3" : "grid-cols-2"
          }`}>

          {/* STATUS */}
          <div className="relative">
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              STATUS <span className="text-red-600">*</span>
            </label>

            <Select
              options={statusOptions}
              value={
                statusOptions.find(
                  (option) => option.value === form.status
                ) || null
              }
              onChange={(selected) => {
                setForm({
                  ...form,
                  status: selected?.value || "",
                  followUpDate:
                    selected?.value === "Follow_up"
                      ? form.followUpDate
                      : "",
                });
              }}
              placeholder="Select"
              components={{ IndicatorSeparator: () => null }}
              styles={customSelectStyles("status")}
            />
            {errors.status && (
              <p className="text-red-500 text-xs mt-1">
                {errors.status}
              </p>
            )}
          </div>

          {/* DATE (Only When FollowUp Selected) */}
          {form.status === "Follow_up" && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">
                DATE <span className="text-red-600">*</span>
              </label>

              <DatePicker
                value={form.followUpDate ? dayjs(form.followUpDate) : null}
                format="YYYY-MM-DD"
                style={{ width: "100%" }}
                disabledDate={(current) =>
                  current && current < dayjs().startOf("day")
                }
                onChange={(date) => {
                  setForm({
                    ...form,
                    followUpDate: date ? date.format("YYYY-MM-DD") : "",
                  });
                  setErrors({ ...errors, followUpDate: "" });
                }}
                className={`custom-date-picker ${errors.followUpDate ? "date-error" : ""
                  }`}
              />

              {errors.followUpDate && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.followUpDate}
                </p>
              )}
            </div>
          )}
          {/* FORWARD TO */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              FORWARD TO
            </label>
            <Select
              options={employeeOptions}
              value={
                employeeOptions.find(
                  (option) => option.value === String(form.forwardTo)
                ) || null
              }
              onChange={(selected) =>
                setForm({ ...form, forwardTo: selected?.value || "" })
              }
              placeholder="Select"
              isClearable
              components={{ IndicatorSeparator: () => null }}
              styles={customSelectStyles("forwardTo")}
            />

            {errors.forwardTo && (
              <p className="text-red-500 text-xs mt-1">
                {errors.forwardTo}
              </p>
            )}
          </div>

        </div>

        {/* Remarks */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              REMARKS (BUYER/SUPPLIER)
            </label>
            <textarea
              name="remarksExternal"
              value={form.remarksExternal}
              onChange={(e) => {
                let value = e.target.value;
                value = value.replace(/\s+/g, " ");
                if (value.length <= 250) {
                  setForm({ ...form, remarksExternal: value });
                }
              }}
              placeholder="Enter external remarks..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 h-24 text-gray-700 placeholder-gray-400 resize-none focus:outline-none focus:border-gray-600"
            />  <p className="text-xs text-gray-400 text-right">
              {form.remarksExternal.length}/250
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              REMARKS (INTERNAL/FOLLOW-UP)
            </label>
            <textarea
              name="remarksInternal"
              value={form.remarksInternal}
              onChange={(e) => {
                let value = e.target.value;
                value = value.replace(/\s+/g, " ");
                if (value.length <= 250) {
                  setForm({ ...form, remarksInternal: value });
                }
              }}
              placeholder="Enter internal notes..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 h-24 text-gray-700 placeholder-gray-400 resize-none focus:outline-none focus:border-gray-600"
            />  <p className="text-xs text-gray-400 text-right">
              {form.remarksInternal.length}/250
            </p>
          </div>
        </div>

        {/* {
          role === "ADMIN" && (
            <div className="text-xs text-blue-600">
              Admin privileges enabled.
            </div>
          )
        } */}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading || !isFormValid }
            className={`flex items-center gap-2
  px-5 py-3
  rounded-xl
  text-sm font-medium
  transition-colors duration-200
      ${isFormValid
      ? "bg-[#7861E6] text-white hover:bg-[#6f59d4]"
      : "bg-[#B9ABF7] text-white cursor-not-allowed"
    }`}

          >
            {loading ? (
              "Saving..."
            ) : (
              <>
                <Save size={16} />
                {isEditMode ? "Update Entry" : "Save Entry"}
              </>
            )}
          </button>
        </div>
      </form >
    </div >
  );
}