/* ============================================================
   BACKUP — GLASS LUXE 2027
============================================================ */

const STORAGE_KEY_BACKUP = "molsan_backup";

async function initBackup() {
    const btn = document.getElementById("btnHacerBackup");
    const info = document.getElementById("backupInfo");

    if (!btn || !info) return;

    btn.onclick = async () => {
        const datos = await cargarHistorico();
        localStorage.setItem(STORAGE_KEY_BACKUP, JSON.stringify({
            fecha: new Date().toISOString(),
            datos
        }));
        info.textContent = `Backup creado con ${datos.length} registros.`;
    };

    const raw = localStorage.getItem(STORAGE_KEY_BACKUP);
    if (raw) {
        const b = JSON.parse(raw);
        info.textContent = `Último backup: ${b.fecha} (${(b.datos || []).length} registros)`;
    } else {
        info.textContent = "No hay backups.";
    }
}

async function initRestore() {
    const btn = document.getElementById("btnRestaurarBackup");
    if (!btn) return;

    btn.onclick = async () => {
        const raw = localStorage.getItem(STORAGE_KEY_BACKUP);
        if (!raw) {
            alert("No hay backup para restaurar.");
            return;
        }
        const b = JSON.parse(raw);
        await guardarHistorico(b.datos || []);
        await recalcularKPIs();
        alert("Backup restaurado.");
        await initDashboard();
    };
}
