import customFetch from "./axios";
 
export const getReportsData = async (filters) => {
  try {
    const res = await customFetch.post(
      `/reports/super-admin/reportData`,
      filters   // { caseId, startDate, endDate, username, clientId }
    );
    return res.data;
  } catch (error) {
    return error.response?.data || { success: false };
  }
};
 
//GET History of the case
 
export const getCaseHistoryForReport = async (caseId) => {
  try {
    const res = await customFetch.get(
      `/reports/${caseId}/history`
    );
 
    return res.data;
  } catch (error) {
    return error.response?.data || { success: false };
  }
};

export const exportReportsToCSV = async (filters) => {
  try {
    const res = await customFetch.post(
      `/reports/exportReportsToCSV`,
      filters
    );
    return res.data; // This will be a Blob
  } catch (error) {
    console.error('Export API error:', error);
    throw error;
  }
};
 