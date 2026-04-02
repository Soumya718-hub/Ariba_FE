import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Select from "react-select";
import dayjs from "dayjs";
import { HiPaperAirplane } from "react-icons/hi";
import { DatePicker } from "antd";
import { SquarePen, ArrowLeft } from "lucide-react";
import { raiseModifyRequest, getAllLatestBackdatedCases, } from "../../api/backdated";

import {
    getAllCallTypes,
    getAllClients,
    getAllCallModes,
    getAllAribaEmp,
} from "../../api/case";
import { getAllEmployees } from "../../api/hrms";

export default function EditBackdated() {
    const cleanText = (value) => value.replace(/\s+/g, " ").trim();
    const isValidName = (value) => /^[A-Za-z\s]+$/.test(value);
    const isNotEmpty = (value) => value.trim().length > 0;

    const [submitting, setSubmitting] = useState(false);
    const [toastMessage, setToastMessage] = useState("");
    const { caseId } = useParams();
    const navigate = useNavigate();
    const [mainError, setMainError] = useState(false);
    const [formData, setFormData] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalRemarks, setModalRemarks] = useState("");
    const [modalError, setModalError] = useState(false);
    const [loading, setLoading] = useState(true);

    const [callTypeOptions, setCallTypeOptions] = useState([]);
    const [clientOptions, setClientOptions] = useState([]);
    const [callModeOptions, setCallModeOptions] = useState([]);
    const [userOptions, setUserOptions] = useState([]);

    const priorityOptions = [
        { label: "High", value: "high" },
        { label: "Medium", value: "medium" },
        { label: "Low", value: "low" },
    ];

    const statusOptions = [
        { label: "Open", value: "Open" },
        { label: "Pending Updates", value: "Pending_Updates" },
        { label: "Follow Up", value: "Follow_up" },
        { label: "Resolved", value: "Resolved" },
        { label: "Closed", value: "Closed" },
    ];

    const poSubtypeOptions = [
        { label: "SR Raised", value: "SR Raised" },
        { label: "Helpdesk Raised", value: "Helpdesk Raised" },
        { label: "Resolved", value: "Resolved" },
    ];

    useEffect(() => {
        if (toastMessage) {
            const timer = setTimeout(() => {
                setToastMessage("");
            }, 5000);

            return () => clearTimeout(timer);
        }
    }, [toastMessage]);
   useEffect(() => {
    const fetchDropdowns = async () => {
        const callTypes = await getAllCallTypes();
        const clients = await getAllClients();
        const callModes = await getAllCallModes();
        const users = await getAllEmployees();  // Changed from getAllAribaEmp

        if (callTypes?.success) {
            setCallTypeOptions(
                callTypes.data.map((c) => ({
                    label: c.callType,
                    value: c.callType,
                }))
            );
        }

        if (clients?.success) {
            setClientOptions(
                clients.data.map((c) => ({
                    label: c.ClientName,
                    value: c.ClientID,
                }))
            );
        }

        if (callModes?.success) {
            setCallModeOptions(
                callModes.data.map((c) => ({
                    label: c.callMode,
                    value: c.callMode,
                }))
            );
        }

        // getAllEmployees returns array directly
        if (Array.isArray(users) && users.length > 0) {
            setUserOptions(
                users.map((u) => ({
                    label: `${u.Employee_Name} (${u.Employee_ID})`, // Using Employee_Name and Employee_ID
                    value: u.Employee_ID,
                }))
            );
        } else {
            console.log("No users data or invalid response:", users);
            setUserOptions([]);
        }
    };

    fetchDropdowns();
}, []);

    // 🔵 Load Case Data
    useEffect(() => {
        const fetchCase = async () => {
            const res = await getAllLatestBackdatedCases();

            if (res?.success) {
                const selected = res.data.find(
                    (item) => item.CaseID === caseId
                );

                if (selected) {
                    setFormData({
                        caseId: selected.CaseID,
                        selectedDate: dayjs(selected.LogTimestamp).format("YYYY-MM-DD"),
                        username: selected.CurrentOwner || "",  // Store the user ID
                        usernameLabel: selected.current_owner_name || "",  // Store the user name for display
                        clientId: selected.ClientID,
                        name: selected.name || selected.BuyerSupplierName,
                        currentOwnerName: selected.current_owner_name,
                        callType: selected.CallType,
                        poSubtype: selected.PO_subtype,
                        callMode: selected.CallMode,
                        priority: selected.Priority,
                        forwardedTo: selected.ForwardedToUserID,
                        forwardedToName: selected.forwarded_to_name,
                        status: selected.Status,
                        followUpDate: selected.FollowUpDate ? dayjs(selected.FollowUpDate).format("YYYY-MM-DD") : "",
                        remarksBuyer: selected.RemarksBuyerSupplier,
                        remarksInternal: selected.RemarksInternal,
                    });
                }
            }

            setLoading(false);
        };

        fetchCase();
    }, [caseId]);

    const handleModify = async () => {
        if (!modalRemarks.trim()) {
            setModalError(true);
            return;
        }

        setModalOpen(false);
        setSubmitting(true);

        const payload = {
            selectedDate: formData.selectedDate,
            username: formData.username,
            updatedData: {
                ...formData,
                name: cleanText(formData.name),
                remarksBuyer: cleanText(formData.remarksBuyer),
                remarksInternal: cleanText(formData.remarksInternal),
            },
            requestRemarks: modalRemarks,
        };

        try {
            const res = await raiseModifyRequest(caseId, payload);

            if (res?.success) {
                setToastMessage("Modify request submitted successfully.");
                setTimeout(() => {
                    navigate(-1);
                }, 1500);
            } else {
                // Handle the error response
                setSubmitting(false);

                // Show the error message from backend
                if (res?.message) {
                    setToastMessage(res.message);

                    // If you want to show the existing request details in the UI
                    if (res?.data?.existingRequestId) {
                        console.log('Existing pending request:', res.data);
                        // You can set this to state and display it in UI if needed
                    }
                } else {
                    setToastMessage("Failed to submit modify request");
                }
            }
        } catch (error) {
            console.error(error);
        }

        setSubmitting(false);
    };

    const customSelectStyles = (hasError) => ({
        control: (provided, state) => ({
            ...provided,
            borderRadius: 8,
            minHeight: 42,
            borderColor: hasError
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

    if (loading || !formData) {
        return <div className="p-6">Loading...</div>;
    }

    const isFormValid =
        formData.selectedDate &&
        formData.username &&
        formData.callType &&
        cleanText(formData.name) &&
        (formData.callType !== "PO" || formData.poSubtype) &&
        formData.callMode &&
        formData.priority &&
        formData.status &&
        (formData.status !== "Follow_up" || formData.followUpDate);

    return (
        <div className="min-h-screen bg-[#F6F8FB]">
            {toastMessage && (
                <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50">
                    <div className={`${toastMessage.includes('successfully') ? 'bg-green-600' : 'bg-red-600'} text-white px-6 py-3 rounded-xl shadow-lg text-sm font-medium animate-fadeIn`}>
                        {toastMessage}
                    </div>
                </div>
            )}
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">

                {/* Back Button */}
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-3 px-4 py-2
  rounded-2xl
  border border-[#CFE0F6]
  bg-white
  hover:bg-gray-50
  text-base font-semibold text-gray-700
  transition-all duration-200"
                >
                    <ArrowLeft size={22} strokeWidth={2.5} />
                    Back
                </button>

                {/* Title Section */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">
                        Modify Entry
                    </h1>
                    <p className="text-md text-[#7861E6] font-semibold">
                        {caseId}
                    </p>
                </div>
            </div>

            {/* Card */}
            <div className="bg-white rounded-2xl shadow-sm p-6">

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                    {/* CLIENT */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-2">
                            CLIENT <span className="text-red-600">*</span>
                        </label>
                        <Select
                            options={clientOptions}
                            value={clientOptions.find(
                                (c) => c.value === formData.clientId
                            )}
                            isDisabled
                            components={{ IndicatorSeparator: () => null }}
                            styles={customSelectStyles(false)}
                        />
                    </div>
                    {/* REQUEST DATE */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-2">
                            DATE <span className="text-red-600">*</span>
                        </label>

                        <DatePicker
                            value={formData.selectedDate ? dayjs(formData.selectedDate) : null}
                            format="YYYY-MM-DD"
                            onChange={(date) => {
                                setFormData({
                                    ...formData,
                                    selectedDate: date ? date.format("YYYY-MM-DD") : "",
                                });
                                setMainError(false);
                            }}
                            className={`w-full h-11 rounded-lg ${mainError && !formData.selectedDate
                                ? "border-red-500"
                                : ""
                                }`}
                            style={{ width: "100%" }}
                            disabledDate={(current) => {
                                return current && current.isAfter(dayjs().subtract(1, 'day'), 'day');
                            }}
                        />

                        {mainError && !formData.selectedDate && (
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
                            value={userOptions.find(
                                (u) => u.value === formData.username
                            )}
                            onChange={(s) => {
                                setFormData({
                                    ...formData,
                                    username: s?.value,
                                    usernameLabel: s?.label,  // Store the label for display
                                });
                                setMainError(false);
                            }}
                            components={{ IndicatorSeparator: () => null }}
                            styles={customSelectStyles(mainError && !formData.username)}
                            placeholder={formData.usernameLabel || "Select user..."}
                        />
                        {/* Optional: Show the current value text if no selection is made */}
                        {!formData.username && formData.usernameLabel && (
                            <p className="text-xs text-gray-500 mt-1">
                                Current: {formData.usernameLabel}
                            </p>
                        )}
                        {mainError && !formData.username && (
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
                            value={formData.name}
                            onChange={(e) => {
                                let value = e.target.value;

                                if (/^[A-Za-z\s]*$/.test(value)) {
                                    value = value.replace(/\s+/g, " ");
                                    setFormData({ ...formData, name: value });
                                }
                            }}
                            placeholder="Enter contact name"
                            className="
      w-full border rounded-lg px-3 py-2 bg-white
      text-gray-700
      placeholder-gray-400
      border-gray-300
      focus:outline-none focus:border-gray-600
    "
                        />
                    </div>

                    {/* CALL TYPE */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-2">
                            CALL TYPE <span className="text-red-600">*</span>
                        </label>
                        <Select
                            options={callTypeOptions}
                            value={callTypeOptions.find(
                                (c) => c.value === formData.callType
                            )} components={{ IndicatorSeparator: () => null }}
                            onChange={(s) =>
                                setFormData({
                                    ...formData,
                                    callType: s?.value,
                                    poSubtype: "",
                                })
                            } styles={customSelectStyles(false)}
                        />
                    </div>

                    {/* PO SUBTYPE */}
                    {formData.callType === "PO" && (
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-2">
                                SUB TYPE <span className="text-red-600">*</span>
                            </label>
                            <Select
                                options={poSubtypeOptions}
                                value={poSubtypeOptions.find(
                                    (p) => p.value === formData.poSubtype
                                )}
                                onChange={(s) =>
                                    setFormData({
                                        ...formData,
                                        poSubtype: s?.value,
                                    })
                                } components={{ IndicatorSeparator: () => null }}
                                styles={customSelectStyles(false)}
                            />
                        </div>
                    )}

                    {/* CALL MODE */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-2">
                            CALL MODE <span className="text-red-600">*</span>
                        </label>
                        <Select
                            options={callModeOptions}
                            value={callModeOptions.find(
                                (c) => c.value === formData.callMode
                            )}
                            onChange={(s) =>
                                setFormData({
                                    ...formData,
                                    callMode: s?.value,
                                })
                            } components={{ IndicatorSeparator: () => null }}
                            styles={customSelectStyles(false)}
                        />
                    </div>

                    {/* PRIORITY */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-2">
                            PRIORITY <span className="text-red-600">*</span>
                        </label>
                        <Select
                            options={priorityOptions}
                            value={priorityOptions.find(
                                (p) => p.value === formData.priority
                            )}
                            onChange={(s) =>
                                setFormData({
                                    ...formData,
                                    priority: s?.value,
                                })
                            } components={{ IndicatorSeparator: () => null }}
                            styles={customSelectStyles(false)}
                        />
                    </div>

                    {/* STATUS */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-2">
                            STATUS <span className="text-red-600">*</span>
                        </label>
                        <Select
                            options={statusOptions}
                            value={statusOptions.find(
                                (s) => s.value === formData.status
                            )}
                            onChange={(s) =>
                                setFormData({
                                    ...formData,
                                    status: s?.value,
                                    followUpDate:
                                        s?.value === "Follow_up"
                                            ? formData.followUpDate
                                            : "",
                                })
                            }
                            components={{ IndicatorSeparator: () => null }}
                            styles={customSelectStyles(false)}
                        />
                    </div>
                    {/* FOLLOW-UP DATE (Only if Follow_up selected) */}
                    {formData.status === "Follow_up" && (
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-2">
                                FOLLOW-UP DATE <span className="text-red-600">*</span>
                            </label>

                            <DatePicker
                                value={
                                    formData.followUpDate
                                        ? dayjs(formData.followUpDate)
                                        : null
                                }
                                format="YYYY-MM-DD"
                                style={{ width: "100%" }}
                                onChange={(date) =>
                                    setFormData({
                                        ...formData,
                                        followUpDate: date
                                            ? date.format("YYYY-MM-DD")
                                            : "",
                                    })
                                }
                                className="w-full h-11 rounded-lg"
                                disabledDate={(current) => {
                                    return current && current.isAfter(dayjs().subtract(1, 'day'), 'day');
                                }}
                            />
                        </div>
                    )}

                    {/* FORWARD TO */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-2">
                            FORWARD TO
                        </label>
                        <Select
                            options={userOptions}
                            value={userOptions.find(
                                (u) => u.value === formData.forwardedTo
                            )}
                            onChange={(s) =>
                                setFormData({
                                    ...formData,
                                    forwardedTo: s?.value,
                                })
                            } components={{ IndicatorSeparator: () => null }}
                            styles={customSelectStyles(false)}
                        />
                    </div>
                </div>

                {/* Remarks Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">

                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-2">
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
                            className="w-full p-3 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-gray-600"
                        /><p className="text-xs text-gray-400 text-right">
                            {formData.remarksBuyer?.length || 0}/250
                        </p>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-2">
                            REMARKS (INTERNAL/FOLLOW-UP)
                        </label>
                        <textarea
                            rows="3"
                            value={formData.remarksInternal}
                            onChange={(e) => {
                                let value = e.target.value;
                                value = value.replace(/\s+/g, " ");
                                if (value.length <= 250) {
                                    setFormData({
                                        ...formData,
                                        remarksInternal: value,
                                    });
                                }
                            }}
                            className="w-full p-3 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-gray-600"
                        /><p className="text-xs text-gray-400 text-right">
                            {formData.remarksInternal?.length || 0}/250
                        </p>
                    </div>
                </div>

                {/* Submit */}
                <div className="flex justify-end mt-6">
                    <button
                        disabled={!isFormValid}
                        onClick={() => {
                            if (!isFormValid) {
                                setMainError(true);
                                return;
                            }
                            setMainError(false);
                            setModalOpen(true);
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
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">

                    <div className="bg-white w-[520px] rounded-3xl shadow-2xl">

                        {/* Header */}
                        <div className="flex justify-between items-center px-6 py-5 bg-gray-100 border-b border-gray-100 rounded-t-3xl">

                            <div className="flex items-center gap-3">

                                <div className="bg-indigo-100 p-2 rounded-xl">
                                    <SquarePen className="text-[#7861E6]" size={20} />
                                </div>

                                <h2 className="text-xl font-semibold text-gray-800">
                                    Edit Request
                                </h2>

                            </div>

                            <button
                                onClick={() => {
                                    setModalOpen(false);
                                    setModalRemarks("");
                                    setModalError(false);
                                }}
                                className="text-gray-400 hover:text-gray-600 text-xl"
                            >
                                ✕
                            </button>

                        </div>

                        <div className="px-6 py-6 space-y-4 pb-8">

                            {/* Selected Case */}
                            <div className="bg-[#EEF2FF] border border-[#E0E7FF] rounded-3xl px-6 py-6">

                                <p className="text-[#7861E6] text-sm font-semibold tracking-widest mb-4">
                                    SELECTED CASES
                                </p>

                                <span className="inline-block bg-white text-[#7861E6] text-sm font-bold px-5 py-2.5 rounded-xl shadow-md border border-[#C6D2FF]">
                                    {caseId}
                                </span>

                            </div>

                            {/* Mandatory Remarks */}
                            <div>
                                <label className="block text-xs font-semibold text-[#62748E] mb-2 uppercase">
                                    Mandatory Remarks for Request <span className="text-red-600">*</span>
                                </label>

                                <textarea
                                    maxLength={250}
                                    rows="3"
                                    value={modalRemarks}
                                    onChange={(e) => {
                                        setModalRemarks(e.target.value);
                                        setModalError(false);
                                    }}
                                    placeholder="Provide a reason for modifying this request..."
                                    className={`w-full p-3 rounded-xl border ${modalError ? "border-red-500" : "border-gray-200"
                                        } text-md font-normal outline-none focus:ring-2 focus:ring-[#C6D2FF]`}
                                /><p className="text-xs text-gray-400 text-right mt-1">
                                    {modalRemarks?.length || 0}/250
                                </p>

                                {modalError && (
                                    <p className="text-red-500 text-xs mt-1">
                                        {modalError}
                                    </p>
                                )}
                            </div>

                            {/* Warning Box */}
                            <div className="bg-[#FFFBEB] border border-[#FEF3C6] rounded-2xl p-4 flex gap-3 items-start">

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

                                <p className="text-[#973C00] text-base leading-relaxed">
                                    Are you sure you want to request modification for case ID:{" "}
                                    <span className="font-semibold">
                                        {caseId}
                                    </span>
                                    ?
                                </p>

                            </div>

                            {/* Buttons */}
                            <div className="flex gap-5 pt-2">

                                <button
                                    onClick={() => {
                                        setModalOpen(false);
                                        setModalRemarks("");
                                        setModalError(false);
                                    }}
                                    className="flex-1 border border-gray-300 rounded-3xl py-4 font-semibold text-gray-600 hover:bg-gray-100 transition"
                                >
                                    Cancel
                                </button>

                                <button
                                    onClick={handleModify}
                                    disabled={!modalRemarks.trim() || submitting}
                                    className={`flex-1 flex items-center justify-center gap-2 h-15 rounded-2xl 
            bg-[#9c90e3] text-white text-sm font-semibold shadow-lg 
            hover:opacity-90 transition
            ${!modalRemarks.trim() || submitting ? "opacity-50 cursor-not-allowed" : ""}`}
                                >
                                    <HiPaperAirplane className="w-4 h-4 rotate-45" />
                                    {submitting ? "Submitting..." : "Modify Request"}
                                </button>

                            </div>

                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}