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
            "informes-premium": "Informes Premium"
        };
        title.textContent = nombresBonitos[nombre] || nombre;
    }

    // Inicializar módulo
    try {
        switch (nombre) {
            case "dashboard":
                await initDashboard();
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

    // Aplicar permisos después de cargar el módulo
    aplicarPermisos();
}

/* ============================================================
   INICIALIZACIÓN GLOBAL — CORREGIDA
============================================================ */
window.addEventListener("DOMContentLoaded", async () => {

    // 1) Esperar a que IndexedDB esté listo
    await initDB();

    // 2) Restaurar estado del sidebar
    const estado = localStorage.getItem("molsan_sidebar") === "collapsed";
    aplicarEstadoSidebar(estado);

    // 3) Cargar módulo inicial
    cargarModulo("dashboard");
});
