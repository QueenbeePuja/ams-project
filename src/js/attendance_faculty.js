const startBtn = document.getElementById("startAttendance");
const sessionPanel = document.getElementById("attendanceSession");

document.addEventListener("DOMContentLoaded", () => {
  autofillDetails();
  loadStudents();
});

function autofillDetails() {
  const cls = JSON.parse(localStorage.getItem("selectedClass"));

  if (!cls) return;
  //subject
  const subjectDropdown = document.querySelectorAll("select")[0];
  subjectDropdown.innerHTML = `<option>${cls.subject.code} - ${cls.subject.name}</option>`;
  //semester
  const semesterDropdown = document.querySelectorAll("select")[1];
  semesterDropdown.innerHTML = `<option>Semester ${cls.semester}</option>`;
  //date(today)
  const dateInput = document.querySelector("input[type='date']");
  const today = new Date().toISOString().split("T")[0];
  dateInput.value = today;
}
async function loadStudents() {
  const cls = JSON.parse(localStorage.getItem("selectedClass"));

  if (!cls) return;

  const semester = cls.semester;

  console.log("Loading students for semester:", semester);

  const token = localStorage.getItem("token");

  const res = await fetch(
    `http://localhost:8081/api/student/semester/${semester}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
  const students = await res.json();

  renderStudents(students);
}
function renderStudents(students) {
  const container = document.getElementById("studentList");

  if (!container) {
    console.error("studentList div not found ❌");
    return;
  }

  container.innerHTML = "";

  students.forEach((s) => {
    const row = document.createElement("div");

    row.className = "flex justify-between p-3 border rounded-lg bg-white";

    row.innerHTML = `
      <span>${s.fullName}</span>
      <input type="checkbox" data-id="${s.id}" />
    `;

    container.appendChild(row);
  });
}
