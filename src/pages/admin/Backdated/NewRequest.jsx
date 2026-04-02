import { useState, useEffect } from "react";
import { HiPaperAirplane, } from "react-icons/hi";
import { SquarePen } from "lucide-react";
import Select from "react-select";
import dayjs from "dayjs";
import { DatePicker } from "antd";
import {
  raiseBackdatedRequest,
  raiseArchiveRequest,
  getAllLatestBackdatedCases
} from "../../../api/backdated";
import {
  getAllCallTypes,
  getAllCallModes,
  getAllClients
} from "../../../api/case";
import {
  getAllEmployees
} from "../../../api/hrms"
import { useNavigate } from "react-router-dom";

export default function NewRequest() {
  const cleanText = (value) => value.replace(/\s+/g, " ").trim();
  const isValidName = (value) => /^[A-Za-z\s]+$/.test(value);
  const isNotEmpty = (value) => value.trim().length > 0;

  const navigate = useNavigate();
  const [toastMessage, setToastMessage] = useState("");
  const [errors, setErrors] = useState({});
  const [tableData, setTableData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [modalError, setModalError] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestType, setRequestType] = useState("");
  const [modalRemarks, setModalRemarks] = useState("");
  const initialFormState = {
    caseId: "",
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
  };

  const [formData, setFormData] = useState(initialFormState);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.selectedDate) newErrors.selectedDate = true;
    if (!formData.username) newErrors.username = true;
    if (!formData.clientId) newErrors.clientId = true;

    const trimmedName = cleanText(formData.name);
    if (!trimmedName) {
      newErrors.name = "Name is required";
    } else if (!isValidName(trimmedName)) {
      newErrors.name = "Only alphabets are allowed";
    }

    if (formData.remarksBuyer) {
      if (!isNotEmpty(formData.remarksBuyer)) {
        newErrors.remarksBuyer = "Cannot be empty or spaces only";
      } else if (formData.remarksBuyer.length > 250) {
        newErrors.remarksBuyer = "Maximum 250 characters allowed";
      }
    }

    if (formData.remarksInternal) {
      if (!isNotEmpty(formData.remarksInternal)) {
        newErrors.remarksInternal = "Cannot be empty or spaces only";
      } else if (formData.remarksInternal.length > 250) {
        newErrors.remarksInternal = "Maximum 250 characters allowed";
      }
    }

    if (!formData.callType) newErrors.callType = true;

    if (formData.callType === "PO" && !formData.poSubtype) {
      newErrors.poSubtype = true;
    }
    if (!formData.callMode) newErrors.callMode = true;
    if (!formData.priority) newErrors.priority = true;
    if (!formData.status) newErrors.status = true;

    if (
      formData.status === "Follow_up" &&
      !formData.followUpDate
    ) {
      newErrors.followUpDate = true;
    }

    setErrors(newErrors);
    return newErrors;
  };

  const poSubtypeOptions = [
    { label: "SR Raised", value: "SR Raised" },
    { label: "Helpdesk Raised", value: "Helpdesk Raised" },
    { label: "Resolved", value: "Resolved" }
  ];

  const handleSubmit = async () => {
    if (!modalRemarks.trim()) {
      setModalError("Remarks is required");
      return;
    } else if (modalRemarks.length > 250) {
      setModalError("Maximum 250 characters allowed");
      return;
    }

    try {
      const payload = {
        selectedDate: formData.selectedDate,
        username: formData.username,
        clientId: formData.clientId,
        name: cleanText(formData.name),
        callType: formData.callType,
        poSubtype: formData.callType === "PO" ? formData.poSubtype : null,
        callMode: formData.callMode,
        priority: formData.priority,
        forwardedTo: formData.forwardedTo || null,
        status: formData.status,
        followUpDate: formData.followUpDate || null,

        remarksBuyer: cleanText(formData.remarksBuyer),
        remarksInternal: cleanText(formData.remarksInternal),
        requestRemarks: modalRemarks
      };

      let response;

      if (requestType === "ARCHIVE") {
        response = await raiseArchiveRequest(formData.caseId, {
          requestRemarks: modalRemarks
        });
      } else {
        response = await raiseBackdatedRequest(payload);
      }

      if (response?.success) {
        setShowRequestModal(false);

        if (requestType === "ARCHIVE") {
          setTableData(prev =>
            prev.filter(item => item.CaseID !== formData.caseId)
          );
          setToastMessage("Archive request submitted successfully.");
        } else {
          setToastMessage("Backdated request submitted successfully.");
        }
        setFormData(initialFormState);
        setErrors({});
        setModalRemarks("");
        setModalError(false);

      } else {
        alert(response?.message || "Failed to submit request");
      }

    } catch (error) {
      console.error(error);
      alert("Server error.");
    }
  };

  const inputStyle =
    "w-full min-h-[44px] px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 placeholder-gray-400 focus:outline-none focus:border-gray-600";

  const [userOptions, setUserOptions] = useState([]);
  const [clientOptions, setClientOptions] = useState([]);
  const [callTypeOptions, setCallTypeOptions] = useState([]);
  const [callModeOptions, setCallModeOptions] = useState([]);
  const [priorityOptions, setPriorityOptions] = useState([]);
  const [statusOptions, setStatusOptions] = useState([]);
  const customSelectStyles = (hasError) => ({
    control: (provided, state) => ({
      ...provided,
      minHeight: 44,
      height: 44,
      borderRadius: 8,
      borderColor: hasError
        ? "#ef4444"
        : state.isFocused
          ? "#4B5563"
          : "#D1D5DB",
      boxShadow: "none",
      paddingLeft: "2px",
      paddingRight: "2px",
      "&:hover": {
        borderColor: "#4B5563",
      },
    }),
    valueContainer: (provided) => ({
      ...provided,
      padding: "0 8px",
    }),
    placeholder: (provided) => ({
      ...provided,
      color: "#9CA3AF",
      fontSize: "14px",
    }),
    singleValue: (provided) => ({
      ...provided,
      color: "#374151",
      fontSize: "14px",
    }),
    indicatorsContainer: (provided) => ({
      ...provided,
      height: 44,
    }),
    menu: (provided) => ({
      ...provided,
      borderRadius: 8,
      zIndex: 50,
    }),
  });

  useEffect(() => {
    const fetchDropdowns = async () => {
      const callTypeRes = await getAllCallTypes();
      const callModeRes = await getAllCallModes();
      if (callTypeRes?.success) {
        setCallTypeOptions(
          callTypeRes.data.map((item) => ({
            label: item.callType,
            value: item.callType
          }))
        );
      }

      if (callModeRes?.success) {
        setCallModeOptions(
          callModeRes.data.map((item) => ({
            label: item.callMode,
            value: item.callMode
          }))
        );
      }
    };

    fetchDropdowns();
  }, []);

  useEffect(() => {
    const fetchUsersAndClients = async () => {
      const usersData = await getAllEmployees();
      const clientsRes = await getAllClients();

      console.log("Users data:", usersData); // Debug: see what you get

      // Users - handle array directly
      if (Array.isArray(usersData) && usersData.length > 0) {
        setUserOptions(
          usersData.map((u) => ({
            label: `${u.Employee_Name} (${u.Employee_ID}) `,
            value: u.Employee_ID
          }))
        );
      } else {
        console.log("No users data or empty array");
      }

      if (clientsRes?.success) {
        setClientOptions(
          clientsRes.data.map((c) => ({
            label: c.ClientName,
            value: c.ClientID
          }))
        );
      }
    };

    fetchUsersAndClients();
  }, []);

  useEffect(() => {
    setPriorityOptions([
      { label: "High", value: "high" },
      { label: "Medium", value: "medium" },
      { label: "Low", value: "low" }
    ]);

    setStatusOptions([
      { label: "Open", value: "Open" },
      { label: "Pending Updates", value: "Pending_Updates" },
      { label: "Follow Up", value: "Follow_up" },
      { label: "Resolved", value: "Resolved" },
      { label: "Closed", value: "Closed" },
    ]);
  }, []);

  useEffect(() => {
    if (showRequestModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [showRequestModal]);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage("");
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;
  // Pagination calculations
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = tableData.slice(indexOfFirstRow, indexOfLastRow);

  const totalPages = Math.ceil(tableData.length / rowsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [tableData]);

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

  const isFormValid =
    formData.selectedDate &&
    formData.username &&
    formData.clientId &&
    cleanText(formData.name) &&
    formData.callType &&
    (formData.callType !== "PO" || formData.poSubtype) &&
    formData.callMode &&
    formData.priority &&
    formData.status &&
    (formData.status !== "Follow_up" || formData.followUpDate);
  return (

    <div className="min-h-screen bg-[#F6F8FB] relative">
      {/* ✅ TOAST MESSAGE HERE */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50">
          <div className="bg-green-600 text-white px-6 py-3 rounded-xl shadow-lg text-sm font-medium animate-fadeIn">
            {toastMessage}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          New Backdated Request
        </h1>
        <p className="text-gray-500 text-sm">
          Log historical call entries and manage administrative records.
        </p>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-2xl shadow-sm p-6 space-y-6">

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-6">
          {/* DATE */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              DATE <span className="text-red-600">*</span>
            </label>

            <DatePicker
              value={formData.selectedDate ? dayjs(formData.selectedDate) : null}
              format="YYYY-MM-DD"
              disabledDate={(current) => current && current > dayjs().endOf("day")}  // restrict future dates
              onChange={(date) => {
                setFormData({
                  ...formData,
                  selectedDate: date ? date.format("YYYY-MM-DD") : "",
                });
                setErrors((prev) => ({ ...prev, selectedDate: false }));
              }}
              placeholder="Select date"
              status={errors.selectedDate ? "error" : ""}
              style={{ width: "100%" }}
            />

            {errors.selectedDate && (
              <p className="text-red-500 text-xs mt-1">
                Date is required
              </p>
            )}
          </div>

          {/* USER */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              USER <span className="text-red-600">*</span>
            </label>
            <Select
              options={userOptions}
              value={
                userOptions.find(
                  (u) => u.value === formData.username
                ) || null
              }
              onChange={(selected) => {
                setFormData({
                  ...formData,
                  username: selected?.value || ""
                });

                setErrors(prev => ({ ...prev, username: false }));
              }}
              placeholder="Select"
              components={{ IndicatorSeparator: () => null }}
              styles={customSelectStyles(errors.username)}
            />{errors.username && (
              <p className="text-red-500 text-xs mt-1">
                User is required
              </p>
            )}
          </div>

          {/* CLIENT */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              CLIENT <span className="text-red-600">*</span>
            </label>
            <Select
              options={clientOptions}
              value={
                clientOptions.find(
                  (u) => u.value === formData.clientId
                ) || null
              }
              onChange={(selected) => {
                setFormData({
                  ...formData,
                  clientId: selected?.value || ""
                });
                setErrors(prev => ({ ...prev, clientId: false }));
              }}
              placeholder="Select"
              components={{ IndicatorSeparator: () => null }}
              styles={customSelectStyles(errors.clientId)}
            />{errors.clientId && (
              <p className="text-red-500 text-xs mt-1">
                Client is required
              </p>
            )}
          </div>
          {/* NAME */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              NAME (BUYER/SUPPLIER) <span className="text-red-600">*</span>
            </label>

            <input
              type="text"
              value={formData.name}
              onChange={(e) => {
                let value = e.target.value;

                if (/^[A-Za-z\s]*$/.test(value)) {
                  value = value.replace(/\s+/g, " ");
                  setFormData({ ...formData, name: value });
                  setErrors(prev => ({ ...prev, name: "" }));
                }
              }}
              className={`
      w-full min-h-[44px] px-3 py-2 rounded-lg border
      ${errors.name ? "border-red-500" : "border-gray-300"}
      bg-white text-gray-700 placeholder-gray-400
      focus:outline-none focus:border-gray-600
    `}
            />

            {errors.name && (
              <p className="text-red-500 text-xs mt-1">
                {errors.name}
              </p>
            )}
          </div>

          {/* CALL TYPE */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              CALL TYPE <span className="text-red-600">*</span>
            </label>
            <Select
              options={callTypeOptions}

              value={
                callTypeOptions.find(
                  (u) => u.value === formData.callType
                ) || null
              }
              onChange={(selected) => {
                setFormData({
                  ...formData,
                  callType: selected?.value || "",
                  poSubtype: ""
                });

                setErrors(prev => ({
                  ...prev,
                  callType: false,
                  poSubtype: false
                }));
              }}
              placeholder="Select"
              components={{ IndicatorSeparator: () => null }}
              styles={customSelectStyles(errors.callType)}
            />{errors.callType && (
              <p className="text-red-500 text-xs mt-1">
                Call Type is required
              </p>
            )}
          </div>

          {/* PO SUBTYPE (Only if PO selected) */}
          {formData.callType === "PO" && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">
                PO SUBTYPE <span className="text-red-600">*</span>
              </label>

              <Select
                options={poSubtypeOptions}
                value={poSubtypeOptions.find(
                  (o) => o.value === formData.poSubtype
                )}
                onChange={(selected) => {
                  setFormData({
                    ...formData,
                    poSubtype: selected?.value || ""
                  });
                  setErrors(prev => ({ ...prev, poSubtype: false }));
                }}
                placeholder="Select"
                components={{ IndicatorSeparator: () => null }}
                styles={customSelectStyles(errors.poSubtype)}
              />

              {errors.poSubtype && (
                <p className="text-red-500 text-xs mt-1">
                  PO Subtype is required
                </p>
              )}
            </div>
          )}

          {/* CALL MODE */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              CALL MODE <span className="text-red-600">*</span>
            </label>
            <Select
              options={callModeOptions}
              value={callModeOptions.find(
                (o) => o.value === formData.callMode
              ) || null}
              onChange={(selected) => {
                setFormData({
                  ...formData,
                  callMode: selected?.value || ""
                });
                setErrors(prev => ({ ...prev, callMode: false }));
              }}
              placeholder="Select"
              components={{ IndicatorSeparator: () => null }}
              styles={customSelectStyles(errors.callMode)}
            />{errors.callMode && (
              <p className="text-red-500 text-xs mt-1">
                Call Mode is required
              </p>
            )}
          </div>

          {/* PRIORITY */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              PRIORITY <span className="text-red-600">*</span>
            </label>
            <Select
              options={priorityOptions}
              value={priorityOptions.find(
                (o) => o.value === formData.priority
              ) || null}
              onChange={(selected) => {
                setFormData({
                  ...formData,
                  priority: selected?.value || ""
                });
                setErrors(prev => ({ ...prev, priority: false }));
              }}
              placeholder="Select"
              components={{ IndicatorSeparator: () => null }}
              styles={customSelectStyles(errors.priority)}
            />{errors.priority && (
              <p className="text-red-500 text-xs mt-1">
                Priority is required
              </p>
            )}
          </div>

          {/* STATUS */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              STATUS <span className="text-red-600">*</span>
            </label>
            <Select
              options={statusOptions}
              value={statusOptions.find(
                (u) => u.value === formData.status
              ) || null}
              onChange={(selected) => {
                setFormData({
                  ...formData,
                  status: selected?.value || "",
                  followUpDate:
                    selected?.value === "Follow_up"
                      ? formData.followUpDate
                      : ""
                });

                setErrors(prev => ({ ...prev, status: false }));
              }}
              placeholder="Select"
              components={{ IndicatorSeparator: () => null }}
              styles={customSelectStyles(errors.status)}
            />{errors.status && (
              <p className="text-red-500 text-xs mt-1">
                Status is required
              </p>
            )}
          </div>

          {/* FOLLOW-UP DATE */}
          {formData.status === "Follow_up" && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">
                FOLLOW-UP DATE <span className="text-red-600">*</span>
              </label>

              <DatePicker
                value={formData.followUpDate ? dayjs(formData.followUpDate) : null}
                format="YYYY-MM-DD"

                onChange={(date) => {
                  setFormData({
                    ...formData,
                    followUpDate: date ? date.format("YYYY-MM-DD") : "",
                  });
                  setErrors((prev) => ({ ...prev, followUpDate: false }));
                }}
                placeholder="Select date"
                status={errors.followUpDate ? "error" : ""}
                style={{ width: "100%" }}
              />

              {errors.followUpDate && (
                <p className="text-red-500 text-xs mt-1">
                  Follow Up Date is required
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
              options={userOptions}
              value={userOptions.find(
                (u) => u.value === formData.forwardedTo
              ) || null}
              onChange={(selected) =>
                setFormData({
                  ...formData,
                  forwardedTo: selected?.value || ""
                })
              }
              placeholder="Select"
              components={{ IndicatorSeparator: () => null }}
              styles={customSelectStyles(false)}
            />
          </div>

        </div>

        {/* Remarks */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="text-xs font-semibold text-gray-500">
              REMARKS (BUYER/SUPPLIER)
            </label>
            <textarea
              rows="3"
              value={formData.remarksBuyer}
              onChange={(e) => {
                let value = e.target.value;
                value = value.replace(/\s+/g, " ");
                if (value.length <= 250) {
                  setFormData({ ...formData, remarksBuyer: value });
                }
              }}
              className="w-full mt-1 p-3 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-indigo-500"
            />  <p className="text-xs text-gray-400 text-right">
              {formData.remarksBuyer.length}/250
            </p>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500">
              REMARKS (INTERNAL/FOLLOW-UP)
            </label>
            <textarea
              rows="3"
              value={formData.remarksInternal}
              onChange={(e) => {
                let value = e.target.value.replace(/\s+/g, " ");
                if (value.length <= 250) {
                  setFormData({ ...formData, remarksInternal: value });
                }
              }}
              className="w-full mt-1 p-3 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-indigo-500"
            />  <p className="text-xs text-gray-400 text-right">
              {formData.remarksInternal.length}/250
            </p>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-3">
          <button
            disabled={!isFormValid}
            onClick={() => {
              const validationErrors = validateForm();

              if (Object.keys(validationErrors).length > 0) {
                return;
              }

              setModalRemarks("");
              setModalError(false);
              setRequestType("CREATE");
              setShowRequestModal(true);
            }}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition
    ${!isFormValid
                ? "bg-[#B9ABF7] text-white cursor-not-allowed"
                : "bg-[#7861E6] text-white hover:bg-[#6C56E0]"
              }
  `}
          >
            <HiPaperAirplane className="w-4 h-4 rotate-45" />
            Submit Request
          </button>
        </div>

      </div>

      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">

          <div className="bg-white w-[520px] rounded-3xl shadow-2xl">

            {/* Header */}
            <div className="flex justify-between items-center px-6 py-5 bg-gray-100 border-b border-gray-100 rounded-t-3xl">

              <div className="flex items-center gap-3">

                <div className="bg-indigo-100 p-2 rounded-xl">
                  <SquarePen className="text-[#7861E6] w-5 h-5" />
                </div>

                <h2 className="text-xl font-semibold text-gray-800">
                  Create Backdated Request
                </h2>

              </div>

              <button
                onClick={() => {
                  setShowRequestModal(false);
                  setModalRemarks("");
                  setModalError(false);
                }}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ✕
              </button>

            </div>

            {/* Body */}
            <div className="px-6 py-6 space-y-4 pb-8">

              {/* Mandatory Remarks */}
              <div>
                <label className="block text-xs font-semibold text-[#62748E] mb-2 uppercase">
                  Mandatory Remarks for Request <span className="text-red-600">*</span>
                </label>

                <textarea
                  rows="3"
                  value={modalRemarks}
                  onChange={(e) => {
                    let value = e.target.value;
                    value = value.replace(/\s+/g, " ");

                    if (value.length <= 250) {
                      setModalRemarks(value);
                    }
                    setModalError(false);
                  }}
                  placeholder="Provide reason for raising this request..."
                  className={`w-full p-3 rounded-xl border ${modalError ? "border-red-500" : "border-gray-200"
                    } text-md font-normal outline-none focus:ring-2 focus:ring-[#C6D2FF]`}
                />
                <p className="text-xs text-gray-400 text-right">
                  {modalRemarks.length}/250
                </p>

                {modalError && (
                  <p className="text-red-500 text-xs mt-1">
                    {modalError}
                  </p>
                )}
              </div>

              {/* Warning Box */}
              <div className="bg-[#FFFBEB] border border-[#FEF3C6] rounded-2xl p-4 flex gap-3 items-start">

                {/* Icon */}
                <div className="text-[#E17100] mt-[2px]">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="9" />
                    <line x1="12" y1="8" x2="12" y2="12" strokeLinecap="round" />
                    <circle cx="12" cy="16" r="1" fill="currentColor" stroke="none" />
                  </svg>
                </div>

                {/* Text */}
                <p className="text-[#973C00] text-base leading-relaxed">
                  Are you sure you want to create this backdated request?
                </p>

              </div>

              {/* Buttons */}
              <div className="flex gap-5 pt-2">

                <button
                  onClick={() => {
                    setShowRequestModal(false);
                    setModalRemarks("");
                    setModalError(false);
                  }}
                  className="flex-1 h-11 rounded-xl bg-[#FFFFFF] border border-[#E2E8F0] text-[#314158] text-sm font-medium hover:bg-[#E2E8F0] transition"
                >
                  Cancel
                </button>

                <button
                  onClick={handleSubmit}
                  disabled={!modalRemarks.trim()}
                  className={`flex-1 flex items-center justify-center gap-2 h-11 rounded-xl 
              bg-[#7861E6] text-white text-sm font-semibold shadow-lg transition
              ${!modalRemarks.trim()
                      ? "opacity-40 cursor-not-allowed"
                      : "opacity-100 hover:bg-[#6C56E0]"
                    }`}
                >
                  <HiPaperAirplane className="w-4 h-4 rotate-45" />
                  Create Request
                </button>

              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}