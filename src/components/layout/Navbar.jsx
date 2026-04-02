import { FiChevronDown, FiLogOut } from "react-icons/fi";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

export default function Navbar({ collapsed, setCollapsed }) {
    const dropdownRef = useRef(null);
    const navigate = useNavigate();
    const role = localStorage.getItem("role")?.toUpperCase() || "USER";

    const [open, setOpen] = useState(false);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    const getInitials = (name) => {
        if (!name) return "";
        const parts = name.trim().split(" ");
        if (parts.length === 1) return parts[0][0].toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    };

    const handleLogout = () => {
        // Clear local storage
        localStorage.clear();
        
        // Get the base URL from env or use default
        const baseUrl = import.meta.env.VITE_MYAHANA_BASE_URL ;
        
        // Notify parent window about logout (if in iframe)
        if (window.parent !== window) {
            window.parent.postMessage(
                { type: "LOGOUT" },
                baseUrl
            );
        }
        
        // Redirect to home page
        window.location.href = `${baseUrl}/home`;
        
        // Close the tab/window after a small delay
        setTimeout(() => {
            window.close();
        }, 500);
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target)
            ) {
                setOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);
    return (
        <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">

            {/* Left Section */}
            <div className="flex items-center gap-4">

                {/* Logo */}
                <img
                    src="/Ahana Logo 2024_Full Size@3x 2.png"
                    alt="Ahana Logo"
                    className="h-10 object-contain"
                />

            </div>

            {/* Right Section */}
            <div className="flex items-center gap-5">

                <div className="relative" ref={dropdownRef}>
                    <div
                        className="flex items-center gap-3 cursor-pointer"
                        onClick={() => setOpen(!open)}
                    >

                        <div className="w-9 h-9 rounded-full bg-gray-800 text-white flex items-center justify-center font-semibold">
                            {getInitials(user?.emp_name)}
                        </div>

                        <div className="leading-tight">
                            <p className="text-sm font-semibold text-gray-800">
                                {user?.emp_name || "User"}
                            </p>
                            <p className="text-xs text-gray-500">
                                {role}
                            </p>
                        </div>

                        <FiChevronDown className="text-gray-400" />
                    </div>

                    {open && (
                        <div className="fixed right-6 top-16 w-40 bg-white border border-gray-200 rounded-lg shadow-md z-50">
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                                <FiLogOut />
                                Logout
                            </button>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}