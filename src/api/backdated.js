import customFetch from "./axios";

/* ================= SUPER ADMIN ================= */

// Create
export const createBackdatedDirect = async (payload) => {
  try {
    const res = await customFetch.post(
      "/backdate/super-admin/backdated/create",
      payload
    );
    return res.data;
  } catch (error) {
    return error.response?.data || { success: false };
  }
};

// Modify
export const modifyBackdatedDirect = async (caseId, payload) => {
  try {
    const res = await customFetch.put(
      `/backdate/super-admin/backdated/modify/${caseId}`,
      payload
    );
    return res.data;
  } catch (error) {
    return error.response?.data || { success: false };
  }
};

// Archive
export const archiveBackdatedDirect = async (caseId, payload) => {
  try {
    const res = await customFetch.put(
      `/backdate/super-admin/backdated/archive/${caseId}`,
      payload
    );
    return res.data;
  } catch (error) {
    return error.response?.data || { success: false };
  }
};

/* ================= ADMIN (Request Based) ================= */

export const raiseBackdatedRequest = async (payload) => {
  try {
    const res = await customFetch.post(
      "/backdate/admin/requests/backdated",
      payload
    );
    return res.data;
  } catch (error) {
    return error.response?.data || { success: false };
  }
};

export const raiseModifyRequest = async (caseId, payload) => {
  try {
    const res = await customFetch.post(
      `/backdate/admin/requests/modify/${caseId}`,
      payload
    );
    return res.data;
  } catch (error) {
    return error.response?.data || { success: false };
  }
};

export const raiseArchiveRequest = async (caseId, payload) => {
  try {
    const res = await customFetch.post(
      `/backdate/admin/requests/archive/${caseId}`,
      payload
    );
    return res.data;
  } catch (error) {
    return error.response?.data || { success: false };
  }
};

/* ================= COMMON ================= */

export const getAllLatestBackdatedCases = async () => {
  try {
    const res = await customFetch.get("/backdate/all-latest-cases");
    return res.data;
  } catch (error) {
    return error.response?.data || { success: false };
  }
};

/* ================= BACKDATED REQUESTS ================= */

// Get all backdated requests 
export const getAllBackdatedRequests = async () => {
  try {
    const role = localStorage.getItem("role");

    const url =
      role === "SUPERADMIN"
        ? "/backdate/super-admin/getAllRequests"
        : "/backdate/backdated-requests";

    const res = await customFetch.get(url);
    return res.data;
  } catch (error) {
    return error.response?.data || { success: false };
  }
};

// Get specific request details by ID
export const getBackdatedRequestDetails = async (requestId) => {
  try {
    const res = await customFetch.get(`/backdate/backdated-requests/${requestId}`);
    return res.data;
  } catch (error) {
    return error.response?.data || { success: false };
  }
};

// Process request (APPROVE/REJECT) - Super Admin only
export const processBackdatedRequest = async (requestId, action, remarks = null) => {
  try {
    const payload = { action };
    if (remarks) {
      payload.remarks = remarks;
    }
    const res = await customFetch.put(
      `/backdate/super-admin/requests/${requestId}/process`,
      payload
    );
    return res.data;
  } catch (error) {
    return error.response?.data || { success: false };
  }
};
//super admin to get all the archive cases

export const getArchivedCases = async (filters) => {
  try {
    const res = await customFetch.post(
      `/backdate/archived-cases`,
      filters   // { startDate, endDate }
    );
    return res.data;
  } catch (error) {
    return error.response?.data || { success: false };
  }
};