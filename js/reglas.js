/* ============================================================
   REGLAS DE NORMALIZACIÓN — MOLSAN Glass Luxe 2027
============================================================ */

function aplicarReglas(f) {

    const fila = {
        expediente: f.expediente || "",
        oficina: f.oficina || "",
        fecha_alta: f.fecha_alta || "",
        contrato: f.contrato || "",
        tipo_provision: f.tipo_provision || "",
        notario: f.notario || "",
        provincia: f.provincia || "",
        municipio: f.municipio || "",
        comunidad: f.comunidad || "",
        protocolo: f.protocolo || "",
        fecha_protocolo: f.fecha_protocolo || "",
        vc: f.vc || f.v_c || "",
        apoderado: f.apoderado || "",
        envio_notario: f.envio_notario || "",
        dias: Number(f.dias || 0),

        // Excel adicionales
        mes_excel: f.mes || "",
        anio_excel: f.anio || "",
        centro_que_firma: f.centro_que_firma || "",
        tipo_gestion_excel: f.tipo_gestion || "",
        nombre_excel: f.nombre || "",
        apellidos_excel: f.apellidos || "",
        circuito_notarial: f.circuito_notarial || "",
        tipo_firma_excel: f.tipo_firma || ""
    };

    const fechaProtocolo = new Date(fila.fecha_protocolo);

    return {
        expediente: fila.expediente,
        oficina: fila.oficina,
        fecha_alta: fila.fecha_alta,
        contrato: fila.contrato,
        tipo_provision: fila.tipo_provision,
        notario: fila.notario,
        provincia: fila.provincia,
        municipio: fila.municipio,
        comunidad: fila.comunidad,
        protocolo: fila.protocolo,
        fecha_protocolo: normalizarFecha(fila.fecha_protocolo),
        vc: fila.vc,
        envio_notario: fila.envio_notario,
        dias: fila.dias,

        // Campos calculados
        mes: getMesNumero(fechaProtocolo) || fila.mes_excel,
        anio: getAnio(fechaProtocolo) || fila.anio_excel,

        // Normalización mejorada
        centro: fila.centro_que_firma || fila.oficina,
        tipo_gestion: fila.tipo_gestion_excel || fila.tipo_provision,
        nombre: fila.apoderado || fila.nombre_excel,
        apellidos: fila.apellidos_excel || "",
        notario_clasificacion: fila.notario,

        // Circuito notarial
        circuito: getCircuito(fila.circuito_notarial || fila.notario),

        // Tipo de firma
        tipo_firma: getTipoFirma(fila.vc || fila.tipo_firma_excel)
    };
}

/* ============================================================
   FECHAS
============================================================ */
function normalizarFecha(v) {
    const d = new Date(v);
    if (isNaN(d)) return "";
    return d.toISOString().split("T")[0];
}

function getMesNumero(fecha) {
    if (!(fecha instanceof Date) || isNaN(fecha)) return null;
    return fecha.getMonth() + 1;
}

function getAnio(fecha) {
    if (!(fecha instanceof Date) || isNaN(fecha)) return null;
    return fecha.getFullYear();
}

/* ============================================================
   CIRCUITO NOTARIAL
============================================================ */
function getCircuito(valor) {
    if (!valor) return "Sin circuito";

    const v = String(valor).toLowerCase();

    if (v.includes("a")) return "A";
    if (v.includes("b")) return "B";
    if (v.includes("c")) return "C";

    return "Otros";
}

/* ============================================================
   TIPO DE FIRMA
============================================================ */
function getTipoFirma(valor) {
    if (!valor) return "Desconocido";

    const v = String(valor).toLowerCase();

    if (v.includes("vc") || v.includes("video") || v.includes("tele") || v.includes("virtual"))
        return "VideoConferencia";

    if (v.includes("pres"))
        return "Presencial";

    return "Desconocido";
}
