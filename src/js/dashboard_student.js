const STATUS_STYLE = {
  SAFE: {
    color: "#606c38",
    badge: "bg-green-100 text-green-800",
    label: "Safe",
  },
  WARNING: {
    color: "#dda15e",
    badge: "bg-yellow-100 text-yellow-800",
    label: "Warning",
  },
  AT_RISK: {
    color: "#bc4749",
    badge: "bg-red-100 text-red-800",
    label: "At risk",
  },
  NO_DATA: {
    color: "#9ca3af",
    badge: "bg-gray-200 text-gray-600",
    label: "No data",
  },
};

let subjectChart = null;

function styleOf(status) {
  return STATUS_STYLE[status] || STATUS_STYLE.NO_DATA;
}

function fmtPercent(p) {
  return p === null || p === undefined ? "--" : Number(p).toFixed(1) + "%";
}

function messageFor(status, canMiss, needToAttend, threshold) {
  if (status === "SAFE")
    return `You can miss ${canMiss} more classes and stay above ${threshold}%.`;
  if (status === "WARNING")
    return `Careful: you can miss only ${canMiss} more class${canMiss === 1 ? "" : "es"} before dropping below ${threshold}%.`;
  if (status === "AT_RISK")
    return `Attend the next ${needToAttend} classes in a row to get back to ${threshold}%.`;
  return "No classes recorded yet.";
}

function renderOverall(data) {
  document.getElementById("overallPercent").textContent = fmtPercent(
    data.overallPercent,
  );

  const badge = document.getElementById("overallBadge");
  const st = styleOf(data.overallStatus);
  badge.textContent = st.label;
  badge.className = "px-3 py-1 rounded-full text-xs font-semibold " + st.badge;

  document.getElementById("overallMessage").textContent = messageFor(
    data.overallStatus,
    data.overallCanMiss,
    data.overallNeedToAttend,
    data.threshold,
  );

  document.getElementById("statAttended").textContent =
    `${data.attended} / ${data.total}`;
  document.getElementById("overallCounts").textContent =
    "classes attended so far";

  if (data.overallNeedToAttend > 0) {
    document.getElementById("statMissLabel").textContent = "NEED TO ATTEND";
    document.getElementById("statMiss").textContent = data.overallNeedToAttend;
    document.getElementById("statMissSub").textContent =
      "classes in a row to reach " + data.threshold + "%";
  } else {
    document.getElementById("statMissLabel").textContent = "CAN STILL MISS";
    document.getElementById("statMiss").textContent = data.overallCanMiss;
    document.getElementById("statMissSub").textContent =
      "classes and stay above " + data.threshold + "%";
  }

  const withData = (data.subjects || []).filter((s) => s.total > 0);
  const atRisk = withData.filter((s) => s.status === "AT_RISK").length;
  document.getElementById("statRisk").textContent = atRisk;
  document.getElementById("statRiskSub").textContent =
    `of ${withData.length} subjects with classes`;
}

function renderChart(data) {
  const subjects = data.subjects || [];
  const labels = subjects.map((s) => s.code || s.subject);
  const values = subjects.map((s) =>
    s.percent === null || s.percent === undefined ? 0 : s.percent,
  );
  const colors = subjects.map((s) => styleOf(s.status).color);

  if (subjectChart) subjectChart.destroy();

  subjectChart = new Chart(document.getElementById("subjectChart"), {
    data: {
      labels,
      datasets: [
        {
          type: "bar",
          label: "Attendance %",
          data: values,
          backgroundColor: colors,
          borderRadius: 6,
        },
        {
          type: "line",
          label: `Threshold (${data.threshold}%)`,
          data: labels.map(() => data.threshold),
          borderColor: "#283618",
          borderDash: [6, 4],
          borderWidth: 2,
          pointRadius: 0,
          fill: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { min: 0, max: 100, ticks: { callback: (v) => v + "%" } },
      },
      plugins: {
        legend: { position: "bottom" },
        tooltip: {
          callbacks: {
            title: (items) => subjects[items[0].dataIndex].subject,
          },
        },
      },
    },
  });
}

function renderTable(data) {
  const tbody = document.getElementById("subjectRows");
  tbody.innerHTML = "";

  (data.subjects || []).forEach((s) => {
    const tr = document.createElement("tr");
    tr.className = "border-b last:border-0";

    const tdName = document.createElement("td");
    tdName.className = "py-2 pr-2";
    tdName.textContent = s.subject;

    const tdCount = document.createElement("td");
    tdCount.className = "py-2 pr-2 whitespace-nowrap";
    tdCount.textContent = `${s.attended}/${s.total}`;

    const tdPct = document.createElement("td");
    tdPct.className = "py-2 pr-2 font-semibold";
    tdPct.textContent = s.total === 0 ? "--" : fmtPercent(s.percent);

    const tdStatus = document.createElement("td");
    tdStatus.className = "py-2";
    const pill = document.createElement("span");
    const st = styleOf(s.status);
    pill.className =
      "px-2 py-0.5 rounded-full text-xs font-semibold " + st.badge;
    pill.textContent = st.label;
    tdStatus.appendChild(pill);

    tr.append(tdName, tdCount, tdPct, tdStatus);
    tbody.appendChild(tr);
  });
}

async function loadStudentDashboard() {
  try {
    const res = await apiFetch("/api/student/analytics/summary");
    const data = res && typeof res.json === "function" ? await res.json() : res;

    renderOverall(data);
    renderChart(data);
    renderTable(data);
  } catch (err) {
    console.error("Dashboard load failed", err);
    document.getElementById("overallMessage").textContent =
      "Could not load attendance data. Please refresh.";
  }
}

loadStudentDashboard();
const RISK_LOOK = {
  HIGH: {
    title: "High risk of falling short",
    badge: "bg-red-100 text-red-800",
    border: "border-red-500",
    label: "High risk",
  },
  MEDIUM: {
    title: "Needs attention",
    badge: "bg-yellow-100 text-yellow-800",
    border: "border-yellow-500",
    label: "Medium risk",
  },
  LOW: {
    title: "You are on track",
    badge: "bg-green-100 text-green-800",
    border: "border-green-600",
    label: "Low risk",
  },
  INSUFFICIENT_DATA: {
    title: "Not enough data yet",
    badge: "bg-gray-200 text-gray-600",
    border: "border-gray-300",
    label: "No data",
  },
};

async function loadRisk() {
  try {
    const res = await apiFetch("/api/student/analytics/risk");
    if (!res.ok) throw new Error("status " + res.status);
    const r = await res.json();
    const look = RISK_LOOK[r.risk] || RISK_LOOK.INSUFFICIENT_DATA;

    document.getElementById("riskCard").className =
      "bg-white rounded-xl shadow p-4 border-l-4 " + look.border;
    document.getElementById("riskTitle").textContent = look.title;
    const badge = document.getElementById("riskBadge");
    badge.textContent = look.label;
    badge.className =
      "px-3 py-1 rounded-full text-xs font-semibold " + look.badge;
    document.getElementById("riskReason").textContent = r.reason;

    const stats = document.getElementById("riskStats");
    if (r.risk === "INSUFFICIENT_DATA") {
      stats.classList.add("hidden");
    } else {
      stats.classList.remove("hidden");
      document.getElementById("riskProjected").textContent =
        r.projectedPercent + "%";
      document.getElementById("riskMust").textContent =
        `${r.mustAttend} / ${r.remainingClasses}`;
      document.getElementById("riskScore").textContent = r.score;
    }
  } catch (err) {
    console.error("Risk load failed", err);
    document.getElementById("riskTitle").textContent =
      "Early warning unavailable";
  }
}

loadRisk();
