const buttons = document.querySelectorAll(".role-btn");

const roleInput = document.getElementById("role");
const userIdInput = document.getElementById("userid");
const form = document.querySelector("form");
const passwordInput = document.getElementById("password");

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
  event.preventDefault(); // 🚨 VERY IMPORTANT (prevents page reload)

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
  localStorage.clear();

  // 🔥 NEW PART (API CALL)
  const data = {
    userId: userIdInput.value.trim(),
    password: passwordInput.value.trim(),
  };
  console.log("📤 Sending:", data);

  try {
    const response = await apiFetch("/api/login", {
      method: "POST",
      body: JSON.stringify(data),
    });

    const result = await response.json();
    console.log("Server Response:", result);
    //alert("DEBUG: " + result);

    // this where "what happenes after login"
    if (response.ok && result.token) {
      localStorage.setItem("token", result.token);
      localStorage.setItem("userId", result.userId);
      localStorage.setItem("studentId", result.id);
      localStorage.setItem("role", result.role);

      // 🔥 CLEAR OLD DATA
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
      alert(result || "Login failed");
    }
  } catch (error) {
    console.error("Login Error:", error);
    alert("Login failed - check network/backend");
  }
});

function setRole(role) {
  // store role
  roleInput.value = role;

  // update placeholder
  userIdInput.placeholder = placeholderMap[role];

  // reset button colors
  buttons.forEach((btn) => {
    btn.classList.remove("bg-yellow-500");
    btn.classList.add("bg-yellow-700/70");
  });

  // highlight selected button
  const selectedButton = [...buttons].find(
    (btn) => btn.textContent.trim() === role,
  );

  if (selectedButton) {
    selectedButton.classList.remove("bg-yellow-700/70");
    selectedButton.classList.add("bg-yellow-500");
  }
}
