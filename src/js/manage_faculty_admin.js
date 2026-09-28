function toggleFacultyForm() {
  const form = document.getElementById("facultyForm");
  form.classList.toggle("hidden");
}
async function addFaculty() {
  try {
    const token = localStorage.getItem("token");

    const data = {
      userId: document.getElementById("facultyId").value.trim(),
      fullName: document.getElementById("facultyName").value.trim(),
      collegeEmail: document.getElementById("facultyEmail").value.trim(),
      department: document.getElementById("facultyDept").value,
    };

    const response = await apiFetch("/api/admin/faculty", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      alert("Faculty added successfully");

      // 🔥 refresh table
      fetchFaculty();

      // 🔥 reset form
      document.getElementById("facultyName").value = "";
      document.getElementById("facultyId").value = "";
      document.getElementById("facultyEmail").value = "";

      // 🔥 hide form
      document.getElementById("facultyForm").classList.add("hidden");
    }
  } catch (error) {
    console.error("Error adding faculty:", error);
  }
}
async function deleteFaculty(userId) {
  try {
    const token = localStorage.getItem("token");

    const response = await apiFetch(`/api/admin/faculty/user/${userId}`, {
      method: "DELETE",
      headers: {
        Authorization: "Bearer " + token,
      },
    });

    if (response.ok) {
      alert("Faculty deleted successfully");

      // 🔥 refresh table
      fetchFaculty();
    }
  } catch (error) {
    console.error("Error deleting faculty:", error);
  }
}

async function fetchFaculty() {
  try {
    const token = localStorage.getItem("token");

    const response = await apiFetch("/api/admin/faculty", {
      method: "GET",
      headers: {
        Authorization: "Bearer " + token,
        "Content-Type": "application/json",
      },
    });

    const facultyList = await response.json();

    const tableBody = document.getElementById("facultyTableBody");
    tableBody.innerHTML = "";

    facultyList.forEach((faculty) => {
      const row = `
        <tr class="border-b hover:bg-gray-50">
          <td class="py-3">${faculty.userId}</td>
          <td>${faculty.fullName}</td>
          <td>${faculty.collegeEmail}</td>
          <td>${faculty.department}</td>
          <td class="flex gap-3 py-3">
            <button class="text-blue-600 hover:underline">Edit</button>
            <button onclick="deleteFaculty('${faculty.userId}')" class="text-red-600 hover:underline">Delete</button>
          </td>
        </tr>
      `;
      tableBody.innerHTML += row;
    });
  } catch (error) {
    console.error("Error fetching faculty:", error);
  }
}
window.onload = fetchFaculty;
