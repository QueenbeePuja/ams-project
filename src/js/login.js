const buttons = document.querySelectorAll(".role-btn");

const roleInput = document.getElementById("role");
const userIdInput = document.getElementById("userid");
const form = document.querySelector("form");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
const loginMessage = document.getElementById("loginMessage");
const defaultMessage = loginMessage.textContent;

const placeholderMap = {
  Admin: "User ID",
  Faculty: "Faculty ID",
  Student: "Registration ID",
};

// default role
setRole("Student");

buttons.forEach((button) => {
  button.addEventListener("click", () => {
    const role = button.textContent.trim();
    setRole(role);
  });
});

form.addEventListener("submit", async function (event) {
  event.preventDefault(); // prevents page reload

  const validations = [
    { value: userIdInput.value.trim(), message: "Please enter your ID." },
    {
      value: passwordInput.value.trim(),
      message: "Please enter your password.",
    },
  ];

  for (const rule of validations) {
    if (!rule.value) {
      alert(rule.message);
      return;
    }
  }

  // clear old session data but keep the saved backend address
  const keepApi = localStorage.getItem("apiBase");
  localStorage.clear();
  if (keepApi) localStorage.setItem("apiBase", keepApi);

  const data = {
    userId: userIdInput.value.trim(),
    password: passwordInput.value.trim(),
  };

  // show progress; the free server can take up to 2 minutes to wake up
  loginBtn.disabled = true;
  loginBtn.style.opacity = "0.6";
  loginBtn.textContent = "SIGNING IN...";
  const wakeTimer = setTimeout(() => {
    loginMessage.textContent =
      "Waking up the free server, this can take up to 2 minutes...";
  }, 4000);

  try {
    const response = await apiFetch("/api/login", {
      method: "POST",
      body: JSON.stringify(data),
    });

    const raw = await response.text();
    let result;
    try {
      result = JSON.parse(raw);
    } catch (e) {
      result = raw;
    }

    if (response.ok && result && result.token) {
      localStorage.setItem("token", result.token);
      localStorage.setItem("userId", result.userId);
      localStorage.setItem("studentId", result.id);
      localStorage.setItem("role", result.role);

      // clear old data
      localStorage.removeItem("fullName");
      localStorage.removeItem("email");
      localStorage.removeItem("department");

      if (result.role == "Admin") {
        window.location.href = "../pages/today_admin.html";
      } else if (result.role == "Faculty") {
        localStorage.setItem("facultyId", result.facultyId);
        window.location.href = "../pages/today_faculty.html";
      } else {
        window.location.href = "../pages/today_student.html";
      }
    } else {
      alert(
        typeof result === "string" && result
          ? result
          : "Login failed. Please check your ID and password.",
      );
    }
  } catch (error) {
    console.error("Login Error:", error);
    alert("Login failed - check network/backend");
  } finally {
    clearTimeout(wakeTimer);
    loginBtn.disabled = false;
    loginBtn.style.opacity = "";
    loginBtn.textContent = "LOGIN";
    loginMessage.textContent = defaultMessage;
  }
});

function setRole(role) {
  roleInput.value = role;
  userIdInput.placeholder = placeholderMap[role];

  buttons.forEach((btn) => {
    btn.classList.remove("bg-yellow-500");
    btn.classList.add("bg-yellow-700/70");
  });

  const selectedButton = [...buttons].find(
    (btn) => btn.textContent.trim() === role,
  );

  if (selectedButton) {
    selectedButton.classList.remove("bg-yellow-700/70");
    selectedButton.classList.add("bg-yellow-500");
  }
}
