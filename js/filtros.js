/* ============================================================
   FILTROS — GLASS LUXE 2027 (IndexedDB + Ultra Rápido)
============================================================ */

/**
 * Obtiene todas las firmas y aplica filtros dinámicos.
 * @param {Object} filtros - objeto con los filtros activos
 * @returns {Array} resultados filtrados
 */
async function filtrarFirmas(filtros = {}) {
    const datos = await obtenerFirmas(); // ← IndexedDB

    return datos.filter(fila => {
        if (!fila) return false;

        if (filtros.mes && fila.mes !== filtros.mes) return false;
        if (filtros.anio && fila.anio !== filtros.anio) return false;
        if (filtros.apoderado && fila.nombre !== filtros.apoderado) return false;
        if (filtros.oficina && fila.oficina !== filtros.oficina) return false;
        if (filtros.circuito && fila.circuito !== filtros.circuito) return false;
        if (filtros.tipoFirma && fila.tipo_firma !== filtros.tipoFirma) return false;
        if (filtros.tipoGestion && fila.tipo_gestion !== filtros.tipoGestion) return false;

        return true;
    });
}

/* ============================================================
   Filtro rápido por año (para informes y dashboard)
============================================================ */
async function filtrarPorAnio(anio) {
    return filtrarFirmas({ anio });
}

/* ============================================================
   Filtro rápido por mes
============================================================ */
async function filtrarPorMes(mes) {
    return filtrarFirmas({ mes });
}

/* ============================================================
   Filtro rápido por apoderado
============================================================ */
async function filtrarPorApoderado(nombre) {
    return filtrarFirmas({ apoderado: nombre });
}

/* ============================================================
   Filtro rápido por oficina
============================================================ */
async function filtrarPorOficina(oficina) {
    return filtrarFirmas({ oficina });
}

/* ============================================================
   Filtro rápido por circuito
============================================================ */
async function filtrarPorCircuito(circuito) {
    return filtrarFirmas({ circuito });
}

/* ============================================================
   Filtro rápido por tipo de firma
============================================================ */
async function filtrarPorTipoFirma(tipo) {
    return filtrarFirmas({ tipoFirma: tipo });
}

/* ============================================================
   Filtro rápido por tipo de gestión
============================================================ */
async function filtrarPorTipoGestion(tipo) {
    return filtrarFirmas({ tipoGestion: tipo });
}
