const BASE_URL = "http://192.168.29.202:8081";

async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem("token");

  const headers = {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true", // ✅ THIS LINE FIXES IT
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
  // clear session
  localStorage.removeItem("userId");
  localStorage.removeItem("role");

  // optional: clear everything
  // localStorage.clear();

  // redirect to login page
  window.location.href = "../pages/login.html";
}

function checkAuth(requiredRole) {
  const userId = localStorage.getItem("userId");
  const role = localStorage.getItem("role");

  // not logged in
  if (!userId || !role) {
    window.location.href = "../pages/login.html";
    return;
  }

  // wrong role
  if (requiredRole && role !== requiredRole) {
    window.location.href = "../pages/login.html";
  }
}
