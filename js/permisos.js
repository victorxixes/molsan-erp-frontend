/* ============================================================
   PERMISOS MOLSAN — Glass Luxe 2027
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

    if (!permisos.importar) {
        const btn = document.getElementById("btnImportar");
        if (btn) btn.disabled = true;
        window.permitirImportar = false;
    } else {
        window.permitirImportar = true;
    }

    window.permitirBorrado = !!permisos.borrar;

    if (!permisos.restaurar) {
        ["btnRestaurarBackup", "btnRestaurar", "btnVistaPrevia"].forEach(id => {
            const b = document.getElementById(id);
            if (b) b && (b.disabled = true);
        });
        window.permitirRestore = false;
    } else {
        window.permitirRestore = true;
    }

    if (!permisos.mapas) {
        document.querySelectorAll(".config-textarea").forEach(t => t.disabled = true);
        document.querySelectorAll("[data-mapa]").forEach(b => b.disabled = true);
        window.permitirMapas = false;
    } else {
        window.permitirMapas = true;
    }

    if (!permisos.exportar) {
        ["btnExportarCSV", "btnExportarJSON"].forEach(id => {
            const b = document.getElementById(id);
            if (b) b.disabled = true;
        });
        window.permitirExportar = false;
    } else {
        window.permitirExportar = true;
    }

    mostrarAvisoPermisos(permisos);
}

function mostrarAvisoPermisos(permisos) {
    const aviso = document.getElementById("avisoPermisos");
    if (!aviso) return;

    const bloqueados = [];

    if (!permisos.importar) bloqueados.push("Importar datos");
    if (!permisos.borrar) bloqueados.push("Borrar datos");
    if (!permisos.restaurar) bloqueados.push("Restaurar backups");
    if (!permisos.mapas) bloqueados.push("Editar mapas");
    if (!permisos.exportar) bloqueados.push("Exportar datos");

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

function guardarPermisos() {
    const permisos = {
        importar: document.getElementById("permImportar")?.checked || false,
        borrar: document.getElementById("permBorrar")?.checked || false,
        restaurar: document.getElementById("permRestaurar")?.checked || false,
        mapas: document.getElementById("permMapas")?.checked || false,
        exportar: document.getElementById("permExportar")?.checked || false,
        verTodo: true
    };

    localStorage.setItem("molsan_permisos", JSON.stringify(permisos));
    alert("Permisos guardados correctamente.");
}

function initPermisos() {
    const permisos = JSON.parse(localStorage.getItem("molsan_permisos") || "{}");

    const map = {
        permImportar: "importar",
        permBorrar: "borrar",
        permRestaurar: "restaurar",
        permMapas: "mapas",
        permExportar: "exportar"
    };

    Object.entries(map).forEach(([id, key]) => {
        const el = document.getElementById(id);
        if (el) el.checked = !!permisos[key];
    });
}
