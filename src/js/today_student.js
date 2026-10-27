document.addEventListener("click", (e) => {
  if (e.target.classList.contains("scan-btn")) {
    startScanner();
  }
});
let attendanceMap = {};
let lastRenderedClasses = null;

function isClassActive(timeSlot) {
  const now = new Date();

  const [startStr, endStr] = timeSlot.split("-");

  let [endH, endM] = endStr.trim().split(":").map(Number);

  // 🔥 FIX: convert to 24-hour format
  if (endH < 8) {
    endH += 12;
  }

  const end = new Date();
  end.setHours(endH, endM, 0);

  return now <= end;
}

let studentSemester = null;

async function getStudentSemester() {
  if (studentSemester) return studentSemester;
  const res = await apiFetch("/api/student/profile");
  if (!res.ok) throw new Error("Could not load student profile");
  const profile = await res.json();
  studentSemester = profile.semester;
  return studentSemester;
}

//todays timetable part:
async function loadTodayClasses() {
  try {
    console.log("loadTodayClasses called");
    const semester = await getStudentSemester();
    const res = await apiFetch(`/timetable/semester/${semester}`);
    const data = await res.json();

    const today = new Date().toLocaleString("en-US", {
      weekday: "long",
    });

    const todayClasses = data
      .filter((cls) => cls.day.toUpperCase() === today.toUpperCase())
      .filter((cls) => isClassActive(cls.timeSlot));
    const currentData = todayClasses
      .map((cls) => cls.subject.name + cls.timeSlot)
      .join("|");

    if (currentData === lastRenderedClasses) {
      return; // 🚫 no change → skip render
    }

    lastRenderedClasses = currentData;

    const container = document.getElementById("timetableContainer");

    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    if (todayClasses.length === 0) {
      container.innerHTML = `<p class="text-gray-500">No classes today</p>`;
      return;
    }

    todayClasses.forEach((cls) => {
      const div = document.createElement("div");

      const attendance = attendanceMap[cls.subject.name];

      let display = "N/A";
      let color = "gray";

      if (attendance) {
        display = attendance.display;
        color = getColor(attendance.percentage, attendance.display);
      }

      const bgColor = getBgColor(attendance?.percentage, display);

      div.className =
        //"text-white py-3 px-4 rounded-lg grid grid-cols-4 items-center mb-3 transition duration-200 hover:scale-[1.01] hover:shadow-lg";
        "relative bg-gray-100 border border-dashed border-gray-300 text-gray-800 py-3 px-4 rounded-lg grid grid-cols-4 items-center overflow-hidden";
      // div.style.backgroundColor = bgColor;

      const percent = display === "N/A" ? 0 : attendance?.percentage || 0;

      const fill = document.createElement("div");
      fill.style.width = percent + "%";
      fill.style.height = "100%";
      fill.style.position = "absolute";
      fill.style.left = "0";
      fill.style.top = "0";
      fill.style.zIndex = "0";
      fill.style.opacity = "0.8";
      fill.style.borderRadius = "8px";

      // color logic
      if (display === "N/A") fill.style.backgroundColor = "#9CA3AF";
      else if (percent >= 85) fill.style.backgroundColor = "#16a34a";
      else if (percent >= 75) fill.style.backgroundColor = "#f59e0b";
      else fill.style.backgroundColor = "#dc2626";

      div.innerHTML = `
      <div class="relative z-10 text-sm">
        ${cls.subject.code} | ${cls.timeSlot} | ${cls.room}
      </div>

      <div class="relative z-10 text-center font-semibold">
        ${cls.subject.name}
      </div>

      <div class="relative z-10 text-right font-bold">
        ${display}
      </div>

      <div class="relative z-10 text-right">
        <button 
          class="scan-btn bg-white text-green-700 px-4 py-1 rounded-md text-sm font-semibold hover:bg-gray-100"
        >
          Scan
        </button>
      </div>
        `;
      div.appendChild(fill);
      container.appendChild(div);
    });
  } catch (err) {
    console.error("Error loading timetable:", err);
  }
}
//percentage of attendance
async function loadAttendancePercentage() {
  const res = await apiFetch("/api/attendance/percentage");
  if (!res.ok) {
    console.error("Could not load attendance percentage", res.status);
    return;
  }

  const data = await res.json();

  // store attendance in map
  data.forEach((item) => {
    attendanceMap[item.subject] = item;
  });

  console.log("Attendance Map:", attendanceMap);
}

function displayAttendance(data) {
  const container = document.getElementById("attendanceContainer");
  container.innerHTML = "";

  data.forEach((item) => {
    const div = document.createElement("div");

    const color = getColor(item.percentage, item.display);

    div.innerHTML = `
      <div style="display:flex; justify-content:space-between; padding:10px; border-bottom:1px solid #ddd;">
        <span>${item.subject}</span>
        <span style="color:${color}; font-weight:bold;">
          ${item.display}
        </span>
      </div>
    `;

    container.appendChild(div);
  });
}

function getBgColor(percentage, display) {
  if (display === "N/A") return "#6b7280"; // gray
  if (percentage >= 85) return "#16a34a"; // green
  if (percentage >= 75) return "#f59e0b"; // orange
  return "#dc2626"; // red
}
function getColor(percentage, display) {
  if (display === "N/A") return "gray";
  if (percentage >= 85) return "white"; // keep white for contrast
  if (percentage >= 75) return "white";
  return "white";
}

let html5QrCode = null;
let scannerStarting = false;

async function stopScanner() {
  if (html5QrCode) {
    try {
      await html5QrCode.stop();
    } catch (e) {}
    try {
      html5QrCode.clear();
    } catch (e) {}
    html5QrCode = null;
  }
}

async function startScanner() {
  if (scannerStarting) return; // ignore double taps
  scannerStarting = true;

  const scannerSection = document.getElementById("scannerSection");
  scannerSection.classList.remove("hidden");

  const resultEl = document.getElementById("scanResult");
  resultEl.innerText = "📷 Opening camera...";

  await stopScanner(); // release any earlier scanner first
  html5QrCode = new Html5Qrcode("reader");

  const config = {
    fps: 10,
    qrbox: (w, h) => {
      const size = Math.floor(Math.min(w, h) * 0.7);
      return { width: size, height: size };
    },
  };

  let handled = false;
  const onScan = async (decodedText) => {
    if (handled) return;
    handled = true;

    await stopScanner();

    console.log("QR DATA:", decodedText);

    // QR format: sessionId.token
    const parts = decodedText.trim().split(".");
    const sessionId = parts.length === 2 ? parts[0] : null;
    const token = parts.length === 2 ? parts[1] : null;

    if (!sessionId || !token) {
      resultEl.innerText = "❌ Invalid QR";
      return;
    }

    sendAttendance(sessionId, token);
  };

  try {
    try {
      // first try: rear camera
      await html5QrCode.start({ facingMode: "environment" }, config, onScan);
    } catch (firstErr) {
      console.warn("facingMode failed, trying each camera:", firstErr);

      // fallback: try every camera the phone reports
      const cameras = await Html5Qrcode.getCameras();
      let started = false;
      for (const cam of cameras) {
        try {
          await html5QrCode.start(cam.id, config, onScan);
          started = true;
          break;
        } catch (e) {
          console.warn("Camera failed:", cam.label, e);
        }
      }
      if (!started) throw firstErr;
    }
    resultEl.innerText = "📷 Scanning QR...";
  } catch (err) {
    console.error(err);
    resultEl.innerText =
      "❌ Camera error: " +
      err +
      " — close other apps/tabs using the camera and try again.";
    await stopScanner();
  } finally {
    scannerStarting = false;
  }
}
//Send Attendance
async function sendAttendance(scannedSessionId, token) {
  const res = await apiFetch(
    `/api/attendance/scan?sessionId=${encodeURIComponent(scannedSessionId)}&token=${encodeURIComponent(token)}`,
    {
      method: "POST",
    },
  );

  if (!res.ok) {
    const errorText = await res.text();
    console.log("Backend error:", errorText);

    document.getElementById("scanResult").innerText = "❌ " + errorText;
    return;
  }

  const text = await res.text();
  document.getElementById("scanResult").innerText = "✅ " + text;
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadAttendancePercentage(); // 🔥 MUST be first
  loadTodayClasses(); // then timetable
  fetchStudentDetails();
});

setInterval(() => {
  loadTodayClasses();
}, 60000); // every 1 minute
