/* ============================================================
   MOLSAN ERP — GLASS LUXE 2027
   MOTOR PRINCIPAL DE MÓDULOS
============================================================ */

function aplicarPermisosGlobal() {
    aplicarPermisos();
}

async function cargarModulo(nombre) {

    document.querySelectorAll(".menu-item").forEach(i => i.classList.remove("active"));

    const item = [...document.querySelectorAll(".menu-item")]
        .find(i => i.getAttribute("onclick")?.includes(nombre));
    if (item) item.classList.add("active");

    const tpl = document.getElementById(`tpl-${nombre}`);
    const cont = document.getElementById("module-container");
    const title = document.getElementById("module-title");

    if (!tpl || !cont) return;

    cont.innerHTML = "";
    cont.appendChild(tpl.content.cloneNode(true));
    if (title) title.textContent = nombre;

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

    aplicarPermisosGlobal();
}

window.addEventListener("DOMContentLoaded", () => {
    cargarModulo("dashboard");
});
