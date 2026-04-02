import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "../pages/Login";

// USER
import UserDashboard from "../pages/user/Dashboard";

// SHARED
import AddEntry from "../pages/shared/AddEntry";
import LoggedCalls from "../pages/shared/LoggedCalls";
import CaseHistory from "../pages/shared/CaseHistory";

// ADMIN
import AdminDashboard from "../pages/admin/Dashboard";
import Reports from "../pages/admin/Reports";
import EditBackdated from "../pages/admin/EditBackdated";
import ReportHistory from '../pages/admin/ReportHistory';
import NewRequest from "../pages/admin/Backdated/NewRequest";
import CallsData from "../pages/admin/Backdated/CallsData";
import ViewRequests from "../pages/admin/Backdated/ViewRequests";

//SUPER ADMIN
import SuperAdminDashboard from "../pages/superAdmin/Dashboard";
import AddBackdated from "../pages/superAdmin/BackdatedEntry/AddBackdated";
import ModifyEntries from "../pages/superAdmin/BackdatedEntry/ModifyEntries";
import EditRequest from "../pages/superAdmin/BackdatedEntry/Modals/EditDetails";
import ViewRequest from "../pages/superAdmin/BackdatedEntry/ViewRequest";
import Archive from "../pages/superAdmin/Archive";
import ProtectedRoute from "./ProtectedRoute";
import AppLayout from "../components/layout/AppLayout";
import Transfer from "../pages/superAdmin/Transfer";
import UserManagement from "../pages/superAdmin/UserManagement";
import ClientManagemnet from "../pages/superAdmin/ClientManagemnet"
import AutoLogin from "../Autologin";
import useIdleTimer from "../components/sessionTimeOut/useIdleTimer"
import SessionTimeoutModal from "../components/sessionTimeOut/SessionTimeoutModal"

export default function AppRoutes() {
   const [isIdle, setIsIdle] = useState(() => {
    // Load from sessionStorage on first render
    return sessionStorage.getItem("isIdle") === "true";
  });

  // 1 hour timeout
  useIdleTimer(() => {
    setIsIdle(true);
    sessionStorage.setItem("isIdle", "true"); // store in session
  }, 3600000);
  return (
    <>
    <SessionTimeoutModal isOpen={isIdle} />
    <Routes>
      {/* LOGIN */}
      
      
      <Route path="/AribaAssistLogbook" element={<AutoLogin/>} />

      {/* USER APPLICATION */}
      <Route
        path="/user"
        element={
          <ProtectedRoute allowedRoles={["USER"]}>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<UserDashboard />} />
        <Route path="add-entry" element={<AddEntry role="USER" />} />
        <Route path="add-entry/:caseId" element={<AddEntry role="USER" />} />
        <Route path="logged-calls" element={<LoggedCalls />} />
        <Route path="case/:caseId" element={<CaseHistory />} />

        {/* DEFAULT PAGE */}
        <Route index element={<Navigate to="dashboard" />} />
      </Route>

      {/* ADMIN APPLICATION */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="add-entry" element={<AddEntry role="ADMIN" />} />
        <Route path="add-entry/:caseId" element={<AddEntry role="ADMIN" />} />
        <Route path="logged-calls" element={<LoggedCalls />} />
        <Route path="case/:caseId" element={<CaseHistory />} />
        <Route path="backdated">
          <Route path="new" element={<NewRequest />} />
          <Route path="calls" element={<CallsData />} />
          <Route path="view-request" element={<ViewRequests />} />

          {/* DEFAULT → open NEW REQUEST */}
          <Route index element={<Navigate to="new" />} />
        </Route>
        <Route path="edit-backdated/:caseId" element={<EditBackdated />} />

        {/* ✅ FIXED EDIT ROUTE */}
        <Route path="backdated/edit/:caseId" element={<EditBackdated />} />

        <Route path="reports" element={<Reports />} />
        <Route path="reports/history/:caseId" element={<ReportHistory />} />

        <Route index element={<Navigate to="dashboard" />} />
      </Route>

      {/* SUPER ADMIN APPLICATION */}
      <Route
        path="/superadmin"
        element={
          <ProtectedRoute allowedRoles={["SUPERADMIN"]}>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<SuperAdminDashboard />} />
        <Route path="backdated-request/add" element={<AddBackdated />} />
        <Route path="backdated-request/modify" element={<ModifyEntries />} />
        <Route path="edit-request/:caseId" element={<EditRequest />} />
        <Route path="backdated-request/view" element={<ViewRequest />} />
        <Route path="archive" element={<Archive />} />
        <Route path="reports" element={<Reports />} />
        <Route path="reports/history/:caseId" element={<ReportHistory />} />
        <Route path="logged-calls" element={<LoggedCalls />} />
        <Route path="case/:caseId" element={<CaseHistory />} />
        <Route path="transfer" element={<Transfer />} />
        <Route path="user-management" element={<UserManagement />} />
        <Route path="client-management" element={<ClientManagemnet />} />

        <Route index element={<Navigate to="dashboard" />} />
      </Route>
      {/* ANY UNKNOWN URL */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
    </>
  );
}
