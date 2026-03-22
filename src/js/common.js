function logout() {
  // clear session
  localStorage.removeItem("userId");
  localStorage.removeItem("role");

  // optional: clear everything
  // localStorage.clear();

  // redirect to login page
  window.location.href = "/src/pages/login.html";
}

function checkAuth(requiredRole) {
  const userId = localStorage.getItem("userId");
  const role = localStorage.getItem("role");

  // not logged in
  if (!userId || !role) {
    window.location.href = "/src/pages/login.html";
    return;
  }

  // wrong role
  if (requiredRole && role !== requiredRole) {
    window.location.href = "/src/pages/login.html";
  }
}
