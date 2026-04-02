import axios from 'axios';

// Create axios instance if you need custom config
const customFetch = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
customFetch.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || localStorage.getItem('sso_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling - MODIFIED to not redirect on RBAC errors
customFetch.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only redirect on 401 if it's NOT an RBAC/no roles error
    if (error.response?.status === 401) {
      const errorMessage = error.response?.data?.message || '';
      
      // Don't redirect if it's a role/permission error - let AutoLogin handle it
      if (!errorMessage.includes("roles assigned") && 
          !errorMessage.includes("RBAC") && 
          !errorMessage.includes("permission")) {
        localStorage.removeItem('token');
        localStorage.removeItem('sso_token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const login = async (payload = {}, ssoToken = null) => {
  try {
    const config = {};
    
    if (ssoToken) {
      config.headers = {
        'Authorization': `Bearer ${ssoToken}`
      };
    }
    
    // If payload is null or undefined, send empty object
    const requestPayload = payload || {};
    
    const res = await customFetch.post("/api/auth/login", requestPayload, config);
    return res.data;
  } catch (error) {
    console.error("Login API error:", error.response?.data || error.message);
    // Return the error response data if available
    if (error.response?.data) {
      return error.response.data;
    }
    throw error;
  }
};

export const validateSSOToken = async (token) => {
  try {
    const res = await customFetch.get("/api/auth/validate-sso", {
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });
    return res.data;
  } catch (error) {
    console.error("SSO token validation failed:", error);
    return null;
  }
};

export default customFetch;
