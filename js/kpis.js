/* ============================================================
   KPIS MOLSAN — GLASS LUXE 2027 (VERSIÓN FINAL)
============================================================ */

/* ============================================================
   RE-CÁLCULO COMPLETO DE KPIs (IndexedDB → localStorage)
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

        // Incrementar contadores
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
   Helpers básicos
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

function obtenerMesNumero(mesTexto) {
    if (!mesTexto) return 0;

    const nombres = [
        "enero","febrero","marzo","abril","mayo","junio",
        "julio","agosto","septiembre","octubre","noviembre","diciembre"
    ];

    const idx = nombres.indexOf(String(mesTexto).toLowerCase());
    return idx >= 0 ? idx + 1 : 0;
}

/* ============================================================
   FUNCIONES PARA EL DASHBOARD (TOPS + KPIs por año)
============================================================ */

/* ------------------------------
   Total firmas por año
------------------------------ */
function kpi_totalFirmasAnio(anio) {
    const k = obtenerKPIs();
    return k.por_anio?.[anio] || 0;
}

/* ------------------------------
   SLA medio por año
------------------------------ */
async function kpi_slaMedioAnio(anio) {
    const datos = await obtenerFirmas();
    let suma = 0, cuenta = 0;

    datos.forEach(f => {
        if (Number(f.anio) === anio) {
            const d = Number(f.dias);
            if (d > 0) {
                suma += d;
                cuenta++;
            }
        }
    });

    return cuenta ? Number((suma / cuenta).toFixed(1)) : 0;
}

/* ------------------------------
   % VC por año
------------------------------ */
async function kpi_vcPorcentajeAnio(anio) {
    const datos = await obtenerFirmas();
    const filtrado = datos.filter(f => Number(f.anio) === anio);

    const total = filtrado.length;
    const vc = filtrado.filter(f => f.tipo_firma === "VideoConferencia").length;

    return total ? Number(((vc / total) * 100).toFixed(1)) : 0;
}

/* ------------------------------
   Mes más fuerte del año
------------------------------ */
async function kpi_mesMasFuerte(anio) {
    const datos = await obtenerFirmas();
    const mapa = {};

    datos.forEach(f => {
        if (Number(f.anio) === anio) {
            const m = Number(f.mes);
            mapa[m] = (mapa[m] || 0) + 1;
        }
    });

    const top = Object.entries(mapa).sort((a,b)=>b[1]-a[1])[0];
    return top ? top[0] : "-";
}

/* ------------------------------
   Detalle mensual (para gráfico)
------------------------------ */
async function kpi_detalleMensual(anio) {
    const datos = await obtenerFirmas();
    const arr = [];

    for (let m = 1; m <= 12; m++) {
        const filtrado = datos.filter(f => Number(f.anio) === anio && Number(f.mes) === m);

        const total = filtrado.length;
        const presencial = filtrado.filter(f => f.tipo_firma !== "VideoConferencia").length;
        const vc = filtrado.filter(f => f.tipo_firma === "VideoConferencia").length;

        let suma = 0, cuenta = 0;
        filtrado.forEach(f => {
            const d = Number(f.dias);
            if (d > 0) { suma += d; cuenta++; }
        });

        const sla = cuenta ? Number((suma / cuenta).toFixed(1)) : 0;

        arr.push({ mes: m, total, presencial, vc, sla });
    }

    return arr;
}

/* ------------------------------
   Top oficina del año
------------------------------ */
function kpi_topOficina(anio) {
    const k = obtenerKPIs();
    const mapa = k.por_oficina || {};
    const top = Object.entries(mapa).sort((a,b)=>b[1]-a[1])[0];
    return top ? top[0] : "-";
}

/* ------------------------------
   Top circuito del año
------------------------------ */
function kpi_topCircuito(anio) {
    const k = obtenerKPIs();
    const mapa = k.por_circuito || {};
    const top = Object.entries(mapa).sort((a,b)=>b[1]-a[1])[0];
    return top ? top[0] : "-";
}

/* ------------------------------
   Top tipo gestión del año
------------------------------ */
async function kpi_topGestion(anio) {
    const datos = await obtenerFirmas();
    const mapa = {};

    datos.filter(f => Number(f.anio) === anio).forEach(f => {
        const g = f.tipo_provision || "Sin dato";
        mapa[g] = (mapa[g] || 0) + 1;
    });

    const top = Object.entries(mapa).sort((a,b)=>b[1]-a[1])[0];
    return top ? top[0] : "-";
}

/* ------------------------------
   Top apoderado del año
------------------------------ */
function kpi_topApoderado() {
    const k = obtenerKPIs();
    return k.ranking_apoderados?.[0]?.apoderado || "-";
}

/* ------------------------------
   Top centro que firma del año
------------------------------ */
function kpi_topCentro(anio) {
    const k = obtenerKPIs();
    const mapa = k.por_oficina || {};
    const top = Object.entries(mapa).sort((a,b)=>b[1]-a[1])[0];
    return top ? top[0] : "-";
}

/* ------------------------------
   Total firmas por panel (Dashboard)
------------------------------ */
function kpi_totalPanel(panel, anio) {
    const k = obtenerKPIs();

    switch(panel) {
        case "anual":       return k.por_anio?.[anio] || 0;
        case "apoderados":  return Object.keys(k.por_apoderado || {}).length;
        case "tipo_firma":  return Object.keys(k.por_tipo_firma || {}).length;
        case "oficinas":    return Object.keys(k.por_oficina || {}).length;
        case "circuito":    return Object.keys(k.por_circuito || {}).length;
        default:            return 0;
    }
}
