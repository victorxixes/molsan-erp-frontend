/* ============================================================
   BACKUP — GLASS LUXE 2027 (IndexedDB + KPIs + Descarga JSON)
============================================================ */

function initBackup() {
    document.getElementById("btnHacerBackup")?.addEventListener("click", generarBackup);
    mostrarInfoBackup();
}

/* ============================================================
   GENERAR BACKUP COMPLETO
============================================================ */
async function generarBackup() {
    const info = document.getElementById("backupInfo");

    const datos = await obtenerFirmas(); // ← IndexedDB
    const kpis = obtenerKPIs();          // ← KPIs actuales

    const backup = {
        fecha: new Date().toISOString(),
        total_registros: datos.length,
        datos,
        kpis
    };

    // Guardar copia local (opcional)
    localStorage.setItem("molsan_backup", JSON.stringify(backup));

    // Descargar archivo JSON
    descargarJSON(backup, `backup_molsan_${Date.now()}.json`);

    if (info) {
        info.textContent = `Backup creado: ${datos.length} registros — ${new Date().toLocaleString("es-ES")}`;
    }
}

/* ============================================================
   MOSTRAR INFO DEL ÚLTIMO BACKUP
============================================================ */
function mostrarInfoBackup() {
    const info = document.getElementById("backupInfo");
    if (!info) return;

    const raw = localStorage.getItem("molsan_backup");

    if (!raw) {
        info.textContent = "No hay backups.";
        return;
    }

    const b = JSON.parse(raw);

    info.textContent = `Último backup: ${new Date(b.fecha).toLocaleString("es-ES")} — ${b.total_registros} registros`;
}

/* ============================================================
   DESCARGAR JSON
============================================================ */
function descargarJSON(obj, nombre) {
    const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = nombre;
    a.click();

    URL.revokeObjectURL(url);
}
