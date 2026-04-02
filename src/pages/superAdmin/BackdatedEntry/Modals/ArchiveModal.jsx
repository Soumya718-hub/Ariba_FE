import { useState } from "react";
import { FiX } from "react-icons/fi";
import { FiSave } from "react-icons/fi";
import { Archive} from "lucide-react";
 
export default function ArchiveModal({ case: caseData, onClose, onConfirm }) {
  const [remarks, setRemarks] = useState("");
  const [error, setError] = useState("");
 
  const handleSubmit = () => {
    if (!remarks.trim()) {
      setError("Remarks are required");
      return;
    }
    onConfirm(remarks);
  };
 
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
  {/* Header - matching Code A exactly */}
  <div className="flex justify-between items-center px-6 py-5 bg-gray-100 border-b border-gray-100 rounded-t-3xl">
    <div className="flex items-center gap-3">
      <div className="bg-[#FFA8A7] p-2 rounded-xl">
        <Archive className="text-[#FF2056]" size={20} />
      </div>
      <h2 className="text-xl font-semibold text-gray-800">
        Archive Request
      </h2>
    </div>
    
    <button
      onClick={onClose}
      className="text-gray-400 hover:text-gray-600 text-xl"
    >
      ✕
    </button>
  </div>

  {/* Body - maintaining original layout but with matching styles */}
  <div className="px-6 py-5  space-y-5">
    {/* Selected Cases */}
    <div className="bg-indigo-50 rounded-xl p-4">
      <p className="text-xs font-semibold text-[#7861E6] tracking-wider mb-2">
        SELECTED CASES
      </p>
      <div className="">
        <span className="inline-block bg-white text-[#432DD7] text-xs font-semibold px-3 py-1 rounded-lg shadow-sm">
          {caseData.CaseID}
        </span>
      </div>
    </div>

    {/* Remarks */}
          <div>
            <p className="text-xs font-semibold text-gray-500 tracking-wider mb-2">
              MANDATORY REMARKS FOR REQUEST
              <span className="text-red-500">*</span>
            </p>

            <textarea
              value={remarks}
              maxLength={250}
              onChange={(e) => {
                setRemarks(e.target.value);
                setError("");
              }}
              placeholder="Provide a reason for archiving this backdated request..."
              rows={4}
              className={`w-full rounded-xl border px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 ${error
                  ? "border-red-500 focus:ring-red-200"
                  : "border-gray-300 focus:ring-indigo-200"
                }`}
            />

            {/* Character Counter */}
            <div className="text-right text-xs text-gray-400 mt-1">
              {remarks.length}/250
            </div>

            {/* Error Message */}
            {error && (
              <p className="text-red-500 text-xs mt-1">{error}</p>
            )}
          </div>

    {/* Warning Box - matching Code A's warning style */}
    <div className="bg-yellow-50 border border-[#fdefb4] rounded-xl p-4 text-sm text-[#973C00]">
      <span className="font-medium">
        Are you sure you want to request archiving for case id:
      </span>{" "}
      <span className="font-semibold text-[#973C00]">
        {caseData.CaseID}
      </span>
      ?
    </div>
  </div>

  {/* Footer - matching Code A's button styles */}
  <div className="flex justify-end gap-4 px-6 py-4 border-t border-gray-100">
    <button
      onClick={onClose}
      className="px-5 py-2 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
    >
      Cancel
    </button>

    <button
      onClick={handleSubmit}
      className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#7861E6] hover:bg-[#6C56E0] text-white text-sm font-medium shadow-md transition"
    >
      <FiSave className="w-4 h-4" />
      Save Changes
    </button>
  </div>
</div>
    </div>
  );
}
 