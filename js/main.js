/* ============================================================
   MOLSAN ERP — GLASS LUXE 2027
   MOTOR PRINCIPAL DE MÓDULOS
============================================================ */

async function cargarModulo(nombre) {

    // Quitar selección previa
    document.querySelectorAll(".menu-item").forEach(i => i.classList.remove("active"));

    // Activar el menú actual
    const item = [...document.querySelectorAll(".menu-item")]
        .find(i => i.getAttribute("onclick")?.includes(nombre));
    if (item) item.classList.add("active");

    // Cargar plantilla
    const tpl = document.getElementById(`tpl-${nombre}`);
    const cont = document.getElementById("module-container");
    const title = document.getElementById("module-title");

    if (!tpl || !cont) {
        console.error("No se encontró el módulo:", nombre);
        return;
    }

    cont.innerHTML = "";
    cont.appendChild(tpl.content.cloneNode(true));

    // Títulos bonitos
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

            // 🔹 NUEVOS PANELES
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

    // Inicializar módulo
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
               NUEVOS PANELES PREMIUM
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
        console.error("Error cargando módulo:", nombre, err);
        cont.innerHTML = `
            <div class="card-glass error-box">
                <h3>Error cargando el módulo</h3>
                <p>${err.message}</p>
            </div>
        `;
    }

    aplicarPermisos();
}

/* ============================================================
   INICIALIZACIÓN GLOBAL — CORREGIDA
============================================================ */
window.addEventListener("DOMContentLoaded", async () => {

    await initDB();

    const estado = localStorage.getItem("molsan_sidebar") === "collapsed";
    aplicarEstadoSidebar(estado);

    cargarModulo("dashboard"); // ✔ Cargar Dashboard al inicio
});
