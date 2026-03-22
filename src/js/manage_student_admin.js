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
          <input type="text" class="border rounded p-1 w-full">
        </td>

        <td>
          <input type="text" class="border rounded p-1 w-full">
        </td>

        <td>
          <input type="email" class="border rounded p-1 w-full">
        </td>
      </tr>
    `;
  }

  document.getElementById("studentsTableContainer").classList.remove("hidden");
}
