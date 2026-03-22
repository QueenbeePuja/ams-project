// SAMPLE DATA (later from backend)
const attendanceData = [
  { subject: "Data Mining", code: "CS501", attended: 41, total: 50 },
  { subject: "Operating Systems", code: "CS502", attended: 38, total: 50 },
  { subject: "Computer Networks", code: "CS504", attended: 30, total: 50 },
];

// SAFETY BUFFER FUNCTION
function calculateBuffer(A, T) {
  const x = Math.floor((A - 0.75 * T) / 0.75);
  return x > 0 ? x : 0;
}

// ----------------------
// OVERALL
// ----------------------

let totalA = 0;
let totalT = 0;

attendanceData.forEach((item) => {
  totalA += item.attended;
  totalT += item.total;
});

const overallPercent = ((totalA / totalT) * 100).toFixed(1);
const overallBuffer = calculateBuffer(totalA, totalT);

document.getElementById("overallPercent").innerText = overallPercent + "%";

const overallEl = document.getElementById("overallBuffer");

if (overallBuffer > 2) {
  overallEl.innerHTML = `✅ You can miss <span class="text-green-600">${overallBuffer}</span> classes`;
} else if (overallBuffer > 0) {
  overallEl.innerHTML = `⚠ Only <span class="text-yellow-600">${overallBuffer}</span> classes left`;
} else {
  overallEl.innerHTML = `❌ You are at risk! No more classes can be missed`;
}

// ----------------------
// SUBJECT-WISE
// ----------------------

const subjectList = document.getElementById("subjectBufferList");

attendanceData.forEach((item) => {
  const percent = ((item.attended / item.total) * 100).toFixed(1);
  const buffer = calculateBuffer(item.attended, item.total);

  let status = "";
  let color = "";

  if (buffer > 2) {
    status = `Can miss ${buffer} classes`;
    color = "text-green-600";
  } else if (buffer > 0) {
    status = `Only ${buffer} left`;
    color = "text-yellow-600";
  } else {
    status = "At Risk";
    color = "text-red-600";
  }

  const row = document.createElement("div");

  row.className = "flex justify-between items-center border-b pb-2";

  row.innerHTML = `
    <div>
      <p class="font-semibold text-[#283618]">${item.subject}</p>
      <p class="text-sm text-gray-500">${item.code} • ${percent}%</p>
    </div>

    <div class="${color} font-semibold">
      ${status}
    </div>
  `;

  subjectList.appendChild(row);
});
