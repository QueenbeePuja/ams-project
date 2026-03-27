async function loadComponent(elementId, filePath) {
  const res = await fetch(filePath);
  const html = await res.text();
  document.getElementById(elementId).innerHTML = html;

  if (window.feather) {
    feather.replace();
  }
}

async function initLayout() {
  await loadComponent("sidebar", "../component/sidebar.html");
  await loadComponent("navbar", "../component/navbar.html");
  loadSidebarMenu();
}

function loadSidebarMenu() {
  const role = localStorage.getItem("role");
  const menu = document.getElementById("menuContent");

  console.log("Sidebar role:", role);

  if (!menu) {
    console.error("menuContent not found ❌");
    return;
  }

  if (role === "Admin") {
    menu.innerHTML = `
      <div class="p-2 hover:bg-[#606c38] rounded cursor-pointer border-2 border-[#606c38] text-center transition">
        <a href="../pages/dashboard_admin.html">Dashboard</a>
      </div>

      <div class="p-2 hover:bg-[#606c38] rounded cursor-pointer border-2 border-[#606c38] text-center transition">
        <a href="../pages/manage_student_admin.html">Manage Students</a>
      </div>

      <div class="p-2 hover:bg-[#606c38] rounded cursor-pointer border-2 border-[#606c38] text-center transition">
      <a href="../pages/manage_faculty_admin.html">Manage Faculty</a>
      </div>

      <div class="p-2 hover:bg-[#606c38] rounded cursor-pointer border-2 border-[#606c38] text-center transition">
      <a href="../pages/manage_timetable_admin.html">Upload Timetable</a>
      </div>
    `;
  } else if (role === "Student") {
    menu.innerHTML = `
      <div class="p-2 text-center">Dashboard</div>
      <div class="p-2 text-center">Attendance</div>
    `;
  } else if (role === "Faculty") {
    menu.innerHTML = `
      <div class="p-2 hover:bg-[#606c38] rounded cursor-pointer border-2 border-[#606c38] text-center transition">
        <a href="../pages/dashboard_faculty.html">Dashboard</a>
      </div>
      <div class="p-2 hover:bg-[#606c38] rounded cursor-pointer border-2 border-[#606c38] text-center transition">
        <a href="../pages/attendance_faculty.html">Take Attendence</a>
      </div>
    `;
  }
}

initLayout();
