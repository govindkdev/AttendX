/*
=========================================================
ATTENDX - FULLSTACK API CLIENT
=========================================================
Handles all HTTP communication with the Express backend:
- Dynamic API Base URL resolution (dev proxy or production origin)
- Automatic JWT Authorization header injection
- Response error handling & JSON formatting
=========================================================
*/

const API_BASE = ""; // Relative path works seamlessly in both Vite dev proxy and Express production SPA

/**
 * Get stored JWT auth token
 */
export function getAuthToken() {
  try {
    return localStorage.getItem("attendx_jwt_token") || "";
  } catch (e) {
    return "";
  }
}

/**
 * Store JWT auth token
 */
export function setAuthToken(token) {
  try {
    if (token) {
      localStorage.setItem("attendx_jwt_token", token);
    } else {
      localStorage.removeItem("attendx_jwt_token");
    }
  } catch (e) {
    console.error("Storage error:", e);
  }
}

/**
 * Core HTTP Request Wrapper
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint.startsWith("/") ? endpoint : "/" + endpoint}`;
  const token = getAuthToken();

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    const isJson = response.headers.get("content-type")?.includes("application/json");
    const data = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      const errorMsg = (typeof data === "object" && data.error) || response.statusText || "Request failed";
      return { success: false, error: errorMsg, status: response.status, data };
    }

    return typeof data === "object" ? { success: true, ...data } : { success: true, data };
  } catch (networkError) {
    console.warn(`[AttendX API] Network request to ${url} encountered an error:`, networkError.message);
    return {
      success: false,
      error: "Backend API is currently unreachable. Operating in offline synchronized mode.",
      isOffline: true
    };
  }
}

export const api = {
  get: (endpoint) => request(endpoint, { method: "GET" }),
  post: (endpoint, body) => request(endpoint, { method: "POST", body: JSON.stringify(body) }),
  put: (endpoint, body) => request(endpoint, { method: "PUT", body: JSON.stringify(body) }),
  patch: (endpoint, body) => request(endpoint, { method: "PATCH", body: JSON.stringify(body) }),
  delete: (endpoint) => request(endpoint, { method: "DELETE" }),
  getAuthToken,
  setAuthToken
};

export default api;
