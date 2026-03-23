function loadSidebar() {
  console.log("Sidebar function running...");

  const role = localStorage.getItem("role");
  console.log("Role:", role);

  const sidebar = document.getElementById("sidebar");

  if (!sidebar) {
    console.error("Sidebar element not found ❌");
    return;
  }

  if (role === "Admin") {
    sidebar.innerHTML = `
      <ul>
        <li><a href="today_admin.html">Dashboard</a></li>
        <li><a href="manage_student_admin.html">Manage Students</a></li>
        <li><a href="#">Manage Faculty</a></li>
        <li><a href="#">Timetable</a></li>
      </ul>
    `;
  } else if (role === "Student") {
    sidebar.innerHTML = `
      <ul>
        <li><a href="#">Dashboard</a></li>
        <li><a href="#">My Attendance</a></li>
      </ul>
    `;
  } else if (role === "Faculty") {
    sidebar.innerHTML = `
      <ul>
        <li><a href="#">Dashboard</a></li>
        <li><a href="#">Take Attendance</a></li>
      </ul>
    `;
  } else {
    console.warn("No role found ⚠️");
  }
}

// ✅ CRITICAL FIX
document.addEventListener("DOMContentLoaded", loadSidebar);
