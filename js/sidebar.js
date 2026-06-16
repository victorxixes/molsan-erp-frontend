/* ============================================================
   SIDEBAR — Glass Luxe 2027
============================================================ */

function aplicarEstadoSidebar(colapsado) {
    const sidebar = document.querySelector(".sidebar");
    const toggleBtn = document.getElementById("sidebarToggle");
    const body = document.body;

    if (colapsado) {
        sidebar.classList.add("collapsed");
        body.classList.add("sidebar-collapsed");
        toggleBtn.textContent = "☰";
    } else {
        sidebar.classList.remove("collapsed");
        body.classList.remove("sidebar-collapsed");
        toggleBtn.textContent = "✖";
    }
}
