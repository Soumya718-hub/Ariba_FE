import { Outlet } from "react-router-dom";
import { useState } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export default function AppLayout() {

  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="h-screen flex flex-col bg-[#f5f7fb]">

      {/* Navbar FULL WIDTH */}
      <Navbar collapsed={collapsed} setCollapsed={setCollapsed} />

      {/* Below Navbar */}
      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar */}
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </div>

      </div>
    </div>
  );
}