/* ============================================================
   CONFIGURACIÓN — MOLSAN GLASS LUXE 2027 (Sin Mapas)
============================================================ */

function initConfiguracion() {

    // Solo permisos (lo único que sigue existiendo)
    aplicarPermisos();

    console.log("Configuración inicializada (sin mapas).");
}

/* ============================================================
   GUARDAR PERMISOS
============================================================ */
function guardarPermisos() {
    const permisos = {
        importar: document.getElementById("permImportar")?.checked || false,
        borrar: document.getElementById("permBorrar")?.checked || false,
        restaurar: document.getElementById("permRestaurar")?.checked || false,
        mapas: false, // mapas eliminados
        exportar: document.getElementById("permExportar")?.checked || false,
        verTodo: document.getElementById("permVerTodo")?.checked || false
    };

    localStorage.setItem("molsan_permisos", JSON.stringify(permisos));
    alert("Permisos guardados correctamente.");
}

/* ============================================================
   INICIALIZAR PÁGINA DE PERMISOS
============================================================ */
function initPermisos() {
    const permisos = JSON.parse(localStorage.getItem("molsan_permisos") || "{}");

    const map = {
        permImportar: "importar",
        permBorrar: "borrar",
        permRestaurar: "restaurar",
        permExportar: "exportar",
        permVerTodo: "verTodo"
    };

    Object.entries(map).forEach(([id, key]) => {
        const el = document.getElementById(id);
        if (el) el.checked = !!permisos[key];
    });
}
