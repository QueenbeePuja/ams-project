function toggleForm() {
  const form = document.getElementById("batchForm");
  form.classList.toggle("hidden");
}

function generateStudents() {
  const count = document.getElementById("studentCount").value;
  const table = document.getElementById("studentsTable");

  table.innerHTML = "";

  for (let i = 1; i <= count; i++) {
    table.innerHTML += `
      <tr class="border-b">
        <td class="py-2">
          <input type="text" class="reg border rounded p-1 w-full" placeholder="Reg No">
        </td>

        <td>
          <input type="text" class="name border rounded p-1 w-full" placeholder="Full Name">
        </td>

        <td>
          <input type="email" class="email border rounded p-1 w-full" placeholder="Email">
        </td>

        <td>
          <input type="text" class="dept border rounded p-1 w-full" placeholder="Department (MCA)">
        </td>

        <td>
          <input type="number" class="sem border rounded p-1 w-full" placeholder="Semester">
        </td>
      </tr>
    `;
  }

  document.getElementById("studentsTableContainer").classList.remove("hidden");
}
async function submitStudents() {
  const rows = document.querySelectorAll("#studentsTable tr");
  const token = localStorage.getItem("token");

  for (let row of rows) {
    const data = {
      userId: row.querySelector(".reg").value.trim(),
      fullName: row.querySelector(".name").value.trim(),
      collegeEmail: row.querySelector(".email").value.trim(),
      department: row.querySelector(".dept").value.trim(),
      currentSemester: parseInt(row.querySelector(".sem").value),
    };

    try {
      const response = await fetch("http://localhost:8081/api/admin/students", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error(result);
      }
    } catch (err) {
      console.error(err);
    }
  }

  alert("Students added successfully");
  // Clear table
  document.getElementById("studentsTable").innerHTML = "";

  // Hide table container
  document.getElementById("studentsTableContainer").classList.add("hidden");

  // Reset student count input
  document.getElementById("studentCount").value = "";
  fetchStudents();
}
async function fetchStudents() {
  try {
    const token = localStorage.getItem("token");
    const response = await fetch("http://localhost:8081/api/admin/students", {
      method: "GET",
      headers: {
        Authorization: "Bearer " + token,
        "Content-Type": "applocation/json",
      },
    });
    const students = await response.json();

    const tableBody = document.getElementById("studentTableBody");
    tableBody.innerHTML = "";

    students.forEach((student) => {
      const row = `
        <tr class="border-b hover:bg-gray-50">
          <td class="py-3">${student.userId}</td>
          <td>${student.fullName}</td>
          <td>${student.collegeEmail}</td>
          <td>${student.currentSemester}</td>
          <td class="flex gap-3 py-3">
            <button class="text-blue-600 hover:underline">Edit</button>
            <button onclick="deleteStudent('${student.userId}')" class="text-red-600 hover:underline">Delete</button>
          </td>
        </tr>
      `;
      tableBody.innerHTML += row;
    });
  } catch (error) {
    console.error("Error fetching students: ", error);
  }
}
async function deleteStudent(userId) {
  try {
    const token = localStorage.getItem("token");
    const response = await fetch(
      `http://localhost:8081/api/admin/students/user/${userId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: "Bearer " + token,
        },
      },
    );
    if (response.ok) {
      alert("Student deleted successfully");

      // 🔥 refresh table
      fetchStudents();
    } else {
      console.error("Delete failed");
    }
  } catch (error) {
    console.error("Error in deleting student:", error);
  }
}
window.onload = fetchStudents;
