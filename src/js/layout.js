async function loadComponent(elementId, filePath) {
  const res = await fetch(filePath);
  const html = await res.text();
  document.getElementById(elementId).innerHTML = html;

  if (window.feather) {
    feather.replace();
  }
}

async function initLayout() {
  await loadComponent("sidebar", "../component/sidebar.html");
  await loadComponent("navbar", "../component/navbar.html");
}

initLayout();
