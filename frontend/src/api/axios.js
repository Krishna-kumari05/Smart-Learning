import axios from "axios";

// Set VITE_API_URL in a .env file at your project root, e.g.:
// VITE_API_URL=http://localhost:5000/api
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Attach the JWT token (if present) to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("sla_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
