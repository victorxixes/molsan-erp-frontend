/* ============================================================
   DASHBOARD — GLASS LUXE 2027 (IndexedDB + KPIs reales)
============================================================ */

async function initDashboard() {
    console.log("📊 initDashboard() ejecutado");

    const datos = await obtenerFirmas(); // ← IndexedDB

    if (!datos || !datos.length) {
        console.warn("Dashboard: no hay datos cargados.");
        const dbg = document.getElementById("debugDashboard");
        if (dbg) dbg.textContent = "Sin datos en histórico.";
        return;
    }

    // Recalcular KPIs y obtenerlos
    await recalcularKPIs();
    const kpis = obtenerKPIs();

    actualizarKPIs(kpis, datos);
}

/* ============================================================
   PINTAR KPIS EN EL DASHBOARD
============================================================ */

function actualizarKPIs(kpis, datos) {

    // IDs REALES DEL HTML
    const elTotal = document.getElementById("kpiTotal");
    const elHoy = document.getElementById("kpiHoy");
    const elMedia = document.getElementById("kpiMedia");
    const elVC = document.getElementById("kpiVC");

    if (!elTotal || !elHoy || !elMedia || !elVC) {
        console.error("❌ No se encontraron los elementos KPI en el HTML");
        return;
    }

    // Total firmas
    elTotal.textContent = kpis.total_registros || 0;

    // Media días
    elMedia.textContent = kpis.media_dias || 0;

    // VC
    elVC.textContent = kpis.por_tipo_firma?.VideoConferencia ?? 0;

    // Firmas HOY (comparación correcta YYYY-MM-DD)
    const hoyISO = new Date().toISOString().split("T")[0];
    const firmasHoy = datos.filter(f => f.fecha_protocolo === hoyISO).length;

    elHoy.textContent = firmasHoy;

    // Debug opcional
    const dbg = document.getElementById("debugDashboard");
    if (dbg) {
        dbg.textContent = "Muestras de datos:\n" + JSON.stringify(datos.slice(0, 5), null, 2);
    }
}
