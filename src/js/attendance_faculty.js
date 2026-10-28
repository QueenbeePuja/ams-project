let subjects = []; // this teacher's own subjects
let semesterStudents = []; // students of the chosen subject's semester
let qrInterval = null;
let lastQrText = "";
let timerInterval = null;
let countInterval = null;
let sessionEnded = false;
let currentSessionId = null;

document.addEventListener("DOMContentLoaded", () => {
  document
    .getElementById("startAttendance")
    .addEventListener("click", startSession);
  document
    .getElementById("endAttendance")
    .addEventListener("click", () => endSession(true));
  document
    .getElementById("subjectSelect")
    .addEventListener("change", showSemester);
  document.getElementById("sessionDate").value = todayLocal();
  loadSubjects();
});

function todayLocal() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

// ---------- subjects ----------
async function loadSubjects() {
  const select = document.getElementById("subjectSelect");
  try {
    const res = await apiFetch("/api/faculty/my-subjects");
    if (!res.ok) throw new Error("status " + res.status);
    subjects = await res.json();
  } catch (err) {
    console.error("Could not load subjects:", err);
    select.replaceChildren(new Option("Could not load your subjects", ""));
    return;
  }

  select.replaceChildren();
  if (subjects.length === 0) {
    select.append(new Option("No subjects assigned to you", ""));
    return;
  }
  subjects.forEach((s) =>
    select.append(new Option(`${s.code} - ${s.name}`, s.id)),
  );

  // if you came here from a timetable click, preselect that subject
  try {
    const cls = JSON.parse(localStorage.getItem("selectedClass"));
    if (cls && cls.subject && subjects.some((s) => s.id === cls.subject.id)) {
      select.value = String(cls.subject.id);
    }
  } catch (e) {}
  showSemester();
}

function currentSubject() {
  const id = document.getElementById("subjectSelect").value;
  return subjects.find((s) => String(s.id) === id) || null;
}

function showSemester() {
  const s = currentSubject();
  document.getElementById("semesterText").textContent = s
    ? `Semester ${s.semester}`
    : "-";
}

async function loadSemesterStudents(semester) {
  const res = await apiFetch(`/api/student/semester/${semester}`);
  semesterStudents = res.ok ? await res.json() : [];
}

function setSetupLocked(locked) {
  document.getElementById("startAttendance").disabled = locked;
  document.getElementById("subjectSelect").disabled = locked;
}

// ---------- session ----------
async function startSession() {
  const subject = currentSubject();
  if (!subject) {
    alert("Please select a subject first.");
    return;
  }
  setSetupLocked(true);

  try {
    const res = await apiFetch(
      `/api/attendance/start-session?subjectId=${subject.id}`,
      { method: "POST" },
    );
    if (!res.ok) {
      alert("Failed to start session");
      setSetupLocked(false);
      return;
    }
    const data = await res.json();

    sessionEnded = false;
    currentSessionId = data.sessionId;
    await loadSemesterStudents(subject.semester);

    document.getElementById("attendanceSession").classList.remove("hidden");
    document.getElementById("pendingCard").classList.remove("hidden");
    renderPending(new Set());

    startQrRotation(data.sessionId);
    startLiveCount(data.sessionId);
    startTimer(120); // 2 minutes
  } catch (err) {
    console.error("Start session failed:", err);
    alert("Could not start the session. Please try again.");
    setSetupLocked(false);
  }
}

async function endSession(early) {
  if (sessionEnded || !currentSessionId) return;
  if (
    early &&
    !confirm(
      "End the session now? Students who have not checked in will be marked absent.",
    )
  ) {
    return;
  }
  sessionEnded = true;

  clearInterval(timerInterval);
  stopQrRotation();
  stopLiveCount();
  document.getElementById("qrBox").innerHTML = "";

  try {
    const res = await apiFetch(
      `/api/attendance/end-session?sessionId=${encodeURIComponent(currentSessionId)}`,
      { method: "POST" },
    );
    alert(await res.text());
  } catch (err) {
    console.error("End session failed:", err);
  }

  await refreshPresent(currentSessionId); // final list = marked absent
  setSetupLocked(false);
}

function startTimer(seconds) {
  const timerEl = document.getElementById("timer");
  clearInterval(timerInterval);
  let time = seconds;
  timerEl.innerText = time;

  timerInterval = setInterval(() => {
    time--;
    timerEl.innerText = Math.max(time, 0);
    if (time <= 0) {
      clearInterval(timerInterval);
      endSession(false);
    }
  }, 1000);
}

// ---------- rotating QR ----------
async function refreshQr(sessionId) {
  try {
    const res = await apiFetch(
      `/api/attendance/qr-token?sessionId=${encodeURIComponent(sessionId)}`,
    );
    if (!res.ok || sessionEnded) return;

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
  qrBox.innerHTML = "";
  new QRCode(qrBox, { text: qrText, width: 200, height: 200 });
}

// ---------- live list of who has / hasn't checked in ----------
function startLiveCount(sessionId) {
  stopLiveCount();
  refreshPresent(sessionId);
  countInterval = setInterval(() => refreshPresent(sessionId), 3000);
}

function stopLiveCount() {
  if (countInterval) clearInterval(countInterval);
  countInterval = null;
}

async function refreshPresent(sessionId) {
  try {
    const res = await apiFetch(
      `/api/attendance/present?sessionId=${encodeURIComponent(sessionId)}`,
    );
    if (!res.ok) return;
    const present = new Set(await res.json());

    document.getElementById("presentCount").textContent =
      `${present.size} / ${semesterStudents.length}`;
    renderPending(present);
  } catch (err) {
    console.error("Live count failed:", err);
  }
}

function renderPending(presentIds) {
  const list = document.getElementById("pendingList");
  const pending = semesterStudents
    .filter((s) => !presentIds.has(s.id))
    .sort((a, b) => String(a.userId).localeCompare(String(b.userId)));

  document.getElementById("pendingTitle").textContent = sessionEnded
    ? `Marked absent (${pending.length})`
    : `Yet to check in (${pending.length})`;

  list.replaceChildren();

  if (pending.length === 0) {
    const p = document.createElement("p");
    p.className = "text-sm text-gray-500 p-3";
    p.textContent = sessionEnded
      ? "Everyone was present."
      : "Everyone has checked in.";
    list.append(p);
    return;
  }

  pending.forEach((s) => {
    const row = document.createElement("div");
    row.className = "flex justify-between p-2 border-b text-sm";

    const name = document.createElement("span");
    name.textContent = s.fullName;
    const roll = document.createElement("span");
    roll.className = "text-gray-500";
    roll.textContent = s.userId;

    row.append(name, roll);
    list.append(row);
  });
}
