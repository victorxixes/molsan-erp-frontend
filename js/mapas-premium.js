/* ============================================================
   MAPAS PREMIUM — GLASS LUXE 2027 (VERSIÓN CORREGIDA)
============================================================ */

window.MP = {
    porAnio: {},
    porMes: {},
    porApoderado: {},
    porOficina: {},
    porCircuito: {},
    porTipoFirma: {},
    porTipoGestion: {},
    porCentroQueFirma: {},
    slaPorAnio: {}
};

/* ============================================================
   GENERAR MAPAS PREMIUM — FUNCIÓN GLOBAL
============================================================ */
async function generarMapasPremium(datos) {

    // Reiniciar mapas
    window.MP = {
        porAnio: {},
        porMes: {},
        porApoderado: {},
        porOficina: {},
        porCircuito: {},
        porTipoFirma: {},
        porTipoGestion: {},
        porCentroQueFirma: {},
        slaPorAnio: {}
    };

    for (const f of datos) {

        const anio = Number(f.anio) || 0;
        if (!anio) continue;

        const mes  = String(f.mes || "").toLowerCase().trim();
        const apo  = String(f.nombre || f.apoderado || "Sin apoderado").trim();
        const ofi  = String(f.centro || "Sin oficina").trim();
        const cir  = String(f.circuito || "Sin circuito").trim();
        const tipo = String(f.tipo_firma || "Sin tipo").trim();
        const gest = String(f.tipo_gestion || "Sin gestión").trim();
        const cen  = String(f.centro_que_firma || "Sin centro").trim();
        const dias = Number(f.dias) || 0;

        /* ============================
           POR AÑO
        ============================ */
        window.MP.porAnio[anio] = (window.MP.porAnio[anio] || 0) + 1;

        /* ============================
           POR MES
        ============================ */
        if (!window.MP.porMes[anio]) window.MP.porMes[anio] = {};
        window.MP.porMes[anio][mes] = (window.MP.porMes[anio][mes] || 0) + 1;

        /* ============================
           POR APODERADO
        ============================ */
        if (!window.MP.porApoderado[anio]) window.MP.porApoderado[anio] = {};
        window.MP.porApoderado[anio][apo] = (window.MP.porApoderado[anio][apo] || 0) + 1;

        /* ============================
           POR OFICINA
        ============================ */
        if (!window.MP.porOficina[anio]) window.MP.porOficina[anio] = {};
        window.MP.porOficina[anio][ofi] = (window.MP.porOficina[anio][ofi] || 0) + 1;

        /* ============================
           POR CIRCUITO
        ============================ */
        if (!window.MP.porCircuito[anio]) window.MP.porCircuito[anio] = {};
        window.MP.porCircuito[anio][cir] = (window.MP.porCircuito[anio][cir] || 0) + 1;

        /* ============================
           POR TIPO FIRMA
        ============================ */
        if (!window.MP.porTipoFirma[anio]) window.MP.porTipoFirma[anio] = {};
        window.MP.porTipoFirma[anio][tipo] = (window.MP.porTipoFirma[anio][tipo] || 0) + 1;

        /* ============================
           POR TIPO GESTIÓN
        ============================ */
        if (!window.MP.porTipoGestion[anio]) window.MP.porTipoGestion[anio] = {};
        window.MP.porTipoGestion[anio][gest] = (window.MP.porTipoGestion[anio][gest] || 0) + 1;

        /* ============================
           POR CENTRO QUE FIRMA
        ============================ */
        if (!window.MP.porCentroQueFirma[anio]) window.MP.porCentroQueFirma[anio] = {};
        window.MP.porCentroQueFirma[anio][cen] = (window.MP.porCentroQueFirma[anio][cen] || 0) + 1;

        /* ============================
           SLA POR AÑO
        ============================ */
        if (!window.MP.slaPorAnio[anio]) window.MP.slaPorAnio[anio] = [];
        if (dias > 0) window.MP.slaPorAnio[anio].push(dias);
    }

    console.log("📊 Mapas Premium generados:", window.MP);
    return window.MP;
}
