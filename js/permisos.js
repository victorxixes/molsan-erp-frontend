/* ============================================================
   PERMISOS MOLSAN — Glass Luxe 2027 (Compatibilidad Total)
============================================================ */

function aplicarPermisos() {
    let permisos = {};

    try {
        permisos = JSON.parse(localStorage.getItem("molsan_permisos") || "{}");
    } catch {
        console.warn("Permisos corruptos, permitiendo todo.");
        return;
    }

    if (!permisos || Object.keys(permisos).length === 0) return;

    /* ============================================================
       IMPORTAR
    ============================================================= */
    if (!permisos.importar) {
        document.getElementById("btnImportar")?.setAttribute("disabled", true);
        document.getElementById("excelFile")?.setAttribute("disabled", true);
        window.permitirImportar = false;
    } else {
        window.permitirImportar = true;
    }

    /* ============================================================
       BORRAR (si lo usas en el futuro)
    ============================================================= */
    window.permitirBorrado = !!permisos.borrar;

    /* ============================================================
       RESTAURAR BACKUPS
    ============================================================= */
    if (!permisos.restaurar) {
        ["btnVistaPrevia", "btnRestaurar", "btnCancelar"].forEach(id => {
            document.getElementById(id)?.setAttribute("disabled", true);
        });
        window.permitirRestore = false;
    } else {
        window.permitirRestore = true;
    }

    /* ============================================================
       MAPAS (configuración avanzada)
    ============================================================= */
    if (!permisos.mapas) {
        document.querySelectorAll(".config-textarea").forEach(t => t.disabled = true);
        document.querySelectorAll("[data-mapa]").forEach(b => b.disabled = true);
        window.permitirMapas = false;
    } else {
        window.permitirMapas = true;
    }

    /* ============================================================
       EXPORTAR (CSV / JSON)
    ============================================================= */
    if (!permisos.exportar) {
        ["btnExportarCSV", "btnExportarJSON"].forEach(id => {
            document.getElementById(id)?.setAttribute("disabled", true);
        });
        window.permitirExportar = false;
    } else {
        window.permitirExportar = true;
    }

    /* ============================================================
       INFORMES PREMIUM
    ============================================================= */
    if (!permisos.verTodo) {
        document.querySelectorAll(".btn-inf").forEach(btn => btn.disabled = true);
    }

    mostrarAvisoPermisos(permisos);
}

/* ============================================================
   AVISO VISUAL
============================================================ */
function mostrarAvisoPermisos(permisos) {
    const aviso = document.getElementById("avisoPermisos");
    if (!aviso) return;

    const bloqueados = [];

    if (!permisos.importar) bloqueados.push("Importar datos");
    if (!permisos.borrar) bloqueados.push("Borrar datos");
    if (!permisos.restaurar) bloqueados.push("Restaurar backups");
    if (!permisos.mapas) bloqueados.push("Editar mapas");
    if (!permisos.exportar) bloqueados.push("Exportar datos");
    if (!permisos.verTodo) bloqueados.push("Ver informes premium");

    if (bloqueados.length === 0) {
        aviso.style.display = "none";
        return;
    }

    aviso.innerHTML = `
        <div class="card-glass" style="margin-bottom:15px;">
            <strong>Permisos limitados:</strong><br>
            ${bloqueados.join("<br>")}
        </div>
    `;
    aviso.style.display = "block";
}

/* ============================================================
   GUARDAR PERMISOS
============================================================ */
function guardarPermisos() {
    const permisos = {
        importar: document.getElementById("permImportar")?.checked || false,
        borrar: document.getElementById("permBorrar")?.checked || false,
        restaurar: document.getElementById("permRestaurar")?.checked || false,
        mapas: document.getElementById("permMapas")?.checked || false,
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
        permMapas: "mapas",
        permExportar: "exportar",
        permVerTodo: "verTodo"
    };

    Object.entries(map).forEach(([id, key]) => {
        const el = document.getElementById(id);
        if (el) el.checked = !!permisos[key];
    });
}
