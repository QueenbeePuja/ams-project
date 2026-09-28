function shouldShowClass(cls) {
  const now = new Date();

  const [startStr, endStr] = cls.timeSlot.split("-");

  let [endH, endM] = endStr.trim().split(":").map(Number);

  // 🔥 FIX: convert to 24-hour format
  // assume timetable runs between 8 AM – 6 PM
  if (endH < 8) {
    endH += 12; // convert 2 → 14, 3 → 15, etc.
  }

  const end = new Date();
  end.setHours(endH, endM, 0);

  return now <= end;
}

async function loadTodayClasses() {
  const facultyId = localStorage.getItem("facultyId");

  const res = await apiFetch(`/timetable/faculty/${facultyId}`);
  const data = await res.json();

  const today = new Date()
    .toLocaleString("en-US", { weekday: "long" })
    .toUpperCase();

  const todayClasses = data
    .filter((e) => e.day === today)
    .filter(shouldShowClass);

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
