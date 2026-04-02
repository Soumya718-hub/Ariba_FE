import { useState } from "react";
import { FiX } from "react-icons/fi";
 
export default function RejectModal({ onClose, onConfirm, processing }) {
  const [remarks, setRemarks] = useState("");
  const [error, setError] = useState("");
 
  const handleSubmit = () => {
    if (!remarks.trim()) {
      setError("Rejection remarks are required");
      return;
    }
    onConfirm(remarks);
  };
 
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-6">
      <div className="w-full max-w-2xl ">
 
        {/* Inner Light Container */}
        <div className="bg-gray-100 m-6 rounded-lg p-8">

          {/* Label */}
          <p className="text-xs font-semibold tracking-wider text-gray-600 mb-4">
            REJECTION REMARKS<span className="text-red-500">*</span>
          </p>

          {/* Textarea */}
          <textarea
            value={remarks}
            maxLength={250}
            onChange={(e) => {
              setRemarks(e.target.value);
              setError("");
            }}
            placeholder="Please provide a reason for rejection..."
            rows={4}
            className={`w-full rounded-xl border px-4 py-3 text-sm resize-none
      focus:outline-none focus:ring-2
      ${error
                ? "border-red-400 focus:ring-red-200"
                : "border-gray-300 focus:ring-gray-200"
              }`}
          />

          {/* Character Counter */}
          <div className="text-right text-xs text-gray-400 mt-1">
            {remarks.length}/250
          </div>

          {/* Error */}
          {error && (
            <p className="text-red-500 text-xs mt-2">{error}</p>
          )}

          {/* Buttons */}
          <div className="flex justify-end gap-4 mt-6">

            {/* Cancel */}
            <button
              onClick={onClose}
              disabled={processing}
              className="px-6 py-2 rounded-lg bg-gray-200 hover:bg-gray-300
                 text-gray-700 text-sm font-medium
                 transition disabled:opacity-50"
            >
              Cancel
            </button>

            {/* Reject Request */}
            <button
              onClick={handleSubmit}
              disabled={processing}
              className="flex items-center gap-2 px-6 py-2 rounded-lg
                 border border-red-300 text-red-600
                 hover:bg-red-50 text-sm font-medium
                 transition disabled:opacity-50"
            >
              {processing ? "Rejecting..." : "Reject Request"}
            </button>

          </div>
        </div>
      </div>
    </div>
  );
}
 