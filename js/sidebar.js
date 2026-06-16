/* ============================================================
   SIDEBAR — Glass Luxe 2027 (Premium + Persistente)
============================================================ */

function aplicarEstadoSidebar(colapsado) {
    const sidebar = document.querySelector(".sidebar");
    const toggleBtn = document.getElementById("sidebarToggle");
    const body = document.body;

    if (!sidebar || !toggleBtn) {
        console.warn("Sidebar no encontrado en el DOM.");
        return;
    }

    if (colapsado) {
        sidebar.classList.add("collapsed");
        body.classList.add("sidebar-collapsed");

        toggleBtn.innerHTML = `
            <svg class="icon"><use href="#icon-menu"></use></svg>
        `;

        localStorage.setItem("molsan_sidebar", "collapsed");

    } else {
        sidebar.classList.remove("collapsed");
        body.classList.remove("sidebar-collapsed");

        toggleBtn.innerHTML = `
            <svg class="icon"><use href="#icon-close"></use></svg>
        `;

        localStorage.setItem("molsan_sidebar", "expanded");
    }

    // Notificar a tooltips premium
    document.dispatchEvent(new Event("sidebarChanged"));
}
