(function () {
  const AUDIENCE_LABEL = {
    FACULTY: "Faculty",
    STUDENTS: "Students",
    BOTH: "Everyone",
  };

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

  function render(list) {
    const ul = document.getElementById("announcementList");
    const empty = document.getElementById("announcementEmpty");
    ul.innerHTML = "";
    if (empty) empty.classList.toggle("hidden", list.length > 0);

    list.forEach((a) => {
      const li = document.createElement("li");
      li.className = "border-b last:border-0 pb-3";

      const title = document.createElement("p");
      title.className = "font-semibold text-[#283618]";
      title.textContent = a.title;

      const msg = document.createElement("p");
      msg.className =
        "text-sm text-gray-700 mt-1 whitespace-pre-wrap break-words";
      msg.textContent = a.message;

      const meta = document.createElement("p");
      meta.className = "text-xs text-gray-400 mt-1";
      meta.textContent = `${AUDIENCE_LABEL[a.audience] || ""} · ${formatTime(a.createdAt)}`;

      li.append(title, msg, meta);
      ul.appendChild(li);
    });
  }

  async function load() {
    const ul = document.getElementById("announcementList");
    if (!ul) return;

    try {
      const res = await apiFetch("/api/announcements");
      if (!res.ok) throw new Error("status " + res.status);
      render(await res.json());
    } catch (err) {
      console.error("Announcements failed", err);
      ul.innerHTML = "";
      const li = document.createElement("li");
      li.className = "text-sm text-gray-500";
      li.textContent = "Could not load announcements.";
      ul.appendChild(li);
    }
  }

  load();
  setInterval(load, 60000); // refresh every minute
})();
