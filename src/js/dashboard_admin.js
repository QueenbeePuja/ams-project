let stuChart = null;
let facChart = null;

function pctText(p) {
  return p === null || p === undefined ? "--" : Number(p).toFixed(1) + "%";
}

function setText(id, value) {
  document.getElementById(id).textContent = value;
}

function cell(text, cls) {
  const td = document.createElement("td");
  td.className = cls;
  td.textContent = text;
  return td;
}

function pill(text, cls) {
  const span = document.createElement("span");
  span.className =
    "px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap " + cls;
  span.textContent = text;
  return span;
}

async function getJson(path, params) {
  const qs = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v && v !== "all") qs.append(k, v);
  });
  const url = qs.toString() ? `${path}?${qs}` : path;
  const res = await apiFetch(url);
  return res && typeof res.json === "function" ? await res.json() : res;
}

/* ---------- top tiles ---------- */
function renderTiles(d) {
  setText("tStudents", d.totalStudents);
  setText("tFaculty", d.totalFaculty);
  setText("tSubjects", d.totalSubjects);
  setText("tSessions", d.sessionsToday);
  setText("tOverall", pctText(d.overallPercent));
  setText("tLow", d.totalLowStudents);
  setText("tLowSub", "below " + d.threshold + "%");
}

/* ---------- students column ---------- */
function renderStudents(d) {
  const rows = d.students || [];
  setText("stuCount", d.count);
  setText("stuAvg", pctText(d.avgPercent));
  setText("stuLow", d.belowCount);
  setText("stuLowSub", d.noDataCount ? d.noDataCount + " no data" : "");

  // distribution chart
  const t = d.threshold;
  const edges = [0, 50, t - 10, t, 90, 101];
  const labels = [
    "<50",
    `50-${t - 10}`,
    `${t - 10}-${t}`,
    `${t}-90`,
    "90-100",
    "No data",
  ];
  const counts = [0, 0, 0, 0, 0, 0];
  rows.forEach((r) => {
    if (r.percent === null || r.percent === undefined) {
      counts[5]++;
      return;
    }
    for (let i = 0; i < 5; i++) {
      if (r.percent >= edges[i] && r.percent < edges[i + 1]) {
        counts[i]++;
        break;
      }
    }
  });

  if (stuChart) stuChart.destroy();
  stuChart = new Chart(document.getElementById("stuChart"), {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Students",
          data: counts,
          backgroundColor: [
            "#bc4749",
            "#d4776b",
            "#dda15e",
            "#606c38",
            "#3f4d1f",
            "#9ca3af",
          ],
          borderRadius: 6,
          maxBarThickness: 56,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
      plugins: { legend: { display: false } },
    },
  });

  // table
  const tbody = document.getElementById("stuRows");
  tbody.innerHTML = "";
  document
    .getElementById("stuEmpty")
    .classList.toggle("hidden", rows.length > 0);

  rows.forEach((r) => {
    const tr = document.createElement("tr");
    tr.className = "border-b last:border-0";

    const statusCell = document.createElement("td");
    statusCell.className = "py-2";
    if (r.status === "AT_RISK")
      statusCell.appendChild(pill("At risk", "bg-red-100 text-red-800"));
    else if (r.status === "SAFE")
      statusCell.appendChild(pill("Safe", "bg-green-100 text-green-800"));
    else statusCell.appendChild(pill("No data", "bg-gray-200 text-gray-600"));

    tr.append(
      cell(`${r.name || r.userId} (${r.userId})`, "py-2 pr-2"),
      cell(r.semester, "py-2 pr-2"),
      cell(
        r.total === 0 ? "--" : `${r.attended}/${r.total}`,
        "py-2 pr-2 whitespace-nowrap",
      ),
      cell(pctText(r.percent), "py-2 pr-2 font-semibold"),
      statusCell,
    );
    tbody.appendChild(tr);
  });
}

/* ---------- faculty column ---------- */
function renderFaculty(d) {
  const rows = d.faculty || [];
  setText("facCount", d.count);
  setText("facAvg", pctText(d.avgPercent));
  setText(
    "facLow",
    rows.reduce((sum, r) => sum + r.lowStudents, 0),
  );

  const labels = rows.map((r) => r.name || r.userId);
  const values = rows.map((r) =>
    r.avgPercent === null || r.avgPercent === undefined ? 0 : r.avgPercent,
  );
  const colors = rows.map((r) => {
    if (r.avgPercent === null || r.avgPercent === undefined) return "#9ca3af";
    if (r.avgPercent < d.threshold) return "#bc4749";
    if (r.avgPercent < d.threshold + 10) return "#dda15e";
    return "#606c38";
  });

  if (facChart) facChart.destroy();
  facChart = new Chart(document.getElementById("facChart"), {
    data: {
      labels,
      datasets: [
        {
          type: "bar",
          label: "Average attendance %",
          data: values,
          backgroundColor: colors,
          borderRadius: 6,
          maxBarThickness: 56,
        },
        {
          type: "line",
          label: `Threshold (${d.threshold}%)`,
          data: labels.map(() => d.threshold),
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
      scales: { y: { min: 0, max: 100, ticks: { callback: (v) => v + "%" } } },
      plugins: { legend: { position: "bottom" } },
    },
  });

  const tbody = document.getElementById("facRows");
  tbody.innerHTML = "";
  document
    .getElementById("facEmpty")
    .classList.toggle("hidden", rows.length > 0);

  rows.forEach((r) => {
    const tr = document.createElement("tr");
    tr.className = "border-b last:border-0";
    tr.append(
      cell(r.name || r.userId, "py-2 pr-2"),
      cell((r.subjectNames || []).join(", ") || "--", "py-2 pr-2"),
      cell(pctText(r.avgPercent), "py-2 pr-2 font-semibold"),
      cell(r.lowStudents, "py-2 text-[#bc4749] font-semibold"),
    );
    tbody.appendChild(tr);
  });
}

/* ---------- loading ---------- */
async function loadStudents() {
  try {
    const d = await getJson("/api/admin/analytics/students", {
      department: document.getElementById("stuDept").value,
      semester: document.getElementById("stuSem").value,
    });
    renderStudents(d);
    loadRisk();
  } catch (err) {
    console.error("Student analytics failed", err);
  }
}

async function loadRisk() {
  try {
    const d = await getJson("/api/admin/analytics/risk", {
      department: document.getElementById("stuDept").value,
      semester: document.getElementById("stuSem").value,
    });

    setText("riskCounts", `${d.high} high · ${d.medium} medium · ${d.low} low`);

    const tbody = document.getElementById("riskRows");
    tbody.innerHTML = "";
    document
      .getElementById("riskEmpty")
      .classList.toggle("hidden", d.students.length > 0);

    d.students.forEach((r) => {
      const tr = document.createElement("tr");
      tr.className = "border-b last:border-0 align-top";

      const badgeTd = document.createElement("td");
      badgeTd.className = "py-2 pr-2";
      const high = r.risk === "HIGH";
      badgeTd.appendChild(
        pill(
          high ? "High" : "Medium",
          high ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800",
        ),
      );

      tr.append(
        cell(`${r.name || r.userId} (${r.userId})`, "py-2 pr-2"),
        cell(r.semester, "py-2 pr-2"),
        badgeTd,
        cell(r.score, "py-2 pr-2 font-semibold"),
        cell(r.projectedPercent + "%", "py-2 pr-2"),
        cell(r.reason, "py-2 text-xs text-gray-600"),
      );
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error("Risk list failed", err);
  }
}

async function loadFaculty() {
  try {
    const d = await getJson("/api/admin/analytics/faculty", {
      department: document.getElementById("facDept").value,
      semester: document.getElementById("facSem").value,
    });
    renderFaculty(d);
  } catch (err) {
    console.error("Faculty analytics failed", err);
  }
}

function fillSelect(id, values, labelFn) {
  const select = document.getElementById(id);
  values.forEach((v) => {
    const opt = document.createElement("option");
    opt.value = String(v);
    opt.textContent = labelFn(v);
    select.appendChild(opt);
  });
}

async function loadAdminDashboard() {
  try {
    const summary = await getJson("/api/admin/analytics/summary");
    renderTiles(summary);

    const filters = await getJson("/api/admin/analytics/filters");
    fillSelect("stuDept", filters.departments || [], (v) => v);
    fillSelect("facDept", filters.departments || [], (v) => v);
    fillSelect("stuSem", filters.semesters || [], (v) => "Semester " + v);
    fillSelect("facSem", filters.semesters || [], (v) => "Semester " + v);

    ["stuDept", "stuSem"].forEach((id) =>
      document.getElementById(id).addEventListener("change", loadStudents),
    );
    ["facDept", "facSem"].forEach((id) =>
      document.getElementById(id).addEventListener("change", loadFaculty),
    );

    await Promise.all([loadStudents(), loadFaculty()]);
  } catch (err) {
    console.error("Admin dashboard load failed", err);
  }
}

loadAdminDashboard();
