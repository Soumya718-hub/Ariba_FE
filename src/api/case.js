import customFetch from "./axios";

// GET ALL CLIENTS
export const getAllClients = async () => {
  try {
    const res = await customFetch.get("/cases/getAllClients");
    return res.data;
  } catch (error) {
    console.log(error.response?.data);
    return null;
  }
};

// CREATE NEW CASE
export const createCase = async (payload) => {
  try {
    const res = await customFetch.post("/cases/create", payload);
    return res.data;
  } catch (error) {
    console.log(error.response?.data);
    return error.response?.data || null;
  }
};

// UPDATE EXISTING CASE
export const updateCase = async (payload) => {
  try {
    const res = await customFetch.put("/cases/update", payload);
    return res.data;
  } catch (error) {
    console.log(error.response?.data);
    return error.response?.data || null;
  }
};

// GET LOGGED CALLS
export const getLoggedCalls = async (params = {}) => {
  try {
    const res = await customFetch.get("/cases/logged-calls", { params });
    return res.data;
  } catch (error) {
    console.log(error.response?.data);
    return error.response?.data || null;
  }
};

// GET EMPLOYEES List in AddEntry for forwarded To Dropdown
export const getAllEmployees = async () => {
  try {
    const res = await customFetch.get("/cases/employees");
    return res.data;
  } catch (error) {
    return null;
  }
};

export const getAllAribaEmp = async () => {
  try {
    const res = await customFetch.get("/cases/ariba-employees");
    return res.data;
  } catch (error) {
    return null;
  }
};


// GET CASE HISTORY
export const getCaseHistory = async (caseId) => {
  try {
    const res = await customFetch.get(`/cases/${caseId}/history`);
    return res.data;
  } catch (error) {
    console.log(error.response?.data);
    return null;
  }
};

// GET ALL CALL TYPES
export const getAllCallTypes = async () => {
  try {
    const res = await customFetch.get("/cases/callTypes");
    return res.data;
  } catch (error) {
    console.log(error.response?.data);
    return null;
  }
};

// GET ALL CALL MODES
export const getAllCallModes = async () => {
  try {
    const res = await customFetch.get("/cases/callModes");
    return res.data;
  } catch (error) {
    console.log(error.response?.data);
    return null;
  }
};
// GET LATEST CASE DETAILS (For Edit Page Reload Support)
export const getLatestCaseDetails = async (caseId) => {
  try {
    const res = await customFetch.get(`/cases/${caseId}/latest`);
    return res.data;
  } catch (error) {
    console.log(error.response?.data);
    return null;
  }
};
// TRANSFER CASE
export const transferCase = async (payload) => {
  try {
    const res = await customFetch.post("/cases/transfer", payload);
    return res.data;
  } catch (error) {
    return error.response?.data || null;
  }
};
// BULK TRANSFER CASES (Super Admin)
export const bulkTransferCases = async (payload) => {
  try {
    const res = await customFetch.post("/cases/Super-admin/Bulktransfer", payload);
    return res.data;
  } catch (error) {
    return error.response?.data || null;
  }
};