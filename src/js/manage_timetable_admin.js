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
                    <option value="CS501">CS501</option>
                    <option value="CS502">CS502</option>
                </select>

                <select class="faculty border rounded p-1 w-full">
                    <option value="">Faculty</option>
                    <option>Sharma</option>
                    <option>Khan</option>
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

    const course = cell.querySelector(".course").value;
    const faculty = cell.querySelector(".faculty").value;
    const room = cell.querySelector(".room").value;

    const display = cell.querySelector(".slot-display");
    const fields = cell.querySelector(".class-fields");

    display.innerHTML = `
            ${course}
            <hr class="border-gray-400">
            ${faculty} | ${room}
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

    cells.forEach((cell) => {
      const day = cell.dataset.day;
      const slot = cell.dataset.slot;

      const slotType = cell.querySelector(".slot-type").value;

      let course = "";
      let faculty = "";
      let room = "";

      if (slotType === "class") {
        course = cell.querySelector(".course")?.value || "";
        faculty = cell.querySelector(".faculty")?.value || "";
        room = cell.querySelector(".room")?.value || "";
      }

      timetableData.push({
        day,
        slot,
        slotType,
        course,
        faculty,
        room,
      });
    });
    const payload = {
      semester: semester,
      timetable: timetableData,
    };
    console.log(payload);
  });

document
  .getElementById("reset-timetable")
  .addEventListener("click", function () {
    if (confirm("Are you sure you want to reset the timetable?")) {
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
  });
generateHeader();
generateTimetable();
