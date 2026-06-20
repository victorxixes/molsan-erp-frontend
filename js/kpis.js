/* ============================================================
   KPIS MOLSAN — GLASS LUXE 2027 (VERSIÓN FINAL)
============================================================ */

async function recalcularKPIs() {
    const datos = await obtenerFirmas(); // IndexedDB

    let totalRegistros = 0;

    let porMes = {};
    let porAnio = {};
    let porApoderado = {};
    let porOficina = {};
    let porCircuito = {};
    let porTipoFirma = {};

    let sumaDias = 0;

    for (const fila of datos) {
        if (!fila) continue;

        totalRegistros++;

        /* ============================================================
           NORMALIZACIÓN CORRECTA PARA KPIs
        ============================================================= */

        // Mes numérico (1–12)
        const mesNum = obtenerMesNumero(fila.mes);

        // Año
        const anio = Number(fila.anio) || 0;

        // Apoderado real
        const apo = normalizarClave(fila.apoderado);

        // Oficina real (centro)
        const ofi = normalizarClave(fila.centro);

        // Circuito notarial
        const cir = normalizarClave(fila.circuito);

        // Tipo firma
        const tipo = normalizarClave(fila.tipo_firma);

        // Días SLA
        const dias = Number(fila.dias) || 0;

        /* ============================================================
           INCREMENTAR CONTADORES
        ============================================================= */

        incrementar(porMes, mesNum);
        incrementar(porAnio, anio);
        incrementar(porApoderado, apo);
        incrementar(porOficina, ofi);
        incrementar(porCircuito, cir);
        incrementar(porTipoFirma, tipo);

        sumaDias += dias;
    }

    const mediaDias = totalRegistros ? (sumaDias / totalRegistros) : 0;

    const rankingApoderados = ordenarRanking(porApoderado, "apoderado");
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

/* ============================================================
   Convertir "enero" → 1, "febrero" → 2...
============================================================ */
function obtenerMesNumero(mesTexto) {
    if (!mesTexto) return 0;

    const nombres = [
        "enero","febrero","marzo","abril","mayo","junio",
        "julio","agosto","septiembre","octubre","noviembre","diciembre"
    ];

    const idx = nombres.indexOf(String(mesTexto).toLowerCase());
    return idx >= 0 ? idx + 1 : 0;
}
