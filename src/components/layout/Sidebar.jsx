import { NavLink, useLocation } from "react-router-dom";
import { useState } from "react";
import {
    LayoutPanelLeft,
    PhoneCall,
    CalendarSync,
    CirclePlus,
    ChevronDown,
    ChevronRight,
    FileText,
    ClipboardPen,
    Eye,
    UserRound,
    UserRoundCog,
    BriefcaseBusiness,
    Archive,
    Users
} from "lucide-react";

export default function Sidebar() {
    const role = localStorage.getItem("role")?.toUpperCase();
    const location = useLocation();
    const [openMenus, setOpenMenus] = useState({});
    const [isHovered, setIsHovered] = useState(false);

    const collapsed = !isHovered;

    // Toggle submenu
    const toggleSubmenu = (label) => {
        setOpenMenus(prev => ({
            ...prev,
            [label]: !prev[label]
        }));
    };

    // Role based menus
    const menus = {
        USER: [
            { label: "Dashboard", path: "dashboard", icon: <LayoutPanelLeft size={18} /> },
            { label: "Add Entry", path: "add-entry", icon: <CirclePlus size={18} /> },
            { label: "Logged Calls", path: "logged-calls", icon: <PhoneCall size={18} /> },
        ],
        ADMIN: [
            { label: "Dashboard", path: "dashboard", icon: <LayoutPanelLeft size={18} /> },
            { label: "Add Entry", path: "add-entry", icon: <CirclePlus size={18} /> },
            { label: "Logged Calls", path: "logged-calls", icon: <PhoneCall size={18} /> },
            {
                label: "Backdated Entry",
                icon: <CalendarSync size={18} />,
                submenu: [
                    {
                        label: "New Request",
                        path: "backdated/new",
                        icon: <CirclePlus size={18} />
                    },
                    {
                        label: "Total Calls Data",
                        path: "backdated/calls",
                        icon: <PhoneCall size={18} />
                    },
                    {
                        label: "View Requests",
                        path: "backdated/view-request",
                        icon: <FileText size={18} />
                    }
                ]
            },
            {
                label: "Reports", path: "reports", icon: <FileText size={18} />
            },
        ],
        SUPERADMIN: [
            { label: "Dashboard", path: "dashboard", icon: <LayoutPanelLeft size={18} /> },
            {
                label: "Backdated Entry",
                icon: <CalendarSync size={18} />,
                submenu: [
                    { label: "Add Backdated", path: "backdated-request/add", icon: <CirclePlus size={18} /> },
                    { label: "Modify Entries", path: "backdated-request/modify", icon: <ClipboardPen size={18} /> },
                    { label: "View Request", path: "backdated-request/view", icon: <Eye size={18} /> }
                ]
            },
            { label: "Archive", path: "archive", icon: <Archive size={18} /> },
            { label: "Reports", path: "reports", icon: <FileText size={18} /> },
            { label: "Transfer", path: "transfer", icon: <PhoneCall size={18} /> },
             { label: "Client Management", path: "client-management", icon: <BriefcaseBusiness size={18} /> },
            // {
            //     label: "Management",
            //     icon: <UserRoundCog size={18} />,
            //     submenu: [
            //         { label: "User Management", path: "user-management", icon: <UserRound size={18} /> },
            //         { label: "Client Management", path: "client-management", icon: <BriefcaseBusiness size={18} /> }
            //     ]
            // }
        ],
    };

    const roleMenus = menus[role] || [];

    // Tooltip shown only when collapsed
    const Tooltip = ({ label }) => (
        <div
            className="absolute left-full ml-2 z-50 whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs font-medium shadow-lg pointer-events-none bg-white border border-gray-200"
            style={{ top: "50%", transform: "translateY(-50%)" }}
        >
            {label}
        </div>
    );

    // Render menu item with possible submenu
    const renderMenuItem = (item) => {
        const isParentActive =
            item.submenu?.some(sub =>
                role === "ADMIN"
                    ? location.pathname.includes(`/admin/${sub.path}`)
                    : role === "SUPERADMIN"
                        ? location.pathname.includes(`/superadmin/${sub.path}`)
                        : location.pathname.includes(sub.path)
            ) ||
            location.pathname.includes("/admin/edit-backdated/") ||
            location.pathname.includes("/edit-request/");

        if (item.submenu) {
            const isOpen = openMenus[item.label] || isParentActive;
            return (
                <div key={item.label} className="relative group">
                    <button
                        onClick={() => !collapsed && toggleSubmenu(item.label)}
                        className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl text-base font-normal leading-6 transition
                            ${isParentActive
                                ? "bg-[#EEF2FF] text-[#7861E6] font-semibold"
                                : "text-[#45556C] hover:bg-gray-100"
                            }`}
                    >
                        <div className={`flex items-center ${collapsed ? "justify-center w-full" : "gap-3"}`}>
                            <span className="text-inherit flex-shrink-0">
                                {item.icon}
                            </span>
                            {!collapsed && (
                                <span className="overflow-hidden whitespace-nowrap transition-all duration-300">
                                    {item.label}
                                </span>
                            )}
                        </div>
                        {!collapsed && (
                            isOpen
                                ? <ChevronDown size={18} className="flex-shrink-0" />
                                : <ChevronRight size={18} className="flex-shrink-0" />
                        )}
                    </button>

                    {/* Tooltip when collapsed */}
                    {collapsed && (
                        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 z-50 hidden group-hover:block">
                            <div className="whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs font-medium shadow-lg pointer-events-none bg-white border border-gray-200 text-[#45556C]">
                                {item.label}
                            </div>
                        </div>
                    )}

                    {/* Submenu */}
                    {!collapsed && isOpen && (
                        <div className="ml-9 mt-1 space-y-1">
                            {item.submenu.map((subItem) => {
                                const fullPath =
                                    role === "ADMIN"
                                        ? `/admin/${subItem.path}`
                                        : role === "SUPERADMIN"
                                            ? `/superadmin/${subItem.path}`
                                            : subItem.path;

                                const isSubActive =
                                    location.pathname.startsWith(fullPath) ||
                                    (role === "ADMIN" &&
                                        subItem.path === "backdated/calls" &&
                                        location.pathname.includes("/edit-backdated/")) ||
                                    (role === "SUPERADMIN" &&
                                        subItem.path === "backdated-request/modify" &&
                                        location.pathname.includes("/edit-request/"));

                                return (
                                    <NavLink
                                        key={subItem.path}
                                        to={
                                            role === "ADMIN"
                                                ? `/admin/${subItem.path}`
                                                : role === "SUPERADMIN"
                                                    ? `/superadmin/${subItem.path}`
                                                    : subItem.path
                                        }
                                        className={`flex items-center gap-3 px-4 py-2 rounded-lg text-base font-normal leading-6 transition ${isSubActive
                                            ? "text-[#7861E6] font-semibold"
                                            : "text-[#45556C] hover:bg-gray-100"
                                            }`}
                                    >
                                        <span className="text-inherit flex-shrink-0">
                                            {subItem.icon}
                                        </span>
                                        {!collapsed && subItem.label}
                                    </NavLink>
                                );
                            })}
                        </div>
                    )}
                </div>
            );
        }

        // Regular menu item (no submenu)
        return (
            <div key={item.path} className="relative group">
                <NavLink
                    to={
                        role === "ADMIN"
                            ? `/admin/${item.path}`
                            : role === "SUPERADMIN"
                                ? `/superadmin/${item.path}`
                                : item.path
                    }
                    className={() => {
                        const isActive =
                            location.pathname.includes(
                                role === "ADMIN"
                                    ? `/admin/${item.path}`
                                    : item.path
                            ) ||
                            (item.path === "logged-calls" &&
                                location.pathname.includes("/case/")) ||
                            (item.path === "reports" &&
                                location.pathname.includes("/reports/history/"));

                        return `flex items-center gap-3 px-4 py-2.5 rounded-xl text-base font-normal leading-6 transition ${isActive
                            ? "bg-[#EEF2FF] text-[#7861E6] font-semibold"
                            : "text-[#45556C] hover:bg-gray-100"
                            }`;
                    }}
                >
                    <span className="text-inherit flex-shrink-0">
                        {item.icon}
                    </span>
                    {!collapsed && (
                        <span className="overflow-hidden whitespace-nowrap transition-all duration-300">
                            {item.label}
                        </span>
                    )}
                </NavLink>

                {/* Tooltip when collapsed */}
                {collapsed && (
                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 z-50 hidden group-hover:block">
                        <div className="whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs font-medium shadow-lg pointer-events-none bg-white border border-gray-200 text-[#45556C]">
                            {item.label}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={`${collapsed ? "w-[70px]" : "w-[220px]"} 
            transition-all duration-300 bg-white border-r border-gray-200 min-h-screen flex flex-col overflow-hidden`}
        >
            {/* Menu */}
            <div className={`space-y-2 flex-1 overflow-y-auto pt-3 ${collapsed ? "px-2" : "px-3"}`}>
                {roleMenus.map((item) => renderMenuItem(item))}
            </div>
        </div>
    );
}