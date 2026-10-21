const AUDIENCE_LABEL = {
  FACULTY: "Faculty",
  STUDENTS: "Students",
  BOTH: "Everyone",
};
const AUDIENCE_STYLE = {
  FACULTY: "bg-blue-100 text-blue-800",
  STUDENTS: "bg-green-100 text-green-800",
  BOTH: "bg-gray-200 text-gray-700",
};

async function getJson(path) {
  const res = await apiFetch(path);
  if (!res.ok) throw new Error("Request failed: " + res.status);
  return res.json();
}

function setText(id, value) {
  document.getElementById(id).textContent = value;
}

function showMsg(text, ok) {
  const el = document.getElementById("annMsg");
  el.textContent = text;
  el.className = "text-sm mt-2 " + (ok ? "text-green-700" : "text-red-600");
}

function formatTime(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return "";
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function loadStats() {
  try {
    const d = await getJson("/api/admin/analytics/today");
    setText("statTaken", `${d.sessionsStarted} / ${d.classesToday}`);
    setText("statPending", d.attendancePending);
    setText("statAnnounce", d.announcementsToday);
  } catch (err) {
    console.error("Today stats failed", err);
  }
}

function renderAnnouncements(list) {
  const ul = document.getElementById("annList");
  ul.innerHTML = "";
  document
    .getElementById("annEmpty")
    .classList.toggle("hidden", list.length > 0);

  list.forEach((a) => {
    const li = document.createElement("li");
    li.className = "border-b last:border-0 pb-3";

    const top = document.createElement("div");
    top.className = "flex items-start justify-between gap-2";

    const title = document.createElement("p");
    title.className = "font-semibold text-[#283618]";
    title.textContent = a.title;

    const del = document.createElement("button");
    del.className = "text-xs text-red-600 hover:underline shrink-0";
    del.textContent = "Delete";
    del.addEventListener("click", () => deleteAnnouncement(a.id));

    top.append(title, del);

    const msg = document.createElement("p");
    msg.className =
      "text-sm text-gray-700 mt-1 whitespace-pre-wrap break-words";
    msg.textContent = a.message;

    const meta = document.createElement("div");
    meta.className = "flex items-center gap-2 mt-2";

    const badge = document.createElement("span");
    badge.className =
      "px-2 py-0.5 rounded-full text-xs font-semibold " +
      (AUDIENCE_STYLE[a.audience] || "");
    badge.textContent = AUDIENCE_LABEL[a.audience] || a.audience;

    const time = document.createElement("span");
    time.className = "text-xs text-gray-400";
    time.textContent = formatTime(a.createdAt);

    meta.append(badge, time);
    li.append(top, msg, meta);
    ul.appendChild(li);
  });
}

async function loadAnnouncements() {
  try {
    renderAnnouncements(await getJson("/api/announcements"));
  } catch (err) {
    console.error("Announcements failed", err);
  }
}

async function postAnnouncement() {
  const audience = document.getElementById("annAudience").value;
  const title = document.getElementById("annTitle").value.trim();
  const message = document.getElementById("annMessage").value.trim();

  if (!audience) return showMsg("Please choose an audience.", false);
  if (!title) return showMsg("Please enter a title.", false);
  if (!message) return showMsg("Please write the announcement.", false);

  const btn = document.getElementById("annPost");
  btn.disabled = true;

  try {
    const res = await apiFetch("/api/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ audience, title, message }),
    });

    if (!res.ok) {
      showMsg((await res.text()) || "Could not post announcement.", false);
      return;
    }

    document.getElementById("annAudience").value = "";
    document.getElementById("annTitle").value = "";
    document.getElementById("annMessage").value = "";
    showMsg("Announcement posted.", true);

    loadAnnouncements();
    loadStats();
  } catch (err) {
    console.error(err);
    showMsg("Something went wrong. Please try again.", false);
  } finally {
    btn.disabled = false;
  }
}

async function deleteAnnouncement(id) {
  if (!confirm("Delete this announcement?")) return;
  try {
    const res = await apiFetch("/api/announcements/" + id, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Delete failed");
    loadAnnouncements();
    loadStats();
  } catch (err) {
    console.error(err);
    alert("Could not delete the announcement.");
  }
}

document.getElementById("annPost").addEventListener("click", postAnnouncement);
loadStats();
loadAnnouncements();
