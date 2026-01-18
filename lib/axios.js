import axios from "axios";

const rawBaseURL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api";
const normalizedBaseURL = rawBaseURL.replace(/\/$/, "");

const api = axios.create({
  baseURL: `${normalizedBaseURL}/`,
  withCredentials: true,
});

export default api;
