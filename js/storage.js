/* ============================================================
   STORAGE — Glass Luxe 2027 (localStorage)
============================================================ */

const STORAGE_KEY_FIRMAS = "molsan_firmas";

async function cargarHistorico() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY_FIRMAS) || "[]";
        const datos = JSON.parse(raw);
        if (!Array.isArray(datos)) return [];
        return datos;
    } catch (e) {
        console.warn("cargarHistorico: error parseando datos", e);
        return [];
    }
}

async function guardarHistorico(filas) {
    try {
        if (!Array.isArray(filas)) {
            console.warn("guardarHistorico: filas no es array");
            return;
        }
        localStorage.setItem(STORAGE_KEY_FIRMAS, JSON.stringify(filas));
    } catch (e) {
        console.error("guardarHistorico: error guardando datos", e);
    }
}
