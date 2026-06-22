/* ============================================================
   MOLSAN ERP — GLASS LUXE 2027
   MOTOR PRINCIPAL DE MÓDULOS + Motion 2027 + UX Premium
============================================================ */

async function cargarModulo(nombre) {

    /* ============================================================
       1. MARCAR ITEM ACTIVO EN SIDEBAR
    ============================================================ */
    document.querySelectorAll(".menu-item").forEach(i => i.classList.remove("active"));

    const item = [...document.querySelectorAll(".menu-item")]
        .find(i => i.getAttribute("onclick")?.includes(nombre));

    if (item) item.classList.add("active");


    /* ============================================================
       2. OBTENER PLANTILLA Y CONTENEDOR
    ============================================================ */
    const tpl = document.getElementById(`tpl-${nombre}`);
    const cont = document.getElementById("module-container");
    const title = document.getElementById("module-title");

    if (!tpl || !cont) {
        console.error("❌ No se encontró el módulo:", nombre);
        return;
    }


    /* ============================================================
       3. EFECTO DE TRANSICIÓN (Motion 2027)
    ============================================================ */
    cont.classList.remove("fadeUp");
    cont.style.opacity = 0;

    setTimeout(() => {
        cont.innerHTML = "";
        cont.appendChild(tpl.content.cloneNode(true));
        cont.classList.add("fadeUp");
        cont.style.opacity = 1;
    }, 80);


    /* ============================================================
       4. TÍTULOS BONITOS
    ============================================================ */
    if (title) {
        const nombresBonitos = {
            "dashboard": "Dashboard",
            "listado": "Listado de Firmas",
            "uploader": "Importación de Excel",
            "permisos": "Permisos del Sistema",
            "backup": "Backup de Datos",
            "restore": "Restauración de Backups",
            "informes-premium": "Informes Premium",
            "informes-dinamicos": "Informes Dinámicos",

            // Paneles Premium
            "panel-anual": "Panel Anual",
            "panel-mensual": "Panel Mensual",
            "panel-apoderados": "Panel Apoderados",
            "panel-tipo-firma": "Panel Tipo de Firma",
            "panel-tipo-gestion": "Panel Tipo de Gestión",
            "panel-oficinas": "Panel Oficinas",
            "panel-circuito": "Panel Circuito Notarial",
            "panel-sla": "Panel SLA / Tiempos"
        };

        title.textContent = nombresBonitos[nombre] || nombre;
    }


    /* ============================================================
       5. INICIALIZAR MÓDULO
    ============================================================ */
    try {
        switch (nombre) {

            case "dashboard":
                setTimeout(() => initDashboard(), 0);
                break;

            case "listado":
                await initListado();
                break;

            case "uploader":
                initUploader();
                break;

            case "permisos":
                initPermisos();
                break;

            case "backup":
                await initBackup();
                break;

            case "restore":
                await initRestore();
                break;

            case "informes-premium":
                await initInformesPremium();
                break;

            case "informes-dinamicos":
                await initInformesDinamicos();
                break;

            /* ==========================
               PANELES PREMIUM
            ========================== */
            case "panel-anual":
                await initPanelAnual();
                break;

            case "panel-mensual":
                await initPanelMensual();
                break;

            case "panel-apoderados":
                await initPanelApoderados();
                break;

            case "panel-tipo-firma":
                await initPanelTipoFirma();
                break;

            case "panel-tipo-gestion":
                await initPanelTipoGestion();
                break;

            case "panel-oficinas":
                await initPanelOficinas();
                break;

            case "panel-circuito":
                await initPanelCircuito();
                break;

            case "panel-sla":
                await initPanelSLA();
                break;
        }

    } catch (err) {

        console.error("❌ Error cargando módulo:", nombre, err);

        cont.innerHTML = `
            <div class="card-glass error-box fadeUp">
                <h3>Error cargando el módulo</h3>
                <p>${err.message}</p>
            </div>
        `;
    }


    /* ============================================================
       6. APLICAR PERMISOS
    ============================================================ */
    aplicarPermisos();
}


/* ============================================================
   INICIALIZACIÓN GLOBAL — GLASS LUXE 2027
============================================================ */
window.addEventListener("DOMContentLoaded", async () => {

    // 1) IndexedDB
    await initDB();

    // 2) Estado del sidebar
    const estado = localStorage.getItem("molsan_sidebar") === "collapsed";
    aplicarEstadoSidebar(estado);

    // 3) Cargar Dashboard al inicio
    cargarModulo("dashboard");
});
