document.addEventListener("DOMContentLoaded", () => {
  autofillDetails();
  loadStudents();

  const startBtn = document.getElementById("startAttendance");

  startBtn.addEventListener("click", startSession);
});
const sessionPanel = document.getElementById("attendanceSession");

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

  const res = await apiFetch(`api/student/semester/${semester}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
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

async function startSession() {
  const cls = JSON.parse(localStorage.getItem("selectedClass"));
  const subjectId = cls.subject.id;

  const token = localStorage.getItem("token");

  const res = await apiFetch(
    `/api/attendance/start-session?subjectId=${subjectId}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
  if (!res.ok) {
    alert("Failed to start session");
    return;
  }

  const data = await res.json();

  console.log("Session:", data);

  // show session panel
  sessionPanel.classList.remove("hidden");

  // generate QR
  window.currentSessionId = data.sessionId;
  startQrRotation(data.sessionId);

  //show count
  startLiveCount(data.sessionId);

  // start timer
  startTimer(120); // 2 minutes
}
let qrInterval = null;
let lastQrText = "";

async function refreshQr(sessionId) {
  try {
    const token = localStorage.getItem("token");
    const res = await apiFetch(
      `/api/attendance/qr-token?sessionId=${encodeURIComponent(sessionId)}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (!res.ok) return;

    const qrToken = (await res.text()).trim();
    const text = `${sessionId}.${qrToken}`;

    if (text !== lastQrText) {
      lastQrText = text;
      generateQRCode(text); // only redraw when the token changed
    }
  } catch (err) {
    console.error("QR refresh failed:", err);
  }
}

function startQrRotation(sessionId) {
  stopQrRotation();
  lastQrText = "";
  refreshQr(sessionId);
  qrInterval = setInterval(() => refreshQr(sessionId), 3000);
}

function stopQrRotation() {
  if (qrInterval) clearInterval(qrInterval);
  qrInterval = null;
}
function generateQRCode(qrText) {
  const qrBox = document.getElementById("qrBox");

  qrBox.innerHTML = ""; // clear old QR

  new QRCode(qrBox, {
    text: qrText,
    width: 200,
    height: 200,
  });
}
function startTimer(seconds) {
  const timerEl = document.getElementById("timer");

  let time = seconds;

  const interval = setInterval(() => {
    timerEl.innerText = time;
    time--;

    if (time < 0) {
      clearInterval(interval);
      alert("Session ended. Marking absentees...");

      endSession();
    }
  }, 1000);
}
stopQrRotation();
document.getElementById("qrBox").innerHTML = ""; // remove the QR when the session ends

async function endSession() {
  const sessionId = window.currentSessionId;
  const token = localStorage.getItem("token");

  const res = await apiFetch(
    `/api/attendance/end-session?sessionId=${sessionId}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  const text = await res.text();

  sessionEnded = true; // 🔥 IMPORTANT

  alert(text);
}

let sessionEnded = false;

function startLiveCount(sessionId) {
  const interval = setInterval(async () => {
    try {
      const res = await apiFetch(
        `/api/attendance/count?sessionId=${sessionId}`,
      );
      const data = await res.json();

      const el = document.getElementById("presentCount");

      if (!sessionEnded) {
        // 🔥 DURING SESSION
        el.innerText = `${data.present}`;
      } else {
        // 🔥 AFTER SESSION
        el.innerText = `${data.present} / ${data.total}`;
        clearInterval(interval); // stop polling
      }
    } catch (err) {
      console.error(err);
    }
  }, 3000);
}
