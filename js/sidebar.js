/* ============================================================
   SIDEBAR — Glass Luxe 2027 (Premium + Persistente + Motion)
============================================================ */

window.addEventListener("DOMContentLoaded", () => {

    const sidebar = document.querySelector(".sidebar");
    const toggleBtn = document.getElementById("sidebarToggle");

    if (!sidebar || !toggleBtn) {
        console.warn("⚠️ Sidebar no encontrado en el DOM.");
        return;
    }

    // Evento del botón
    toggleBtn.addEventListener("click", () => {
        const estadoActual = sidebar.classList.contains("collapsed");
        aplicarEstadoSidebar(!estadoActual);
    });
});


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

