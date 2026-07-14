/* ============================================================
   MAPAS PREMIUM — GLASS LUXE 2027
============================================================ */

let PAP_POR_ANIO = {};   // Apoderados
let PTF_POR_ANIO = {};   // Tipo Firma
let PTG_POR_ANIO = {};   // Tipo Gestión
let POF_POR_ANIO = {};   // Oficinas
let PCI_POR_ANIO = {};   // Circuito
let PCF_POR_ANIO = {};   // Centro que firma
let SLA_POR_ANIO = {};   // Días / SLA

function generarMapasPremium(datos) {

    PAP_POR_ANIO = {};
    PTF_POR_ANIO = {};
    PTG_POR_ANIO = {};
    POF_POR_ANIO = {};
    PCI_POR_ANIO = {};
    PCF_POR_ANIO = {};
    SLA_POR_ANIO = {};

    for (const f of datos) {

        const anio = Number(f.anio);
        if (!anio) continue;

        /* ============================
           APODERADOS
        ============================ */
        if (!PAP_POR_ANIO[anio]) PAP_POR_ANIO[anio] = {};
        PAP_POR_ANIO[anio][f.apoderado] = (PAP_POR_ANIO[anio][f.apoderado] || 0) + 1;

        /* ============================
           TIPO FIRMA
        ============================ */
        if (!PTF_POR_ANIO[anio]) PTF_POR_ANIO[anio] = {};
        PTF_POR_ANIO[anio][f.tipo_firma] = (PTF_POR_ANIO[anio][f.tipo_firma] || 0) + 1;

        /* ============================
           TIPO GESTIÓN
        ============================ */
        if (!PTG_POR_ANIO[anio]) PTG_POR_ANIO[anio] = {};
        PTG_POR_ANIO[anio][f.tipo_gestion] = (PTG_POR_ANIO[anio][f.tipo_gestion] || 0) + 1;

        /* ============================
           OFICINAS
        ============================ */
        if (!POF_POR_ANIO[anio]) POF_POR_ANIO[anio] = {};
        POF_POR_ANIO[anio][f.oficina] = (POF_POR_ANIO[anio][f.oficina] || 0) + 1;

        /* ============================
           CIRCUITO
        ============================ */
        if (!PCI_POR_ANIO[anio]) PCI_POR_ANIO[anio] = {};
        PCI_POR_ANIO[anio][f.circuito] = (PCI_POR_ANIO[anio][f.circuito] || 0) + 1;

        /* ============================
           CENTRO QUE FIRMA
        ============================ */
        if (!PCF_POR_ANIO[anio]) PCF_POR_ANIO[anio] = {};
        PCF_POR_ANIO[anio][f.centro] = (PCF_POR_ANIO[anio][f.centro] || 0) + 1;

        /* ============================
           SLA (DÍAS)
        ============================ */
        if (!SLA_POR_ANIO[anio]) SLA_POR_ANIO[anio] = [];
        SLA_POR_ANIO[anio].push(f.dias || 0);
    }

    console.log("📊 Mapas Premium generados:");
    console.log({ PAP_POR_ANIO, PTF_POR_ANIO, PTG_POR_ANIO, POF_POR_ANIO, PCI_POR_ANIO, PCF_POR_ANIO, SLA_POR_ANIO });
}
