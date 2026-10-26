// Backend address: same host as the page, port 8081.
// Override when the backend is elsewhere (ngrok, deployment) by opening any page once with
//   ?api=https://your-backend-url      (remove the override with  ?api= )
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
