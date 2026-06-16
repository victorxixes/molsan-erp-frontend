/* ============================================================
   DASHBOARD — GLASS LUXE 2027
============================================================ */

async function initDashboard() {
    const datos = await cargarHistorico();

    if (!datos || !datos.length) {
        console.warn("Dashboard: no hay datos cargados.");
        const dbg = document.getElementById("debugDashboard");
        if (dbg) dbg.textContent = "Sin datos en histórico.";
        return;
    }

    const kpis = await recalcularKPIs();
    actualizarKPIs(kpis, datos);
}

function actualizarKPIs(kpis, datos) {
    const cont = document.getElementById("kpisContainer");
    const dbg = document.getElementById("debugDashboard");
    if (!cont) return;

    cont.innerHTML = `
        <div class="kpi-card">Total firmas: <strong>${kpis.total}</strong></div>
        <div class="kpi-card">Firmas hoy: <strong>${kpis.hoy}</strong></div>
        <div class="kpi-card">Media días: <strong>${kpis.mediaDias}</strong></div>
        <div class="kpi-card">VideoConferencia: <strong>${kpis.vc}</strong></div>
    `;

    if (dbg) {
        dbg.textContent = "Muestras de datos:\n" + JSON.stringify(datos.slice(0, 5), null, 2);
    }
}
