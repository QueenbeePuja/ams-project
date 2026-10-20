let facultyChart = null;

function pctText(p) {
  return p === null || p === undefined ? "--" : Number(p).toFixed(1) + "%";
}

function barColor(avg, threshold) {
  if (avg === null || avg === undefined) return "#9ca3af";
  if (avg < threshold) return "#bc4749";
  if (avg < threshold + 10) return "#dda15e";
  return "#606c38";
}

function renderTiles(data) {
  const subjects = data.subjects || [];
  const withData = subjects.filter(
    (s) => s.avgPercent !== null && s.avgPercent !== undefined,
  );

  document.getElementById("statSubjects").textContent = subjects.length;
  document.getElementById("statSubjectsSub").textContent = subjects
    .map((s) => s.code)
    .filter(Boolean)
    .join(", ");

  const avg = withData.length
    ? withData.reduce((sum, s) => sum + s.avgPercent, 0) / withData.length
    : null;
  document.getElementById("statAvg").textContent = pctText(avg);

  document.getElementById("statLow").textContent = data.totalLowStudents;
  document.getElementById("statLowSub").textContent =
    "below " + data.threshold + "% (counted per subject)";

  if (withData.length) {
    const worst = withData.reduce((a, b) =>
      a.avgPercent <= b.avgPercent ? a : b,
    );
    document.getElementById("statWorst").textContent = worst.subject;
    document.getElementById("statWorstSub").textContent =
      "average " + pctText(worst.avgPercent);
  } else {
    document.getElementById("statWorst").textContent = "No data yet";
  }
}

function renderChart(data) {
  const subjects = data.subjects || [];
  const labels = subjects.map((s) => s.code || s.subject);
  const values = subjects.map((s) =>
    s.avgPercent === null || s.avgPercent === undefined ? 0 : s.avgPercent,
  );
  const colors = subjects.map((s) => barColor(s.avgPercent, data.threshold));

  if (facultyChart) facultyChart.destroy();

  facultyChart = new Chart(document.getElementById("facultyChart"), {
    data: {
      labels,
      datasets: [
        {
          type: "bar",
          label: "Average attendance %",
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
      scales: { y: { min: 0, max: 100, ticks: { callback: (v) => v + "%" } } },
      plugins: {
        legend: { position: "bottom" },
        tooltip: {
          callbacks: { title: (items) => subjects[items[0].dataIndex].subject },
        },
      },
    },
  });
}

function makeCell(text, className) {
  const td = document.createElement("td");
  td.className = className;
  td.textContent = text;
  return td;
}

function renderLowLists(data) {
  const wrap = document.getElementById("lowLists");
  wrap.innerHTML = "";

  (data.subjects || []).forEach((s) => {
    const card = document.createElement("div");
    card.className = "bg-white rounded-xl shadow p-4";

    const head = document.createElement("div");
    head.className = "flex items-start justify-between gap-2 mb-3";

    const title = document.createElement("div");
    const name = document.createElement("p");
    name.className = "font-semibold text-[#283618]";
    name.textContent = s.subject;
    const meta = document.createElement("p");
    meta.className = "text-xs text-gray-500";
    meta.textContent = `${s.code || ""} · Semester ${s.semester} · ${s.students} students · avg ${pctText(s.avgPercent)}`;
    title.append(name, meta);

    const badge = document.createElement("span");
    const hasLow = s.lowCount > 0;
    badge.className =
      "px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap " +
      (hasLow ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800");
    badge.textContent = hasLow ? `${s.lowCount} low` : "All good";

    head.append(title, badge);
    card.appendChild(head);

    if (!hasLow) {
      const ok = document.createElement("p");
      ok.className = "text-sm text-gray-500";
      ok.textContent = `No students below ${data.threshold}%.`;
      card.appendChild(ok);
    } else {
      const scroll = document.createElement("div");
      scroll.className = "overflow-x-auto";
      const table = document.createElement("table");
      table.className = "w-full text-sm min-w-[320px]";

      const thead = document.createElement("thead");
      thead.innerHTML =
        '<tr class="text-left text-gray-500 border-b">' +
        '<th class="py-2 pr-2">Student</th>' +
        '<th class="py-2 pr-2">Attended</th>' +
        '<th class="py-2">%</th></tr>';
      table.appendChild(thead);

      const tbody = document.createElement("tbody");
      s.lowStudents.forEach((st) => {
        const tr = document.createElement("tr");
        tr.className = "border-b last:border-0";
        tr.append(
          makeCell(`${st.name || st.userId} (${st.userId})`, "py-2 pr-2"),
          makeCell(`${st.attended}/${st.total}`, "py-2 pr-2 whitespace-nowrap"),
          makeCell(pctText(st.percent), "py-2 font-semibold text-[#bc4749]"),
        );
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);
      scroll.appendChild(table);
      card.appendChild(scroll);
    }

    wrap.appendChild(card);
  });
}

let fullData = null;

function viewFor(selected) {
  if (selected === "all") return fullData;
  const subjects = fullData.subjects.filter(
    (s) => String(s.subjectId) === selected,
  );
  return {
    ...fullData,
    subjects,
    totalLowStudents: subjects.reduce((sum, s) => sum + s.lowCount, 0),
  };
}

function applyFilter() {
  const selected = document.getElementById("subjectFilter").value;
  try {
    localStorage.setItem("facultyDashSubject", selected);
  } catch (e) {}

  const view = viewFor(selected);
  renderTiles(view);
  renderChart(view);
  renderLowLists(view);
}

function fillFilter(data) {
  const select = document.getElementById("subjectFilter");
  select.innerHTML = "";

  const all = document.createElement("option");
  all.value = "all";
  all.textContent = "All my subjects";
  select.appendChild(all);

  (data.subjects || []).forEach((s) => {
    const opt = document.createElement("option");
    opt.value = String(s.subjectId);
    opt.textContent = `${s.subject}${s.code ? " (" + s.code + ")" : ""} · Sem ${s.semester}`;
    select.appendChild(opt);
  });

  let saved = "all";
  try {
    saved = localStorage.getItem("facultyDashSubject") || "all";
  } catch (e) {}
  const exists = Array.from(select.options).some((o) => o.value === saved);
  select.value = exists ? saved : "all";

  select.addEventListener("change", applyFilter);
}

async function loadFacultyDashboard() {
  try {
    const res = await apiFetch("/api/faculty/analytics/summary");
    fullData = res && typeof res.json === "function" ? await res.json() : res;
    fillFilter(fullData);
    applyFilter();
  } catch (err) {
    console.error("Faculty dashboard load failed", err);
    document.getElementById("statWorst").textContent = "Could not load data";
  }
}

loadFacultyDashboard();
