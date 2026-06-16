/* ============================================================
   RESTORE — Restauración avanzada de backups (Glass Luxe 2027)
============================================================ */

let backupTemporal = null;
let restaurando = false;

/* ============================================================
   INICIALIZAR MÓDULO
============================================================ */
function initRestore() {
    const btnPreview = document.getElementById("btnVistaPrevia");
    const btnRestaurar = document.getElementById("btnRestaurar");
    const btnCancelar = document.getElementById("btnCancelar");

    if (btnPreview) btnPreview.onclick = vistaPreviaBackup;
    if (btnRestaurar) btnRestaurar.onclick = confirmarRestauracion;
    if (btnCancelar) btnCancelar.onclick = cancelarRestauracion;

    aplicarPermisos();
}

/* ============================================================
   VISTA PREVIA DEL BACKUP
============================================================ */
function vistaPreviaBackup() {
    const file = document.getElementById("restoreFile").files[0];
    if (!file) {
        alert("Selecciona un archivo JSON primero.");
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const json = JSON.parse(e.target.result);

            if (!validarEstructuraBackup(json)) {
                alert("El archivo no tiene la estructura correcta.");
                return;
            }

            backupTemporal = json;
            mostrarPreview();

        } catch (err) {
            console.error("Error leyendo backup:", err);
            alert("El archivo no es un JSON válido.");
        }
    };

    reader.readAsText(file);
}

/* ============================================================
   VALIDAR ESTRUCTURA DEL BACKUP
============================================================ */
function validarEstructuraBackup(b) {
    if (!b) return false;
    if (!b.fecha) return false;
    if (!b.datos || !Array.isArray(b.datos)) return false;
    if (!b.kpis || typeof b.kpis !== "object") return false;
    if (typeof b.total_registros !== "number") return false;
    return true;
}

/* ============================================================
   MOSTRAR PREVIEW
============================================================ */
function mostrarPreview() {
    if (!backupTemporal) return;

    document.getElementById("previewContainer").style.display = "block";

    document.getElementById("previewFecha").textContent =
        new Date(backupTemporal.fecha).toLocaleString("es-ES");

    document.getElementById("previewTotal").textContent =
        backupTemporal.total_registros.toLocaleString("es-ES");

    document.getElementById("previewMediaDias").textContent =
        backupTemporal.kpis.media_dias ?? "—";

    document.getElementById("previewPresencial").textContent =
        backupTemporal.kpis.por_tipo_firma?.Presencial ?? 0;

    document.getElementById("previewVC").textContent =
        backupTemporal.kpis.por_tipo_firma?.VideoConferencia ?? 0;

    const tbody = document.getElementById("previewTabla");
    tbody.innerHTML = "";

    backupTemporal.datos.slice(0, 20).forEach(fila => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${fila.expediente}</td>
            <td>${fila.oficina}</td>
            <td>${fila.fecha_protocolo}</td>
            <td>${(fila.nombre || "") + " " + (fila.apellidos || "")}</td>
            <td>${fila.circuito || ""}</td>
        `;
        tbody.appendChild(tr);
    });
}

/* ============================================================
   CONFIRMAR RESTAURACIÓN
============================================================ */
function confirmarRestauracion() {
    if (!backupTemporal) {
        alert("No hay backup cargado.");
        return;
    }

    if (restaurando) {
        alert("Ya se está restaurando un backup.");
        return;
    }

    if (!confirm("¿Seguro que quieres restaurar este backup? Se perderán los datos actuales.")) {
        return;
    }

    restaurando = true;
    restaurarBackup();
}

/* ============================================================
   RESTAURAR BACKUP (chunked)
============================================================ */
function restaurarBackup() {
    try {
        borrarTodo();

        const lote = 5000;
        let bloque = [];
        let index = 1;

        backupTemporal.datos.forEach(fila => {
            bloque.push(fila);

            if (bloque.length === lote) {
                guardarChunk(bloque, index);
                bloque = [];
                index++;
            }
        });

        if (bloque.length > 0) {
            guardarChunk(bloque, index);
        }

        // Restaurar KPIs
        localStorage.setItem("molsan_kpis", JSON.stringify(backupTemporal.kpis));

        // Reconstruir índices y KPIs
        construirIndices();
        recalcularKPIs();

        alert("Backup restaurado correctamente.");
        cancelarRestauracion();

    } catch (err) {
        console.error("Error restaurando backup:", err);
        alert("Error durante la restauración.");
    }

    restaurando = false;
}

/* ============================================================
   CANCELAR
============================================================ */
function cancelarRestauracion() {
    document.getElementById("previewContainer").style.display = "none";
    backupTemporal = null;
}
