import customFetch from "./axios";

// ================= USER DASHBOARD =================

// Get User Card Counts
export const getUserDashboardCounts = async (params = {}) => {
  try {
    const { startDate, endDate } = params;
    
    // Build query string if dates are provided
    let queryString = '';
    if (startDate && endDate) {
      queryString = `?startDate=${startDate}&endDate=${endDate}`;
    }
    
    const res = await customFetch.get(
      `/dashboard/user/dashboard/counts${queryString}`
    );
    return res.data;
  } catch (error) {
    console.log(error.response?.data);
    return null;
  }
};
// Get User Filtered Cases
export const getUserFilteredCases = async (payload) => {
  try {
    const res = await customFetch.post(
      "/dashboard/user/dashboard/filtered-cases",
      payload
    );
    return res.data;
  } catch (error) {
    console.log(error.response?.data);
    return null;
  }
};

// ================= ADMIN DASHBOARD =================

// Get Admin Card Counts
export const getAdminDashboardCounts = async (params = {}) => {
  try {
    const { startDate, endDate } = params;
    
    // Build query parameters
    const queryParams = new URLSearchParams();
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);
    
    const queryString = queryParams.toString();
    const url = `/dashboard/admin/dashboard/counts${queryString ? `?${queryString}` : ''}`;
    
    const res = await customFetch.get(url);
    return res.data;
  } catch (error) {
    console.log(error.response?.data);
    return null;
  }
};
// Get Weekly Summary (Graph)
export const getWeeklySummary = async () => {
  try {
    const res = await customFetch.get(
      "/dashboard/admin/dashboard/weekly-summary"
    );
    return res.data;
  } catch (error) {
    console.log(error.response?.data);
    return null;
  }
};

// Get Admin Filtered Cases
export const getAdminFilteredCases = async (payload) => {
  try {
    const res = await customFetch.post(
      "/dashboard/admin/dashboard/filtered-cases",
      payload
    );
    return res.data;
  } catch (error) {
    console.log(error.response?.data);
    return null;
  }
};
//mark seen for the forwarded cases
export const markForwardedAsSeen = async (payload) => {
  try {
    const res = await customFetch.post(
      "/dashboard/user/forwarded/seen",
      payload
    );
    return res.data;
  } catch (error) {
    console.log(error.response?.data);
    return null;
  }
};
