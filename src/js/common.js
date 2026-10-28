// Backend address: your laptop uses port 8081 locally; any other host uses the live server.
const LIVE_API = "https://ams-project-96ec.onrender.com";
const BASE_URL = (function () {
  try {
    const q = new URLSearchParams(window.location.search).get("api");
    if (q !== null) {
      if (q) localStorage.setItem("apiBase", q);
      else localStorage.removeItem("apiBase");
    }
    const saved = localStorage.getItem("apiBase");
    if (saved) return saved.replace(/\/+$/, "");
  } catch (e) {}
  const host = window.location.hostname || "localhost";
  const isLocal =
    host === "localhost" ||
    host === "127.0.0.1" ||
    /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host);
  if (!isLocal) return LIVE_API;
  const protocol = window.location.protocol === "https:" ? "https:" : "http:";
  return `${protocol}//${host}:8081`;
})();

async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem("token");

  const headers = {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
    ...(options.headers || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  return res;
}

function logout() {
  // clear the whole session (token, role, ids), but keep the backend override
  let apiBase = null;
  try {
    apiBase = localStorage.getItem("apiBase");
  } catch (e) {}
  localStorage.clear();
  if (apiBase) localStorage.setItem("apiBase", apiBase);

  window.location.href = "login.html";
}

function checkAuth(requiredRole) {
  const userId = localStorage.getItem("userId");
  const role = (localStorage.getItem("role") || "").toUpperCase();

  // not logged in
  if (!userId || !role) {
    window.location.href = "login.html";
    return;
  }

  // wrong role
  if (requiredRole && role !== requiredRole.toUpperCase()) {
    window.location.href = "login.html";
  }
}
