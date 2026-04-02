import React from "react";
import { AlertTriangle } from "lucide-react";

const SessionTimeoutModal = ({ isOpen }) => {
  if (!isOpen) return null;

  const handleRedirect = () => {
     sessionStorage.removeItem("isIdle"); // or sessionStorage.clear();
    localStorage.clear();
    const baseUrl = import.meta.env.VITE_MYAHANA_BASE_URL;
    window.location.href = `${baseUrl}/home`;
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center backdrop-blur-sm bg-black/40">
      <div className="relative bg-white rounded-2xl shadow-2xl px-10 py-10 flex flex-col items-center gap-4 w-full max-w-sm mx-4">
        {/* Icon */}
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-amber-50 border border-amber-200 mb-1">
          <AlertTriangle className="text-amber-500 h-8 w-8" />
        </div>

        {/* Text */}
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 tracking-tight mb-1">
            Session Expired
          </h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            You've been inactive for a while.<br />Please log in again to continue.
          </p>
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-gray-100" />

        {/* Button */}
        <button
          onClick={handleRedirect}
          className="mt-2 w-full bg-gradient-to-r bg-[#7861E6]
                         text-white py-3 rounded-2xl font-semibold
                         hover:shadow-lg hover:scale-[1.01]
                         active:scale-[0.99] transition cursor-pointer"
        >
          Go to Login
        </button>
      </div>
    </div>
  );
};

export default SessionTimeoutModal;