import axios from "axios";
const apiUrl = import.meta.env.VITE_API_URL;

const api = axios.create({
  // baseURL: `/api`, // This is for testing pwa application
  baseURL: `${apiUrl}/api`,
  withCredentials: true,
});

export default api;
