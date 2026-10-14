import axios from "axios";

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    "https://student-life-planner-backend-iixm.onrender.com",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("studentlife_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("studentlife_token");
      localStorage.removeItem("studentlife_user");
      window.dispatchEvent(new Event("studentlife:unauthorized"));
    }

    return Promise.reject(error);
  }
);

export default api;
