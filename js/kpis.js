/* ============================================================
   KPIS — GLASS LUXE 2027
============================================================ */

async function recalcularKPIs() {
    const datos = await cargarHistorico();
    if (!Array.isArray(datos) || datos.length === 0) {
        console.warn("KPIs: no hay datos.");
        return {
            total: 0,
            hoy: 0,
            mediaDias: 0,
            vc: 0
        };
    }

    const total = datos.length;

    const hoyStr = new Date().toISOString().split("T")[0];
    const hoy = datos.filter(d => d.fecha_protocolo?.startsWith(hoyStr)).length;

    const mediaDias = Math.round(
        datos.reduce((acc, d) => acc + (Number(d.dias) || 0), 0) / total
    );

    const vc = datos.filter(d => String(d.tipo_firma).toLowerCase().includes("video")).length;

    const kpis = { total, hoy, mediaDias, vc };

    await guardarKPIs(kpis);
    return kpis;
}

async function guardarKPIs(kpis) {
    localStorage.setItem("molsan_kpis", JSON.stringify(kpis));
}

function cargarKPIs() {
    try {
        return JSON.parse(localStorage.getItem("molsan_kpis") || "{}");
    } catch {
        return {};
    }
}
