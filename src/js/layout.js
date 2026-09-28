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

  const role = localStorage.getItem("role")?.toUpperCase();

  if (role === "STUDENT") {
    await fetchStudentDetails();
  } else if (role === "FACULTY") {
    await fetchFacultyDetails();
  } else {
    loadUserInfo();
  }
  const sidebar = document.getElementById("sidebarMenu");
  const overlay = document.getElementById("overlay");

  // ✅ ALWAYS RESET FIRST
  sidebar.style.transition = "left 0.3s ease";

  if (window.innerWidth < 768) {
    // 🔥 MOBILE DEFAULT
    sidebar.style.position = "fixed";
    sidebar.style.left = "-250px"; // hidden
    overlay.style.display = "none"; // no dim
  } else {
    // 🔥 DESKTOP DEFAULT
    sidebar.style.position = "static";
    sidebar.style.left = "0px"; // visible
    overlay.style.display = "none"; // no dim ever
  }

  // ✅ OVERLAY CLICK (ONLY CLOSES)
  overlay.addEventListener("click", () => {
    sidebar.style.left = "-250px";
    overlay.style.display = "none";
  });
}

function loadSidebarMenu() {
  const role = localStorage.getItem("role")?.toUpperCase();
  const menu = document.getElementById("menuContent");

  console.log("Sidebar role:", role);
  if (!role) {
    window.location.href = "../pages/login.html";
    return;
  }

  if (!menu) {
    console.error("menuContent not found ❌");
    return;
  }

  if (role === "ADMIN") {
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
  } else if (role === "STUDENT") {
    menu.innerHTML = `
      <div class="p-2 hover:bg-[#606c38] rounded cursor-pointer border-2 border-[#606c38] text-center transition">
        <a href="../pages/dashboard_student.html">Dashboard</a>
      </div>
      <div class="p-2 hover:bg-[#606c38] rounded cursor-pointer border-2 border-[#606c38] text-center transition">
      Attendance</div>
    `;
  } else if (role === "FACULTY") {
    menu.innerHTML = `
      <div class="p-2 hover:bg-[#606c38] rounded cursor-pointer border-2 border-[#606c38] text-center transition">
        <a href="../pages/dashboard_faculty.html">Dashboard</a>
      </div>
      <div class="p-2 hover:bg-[#606c38] rounded cursor-pointer border-2 border-[#606c38] text-center transition">
        <a href="../pages/attendance_faculty.html">Take Attendance</a>
      </div>
    `;
  }
}

initLayout();
function goToToday() {
  const role = localStorage.getItem("role")?.toUpperCase();
  if (!role) {
    window.location.href = "../pages/login.html";
    return;
  }

  if (role === "ADMIN") {
    window.location.href = "../pages/today_admin.html";
  } else if (role === "FACULTY") {
    window.location.href = "../pages/today_faculty.html";
  } else if (role === "STUDENT") {
    window.location.href = "../pages/today_student.html";
  } else {
    window.location.href = "../pages/login.html";
  }
}

// make it globally accessible (IMPORTANT)
window.goToToday = goToToday;
// SIDEBAR TOGGLE (MOBILE)
function toggleSidebar() {
  const sidebar = document.getElementById("sidebarMenu");
  const overlay = document.getElementById("overlay");

  const isMobile = window.innerWidth < 768;

  if (isMobile) {
    // ✅ MOBILE BEHAVIOR
    if (sidebar.style.left === "0px") {
      sidebar.style.left = "-250px";
      overlay.style.display = "none";
    } else {
      sidebar.style.left = "0px";
      overlay.style.display = "block";
    }
  } else {
    // ✅ DESKTOP → DO NOTHING
    console.log("Desktop click ignored");
  }
}

// make globally accessible
window.toggleSidebar = toggleSidebar;
function loadUserInfo() {
  const name = localStorage.getItem("fullName");
  const email = localStorage.getItem("email");
  const userId = localStorage.getItem("userId");
  const dept = localStorage.getItem("department");

  const nameEl = document.getElementById("userName");
  const emailEl = document.getElementById("userEmail");
  const idEl = document.getElementById("userId");
  const deptEl = document.getElementById("userDept");

  if (nameEl) nameEl.innerText = name || "User";
  if (emailEl) emailEl.innerText = email || "email@example.com";
  if (idEl) idEl.innerText = userId || "ID";
  if (deptEl) deptEl.innerText = dept || "Dept";
}

async function fetchStudentDetails() {
  console.log("🔥 fetchStudentDetails called");
  const userId = localStorage.getItem("userId");

  try {
    const res = await apiFetch(`/api/by-userid/${userId}`);
    const data = await res.json();

    console.log("Student Data:", data);

    // store in localStorage
    localStorage.setItem("fullName", data.fullName);
    localStorage.setItem("email", data.collegeEmail);
    localStorage.setItem("department", data.department);

    // update UI immediately
    loadUserInfo();
  } catch (err) {
    console.error("Error fetching student:", err);
  }
}
async function fetchFacultyDetails() {
  console.log("🔥 fetchFacultyDetails called");
  const userId = localStorage.getItem("userId");

  try {
    const res = await apiFetch(`/api/faculty/by-userid/${userId}`);

    if (!res.ok) {
      const text = await res.text();
      console.error("Faculty API error:", text);
      return;
    }

    const data = await res.json();

    console.log("Faculty Data:", data);

    localStorage.setItem("fullName", data.fullName);
    localStorage.setItem("email", data.collegeEmail);
    localStorage.setItem("department", data.department);

    loadUserInfo();
  } catch (err) {
    console.error("Error fetching faculty:", err);
  }
}
