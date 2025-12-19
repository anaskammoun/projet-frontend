import axios from "axios";

// Use same-origin so nginx can inject X-Employee-Cin from auth_basic
const api = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json"
  }
});

// Authentication removed: no Authorization header attached

export default api;
