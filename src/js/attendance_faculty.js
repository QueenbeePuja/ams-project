const startBtn = document.getElementById("startAttendance");
const sessionPanel = document.getElementById("attendanceSession");

startBtn.addEventListener("click", () => {
  sessionPanel.classList.remove("hidden");
});
