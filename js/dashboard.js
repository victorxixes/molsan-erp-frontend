/* ============================================================
   DASHBOARD — GLASS LUXE 2027 (IndexedDB + KPIs reales)
============================================================ */

async function initDashboard() {
    const datos = await obtenerFirmas(); // ← IndexedDB

    if (!datos || !datos.length) {
        console.warn("Dashboard: no hay datos cargados.");
        const dbg = document.getElementById("debugDashboard");
        if (dbg) dbg.textContent = "Sin datos en histórico.";
        return;
    }

    await recalcularKPIs(); // recalcula y guarda en localStorage
    const kpis = obtenerKPIs(); // ahora sí obtenemos los KPIs

    actualizarKPIs(kpis, datos);
}

/* ============================================================
   PINTAR KPIS EN EL DASHBOARD
============================================================ */

function actualizarKPIs(kpis, datos) {
    const cont = document.getElementById("kpisContainer");
    const dbg = document.getElementById("debugDashboard");
    if (!cont) return;

    const total = kpis.total_registros || 0;
    const media = kpis.media_dias || 0;

    const hoy = datos.filter(f => f.fecha_protocolo === new Date().toLocaleDateString()).length;

    const vc = (kpis.por_tipo_firma?.VideoConferencia) || 0;

    cont.innerHTML = `
        <div class="kpi-card">Total firmas: <strong>${total}</strong></div>
        <div class="kpi-card">Firmas hoy: <strong>${hoy}</strong></div>
        <div class="kpi-card">Media días: <strong>${media}</strong></div>
        <div class="kpi-card">VideoConferencia: <strong>${vc}</strong></div>
    `;

    if (dbg) {
        dbg.textContent = "Muestras de datos:\n" + JSON.stringify(datos.slice(0, 5), null, 2);
    }
}
