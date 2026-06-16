/* ============================================================
   KPIS MOLSAN — Cálculo automático de indicadores (Glass Luxe 2027)
============================================================ */

function recalcularKPIs() {
    const idx = obtenerIndiceChunks();

    let totalRegistros = 0;

    let porMes = {};
    let porAnio = {};
    let porApoderado = {};
    let porOficina = {};
    let porCircuito = {};
    let porTipoFirma = {};

    let sumaDias = 0;

    for (const i of idx) {
        const chunk = cargarChunk(i);
        if (!chunk || !chunk.length) continue;

        for (const fila of chunk) {
            if (!fila) continue;

            totalRegistros++;

            const mes = normalizarClave(fila.mes);
            const anio = normalizarClave(fila.anio);
            const apo = normalizarClave(fila.nombre);
            const ofi = normalizarClave(fila.oficina);
            const cir = normalizarClave(fila.circuito);   // ✔ CORREGIDO
            const tipo = normalizarClave(fila.tipo_firma);
            const dias = Number(fila.dias) || 0;

            incrementar(porMes, mes);
            incrementar(porAnio, anio);
            incrementar(porApoderado, apo);
            incrementar(porOficina, ofi);
            incrementar(porCircuito, cir);
            incrementar(porTipoFirma, tipo);

            sumaDias += dias;
        }
    }

    const mediaDias = totalRegistros ? (sumaDias / totalRegistros) : 0;

    const rankingApoderados = ordenarRanking(porApoderado, "nombre");
    const rankingOficinas = ordenarRanking(porOficina, "oficina");

    const kpis = {
        fecha_calculo: new Date().toISOString(),
        total_registros: totalRegistros,
        por_mes: porMes,
        por_anio: porAnio,
        por_apoderado: porApoderado,
        por_oficina: porOficina,
        por_circuito: porCircuito,
        por_tipo_firma: porTipoFirma,
        media_dias: Number(mediaDias.toFixed(2)),
        ranking_apoderados: rankingApoderados,
        ranking_oficinas: rankingOficinas
    };

    localStorage.setItem("molsan_kpis", JSON.stringify(kpis));

    console.log("KPIs recalculados:", kpis);
}

/* ============================================================
   Obtener KPIs ya calculados
============================================================ */
function obtenerKPIs() {
    return JSON.parse(localStorage.getItem("molsan_kpis") || "{}");
}

/* ============================================================
   Helpers
============================================================ */

function incrementar(obj, clave) {
    if (!clave) clave = "Sin dato";
    obj[clave] = (obj[clave] || 0) + 1;
}

function normalizarClave(v) {
    if (v === undefined || v === null) return "Sin dato";
    const t = String(v).trim();
    return t === "" ? "Sin dato" : t;
}

function ordenarRanking(obj, campo) {
    return Object.entries(obj)
        .map(([k, total]) => ({ [campo]: k, total }))
        .sort((a, b) => b.total - a.total);
}
