/* ============================================================
   RESTORE — GLASS LUXE 2027 (IndexedDB + Preview + Progreso)
============================================================ */

let backupTemporal = null;
let restaurando = false;

/* ============================================================
   INICIALIZAR MÓDULO
============================================================ */
function initRestore() {
    document.getElementById("btnVistaPrevia")?.addEventListener("click", vistaPreviaBackup);
    document.getElementById("btnRestaurar")?.addEventListener("click", confirmarRestauracion);
    document.getElementById("btnCancelar")?.addEventListener("click", cancelarRestauracion);
}

/* ============================================================
   VISTA PREVIA DEL BACKUP
============================================================ */
function vistaPreviaBackup() {
    const file = document.getElementById("restoreFile").files[0];
    if (!file) return alert("Selecciona un archivo JSON primero.");

    const reader = new FileReader();
    reader.onload = (e) => {
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
    return (
        b &&
        typeof b === "object" &&
        Array.isArray(b.datos) &&
        typeof b.kpis === "object" &&
        typeof b.total_registros === "number"
    );
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
    if (!backupTemporal) return alert("No hay backup cargado.");
    if (restaurando) return alert("Ya se está restaurando un backup.");

    if (!confirm("¿Seguro que quieres restaurar este backup? Se perderán los datos actuales.")) {
        return;
    }

    restaurando = true;
    restaurarBackup();
}

/* ============================================================
   RESTAURAR BACKUP (IndexedDB + Progreso)
============================================================ */
async function restaurarBackup() {
    try {
        // 1. Borrar DB
        await borrarFirmas();

        // 2. Insertar datos en lotes
        const lote = 500;
        let procesadas = 0;

        for (let i = 0; i < backupTemporal.datos.length; i += lote) {
            const chunk = backupTemporal.datos.slice(i, i + lote);
            await guardarFirmas(chunk);

            procesadas += chunk.length;
            actualizarProgresoRestore(procesadas, backupTemporal.datos.length);
        }

        // 3. Restaurar KPIs
        localStorage.setItem("molsan_kpis", JSON.stringify(backupTemporal.kpis));

        alert("Backup restaurado correctamente.");
        cancelarRestauracion();

    } catch (err) {
        console.error("Error restaurando backup:", err);
        alert("Error durante la restauración.");
    }

    restaurando = false;
}

/* ============================================================
   PROGRESO VISUAL
============================================================ */
function actualizarProgresoRestore(actual, total) {
    const barra = document.getElementById("restoreBarra");
    const texto = document.getElementById("restoreTexto");

    if (!barra || !texto) return;

    const pct = Math.round((actual / total) * 100);
    barra.style.width = pct + "%";
    texto.textContent = `Restaurando ${actual} / ${total} (${pct}%)`;
}

/* ============================================================
   CANCELAR
============================================================ */
function cancelarRestauracion() {
    document.getElementById("previewContainer").style.display = "none";
    backupTemporal = null;
}
