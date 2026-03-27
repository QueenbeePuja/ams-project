async function loadTodayClasses() {
  const facultyId = localStorage.getItem("facultyId");

  const res = await fetch(
    `http://localhost:8081/timetable/faculty/${facultyId}`,
  );
  const data = await res.json();

  const today = new Date()
    .toLocaleString("en-US", { weekday: "long" })
    .toUpperCase();

  const todayClasses = data.filter((e) => e.day === today);

  renderTodayClasses(todayClasses);
}

function renderTodayClasses(classes) {
  const container = document.getElementById("todayClassesContainer");
  container.innerHTML = "";

  if (classes.length === 0) {
    container.innerHTML = `<div class="text-gray-500">No classes today</div>`;
    return;
  }

  classes.forEach((cls) => {
    const div = document.createElement("div");

    div.className =
      "bg-green-500 text-white py-3 px-4 rounded-lg grid grid-cols-3 items-center";

    div.innerHTML = `
  <div class="flex-1 text-sm">
    ${cls.subject.code} • ${cls.timeSlot} • ${cls.room || "-"}
  </div>

  <div class="flex-1 text-center font-semibold text-lg">
    ${cls.subject.name}
  </div>

  <div class="justify-self-end">
    <button class="take-attendance-btn bg-white text-green-700 px-4 py-1.5 rounded-md text-sm font-semibold">
      Take Attendance
    </button>
  </div>
`;
    const btn = div.querySelector(".take-attendance-btn");

    btn.addEventListener("click", () => {
      console.log("Clicked class:", cls); // ✅ DEBUG

      localStorage.setItem("selectedClass", JSON.stringify(cls));

      window.location.href = "../pages/attendance_faculty.html";
    });
    container.appendChild(div);
  });
}

document.addEventListener("DOMContentLoaded", loadTodayClasses);
