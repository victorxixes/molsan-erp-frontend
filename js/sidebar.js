/* ============================================================
   SIDEBAR — Glass Luxe 2027 (Premium + Persistente + Motion)
============================================================ */

function aplicarEstadoSidebar(colapsado) {
    const sidebar = document.querySelector(".sidebar");
    const toggleBtn = document.getElementById("sidebarToggle");
    const body = document.body;

    if (!sidebar || !toggleBtn) {
        console.warn("⚠️ Sidebar no encontrado en el DOM.");
        return;
    }

    /* ============================================================
       ESTADO: COLAPSADO
    ============================================================ */
    if (colapsado) {

        sidebar.classList.add("collapsed");
        body.classList.add("sidebar-collapsed");

        // Icono menú (abrir)
        toggleBtn.innerHTML = `
            <svg class="icon"><use href="#icon-menu"></use></svg>
        `;

        localStorage.setItem("molsan_sidebar", "collapsed");

    } else {

        /* ============================================================
           ESTADO: EXPANDIDO
        ============================================================ */
        sidebar.classList.remove("collapsed");
        body.classList.remove("sidebar-collapsed");

        // Icono cerrar (colapsar)
        toggleBtn.innerHTML = `
            <svg class="icon"><use href="#icon-close"></use></svg>
        `;

        localStorage.setItem("molsan_sidebar", "expanded");
    }

    /* ============================================================
       NOTIFICAR A TOOLTIP + LAYOUT ENGINE
    ============================================================ */
    document.dispatchEvent(new Event("sidebarChanged"));
}
