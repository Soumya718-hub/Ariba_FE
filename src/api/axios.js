import axios from "axios";

const customFetch = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL,
});

// 🔐 Automatically attach JWT token
customFetch.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default customFetch;