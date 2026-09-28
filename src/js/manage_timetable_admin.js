const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const slots = [
  "9:00-9:50",
  "9:50-10:40",
  "10:40-11:30",
  "11:30-12:20",
  "12:20-1:10",
  "LUNCH",
  "1:10-2:00",
  "2:00-2:50",
  "2:50-3:40",
  "3:40-4:30",
  "4:30-5:20",
  "5:20-6:10",
];
let facultyData = [];

function generateTimetable() {
  const tbody = document.getElementById("timetable-body");
  tbody.innerHTML = "";
  days.forEach((day) => {
    let row = `<tr>`;

    row += `
        <td class="border p-2 font-semibold bg-white sticky left-0 z-10">
            ${day}
        </td>`;

    slots.forEach((slot, slotIndex) => {
      if (slot === "LUNCH") {
        row += createLunchCell();
      } else {
        row += createSlotCell(day, slotIndex);
      }
    });

    row += `</tr>`;

    tbody.insertAdjacentHTML("beforeend", row);
  });
}

function generateHeader() {
  const thead = document.getElementById("timetable-head");

  let header = `
    <tr class="bg-gray-100">
        <th class="border p-2 sticky left-0 bg-gray-100 z-20">Day</th>
    `;

  slots.forEach((slot) => {
    if (slot === "LUNCH") {
      header += `<th class="border p-2">Lunch</th>`;
    } else {
      header += `<th class="border p-2">${slot}</th>`;
    }
  });

  header += `</tr>`;

  thead.innerHTML = header;
}

function createLunchCell() {
  return `
    <td class="border bg-yellow-200 font-semibold text-black h-24">
        LUNCH
    </td>
    `;
}
function createSlotCell(day, slotIndex) {
  return `
    <td class="border h-24 p-1 align-top"
        data-day="${day}"
        data-slot = "${slotIndex}">

        <div class="flex flex-col gap-1 text-xs">

            <select class="slot-type border rounded p-1 w-full">
                <option value="">Slot Type</option>
                <option value="class">Class</option>
                <option value="break">Break</option>
            </select>

            <div class="class-fields flex flex-col gap-1 hidden">

                <select class="course border rounded p-1 w-full">
                    <option value="">Course</option>
                </select>

                <select class="faculty border rounded p-1 w-full">
                    <option value="">Faculty</option>
                </select>

                <select class="room border rounded p-1 w-full">
                    <option value="">Room</option>
                    <option>S-12</option>
                    <option>S-14</option>
                </select>
                <button class="apply-slot bg-blue-600 text-white rounded p-1 text-xs">
                Apply
                </button>
            </div>
            <div class="slot-display hidden text-xs font-semibold text-center leading-tight"></div>
        </div>

    </td>
    `;
}
document.addEventListener("click", function (e) {
  if (e.target.classList.contains("apply-slot")) {
    const cell = e.target.closest("td");

    const courseSelect = cell.querySelector(".course");
    const facultySelect = cell.querySelector(".faculty");
    const roomSelect = cell.querySelector(".room");

    const display = cell.querySelector(".slot-display");
    const fields = cell.querySelector(".class-fields");

    const courseText = courseSelect.options[courseSelect.selectedIndex].text;
    const facultyText = facultySelect.options[facultySelect.selectedIndex].text;
    const room = roomSelect.value;

    display.innerHTML = `
      ${courseText}
      <hr class="border-gray-400">
      ${facultyText} | ${room}
    `;

    fields.classList.add("hidden");
    display.classList.remove("hidden");
  }
});

document.addEventListener("change", function (e) {
  if (e.target.classList.contains("slot-type")) {
    const cell = e.target.closest("td");
    const fields = cell.querySelector(".class-fields");
    const display = cell.querySelector(".slot-display");

    if (e.target.value === "class") {
      fields.classList.remove("hidden");
      display.classList.add("hidden");

      const facultySelect = cell.querySelector(".faculty");

      const day = cell.dataset.day.toUpperCase();
      const slotIndex = cell.dataset.slot;
      const time = slots[slotIndex];

      facultySelect.innerHTML = `<option value="">Faculty</option>`;
      apiFetch(`/timetable/conflicts?day=${day}&time=${time}`)
        .then((res) => res.json())
        .then((usedFaculty) => {
          facultySelect.innerHTML = `<option value="">Faculty</option>`;
          console.log("USED:", usedFaculty);
          console.log("FACULTY:", facultyData);

          facultyData.forEach((f) => {
            if (!usedFaculty.includes(Number(f.id))) {
              facultySelect.innerHTML += `
          <option value="${f.id}">
            ${f.fullName}
          </option>
        `;
            }
          });
        })
        .catch((err) => {
          console.error("Conflict API error:", err);
        });
    } else {
      fields.classList.add("hidden");

      if (display) {
        display.classList.add("hidden");
        display.innerHTML = "";
      }
    }
  }
});
document
  .getElementById("save-timetable")
  .addEventListener("click", function () {
    const semester = document.getElementById("semester-select").value;
    const cells = document.querySelectorAll("td[data-day]");

    let timetableData = [];
    if (!semester) {
      alert("Select semester before saving");
      return;
    }
    cells.forEach((cell) => {
      const day = cell.dataset.day.toUpperCase();
      const slotIndex = cell.dataset.slot;
      const time = slots[slotIndex];

      const slotType = cell.querySelector(".slot-type").value;

      let subjectId = "";
      let facultyId = "";
      let room = "";

      if (slotType === "class") {
        subjectId = cell.querySelector(".course")?.value || "";
        facultyId = cell.querySelector(".faculty")?.value || "";
        room = cell.querySelector(".room")?.value || "";
      }
      if (slotType === "class") {
        timetableData.push({
          day,
          time,
          slotType: "CLASS",
          subjectId,
          facultyId,
          room,
        });
      }
    });
    const payload = {
      semester: semester,
      timetable: timetableData,
    };
    console.log("PAYLOAD:", payload);
    apiFetch("/timetable", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })
      .then((res) => res.text())
      .then((data) => {
        alert(data);
        if (data.toLowerCase().includes("success")) {
          resetTimetable();
        }
      })
      .catch((err) => {
        console.error(err);
        alert("Error saving timetable");
      });
  });

function resetTimetable() {
  const cells = document.querySelectorAll("td[data-day]");

  cells.forEach((cell) => {
    const slotType = cell.querySelector(".slot-type");
    const fields = cell.querySelector(".class-fields");
    const display = cell.querySelector(".slot-display");

    slotType.value = "";

    if (fields) {
      fields.classList.add("hidden");
    }
    if (display) {
      display.classList.add("hidden");
      display.innerHTML = "";
    }

    cell.querySelectorAll("select").forEach((select) => {
      select.selectedIndex = 0;
    });
  });
}
function updateSubjectDropdowns(subjects) {
  const selects = document.querySelectorAll(".course");

  selects.forEach((select) => {
    select.innerHTML = `<option value="">Course</option>`;

    subjects.forEach((sub) => {
      select.innerHTML += `
        <option value="${sub.id}">
          ${sub.code} - ${sub.name}
        </option>
      `;
    });
  });
}

generateHeader();
generateTimetable();
document
  .getElementById("semester-select")
  .addEventListener("change", function () {
    const semester = this.value;

    if (!semester) return;

    apiFetch(`/subjects/${semester}`)
      .then((res) => res.json())
      .then((data) => {
        updateSubjectDropdowns(data);
      })
      .catch((err) => {
        console.error("Error fetching subjects:", err);
      });
  });
apiFetch("/faculty")
  .then((res) => res.json())
  .then((data) => {
    console.log("FACULTY:", data); // debug
    facultyData = data;
  });
